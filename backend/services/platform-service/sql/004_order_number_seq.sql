CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1;

-- Align sequence with existing ORD-### order numbers (skip when table is empty).
DO $$
DECLARE
  max_num bigint;
BEGIN
  SELECT MAX(
    CASE
      WHEN order_number ~ '^ORD-[0-9]+$' THEN substring(order_number FROM 5)::bigint
      WHEN order_number ~ '^[0-9]+$' THEN order_number::bigint
      ELSE NULL
    END
  )
  INTO max_num
  FROM orders;

  IF max_num IS NOT NULL AND max_num >= 1 THEN
    PERFORM setval('order_number_seq', max_num, true);
  END IF;
END $$;
