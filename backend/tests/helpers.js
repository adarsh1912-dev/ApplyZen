import request from 'supertest';
import { createApp } from '../src/app.js';
import { pool } from '../src/config/database.js';

export const app = createApp();

let counter = 0;

/** Wipe all data between tests. Tables enumerated explicitly; CASCADE follows FKs. */
export async function truncate() {
  await pool.query(
    'TRUNCATE users, sessions, resumes, resume_versions, job_analyses, job_applications CASCADE',
  );
}

export function uniqueEmail(prefix = 'user') {
  counter += 1;
  return `${prefix}${counter}_${Date.now()}@example.com`;
}

/** Register a fresh user and return a cookie-persisting agent. */
export async function authedAgent(email, password = 'password123', name = 'Test User') {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/register').send({ name, email, password });
  if (res.status !== 201) throw new Error(`setup register failed: ${res.status} ${JSON.stringify(res.body)}`);
  return agent;
}

export async function closePool() {
  await pool.end();
}
