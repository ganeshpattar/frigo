import { query } from '../db/pool.js'
import { assertFound } from '../utils/errors.js'

export async function recordStockTransaction({
  productId,
  transactionType,
  quantityChange,
  quantityBefore,
  quantityAfter,
  orderId = null,
  orderNumber = null,
  referenceNote = null,
  createdByUserId = null,
}) {
  await query(
    `INSERT INTO stock_transactions (
       product_id, transaction_type, quantity_change,
       quantity_before, quantity_after,
       order_id, order_number, reference_note, created_by_user_id
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      productId,
      transactionType,
      quantityChange,
      quantityBefore,
      quantityAfter,
      orderId,
      orderNumber,
      referenceNote,
      createdByUserId,
    ],
  )
}

export async function listStockTransactions(productId, { page = 1, pageSize = 50 } = {}) {
  const productCheck = await query(`SELECT product_id FROM products WHERE product_id = $1`, [productId])
  assertFound(productCheck.rows[0], 'Product not found')

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM stock_transactions WHERE product_id = $1`,
    [productId],
  )
  const totalItems = countResult.rows[0].total
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1)
  const offset = (page - 1) * pageSize

  const result = await query(
    `SELECT transaction_id, product_id, transaction_type, quantity_change,
            quantity_before, quantity_after, order_id, order_number,
            reference_note, created_by_user_id, created_at_utc
     FROM stock_transactions
     WHERE product_id = $1
     ORDER BY created_at_utc DESC
     LIMIT $2 OFFSET $3`,
    [productId, pageSize, offset],
  )

  return {
    data: result.rows.map((row) => ({
      id: row.transaction_id,
      productId: row.product_id,
      type: row.transaction_type,
      quantityChange: row.quantity_change,
      quantityBefore: row.quantity_before,
      quantityAfter: row.quantity_after,
      orderId: row.order_id,
      orderNumber: row.order_number,
      referenceNote: row.reference_note,
      createdByUserId: row.created_by_user_id,
      createdAt: row.created_at_utc,
    })),
    page,
    pageSize,
    totalItems,
    totalPages,
  }
}
