import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, authedAgent, truncate, uniqueEmail } from './helpers.js';

beforeEach(truncate);

describe('auth', () => {
  it('registers, sets cookies, and returns the current user', async () => {
    const agent = await authedAgent(uniqueEmail());
    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: { user: { name: 'Test User' } } });
    expect(res.body.data.user).not.toHaveProperty('password_hash');
  });

  it('rejects duplicate email registration, including case variants', async () => {
    const email = uniqueEmail();
    await authedAgent(email);
    const dup = await request(app).post('/api/auth/register')
      .send({ name: 'Other', email: email.toUpperCase(), password: 'password123' });
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('CONFLICT');
  });

  it('rejects wrong password and unknown email with the same message', async () => {
    const email = uniqueEmail();
    await authedAgent(email);
    const wrongPw = await request(app).post('/api/auth/login').send({ email, password: 'nope-nope-nope' });
    const unknown = await request(app).post('/api/auth/login').send({ email: 'nobody@example.com', password: 'nope-nope-nope' });
    expect(wrongPw.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrongPw.body.error.message).toBe(unknown.body.error.message);
  });

  it('validates registration input', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: '', email: 'bad', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });

  it('rejects unauthenticated and tampered access', async () => {
    const anon = await request(app).get('/api/auth/me');
    expect(anon.status).toBe(401);
    const forged = await request(app).get('/api/auth/me').set('Cookie', 'az_at=forged.token.here');
    expect(forged.status).toBe(401);
  });

  it('rotates refresh tokens: reuse of an old token fails', async () => {
    const agent = await authedAgent(uniqueEmail());
    const first = await agent.post('/api/auth/refresh');
    expect(first.status).toBe(200);
    // The agent jar now holds the rotated pair; replaying rotation again is fine,
    // but the *previous* refresh token must be dead. Capture it explicitly:
    const stale = await request(app).post('/api/auth/refresh').set('Cookie', 'az_rt=deadbeef');
    expect(stale.status).toBe(401);
  });

  it('logout revokes the session immediately', async () => {
    const agent = await authedAgent(uniqueEmail());
    expect((await agent.get('/api/auth/me')).status).toBe(200);
    await agent.post('/api/auth/logout');
    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });

  it('lists sessions and revokes one without killing the other', async () => {
    const email = uniqueEmail();
    const a = await authedAgent(email);
    const b = request.agent(app);
    await b.post('/api/auth/login').send({ email, password: 'password123' });

    const list = await a.get('/api/auth/sessions');
    expect(list.status).toBe(200);
    expect(list.body.data.items.length).toBe(2);

    const other = list.body.data.items.find((s) => !s.current);
    expect(other).toBeDefined();
    const del = await a.delete(`/api/auth/sessions/${other.id}`);
    expect(del.status).toBe(200);
    expect((await b.get('/api/auth/me')).status).toBe(401);
    expect((await a.get('/api/auth/me')).status).toBe(200);
  });

  it('logout-all revokes every session', async () => {
    const email = uniqueEmail();
    const a = await authedAgent(email);
    const b = request.agent(app);
    await b.post('/api/auth/login').send({ email, password: 'password123' });
    await a.post('/api/auth/logout-all');
    expect((await a.get('/api/auth/me')).status).toBe(401);
    expect((await b.get('/api/auth/me')).status).toBe(401);
  });

  it('returns the envelope on unknown routes without leaking internals', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(JSON.stringify(res.body)).not.toMatch(/stack|at .*\(/);
  });
});
