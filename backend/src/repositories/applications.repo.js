import { query } from '../config/database.js';
import { statusDbToLabel } from '../schemas/index.js';

// applied_on is a DATE: serialize as YYYY-MM-DD instead of a full timestamp.
const COLUMNS = `id, company, job_title, status, to_char(applied_on, 'YYYY-MM-DD') AS applied_on,
                 notes, resume_id, job_description, created_at, updated_at`;

const rowToApp = (r) => ({ ...r, status: statusDbToLabel(r.status) });

export async function createApplication({ userId, data }) {
  const { rows } = await query(
    `INSERT INTO job_applications (user_id, resume_id, company, job_title, job_description, status, applied_on, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING ${COLUMNS}`,
    [userId, data.resume_id ?? null, data.company, data.job_title,
     data.job_description ?? null, data.status, data.applied_on ?? null, data.notes ?? null],
  );
  return rowToApp(rows[0]);
}

// Sort identifiers cannot be parameterized — strict allowlist only.
const SORT_MAP = {
  applied_on: 'applied_on',
  created_at: 'created_at',
  updated_at: 'updated_at',
  company: 'company',
};

export async function listApplications({ userId, filters }) {
  const { status, q, from, to, page, per_page: perPage, sort, order } = filters;
  const conds = ['user_id = $1'];
  const params = [userId];
  let i = 2;
  if (status) {
    const list = String(status).split(',').map((s) => s.trim().toLowerCase())
      .filter((s) => ['saved', 'applied', 'assessment', 'interview', 'offer', 'rejected'].includes(s));
    if (list.length > 0) { conds.push(`status = ANY($${i++})`); params.push(list); }
  }
  if (q) { conds.push(`(company ILIKE $${i} OR job_title ILIKE $${i})`); params.push(`%${q}%`); i++; }
  if (from) { conds.push(`applied_on >= $${i++}`); params.push(from); }
  if (to) { conds.push(`applied_on <= $${i++}`); params.push(to); }
  const where = `WHERE ${conds.join(' AND ')}`;
  const dir = order === 'asc' ? 'ASC' : 'DESC';
  // NULLS LAST keeps undated rows at the end regardless of direction.
  const orderBy = sort === 'company'
    ? `ORDER BY company ${dir}, created_at DESC`
    : `ORDER BY ${SORT_MAP[sort]} ${dir} NULLS LAST, created_at DESC`;
  const offset = (page - 1) * perPage;
  const [{ rows }, count] = await Promise.all([
    query(`SELECT ${COLUMNS} FROM job_applications ${where} ${orderBy} LIMIT $${i++} OFFSET $${i++}`,
      [...params, perPage, offset]),
    query(`SELECT COUNT(*)::int AS total FROM job_applications ${where}`, params),
  ]);
  return { items: rows.map(rowToApp), total: count.rows[0].total };
}

export async function getApplication({ userId, id }) {
  const { rows } = await query(
    `SELECT ${COLUMNS} FROM job_applications WHERE id = $1 AND user_id = $2`, [id, userId],
  );
  return rows[0] ? rowToApp(rows[0]) : null;
}

export async function updateApplication({ userId, id, patch }) {
  const map = {
    company: 'company', job_title: 'job_title', job_description: 'job_description',
    status: 'status', applied_on: 'applied_on', notes: 'notes', resume_id: 'resume_id',
  };
  const sets = [];
  const params = [];
  let i = 1;
  for (const [key, col] of Object.entries(map)) {
    if (patch[key] !== undefined) { sets.push(`${col} = $${i++}`); params.push(patch[key]); }
  }
  if (sets.length === 0) return getApplication({ userId, id });
  sets.push('updated_at = now()');
  params.push(id, userId);
  const { rows, rowCount } = await query(
    `UPDATE job_applications SET ${sets.join(', ')} WHERE id = $${i++} AND user_id = $${i++} RETURNING ${COLUMNS}`,
    params,
  );
  return rowCount === 0 ? null : rowToApp(rows[0]);
}

export async function deleteApplication({ userId, id }) {
  const { rowCount } = await query('DELETE FROM job_applications WHERE id = $1 AND user_id = $2', [id, userId]);
  return rowCount;
}

/** Aggregated in SQL — the API never loads all rows to count them. */
export async function applicationStats(userId) {
  const { rows } = await query(
    `SELECT status, COUNT(*)::int AS count FROM job_applications
     WHERE user_id = $1 GROUP BY status`,
    [userId],
  );
  const byStatus = { Saved: 0, Applied: 0, Assessment: 0, Interview: 0, Offer: 0, Rejected: 0 };
  let total = 0;
  for (const r of rows) {
    byStatus[statusDbToLabel(r.status)] = r.count;
    total += r.count;
  }
  return { total, by_status: byStatus };
}
