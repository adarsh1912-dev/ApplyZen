import { Client } from 'pg';

// Runs once before all test files: ensures the test database exists and is migrated.
// NEVER touches the development database — the name is hardcoded with a _test suffix guard.
// Note: vitest `test.env` is NOT visible here, so connection values are set explicitly.
process.env.NODE_ENV ??= 'test';
process.env.DATABASE_URL ??= 'postgres://applyzen:applyzen_dev@127.0.0.1:5432/applyzen_test';
process.env.ACCESS_TOKEN_SECRET ??= 'test-only-secret-that-is-long-enough-for-hs256-use';
process.env.FRONTEND_ORIGIN ??= 'http://localhost:5173';
process.env.BCRYPT_ROUNDS ??= '4';
export default async function globalSetup() {
  const testUrl = process.env.DATABASE_URL ?? '';
  if (!testUrl.endsWith('/applyzen_test')) {
    throw new Error(`Refusing to run tests against non-test database: ${testUrl}`);
  }
  const admin = new Client({ connectionString: testUrl.replace('/applyzen_test', '/applyzen') });
  await admin.connect();
  try {
    await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', ['applyzen_test']).then(async (r) => {
      if (r.rowCount === 0) {
        await admin.query('CREATE DATABASE applyzen_test');
      }
    });
  } finally {
    await admin.end();
  }
  // Run pending migrations against DATABASE_URL (the test DB).
  const { migrate } = await import('../src/db/migrate.js');
  await migrate();
}
