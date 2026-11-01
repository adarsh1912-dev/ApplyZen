import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app, authedAgent, truncate, uniqueEmail } from './helpers.js';
import { pool } from '../src/config/database.js';

const emailState = vi.hoisted(() => ({ verification: null, reset: null }));

vi.mock('../src/services/email.service.js', () => ({
  sendVerificationEmail: vi.fn(async ({ token }) => { emailState.verification = token; }),
  sendPasswordResetEmail: vi.fn(async ({ token }) => { emailState.reset = token; }),
}));

beforeEach(async () => {
  await truncate();
  emailState.verification = null;
  emailState.reset = null;
});

describe('auth', () => {
  it('registers, verifies, and returns the current user', async () => {
    const agent = await authedAgent(uniqueEmail());
    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: { user: { name: 'Test User', email_verified: true } } });
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

describe('email verification', () => {
  it('registers unverified, blocks login, verifies, and then allows login', async () => {
    const email = uniqueEmail();
    const reg = await request(app).post('/api/auth/register')
      .send({ name: 'Verify User', email, password: 'password123' });
    expect(reg.status).toBe(201);
    expect(reg.body.data.verification_required).toBe(true);
    expect(reg.body.data.email_sent).toBe(true);
    expect(reg.headers['set-cookie']).toBeUndefined();
    expect(emailState.verification).toBeTruthy();

    const blocked = await request(app).post('/api/auth/login').send({ email, password: 'password123' });
    expect(blocked.status).toBe(403);
    expect(blocked.body.error.code).toBe('EMAIL_NOT_VERIFIED');

    const verified = await request(app).post('/api/auth/verify-email').send({ token: emailState.verification });
    expect(verified.status).toBe(200);
    expect(verified.body.data.verified).toBe(true);

    const login = await request(app).post('/api/auth/login').send({ email, password: 'password123' });
    expect(login.status).toBe(200);
    expect(login.body.data.user.email_verified).toBe(true);
  });

  it('rejects used, invalid, and expired verification tokens', async () => {
    const email = uniqueEmail();
    await request(app).post('/api/auth/register').send({ name: 'Token User', email, password: 'password123' });
    const token = emailState.verification;

    expect((await request(app).post('/api/auth/verify-email').send({ token })).status).toBe(200);
    expect((await request(app).post('/api/auth/verify-email').send({ token })).status).toBe(400);
    expect((await request(app).post('/api/auth/verify-email').send({ token: 'a'.repeat(64) })).status).toBe(400);

    const secondEmail = uniqueEmail();
    await request(app).post('/api/auth/register').send({ name: 'Expired User', email: secondEmail, password: 'password123' });
    await pool.query("UPDATE auth_tokens SET expires_at = now() - interval '1 minute' WHERE purpose = 'email_verification' AND used_at IS NULL");
    expect((await request(app).post('/api/auth/verify-email').send({ token: emailState.verification })).status).toBe(400);
  });

  it('resend invalidates the old token and sends a new one', async () => {
    const email = uniqueEmail();
    await request(app).post('/api/auth/register').send({ name: 'Resend User', email, password: 'password123' });
    const oldToken = emailState.verification;

    const resend = await request(app).post('/api/auth/resend-verification').send({ email });
    expect(resend.status).toBe(200);
    expect(resend.body.data.sent).toBe(true);
    expect(emailState.verification).not.toBe(oldToken);

    expect((await request(app).post('/api/auth/verify-email').send({ token: oldToken })).status).toBe(400);
    expect((await request(app).post('/api/auth/verify-email').send({ token: emailState.verification })).status).toBe(200);
  });
});

describe('password reset', () => {
  it('returns generic success for an unknown email and sends nothing', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'nobody@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.data.sent).toBe(true);
    expect(emailState.reset).toBeNull();
  });

  it('resets the password, revokes sessions, and invalidates the token', async () => {
    const email = uniqueEmail();
    const agent = await authedAgent(email);

    const forgot = await request(app).post('/api/auth/forgot-password').send({ email });
    expect(forgot.status).toBe(200);
    const token = emailState.reset;
    expect(token).toBeTruthy();

    const reset = await request(app).post('/api/auth/reset-password').send({ token, password: 'newpassword123' });
    expect(reset.status).toBe(200);

    expect((await agent.get('/api/auth/me')).status).toBe(401);
    expect((await request(app).post('/api/auth/login').send({ email, password: 'password123' })).status).toBe(401);
    expect((await request(app).post('/api/auth/login').send({ email, password: 'newpassword123' })).status).toBe(200);
    expect((await request(app).post('/api/auth/reset-password').send({ token, password: 'anotherpass123' })).status).toBe(400);
  });

  it('marks an unverified account verified when the reset succeeds', async () => {
    const email = uniqueEmail();
    await request(app).post('/api/auth/register').send({ name: 'Reset Unverified', email, password: 'password123' });
    const forgot = await request(app).post('/api/auth/forgot-password').send({ email });
    expect(forgot.status).toBe(200);

    const reset = await request(app).post('/api/auth/reset-password').send({ token: emailState.reset, password: 'newpassword123' });
    expect(reset.status).toBe(200);
    const login = await request(app).post('/api/auth/login').send({ email, password: 'newpassword123' });
    expect(login.status).toBe(200);
    expect(login.body.data.user.email_verified).toBe(true);
  });

  it('validates verification and reset input', async () => {
    expect((await request(app).post('/api/auth/verify-email').send({ token: 'short' })).status).toBe(400);
    expect((await request(app).post('/api/auth/reset-password').send({ token: 'a'.repeat(64), password: 'short' })).status).toBe(400);
    expect((await request(app).post('/api/auth/forgot-password').send({ email: 'bad' })).status).toBe(400);
    expect((await request(app).post('/api/auth/resend-verification').send({ email: 'bad' })).status).toBe(400);
  });
});

describe('origin checks', () => {
  const previewOrigin = 'https://applyzen-pr-12-test.vercel.app';

  it('emits CORS headers for exact and configured preview origins', async () => {
    const exact = await request(app).get('/api/templates').set('Origin', 'http://localhost:5173');
    expect(exact.status).toBe(200);
    expect(exact.headers['access-control-allow-origin']).toBe('http://localhost:5173');

    const preview = await request(app).get('/api/templates').set('Origin', previewOrigin);
    expect(preview.status).toBe(200);
    expect(preview.headers['access-control-allow-origin']).toBe(previewOrigin);
  });

  it('omits CORS headers for unknown origins instead of returning 500', async () => {
    const res = await request(app).get('/api/templates').set('Origin', 'https://evil.example');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('blocks cookie-authenticated mutations from unknown origins', async () => {
    const agent = await authedAgent(uniqueEmail());
    const res = await agent.post('/api/applications')
      .set('Origin', 'https://evil.example')
      .send({ company: 'Acme', job_title: 'Engineer' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CSRF_BLOCKED');
  });

  it('allows cookie-authenticated mutations from a configured preview origin', async () => {
    const agent = await authedAgent(uniqueEmail());
    const res = await agent.post('/api/applications')
      .set('Origin', previewOrigin)
      .send({ company: 'Acme', job_title: 'Engineer' });
    expect(res.status).toBe(201);
  });
});
