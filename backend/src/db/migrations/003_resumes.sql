-- 003_resumes: one row per resume; structured content lives in JSONB and is
-- validated by Zod before it ever reaches SQL (bounded sizes, known shape).
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  template_key TEXT NOT NULL DEFAULT 'minimal'
    CHECK (template_key IN ('classic', 'minimal', 'technical', 'compact')),
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- All resume queries are scoped to a user and ordered by recency.
CREATE INDEX resumes_user_updated_idx ON resumes (user_id, updated_at DESC);
