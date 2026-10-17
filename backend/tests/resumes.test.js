import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, authedAgent, truncate, uniqueEmail } from './helpers.js';
import { createResumeWithVersion } from '../src/repositories/resumes.repo.js';

beforeEach(truncate);

const content = (summary = 'Engineer with React experience.') => ({
  personal: { name: 'T User', role: 'Engineer' },
  summary,
  experience: [],
  education: [],
  skills: ['React'],
  projects: [],
  certifications: [],
});

describe('resumes', () => {
  it('creates a resume with an initial version snapshot', async () => {
    const agent = await authedAgent(uniqueEmail());
    const res = await agent.post('/api/resumes').send({ title: 'R1', template_key: 'minimal', content: content() });
    expect(res.status).toBe(201);
    const id = res.body.data.resume.id;
    const versions = await agent.get(`/api/resumes/${id}/versions`);
    expect(versions.body.data.items).toHaveLength(1);
    expect(versions.body.data.items[0].version).toBe(1);
  });

  it('lists with limit/offset pagination and omits content', async () => {
    const agent = await authedAgent(uniqueEmail());
    for (let i = 0; i < 3; i++) {
      await agent.post('/api/resumes').send({ title: `R${i}`, content: content() });
    }
    const p1 = await agent.get('/api/resumes?page=1&per_page=2');
    expect(p1.body.data).toMatchObject({ page: 1, per_page: 2, total: 3 });
    expect(p1.body.data.items).toHaveLength(2);
    expect(p1.body.data.items[0]).not.toHaveProperty('content');
    const p2 = await agent.get('/api/resumes?page=2&per_page=2');
    expect(p2.body.data.items).toHaveLength(1);
  });

  it('reads, patches, and deletes', async () => {
    const agent = await authedAgent(uniqueEmail());
    const created = await agent.post('/api/resumes').send({ title: 'R1', content: content() });
    const id = created.body.data.resume.id;

    const got = await agent.get(`/api/resumes/${id}`);
    expect(got.body.data.resume.content.summary).toMatch(/React/);

    const patched = await agent.patch(`/api/resumes/${id}`).send({ title: 'R1 renamed' });
    expect(patched.status).toBe(200);
    expect(patched.body.data.resume.title).toBe('R1 renamed');

    const del = await agent.delete(`/api/resumes/${id}`);
    expect(del.status).toBe(204);
    expect((await agent.get(`/api/resumes/${id}`)).status).toBe(404);
  });

  it('accepts a fresh expected_updated_at (token round-trips)', async () => {
    const agent = await authedAgent(uniqueEmail());
    const created = await agent.post('/api/resumes').send({ title: 'R1', content: content() });
    const { id, updated_at } = created.body.data.resume;

    // The value the API returned must be usable as-is on the next write.
    const ok = await agent.patch(`/api/resumes/${id}`).send({ title: 'fresh token write', expected_updated_at: updated_at });
    expect(ok.status).toBe(200);
    expect(ok.body.data.resume.title).toBe('fresh token write');
    expect(ok.body.data.resume.updated_at).not.toBe(updated_at);
  });

  it('rejects stale writes with 409 (optimistic concurrency)', async () => {
    const agent = await authedAgent(uniqueEmail());
    const created = await agent.post('/api/resumes').send({ title: 'R1', content: content() });
    const { id, updated_at } = created.body.data.resume;

    await agent.patch(`/api/resumes/${id}`).send({ title: 'fresh write' });
    const stale = await agent.patch(`/api/resumes/${id}`).send({ title: 'stale write', expected_updated_at: updated_at });
    expect(stale.status).toBe(409);
    expect(stale.body.error.code).toBe('CONFLICT');
  });

  it('enforces ownership across users', async () => {
    const a = await authedAgent(uniqueEmail('a'));
    const b = await authedAgent(uniqueEmail('b'));
    const created = await a.post('/api/resumes').send({ title: 'A private', content: content() });
    const id = created.body.data.resume.id;

    expect((await b.get(`/api/resumes/${id}`)).status).toBe(404);
    expect((await b.patch(`/api/resumes/${id}`).send({ title: 'hijack' })).status).toBe(404);
    expect((await b.delete(`/api/resumes/${id}`)).status).toBe(404);
    expect((await b.post(`/api/resumes/${id}/duplicate`)).status).toBe(404);
    const list = await b.get('/api/resumes');
    expect(list.body.data.total).toBe(0);
  });

  it('duplicates with its own version history', async () => {
    const agent = await authedAgent(uniqueEmail());
    const created = await agent.post('/api/resumes').send({ title: 'Orig', content: content() });
    const dup = await agent.post(`/api/resumes/${created.body.data.resume.id}/duplicate`);
    expect(dup.status).toBe(201);
    expect(dup.body.data.resume.title).toBe('Orig (copy)');
    const versions = await agent.get(`/api/resumes/${dup.body.data.resume.id}/versions`);
    expect(versions.body.data.items).toHaveLength(1);
  });

  it('snapshots versions and retrieves content by number', async () => {
    const agent = await authedAgent(uniqueEmail());
    const created = await agent.post('/api/resumes').send({ title: 'V', content: content('v1 summary') });
    const id = created.body.data.resume.id;
    await agent.patch(`/api/resumes/${id}`).send({ content: content('v2 summary') });
    const snap = await agent.post(`/api/resumes/${id}/versions`);
    expect(snap.status).toBe(201);
    expect(snap.body.data.version.version).toBe(2);
    const v1 = await agent.get(`/api/resumes/${id}/versions/1`);
    expect(v1.body.data.version.content.summary).toBe('v1 summary');
    expect((await agent.get(`/api/resumes/${id}/versions/99`)).status).toBe(404);
  });

  it('validates template keys, sizes, and UUID params', async () => {
    const agent = await authedAgent(uniqueEmail());
    expect((await agent.post('/api/resumes').send({ title: 'x', template_key: 'fancy' })).status).toBe(400);
    expect((await agent.post('/api/resumes').send({ title: 'x'.repeat(201) })).status).toBe(400);
    expect((await agent.get('/api/resumes/not-a-uuid')).status).toBe(400);
    expect((await agent.patch('/api/resumes/not-a-uuid').send({ title: 'x' })).status).toBe(400);
  });

  it('rolls back resume creation when the version insert fails', async () => {
    // Direct repo call with a CHECK-violating template: the INSERT must roll back fully.
    await expect(
      createResumeWithVersion({ userId: '00000000-0000-0000-0000-000000000000', title: 't', templateKey: 'bogus', content: {} }),
    ).rejects.toThrow();
    const { pool } = await import('../src/config/database.js');
    const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM resumes WHERE title = $1', ['t']);
    expect(rows[0].n).toBe(0);
  });

  it('requires authentication', async () => {
    expect((await request(app).get('/api/resumes')).status).toBe(401);
  });
});
