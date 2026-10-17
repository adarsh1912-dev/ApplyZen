import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, authedAgent, truncate, uniqueEmail } from './helpers.js';

beforeEach(truncate);

const JD = `Senior Frontend Engineer. Required: React, TypeScript, testing with Jest, Git, Agile delivery. Preferred: SQL and AWS for tooling.`;
const resumeContent = {
  personal: { name: 'A Dev' },
  summary: 'Frontend engineer with 3 years of React and Jest testing experience.',
  experience: [{ role: 'Frontend Engineer', company: 'Acme', dates: '2023', bullets: ['Shipped React dashboard used by 5k users.'] }],
  education: [], skills: ['React', 'Git'], projects: [], certifications: [],
};

async function makeResume(agent) {
  const res = await agent.post('/api/resumes').send({ title: 'R', content: resumeContent });
  return res.body.data.resume.id;
}

describe('analyses', () => {
  it('runs heuristic analysis, persists it, and reads it back', async () => {
    const agent = await authedAgent(uniqueEmail());
    const resumeId = await makeResume(agent);
    const res = await agent.post('/api/analyses').send({
      resume_id: resumeId,
      job_description: JD,
      job_title: 'Frontend Engineer',
      company: 'Acme',
    });
    expect(res.status).toBe(201);
    const a = res.body.data.analysis;
    expect(a.engine).toBe('heuristic');
    expect(a.result.simulated).toBe(true);
    expect(a.result.coverage).toBeGreaterThanOrEqual(0);
    expect(a.result).toHaveProperty('matched_skills');
    expect(a.result).toHaveProperty('missing_skills');
    expect(a.result.matched_skills).toContain('React');

    const got = await agent.get(`/api/analyses/${a.id}`);
    expect(got.status).toBe(200);
    expect(got.body.data.analysis.job_description).toMatch(/Senior Frontend/);
  });

  it('is deterministic for the same inputs', async () => {
    const agent = await authedAgent(uniqueEmail());
    const resumeId = await makeResume(agent);
    const body = { resume_id: resumeId, job_description: JD };
    const r1 = await agent.post('/api/analyses').send(body);
    const r2 = await agent.post('/api/analyses').send(body);
    expect(r1.body.data.analysis.result.coverage).toBe(r2.body.data.analysis.result.coverage);
  });

  it('lists history without full result payloads', async () => {
    const agent = await authedAgent(uniqueEmail());
    const resumeId = await makeResume(agent);
    await agent.post('/api/analyses').send({ resume_id: resumeId, job_description: JD });
    const list = await agent.get('/api/analyses');
    expect(list.body.data.total).toBe(1);
    expect(list.body.data.items[0]).toHaveProperty('coverage');
    expect(list.body.data.items[0]).not.toHaveProperty('result');
  });

  it('validates input and resume ownership', async () => {
    const a = await authedAgent(uniqueEmail('a'));
    const b = await authedAgent(uniqueEmail('b'));
    const resumeId = await makeResume(a);

    expect((await b.post('/api/analyses').send({ resume_id: resumeId, job_description: JD })).status).toBe(404);
    expect((await a.post('/api/analyses').send({
      resume_id: '00000000-0000-0000-0000-000000000000', job_description: JD,
    })).status).toBe(404);
    expect((await a.post('/api/analyses').send({ resume_id: resumeId, job_description: 'too short' })).status).toBe(400);
    expect((await a.post('/api/analyses').send({ resume_id: 'nope', job_description: JD })).status).toBe(400);
    expect((await a.post('/api/analyses').send({ job_description: JD })).status).toBe(400);
  });

  it('isolates analyses per user', async () => {
    const a = await authedAgent(uniqueEmail('a'));
    const b = await authedAgent(uniqueEmail('b'));
    const resumeId = await makeResume(a);
    const created = await a.post('/api/analyses').send({ resume_id: resumeId, job_description: JD });
    expect((await b.get(`/api/analyses/${created.body.data.analysis.id}`)).status).toBe(404);
    expect((await b.get('/api/analyses')).body.data.total).toBe(0);
  });

  it('requires authentication', async () => {
    expect((await request(app).post('/api/analyses').send({ resume_id: '00000000-0000-0000-0000-000000000000', job_description: JD })).status).toBe(401);
  });
});
