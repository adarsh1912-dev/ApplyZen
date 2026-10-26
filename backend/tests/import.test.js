import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import request from 'supertest';
import { app, authedAgent, truncate, uniqueEmail } from './helpers.js';

// Provider mocked: no network, no tokens. The extraction pipeline (unpdf /
// mammoth / text) runs for real against fixtures.
vi.mock('../src/services/llm-provider.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, llmConfigured: vi.fn(() => true), importResume: vi.fn() };
});

import { llmConfigured, importResume } from '../src/services/llm-provider.js';

const TXT = `Jane Doe — Senior Software Engineer
jane.doe@example.com | +1 555 010 2030 | Berlin

Experience
Senior Engineer, Acme Corp, 2021 — Present
- Built React dashboards used by 12k merchants.
- Cut page load time by 40%.

Skills: React, TypeScript, Jest, Git, SQL
`;

const providerOut = () => ({
  personal: {
    name: 'Jane Doe', role: 'Senior Software Engineer', email: 'jane.doe@example.com',
    phone: '+1 555 010 2030', location: 'Berlin', website: '', linkedin: '',
  },
  summary: '',
  experience: [{
    role: 'Senior Engineer', company: 'Acme Corp', dates: '2021 — Present',
    bullets: ['Built React dashboards used by 12k merchants.', 'Cut page load time by 40%.'],
  }],
  education: [],
  skills: ['React', 'TypeScript', 'Jest', 'Git', 'SQL'],
  projects: [],
  certifications: [],
  warnings: ['No summary section found in the file.'],
});

const b64 = (buf) => Buffer.from(buf).toString('base64');

beforeEach(async () => {
  await truncate();
  vi.mocked(llmConfigured).mockReturnValue(true);
  vi.mocked(importResume).mockReset();
});

describe('resume import', () => {
  it('structures a TXT upload into a stored résumé', async () => {
    const agent = await authedAgent(uniqueEmail());
    vi.mocked(importResume).mockResolvedValue(providerOut());

    const res = await agent.post('/api/resumes/import').send({ filename: 'jane_doe.txt', data_base64: b64(TXT) });
    expect(res.status).toBe(201);
    const { resume, warnings } = res.body.data;
    expect(resume.title).toBe('jane doe');
    expect(resume.content.personal.name).toBe('Jane Doe');
    expect(resume.content.experience).toHaveLength(1);
    expect(resume.content.experience[0].id).toMatch(/^e_/);
    expect(resume.content.visible.summary).toBe(true);
    expect(resume.content.order).toContain('experience');
    expect(warnings).toEqual(['No summary section found in the file.']);
    expect(importResume).toHaveBeenCalledTimes(1);
    expect(vi.mocked(importResume).mock.calls[0][0]).toContain('Jane Doe');

    // Persisted: fetch by id returns the same content.
    const got = await agent.get(`/api/resumes/${resume.id}`);
    expect(got.body.data.resume.content.skills).toContain('React');
  });

  it('extracts text from a real PDF before structuring', async () => {
    const agent = await authedAgent(uniqueEmail());
    vi.mocked(importResume).mockResolvedValue(providerOut());
    const pdf = readFileSync(fileURLToPath(new URL('./fixtures/resume.pdf', import.meta.url)));

    const res = await agent.post('/api/resumes/import').send({ filename: 'resume.pdf', data_base64: b64(pdf) });
    expect(res.status).toBe(201);
    const sentText = vi.mocked(importResume).mock.calls[0][0];
    expect(sentText).toContain('Jane Doe');
    expect(sentText).toContain('Acme Corp');
  });

  it('rejects unsupported extensions (415)', async () => {
    const agent = await authedAgent(uniqueEmail());
    const res = await agent.post('/api/resumes/import').send({ filename: 'resume.doc', data_base64: b64(TXT) });
    expect(res.status).toBe(415);
    expect(res.body.error.code).toBe('UNSUPPORTED_FILE');
  });

  it('rejects files with almost no extractable text (422, scanned-PDF hint)', async () => {
    const agent = await authedAgent(uniqueEmail());
    const res = await agent.post('/api/resumes/import').send({ filename: 'scan.txt', data_base64: b64('tiny') });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('IMPORT_EMPTY_TEXT');
    expect(res.body.error.message).toMatch(/scanned/i);
  });

  it('rejects files over 3 MB (413)', async () => {
    const agent = await authedAgent(uniqueEmail());
    const big = Buffer.alloc(3 * 1024 * 1024 + 8, 0x61);
    const res = await agent.post('/api/resumes/import').send({ filename: 'big.txt', data_base64: big.toString('base64') });
    expect(res.status).toBe(413);
  });

  it('returns 503 when no provider is configured', async () => {
    const agent = await authedAgent(uniqueEmail());
    vi.mocked(llmConfigured).mockReturnValue(false);
    const res = await agent.post('/api/resumes/import').send({ filename: 'jane.txt', data_base64: b64(TXT) });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('AI_NOT_CONFIGURED');
    expect(importResume).not.toHaveBeenCalled();
  });

  it('maps provider failures to 502 without leaking details', async () => {
    const agent = await authedAgent(uniqueEmail());
    vi.mocked(importResume).mockRejectedValue(new Error('provider status 500 (secret)'));
    const res = await agent.post('/api/resumes/import').send({ filename: 'jane.txt', data_base64: b64(TXT) });
    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('AI_PROVIDER_FAILED');
    expect(JSON.stringify(res.body)).not.toContain('secret');
  });

  it('validates input and requires auth', async () => {
    const agent = await authedAgent(uniqueEmail());
    expect((await agent.post('/api/resumes/import').send({ filename: 'a.txt' })).status).toBe(400);
    expect((await agent.post('/api/resumes/import').send({ data_base64: b64(TXT) })).status).toBe(400);
    expect((await agent.post('/api/resumes/import').send({ filename: 'a.txt', data_base64: '' })).status).toBe(400);
    expect((await request(app).post('/api/resumes/import').send({ filename: 'a.txt', data_base64: b64(TXT) })).status).toBe(401);
  });
});
