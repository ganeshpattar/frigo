-- Email verification OTPs for signup
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  verification_token_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  expires_at_utc timestamptz NOT NULL,
  consumed_at_utc timestamptz NULL,
  created_at_utc timestamptz NOT NULL DEFAULT NOW(),
  request_ip_hash text NULL
);

CREATE INDEX IF NOT EXISTS idx_email_verification_user
  ON email_verification_tokens (user_id, created_at_utc DESC);
