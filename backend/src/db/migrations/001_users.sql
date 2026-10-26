-- 001_users: accounts. Email is normalized (lowercased/trimmed) in the app;
-- the CITEXT-free UNIQUE on the normalized value enforces case-insensitive uniqueness.
-- gen_random_uuid() is built into PostgreSQL 13+, so no pgcrypto extension is needed.
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  email TEXT NOT NULL UNIQUE CHECK (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
