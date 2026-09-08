ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address_json jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'COD';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes text;
