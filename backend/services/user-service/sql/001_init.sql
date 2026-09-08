-- User Service schema (user_db) — aligned with Food_Microservices_ERD.md
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS customer_profiles (
  customer_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NULL,
  phone text NULL,
  profile_image_url text NULL,
  created_at_utc timestamptz NOT NULL DEFAULT NOW(),
  updated_at_utc timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_profiles_user ON customer_profiles (user_id);

CREATE TABLE IF NOT EXISTS addresses (
  address_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customer_profiles(customer_id),
  address_label text NULL,
  recipient_name text NOT NULL,
  phone text NULL,
  address_line1 text NOT NULL,
  address_line2 text NULL,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  country_code char(2) NOT NULL,
  latitude numeric(9,6) NULL,
  longitude numeric(9,6) NULL,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at_utc timestamptz NOT NULL DEFAULT NOW(),
  updated_at_utc timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_outbox (
  outbox_id bigserial PRIMARY KEY,
  event_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  aggregate_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  payload_json jsonb NOT NULL,
  created_at_utc timestamptz NOT NULL DEFAULT NOW(),
  published_at_utc timestamptz NULL,
  attempt_count int NOT NULL DEFAULT 0
);
