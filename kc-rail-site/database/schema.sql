
CREATE TABLE IF NOT EXISTS support_feedback (
  id BIGSERIAL PRIMARY KEY,
  full_name TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 120),
  zip_code VARCHAR(10) NOT NULL CHECK (zip_code ~ '^\d{5}(-\d{4})?$'),
  email TEXT NOT NULL CHECK (char_length(email) <= 254),
  comments TEXT NOT NULL DEFAULT '',
  comment_word_count INTEGER NOT NULL CHECK (comment_word_count <= 256),
  ip_hash TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_feedback_created_at_idx ON support_feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS support_feedback_zip_code_idx ON support_feedback (zip_code);
