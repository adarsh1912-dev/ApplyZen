import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 20_000,
    teardownTimeout: 8_000,
    // Integration tests share one database with truncating setup:
    // run files sequentially in a single worker to avoid cross-file interference.
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgres://applyzen:applyzen_dev@127.0.0.1:5432/applyzen_test',
      ACCESS_TOKEN_SECRET: 'test-only-secret-that-is-long-enough-for-hs256-use',
      FRONTEND_ORIGIN: 'http://localhost:5173',
      BCRYPT_ROUNDS: '4',
      // Never let the suite hit a real provider, even when backend/.env has a
      // key configured: dotenv skips vars that already exist in the process.
      LLM_API_URL: '',
      LLM_API_KEY: '',
      LLM_MODEL: '',
    },
    globalSetup: ['./tests/global-setup.js'],
  },
});
