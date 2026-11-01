import crypto from 'node:crypto';
import { withTransaction } from '../config/database.js';

const PURPOSES = new Set(['email_verification', 'password_reset']);

function newToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Issue a one-time token, invalidating older unused tokens for the same purpose. */
export async function issueAuthToken({ userId, purpose, ttlMs }) {
  if (!PURPOSES.has(purpose)) throw new Error(`Unsupported auth token purpose: ${purpose}`);
  const token = newToken();
  const expiresAt = new Date(Date.now() + ttlMs);
  await withTransaction(async (client) => {
    await client.query(
      `UPDATE auth_tokens SET used_at = now()
       WHERE user_id = $1 AND purpose = $2 AND used_at IS NULL`,
      [userId, purpose],
    );
    await client.query(
      `INSERT INTO auth_tokens (user_id, purpose, token_hash, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [userId, purpose, hashToken(token), expiresAt],
    );
  });
  return token;
}

/** Verify an email token in one transaction and mark the account verified. */
export async function verifyEmailToken(token) {
  const tokenHash = hashToken(token);
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `SELECT id, user_id FROM auth_tokens
       WHERE token_hash = $1 AND purpose = 'email_verification'
         AND used_at IS NULL AND expires_at > now()
       FOR UPDATE`,
      [tokenHash],
    );
    if (!rows[0]) return null;
    await client.query('UPDATE auth_tokens SET used_at = now() WHERE id = $1', [rows[0].id]);
    await client.query(
      'UPDATE users SET email_verified_at = now(), updated_at = now() WHERE id = $1',
      [rows[0].user_id],
    );
    return rows[0].user_id;
  });
}

/**
 * Consume a reset token, update the password, and revoke every session.
 * The reset email itself proves ownership, so an unverified account becomes
 * verified when the reset succeeds.
 */
export async function resetPasswordWithToken(token, passwordHash) {
  const tokenHash = hashToken(token);
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `SELECT id, user_id FROM auth_tokens
       WHERE token_hash = $1 AND purpose = 'password_reset'
         AND used_at IS NULL AND expires_at > now()
       FOR UPDATE`,
      [tokenHash],
    );
    if (!rows[0]) return null;
    await client.query('UPDATE auth_tokens SET used_at = now() WHERE id = $1', [rows[0].id]);
    await client.query(
      `UPDATE users
       SET password_hash = $2,
           email_verified_at = COALESCE(email_verified_at, now()),
           updated_at = now()
       WHERE id = $1`,
      [rows[0].user_id, passwordHash],
    );
    await client.query(
      'UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
      [rows[0].user_id],
    );
    return rows[0].user_id;
  });
}
