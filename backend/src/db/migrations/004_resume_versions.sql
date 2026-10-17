-- 004_resume_versions: immutable snapshots. Version numbers are assigned in a
-- transaction (MAX(version)+1) so concurrent snapshots cannot collide.
CREATE TABLE resume_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL REFERENCES resumes (id) ON DELETE CASCADE,
  version INTEGER NOT NULL CHECK (version >= 1),
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (resume_id, version)
);
CREATE INDEX resume_versions_resume_idx ON resume_versions (resume_id, version DESC);
