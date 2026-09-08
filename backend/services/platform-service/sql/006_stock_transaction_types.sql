ALTER TABLE stock_transactions DROP CONSTRAINT IF EXISTS stock_transactions_transaction_type_check;

ALTER TABLE stock_transactions ADD CONSTRAINT stock_transactions_transaction_type_check
  CHECK (transaction_type IN (
    'INITIAL',
    'ORDER',
    'ADJUSTMENT',
    'MANUAL_SET',
    'RESERVE',
    'FULFILL',
    'RELEASE'
  ));
