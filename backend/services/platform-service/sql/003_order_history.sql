CREATE TABLE IF NOT EXISTS order_status_history (
  history_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  from_status text NULL,
  to_status text NOT NULL,
  changed_by_user_id uuid NULL,
  changed_at_utc timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order
  ON order_status_history (order_id, changed_at_utc DESC);
