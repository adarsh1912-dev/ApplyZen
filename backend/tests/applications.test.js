import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, authedAgent, truncate, uniqueEmail } from './helpers.js';

beforeEach(truncate);

const mk = (over = {}) => ({
  company: 'Acme Corp',
  job_title: 'Frontend Engineer',
  status: 'Applied',
  applied_on: '2026-10-01',
  notes: 'Referral.',
  ...over,
});

describe('applications', () => {
  it('creates with label mapping and reads back', async () => {
    const agent = await authedAgent(uniqueEmail());
    const res = await agent.post('/api/applications').send(mk({ status: 'Interview' }));
    expect(res.status).toBe(201);
    expect(res.body.data.application.status).toBe('Interview');
    expect(res.body.data.application.applied_on).toBe('2026-10-01');
    const lower = await agent.post('/api/applications').send(mk({ company: 'Globex', status: 'applied' }));
    expect(lower.body.data.application.status).toBe('Applied');
    const got = await agent.get(`/api/applications/${res.body.data.application.id}`);
    expect(got.body.data.application.company).toBe('Acme Corp');
    expect(got.body.data.application.applied_on).toBe('2026-10-01');
  });

  it('rejects invalid status and bad input', async () => {
    const agent = await authedAgent(uniqueEmail());
    expect((await agent.post('/api/applications').send(mk({ status: 'Hired' }))).status).toBe(400);
    expect((await agent.post('/api/applications').send({ company: '', job_title: 'x' })).status).toBe(400);
    expect((await agent.post('/api/applications').send(mk({ applied_on: '10/01/2026' }))).status).toBe(400);
  });

  it('filters by status, searches, ranges dates, and paginates', async () => {
    const agent = await authedAgent(uniqueEmail());
    await agent.post('/api/applications').send(mk({ company: 'Acme Corp', status: 'Applied', applied_on: '2026-10-01' }));
    await agent.post('/api/applications').send(mk({ company: 'Beta LLC', status: 'Interview', applied_on: '2026-09-15' }));
    await agent.post('/api/applications').send(mk({ company: 'Gamma Inc', status: 'Rejected', applied_on: '2026-08-01' }));

    const byStatus = await agent.get('/api/applications?status=Interview');
    expect(byStatus.body.data.items).toHaveLength(1);

    const search = await agent.get('/api/applications?q=acme');
    expect(search.body.data.items).toHaveLength(1);

    const ranged = await agent.get('/api/applications?from=2026-09-01&to=2026-10-31');
    expect(ranged.body.data.total).toBe(2);

    const paged = await agent.get('/api/applications?page=1&per_page=2');
    expect(paged.body.data).toMatchObject({ total: 3 });
    expect(paged.body.data.items).toHaveLength(2);

    const sorted = await agent.get('/api/applications?sort=company&order=asc');
    expect(sorted.body.data.items[0].company).toBe('Acme Corp');

    expect((await agent.get('/api/applications?sort=evil')).status).toBe(400);
  });

  it('updates status and deletes', async () => {
    const agent = await authedAgent(uniqueEmail());
    const created = await agent.post('/api/applications').send(mk({ status: 'Saved' }));
    const id = created.body.data.application.id;
    const patched = await agent.patch(`/api/applications/${id}`).send({ status: 'Offer' });
    expect(patched.body.data.application.status).toBe('Offer');
    expect((await agent.delete(`/api/applications/${id}`)).status).toBe(204);
    expect((await agent.get(`/api/applications/${id}`)).status).toBe(404);
  });

  it('computes stats with SQL aggregation', async () => {
    const agent = await authedAgent(uniqueEmail());
    await agent.post('/api/applications').send(mk({ status: 'Applied' }));
    await agent.post('/api/applications').send(mk({ company: 'B', status: 'Applied' }));
    await agent.post('/api/applications').send(mk({ company: 'C', status: 'Interview' }));
    const stats = await agent.get('/api/applications/stats');
    expect(stats.body.data).toMatchObject({ total: 3, by_status: { Applied: 2, Interview: 1, Saved: 0 } });
  });

  it('isolates applications per user', async () => {
    const a = await authedAgent(uniqueEmail('a'));
    const b = await authedAgent(uniqueEmail('b'));
    const created = await a.post('/api/applications').send(mk());
    const id = created.body.data.application.id;
    expect((await b.get(`/api/applications/${id}`)).status).toBe(404);
    expect((await b.get('/api/applications')).body.data.total).toBe(0);
    expect((await b.get('/api/applications/stats')).body.data.total).toBe(0);
  });

  it('requires authentication', async () => {
    expect((await request(app).get('/api/applications')).status).toBe(401);
  });
});
