CREATE TABLE IF NOT EXISTS stock_transactions (
  transaction_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products (product_id) ON DELETE CASCADE,
  transaction_type text NOT NULL
    CHECK (transaction_type IN ('INITIAL', 'ORDER', 'ADJUSTMENT', 'MANUAL_SET')),
  quantity_change int NOT NULL,
  quantity_before int NOT NULL,
  quantity_after int NOT NULL,
  order_id uuid NULL REFERENCES orders (order_id) ON DELETE SET NULL,
  order_number text NULL,
  reference_note text NULL,
  created_by_user_id uuid NULL,
  created_at_utc timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_transactions_product
  ON stock_transactions (product_id, created_at_utc DESC);
