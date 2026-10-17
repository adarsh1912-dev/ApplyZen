import { query, withTransaction } from '../config/database.js';

const rowToResume = (r) => ({
  id: r.id,
  title: r.title,
  template_key: r.template_key,
  content: r.content,
  created_at: r.created_at,
  updated_at: r.updated_at,
});

/** Create resume + initial version atomically. */
export async function createResumeWithVersion({ userId, title, templateKey, content }) {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO resumes (user_id, title, template_key, content)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, template_key, content, created_at, updated_at`,
      [userId, title, templateKey, JSON.stringify(content)],
    );
    await client.query('INSERT INTO resume_versions (resume_id, version, content) VALUES ($1, 1, $2)', [
      rows[0].id,
      JSON.stringify(content),
    ]);
    return rowToResume(rows[0]);
  });
}

/** List without the (potentially large) content column — one indexed query. */
export async function listResumes({ userId, page, perPage }) {
  const offset = (page - 1) * perPage;
  const [{ rows }, count] = await Promise.all([
    query(
      `SELECT id, title, template_key, created_at, updated_at
       FROM resumes WHERE user_id = $1
       ORDER BY updated_at DESC LIMIT $2 OFFSET $3`,
      [userId, perPage, offset],
    ),
    query('SELECT COUNT(*)::int AS total FROM resumes WHERE user_id = $1', [userId]),
  ]);
  return { items: rows, total: count.rows[0].total };
}

export async function getResume({ userId, resumeId }) {
  const { rows } = await query(
    `SELECT id, title, template_key, content, created_at, updated_at
     FROM resumes WHERE id = $1 AND user_id = $2`,
    [resumeId, userId],
  );
  return rows[0] ? rowToResume(rows[0]) : null;
}

/**
 * Partial update with optimistic concurrency. When expectedUpdatedAt is given
 * and no longer matches, returns { conflict: true } instead of writing.
 */
export async function updateResume({ userId, resumeId, patch, expectedUpdatedAt }) {
  const sets = [];
  const params = [];
  let i = 1;
  if (patch.title !== undefined) { sets.push(`title = $${i++}`); params.push(patch.title); }
  if (patch.templateKey !== undefined) { sets.push(`template_key = $${i++}`); params.push(patch.templateKey); }
  if (patch.content !== undefined) { sets.push(`content = $${i++}`); params.push(JSON.stringify(patch.content)); }
  sets.push('updated_at = now()');
  params.push(resumeId, userId);
  let sql = `UPDATE resumes SET ${sets.join(', ')} WHERE id = $${i++} AND user_id = $${i++}`;
  if (expectedUpdatedAt) {
    // Compare at millisecond precision: pg returns timestamps as JS Dates, so
    // the API's ISO strings truncate Postgres microseconds. Exact equality
    // would reject every token that was read back from the API.
    sql += ` AND date_trunc('milliseconds', updated_at) = date_trunc('milliseconds', $${i++}::timestamptz)`;
    params.push(expectedUpdatedAt);
  }
  sql += ' RETURNING id, title, template_key, content, created_at, updated_at';
  const { rows, rowCount } = await query(sql, params);
  if (rowCount === 0) {
    // Distinguish "missing/forbidden" from "stale copy".
    const existing = await getResume({ userId, resumeId });
    if (existing && expectedUpdatedAt) return { conflict: true, currentUpdatedAt: existing.updated_at };
    return null;
  }
  return rowToResume(rows[0]);
}

export async function deleteResume({ userId, resumeId }) {
  // Versions cascade via FK; analyses/applications keep history with resume_id nulled.
  const { rowCount } = await query('DELETE FROM resumes WHERE id = $1 AND user_id = $2', [resumeId, userId]);
  return rowCount;
}

export async function duplicateResume({ userId, resumeId }) {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `SELECT title, template_key, content FROM resumes WHERE id = $1 AND user_id = $2`,
      [resumeId, userId],
    );
    if (rows.length === 0) return null;
    const src = rows[0];
    const copy = await client.query(
      `INSERT INTO resumes (user_id, title, template_key, content)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, template_key, content, created_at, updated_at`,
      [userId, `${src.title} (copy)`, src.template_key, src.content],
    );
    await client.query('INSERT INTO resume_versions (resume_id, version, content) VALUES ($1, 1, $2)', [
      copy.rows[0].id,
      src.content,
    ]);
    return rowToResume(copy.rows[0]);
  });
}

export async function listVersions({ userId, resumeId }) {
  // Ownership enforced by scoping versions to the user's resume.
  const { rows } = await query(
    `SELECT v.id, v.version, v.created_at
     FROM resume_versions v JOIN resumes r ON r.id = v.resume_id
     WHERE v.resume_id = $1 AND r.user_id = $2
     ORDER BY v.version DESC`,
    [resumeId, userId],
  );
  return rows;
}

export async function getVersion({ userId, resumeId, version }) {
  const { rows } = await query(
    `SELECT v.id, v.version, v.content, v.created_at
     FROM resume_versions v JOIN resumes r ON r.id = v.resume_id
     WHERE v.resume_id = $1 AND v.version = $2 AND r.user_id = $3`,
    [resumeId, version, userId],
  );
  return rows[0] ?? null;
}

/** Snapshot current content; version = MAX+1 inside a transaction (no lost races). */
export async function createVersion({ userId, resumeId }) {
  return withTransaction(async (client) => {
    const { rows: owned } = await client.query(
      'SELECT content FROM resumes WHERE id = $1 AND user_id = $2',
      [resumeId, userId],
    );
    if (owned.length === 0) return null;
    const { rows: maxRow } = await client.query(
      'SELECT COALESCE(MAX(version), 0) AS m FROM resume_versions WHERE resume_id = $1',
      [resumeId],
    );
    const next = maxRow[0].m + 1;
    const { rows } = await client.query(
      `INSERT INTO resume_versions (resume_id, version, content)
       VALUES ($1, $2, $3) RETURNING id, version, created_at`,
      [resumeId, next, owned[0].content],
    );
    return rows[0];
  });
}
