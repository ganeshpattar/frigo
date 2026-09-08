-- Auth Service schema (auth_db) — aligned with Food_Microservices_ERD.md
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

CREATE TABLE IF NOT EXISTS users (
  user_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL,
  password_hash text NOT NULL,
  user_status text NOT NULL DEFAULT 'ACTIVE'
    CHECK (user_status IN ('ACTIVE', 'SUSPENDED', 'DELETED')),
  account_status text NOT NULL DEFAULT 'ACTIVE'
    CHECK (account_status IN ('ACTIVE', 'LOCKED', 'DISABLED')),
  email_verified_at_utc timestamptz NULL,
  last_login_at_utc timestamptz NULL,
  failed_login_count int NOT NULL DEFAULT 0,
  locked_until_utc timestamptz NULL,
  created_at_utc timestamptz NOT NULL DEFAULT NOW(),
  updated_at_utc timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_users_status ON users (user_status, account_status);

CREATE TABLE IF NOT EXISTS roles (
  role_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_code text NOT NULL UNIQUE
    CHECK (role_code IN ('ADMIN', 'MANAGER', 'CUSTOMER')),
  name text NOT NULL,
  description text NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at_utc timestamptz NOT NULL DEFAULT NOW(),
  updated_at_utc timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  permission_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at_utc timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id uuid NOT NULL REFERENCES roles(role_id),
  permission_id uuid NOT NULL REFERENCES permissions(permission_id),
  created_at_utc timestamptz NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_role_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(user_id),
  role_id uuid NOT NULL REFERENCES roles(role_id),
  assigned_at_utc timestamptz NOT NULL DEFAULT NOW(),
  revoked_at_utc timestamptz NULL,
  assigned_by_user_id uuid NULL REFERENCES users(user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_roles_active
  ON user_roles (user_id, role_id)
  WHERE revoked_at_utc IS NULL;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  refresh_token_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(user_id),
  token_hash text NOT NULL UNIQUE,
  family_id uuid NOT NULL,
  issued_at_utc timestamptz NOT NULL DEFAULT NOW(),
  expires_at_utc timestamptz NOT NULL,
  revoked_at_utc timestamptz NULL,
  replaced_by_token_id uuid NULL,
  device_id text NULL,
  ip_hash text NULL
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens (user_id);

-- Extension for forgot/reset password (not named in ERD; owned by Auth)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  reset_token_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(user_id),
  code_hash text NOT NULL,
  expires_at_utc timestamptz NOT NULL,
  consumed_at_utc timestamptz NULL,
  created_at_utc timestamptz NOT NULL DEFAULT NOW(),
  request_ip_hash text NULL
);

CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens (user_id, created_at_utc DESC);

CREATE TABLE IF NOT EXISTS auth_outbox (
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

-- Seed roles
INSERT INTO roles (role_code, name, description)
VALUES
  ('CUSTOMER', 'Customer', 'Customer shopper'),
  ('MANAGER', 'Manager', 'Operations manager'),
  ('ADMIN', 'Admin', 'Platform administrator')
ON CONFLICT (role_code) DO NOTHING;

-- Seed permissions (from ERD matrix)
INSERT INTO permissions (permission_code, name)
VALUES
  ('product.read', 'Read products'),
  ('category.read', 'Read categories'),
  ('cart.manage_own', 'Manage own cart'),
  ('order.create', 'Create orders'),
  ('order.read_own', 'Read own orders'),
  ('order.read_all', 'Read all orders'),
  ('order.update_status', 'Update order status'),
  ('product.create', 'Create products'),
  ('product.update', 'Update products'),
  ('product.delete', 'Delete products'),
  ('inventory.read', 'Read inventory'),
  ('inventory.adjust', 'Adjust inventory'),
  ('customer.read', 'Read customers'),
  ('customer.update', 'Update customers'),
  ('user.manage_roles', 'Manage roles'),
  ('audit.read', 'Read audit logs')
ON CONFLICT (permission_code) DO NOTHING;

-- CUSTOMER permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'CUSTOMER'
  AND p.permission_code IN (
    'product.read', 'category.read', 'cart.manage_own',
    'order.create', 'order.read_own', 'customer.read', 'customer.update'
  )
ON CONFLICT DO NOTHING;

-- MANAGER permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'MANAGER'
  AND p.permission_code IN (
    'product.read', 'category.read', 'cart.manage_own',
    'order.read_all', 'order.update_status',
    'inventory.read', 'customer.read', 'customer.update'
  )
ON CONFLICT DO NOTHING;

-- ADMIN: all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'ADMIN'
ON CONFLICT DO NOTHING;
