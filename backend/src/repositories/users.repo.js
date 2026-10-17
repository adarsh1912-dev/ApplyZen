import { query } from '../config/database.js';

const PUBLIC_COLUMNS = 'id, name, email, created_at, updated_at';

export async function createUser({ name, email, passwordHash }) {
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING ${PUBLIC_COLUMNS}`,
    [name, email, passwordHash],
  );
  return rows[0];
}

export async function findUserByEmail(email) {
  const { rows } = await query(
    'SELECT id, name, email, password_hash, created_at, updated_at FROM users WHERE email = $1',
    [email],
  );
  return rows[0] ?? null;
}

export async function findUserById(id) {
  const { rows } = await query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`, [id]);
  return rows[0] ?? null;
}
