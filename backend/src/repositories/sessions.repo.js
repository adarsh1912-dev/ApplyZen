import { query } from '../config/database.js';

export async function createSession(client, { userId, refreshHash, expiresAt }) {
  const q = `INSERT INTO sessions (user_id, refresh_hash, expires_at)
             VALUES ($1, $2, $3) RETURNING id, created_at, expires_at`;
  const result = client ? await client.query(q, [userId, refreshHash, expiresAt]) : await query(q, [userId, refreshHash, expiresAt]);
  return result.rows[0];
}

/** Live session (not revoked, not expired) by refresh-token hash. */
export async function findLiveSession(refreshHash) {
  const { rows } = await query(
    `SELECT id, user_id, created_at, expires_at
     FROM sessions
     WHERE refresh_hash = $1 AND revoked_at IS NULL AND expires_at > now()`,
    [refreshHash],
  );
  return rows[0] ?? null;
}

export async function revokeSession(client, { sessionId, userId }) {
  const q = `UPDATE sessions SET revoked_at = now()
             WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL`;
  const result = client ? await client.query(q, [sessionId, userId]) : await query(q, [sessionId, userId]);
  return result.rowCount;
}

export async function revokeAllSessions(userId) {
  const { rowCount } = await query(
    'UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
    [userId],
  );
  return rowCount;
}

export async function listSessions(userId) {
  const { rows } = await query(
    `SELECT id, created_at, expires_at, revoked_at
     FROM sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [userId],
  );
  return rows;
}
/** Live session by id (for access-token binding). Indexed PK lookup. */
export async function findLiveSessionById(sessionId) {
  const { rows } = await query(
    `SELECT id, user_id, expires_at
     FROM sessions
     WHERE id = $1 AND revoked_at IS NULL AND expires_at > now()`,
    [sessionId],
  );
  return rows[0] ?? null;
}
