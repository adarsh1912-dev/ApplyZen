-- 006_applications: job tracker rows. Status stored lowercase; API maps to
-- display labels (Saved/Applied/Assessment/Interview/Offer/Rejected).
-- pg_trgm is created by 005a_pg_trgm.sql so Heroku's extension validator can
-- process it as a standalone statement.
CREATE TABLE job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  resume_id UUID REFERENCES resumes (id) ON DELETE SET NULL,
  company TEXT NOT NULL CHECK (char_length(company) BETWEEN 1 AND 200),
  job_title TEXT NOT NULL CHECK (char_length(job_title) BETWEEN 1 AND 200),
  job_description TEXT CHECK (job_description IS NULL OR char_length(job_description) <= 20000),
  status TEXT NOT NULL DEFAULT 'saved'
    CHECK (status IN ('saved', 'applied', 'assessment', 'interview', 'offer', 'rejected')),
  applied_on DATE,
  notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 5000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Filter-by-status listing per user.
CREATE INDEX job_applications_user_status_idx ON job_applications (user_id, status);
-- Date-range + recency ordering per user.
CREATE INDEX job_applications_user_date_idx ON job_applications (user_id, applied_on DESC NULLS LAST, created_at DESC);
-- Substring search on company/title (ILIKE '%…%') via trigram index.
CREATE INDEX job_applications_search_trgm_idx ON job_applications USING gin (company gin_trgm_ops, job_title gin_trgm_ops);
