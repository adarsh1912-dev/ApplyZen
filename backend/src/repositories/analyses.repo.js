import { query } from '../config/database.js';

export async function createAnalysis({ userId, resumeId, jobTitle, company, jobDescription, result, engine }) {
  const { rows } = await query(
    `INSERT INTO job_analyses (user_id, resume_id, job_title, company, job_description, result, engine)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, resume_id, job_title, company, job_description, result, engine, status, created_at`,
    [userId, resumeId, jobTitle ?? null, company ?? null, jobDescription,
     JSON.stringify(result), engine],
  );
  return rows[0];
}

/** History list: metadata + coverage extracted from JSONB (result column excluded). */
export async function listAnalyses({ userId, page, perPage }) {
  const offset = (page - 1) * perPage;
  const listSql = `SELECT id, resume_id, job_title, company, engine, status, created_at,
                          (result->>'coverage')::int AS coverage
                   FROM job_analyses WHERE user_id = $1
                   ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
  const [{ rows }, count] = await Promise.all([
    query(listSql, [userId, perPage, offset]),
    query('SELECT COUNT(*)::int AS total FROM job_analyses WHERE user_id = $1', [userId]),
  ]);
  return { items: rows, total: count.rows[0].total };
}

export async function getAnalysis({ userId, id }) {
  const { rows } = await query(
    `SELECT id, resume_id, job_title, company, job_description, result, engine, status, created_at
     FROM job_analyses WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  return rows[0] ?? null;
}
