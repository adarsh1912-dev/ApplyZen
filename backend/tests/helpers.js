import request from 'supertest';
import { createApp } from '../src/app.js';
import { pool } from '../src/config/database.js';

export const app = createApp();

let counter = 0;

/** Wipe all data between tests. Tables enumerated explicitly; CASCADE follows FKs. */
export async function truncate() {
  await pool.query(
    'TRUNCATE users, sessions, auth_tokens, resumes, resume_versions, job_analyses, job_applications CASCADE',
  );
}

export function uniqueEmail(prefix = 'user') {
  counter += 1;
  return `${prefix}${counter}_${Date.now()}@example.com`;
}

/**
 * Register a fresh user, mark it verified in the test database, then log in to
 * obtain the cookie-persisting agent. Registration itself no longer logs in.
 */
export async function authedAgent(email, password = 'password123', name = 'Test User') {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/register').send({ name, email, password });
  if (res.status !== 201) throw new Error(`setup register failed: ${res.status} ${JSON.stringify(res.body)}`);
  await pool.query('UPDATE users SET email_verified_at = now() WHERE email = $1', [email]);
  const login = await agent.post('/api/auth/login').send({ email, password });
  if (login.status !== 200) throw new Error(`setup login failed: ${login.status} ${JSON.stringify(login.body)}`);
  return agent;
}

export async function closePool() {
  await pool.end();
}
