-- 002_sessions: server-side refresh sessions. Only the SHA-256 hash of the
-- opaque refresh token is stored; theft of the DB alone cannot mint sessions.
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  refresh_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ
);
-- Lookup by owner for session listing / revocation.
CREATE INDEX sessions_user_id_idx ON sessions (user_id);
-- Cleanup job for expired rows.
CREATE INDEX sessions_expires_at_idx ON sessions (expires_at);
