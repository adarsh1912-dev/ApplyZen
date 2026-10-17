import { createApp, env } from './app.js';
import { pool } from './config/database.js';

const app = createApp();
const server = app.listen(env.port, () => {
  console.log(`[api] listening on :${env.port} (${env.nodeEnv})`);
});

// Graceful shutdown: stop accepting, drain, then close the pool.
let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[api] ${signal} received, draining…`);
  server.close(async () => {
    try {
      await pool.end();
      console.log('[api] pool closed, exiting');
      process.exit(0);
    } catch (err) {
      console.error('[api] error during shutdown:', err.message);
      process.exit(1);
    }
  });
  // Hard stop if connections refuse to drain.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
