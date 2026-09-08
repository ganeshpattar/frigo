-- Platform Service schema (catalog, inventory, orders)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS categories (
  category_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  status text NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'INACTIVE', 'DELETED')),
  sort_order int DEFAULT 0,
  created_at_utc timestamptz NOT NULL DEFAULT NOW(),
  updated_at_utc timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  product_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories (category_id),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  short_description text,
  sku text UNIQUE,
  status text NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED')),
  unit_price numeric(12, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  image_url text,
  tags text[] DEFAULT '{}',
  is_available boolean DEFAULT true,
  created_at_utc timestamptz NOT NULL DEFAULT NOW(),
  updated_at_utc timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products (status);

CREATE TABLE IF NOT EXISTS inventory (
  inventory_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL UNIQUE REFERENCES products (product_id),
  available_quantity int NOT NULL DEFAULT 0,
  reserved_quantity int NOT NULL DEFAULT 0,
  updated_at_utc timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  order_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  user_id uuid,
  customer_email text,
  customer_name text,
  status text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN (
      'PENDING',
      'CONFIRMED',
      'PREPARING',
      'READY',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED',
      'FAILED'
    )),
  subtotal numeric(12, 2) NOT NULL DEFAULT 0,
  tax numeric(12, 2) NOT NULL DEFAULT 0,
  delivery_fee numeric(12, 2) NOT NULL DEFAULT 0,
  discount numeric(12, 2) NOT NULL DEFAULT 0,
  total numeric(12, 2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  created_at_utc timestamptz NOT NULL DEFAULT NOW(),
  updated_at_utc timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders (created_at_utc);

CREATE TABLE IF NOT EXISTS order_items (
  order_item_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders (order_id) ON DELETE CASCADE,
  product_id uuid,
  product_name text NOT NULL,
  quantity int NOT NULL,
  unit_price numeric(12, 2) NOT NULL,
  line_total numeric(12, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);
