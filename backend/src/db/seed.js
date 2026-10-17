import bcrypt from 'bcryptjs';
import { pool } from '../config/database.js';
import { env } from '../config/env.js';
import { migrate } from './migrate.js';

// Development-only seed. Refuses to run in production.
// Creates a demo user plus one resume and two applications.
if (env.isProd) {
  console.error('[seed] refusing to seed in production');
  process.exit(1);
}

await migrate();

const email = 'demo@applyzen.local';
const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
if (rows.length > 0) {
  console.log('[seed] demo user already exists, skipping');
  await pool.end();
  process.exit(0);
}

const passwordHash = await bcrypt.hash('demo-password-123', env.bcryptRounds);
const client = await pool.connect();
try {
  await client.query('BEGIN');
  const u = await client.query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
    ['Demo User', email, passwordHash],
  );
  const userId = u.rows[0].id;
  const r = await client.query(
    `INSERT INTO resumes (user_id, title, template_key, content)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [userId, 'Product Designer — 2026', 'minimal', {
      personal: { name: 'Demo User', role: 'Product Designer', email },
      summary: 'Seeded demo resume.',
      experience: [], education: [], skills: ['Figma'], projects: [], certifications: [],
    }],
  );
  await client.query('INSERT INTO resume_versions (resume_id, version, content) VALUES ($1, 1, $2)', [r.rows[0].id, { seeded: true }]);
  await client.query(
    `INSERT INTO job_applications (user_id, company, job_title, status, applied_on, notes)
     VALUES ($1, 'Acme Corp', 'Product Designer', 'applied', CURRENT_DATE, 'Seeded demo application'),
            ($1, 'Globex', 'UI Designer', 'saved', CURRENT_DATE, 'Seeded demo application')`,
    [userId],
  );
  await client.query('COMMIT');
  console.log('[seed] demo user created: demo@applyzen.local / demo-password-123');
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
} finally {
  client.release();
  await pool.end();
}
