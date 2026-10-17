import { Pool } from 'pg';
import { env } from './env.js';

// Single shared pool. Tuned for a small API + local Postgres.
export const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  // In tests the pool is intentionally left open across files; don't hold the worker open.
  allowExitOnIdle: env.isTest,
});

pool.on('error', (err) => {
  // A pool-level error means an idle client died; log minimally and keep serving.
  console.error('[db] idle client error:', err.message);
});

/** Thin wrapper so call sites never touch pool internals. Values always parameterized by callers. */
export function query(text, params = []) {
  return pool.query(text, params);
}

/**
 * Run fn(client) inside a transaction. Commits on success, rolls back on
 * error, and ALWAYS releases the client back to the pool.
 */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch { /* already broken */ }
    throw err;
  } finally {
    client.release();
  }
}
