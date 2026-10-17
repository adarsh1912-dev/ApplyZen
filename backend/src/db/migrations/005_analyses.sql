-- 005_analyses: persisted job-description analyses. Statuses normalized to
-- lowercase; the API maps them to the frontend's display labels.
CREATE TABLE job_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  resume_id UUID REFERENCES resumes (id) ON DELETE SET NULL,
  job_title TEXT CHECK (job_title IS NULL OR char_length(job_title) BETWEEN 1 AND 200),
  company TEXT CHECK (company IS NULL OR char_length(company) BETWEEN 1 AND 200),
  job_description TEXT NOT NULL CHECK (char_length(job_description) BETWEEN 50 AND 20000),
  result JSONB NOT NULL,
  engine TEXT NOT NULL CHECK (engine IN ('heuristic', 'llm')),
  status TEXT NOT NULL DEFAULT 'complete' CHECK (status = 'complete'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- History view per user, newest first.
CREATE INDEX job_analyses_user_created_idx ON job_analyses (user_id, created_at DESC);
