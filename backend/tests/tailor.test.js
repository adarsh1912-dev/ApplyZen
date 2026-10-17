import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app, authedAgent, truncate, uniqueEmail } from './helpers.js';

// The provider module is mocked so this suite never touches the network and
// never spends tokens, no matter what backend/.env has configured. The
// service merge + integrity rules are exercised with controlled output.
vi.mock('../src/services/llm-provider.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, llmConfigured: vi.fn(() => true), tailorResume: vi.fn() };
});

import { llmConfigured, tailorResume } from '../src/services/llm-provider.js';

const JD = 'We are hiring a senior React engineer for our payments team. Required: React, testing, Git workflow. '.repeat(2);

const content = () => ({
  personal: { name: 'T User', role: 'Engineer', email: 't@example.com' },
  summary: 'Engineer with React experience.',
  experience: [
    { id: 'e1', role: 'Engineer', company: 'Acme', dates: '2020 — Present', bullets: ['Responsible for testing.'] },
  ],
  education: [{ id: 'ed1', school: 'U', degree: 'BSc', dates: '2019' }],
  skills: ['React', 'Git'],
  projects: [{ id: 'p1', name: 'P', detail: 'D' }],
  certifications: [],
  visible: { summary: true },
  order: ['summary', 'experience', 'skills'],
});

const providerOut = () => ({
  role: 'Senior React Engineer',
  summary: 'React engineer targeting payments platforms.',
  experience: [{ id: 'e1', bullets: ['Built React dashboards, cutting load time 40%.'] }],
  skills: ['React', 'Jest', 'Git'],
  changes: ['Rewrote the summary for the target role.', 'Reordered skills by relevance.'],
  warnings: ['Check the testing claim before applying.'],
});

async function createResume(agent) {
  const res = await agent.post('/api/resumes').send({ title: 'R1', content: content() });
  return res.body.data.resume.id;
}

beforeEach(async () => {
  await truncate();
  vi.mocked(llmConfigured).mockReturnValue(true);
  vi.mocked(tailorResume).mockReset();
});

describe('resume tailoring (autoconfigure)', () => {
  it('returns 503 AI_NOT_CONFIGURED when no provider is configured', async () => {
    const agent = await authedAgent(uniqueEmail());
    const id = await createResume(agent);
    vi.mocked(llmConfigured).mockReturnValue(false);
    const res = await agent.post(`/api/resumes/${id}/tailor`).send({ job_description: JD });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('AI_NOT_CONFIGURED');
    expect(tailorResume).not.toHaveBeenCalled();
  });

  it('returns tailored text while preserving everything else on the resume', async () => {
    const agent = await authedAgent(uniqueEmail());
    const id = await createResume(agent);
    vi.mocked(tailorResume).mockResolvedValue(providerOut());

    const res = await agent.post(`/api/resumes/${id}/tailor`).send({ job_description: JD });
    expect(res.status).toBe(200);
    const { tailored } = res.body.data;
    expect(tailored.engine).toBe('llm');
    expect(tailored.changes).toHaveLength(2);
    expect(tailored.warnings).toHaveLength(1);

    // Model-rewritten parts are applied.
    expect(tailored.content.summary).toBe('React engineer targeting payments platforms.');
    expect(tailored.content.personal.role).toBe('Senior React Engineer');
    expect(tailored.content.skills).toEqual(['React', 'Jest', 'Git']);
    expect(tailored.content.experience[0].bullets).toEqual(['Built React dashboards, cutting load time 40%.']);

    // Everything else comes from the stored resume, not the model.
    expect(tailored.content.personal.email).toBe('t@example.com');
    expect(tailored.content.experience[0].id).toBe('e1');
    expect(tailored.content.education).toEqual(content().education);
    expect(tailored.content.projects).toEqual(content().projects);
    expect(tailored.content.visible).toEqual({ summary: true });
    expect(tailored.content.order).toEqual(['summary', 'experience', 'skills']);
  });

  it('keeps stored bullets when a role comes back empty', async () => {
    const agent = await authedAgent(uniqueEmail());
    const id = await createResume(agent);
    vi.mocked(tailorResume).mockResolvedValue({
      ...providerOut(),
      experience: [{ id: 'e1', bullets: [] }],
    });
    const res = await agent.post(`/api/resumes/${id}/tailor`).send({ job_description: JD });
    expect(res.status).toBe(200);
    expect(res.body.data.tailored.content.experience[0].bullets).toEqual(['Responsible for testing.']);
  });

  it('rejects output that drops or invents experience entries (502)', async () => {
    const agent = await authedAgent(uniqueEmail());
    const id = await createResume(agent);
    vi.mocked(tailorResume).mockResolvedValue({ ...providerOut(), experience: [] });
    const res = await agent.post(`/api/resumes/${id}/tailor`).send({ job_description: JD });
    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('AI_PROVIDER_FAILED');
  });

  it('maps provider errors to a 502 without leaking details', async () => {
    const agent = await authedAgent(uniqueEmail());
    const id = await createResume(agent);
    vi.mocked(tailorResume).mockRejectedValue(new Error('provider status 401 (secret-token)'));
    const res = await agent.post(`/api/resumes/${id}/tailor`).send({ job_description: JD });
    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('AI_PROVIDER_FAILED');
    expect(JSON.stringify(res.body)).not.toContain('secret');
  });

  it("404s on another user's resume without calling the provider", async () => {
    const a = await authedAgent(uniqueEmail());
    const id = await createResume(a);
    const b = await authedAgent(uniqueEmail());
    vi.mocked(tailorResume).mockResolvedValue(providerOut());
    const res = await b.post(`/api/resumes/${id}/tailor`).send({ job_description: JD });
    expect(res.status).toBe(404);
    expect(tailorResume).not.toHaveBeenCalled();
  });

  it('validates input and requires auth', async () => {
    const agent = await authedAgent(uniqueEmail());
    const id = await createResume(agent);
    vi.mocked(tailorResume).mockResolvedValue(providerOut());
    expect((await agent.post(`/api/resumes/${id}/tailor`).send({ job_description: 'too short' })).status).toBe(400);
    expect((await agent.post('/api/resumes/not-a-uuid/tailor').send({ job_description: JD })).status).toBe(400);
    expect((await request(app).post(`/api/resumes/${id}/tailor`).send({ job_description: JD })).status).toBe(401);
  });
});
