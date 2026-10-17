import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { pool } from '../config/database.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(dir, 'migrations');

export async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
  const { rows: applied } = await pool.query('SELECT version FROM schema_migrations');
  const done = new Set(applied.map((r) => r.version));

  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    const version = file.replace(/\.sql$/, '');
    if (done.has(version)) continue;
    const sql = await readFile(path.join(migrationsDir, file), 'utf8');
    console.log(`[migrate] applying ${file}`);
    // One migration per implicit transaction via multi-statement simple query.
    await pool.query('BEGIN');
    try {
      await pool.query(sql);
      await pool.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version]);
      await pool.query('COMMIT');
    } catch (err) {
      await pool.query('ROLLBACK');
      throw err;
    }
  }
  console.log('[migrate] up to date');
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  const mode = process.argv[2] ?? 'up';
  if (mode !== 'up') {
    console.error('Usage: node src/db/migrate.js up');
    process.exit(1);
  }
  migrate()
    .then(() => pool.end())
    .catch((err) => {
      console.error('[migrate] failed:', err.message);
      process.exitCode = 1;
      return pool.end();
    });
}
