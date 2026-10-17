-- 007_template_keys: ship four SWE-focused templates (engineer, terminal, opensource, staff).
ALTER TABLE resumes DROP CONSTRAINT resumes_template_key_check;
ALTER TABLE resumes ADD CONSTRAINT resumes_template_key_check
  CHECK (template_key IN ('classic', 'minimal', 'technical', 'compact', 'engineer', 'terminal', 'opensource', 'staff'));
