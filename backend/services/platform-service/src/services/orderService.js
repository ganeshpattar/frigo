import { query } from '../db/pool.js'
import { AppError, assertFound } from '../utils/errors.js'
import {
  reserveStockForOrderLine,
  fulfillOrderStock,
  releaseOrderStock,
} from './inventoryService.js'

const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'FAILED',
]

function mapOrder(row, items = []) {
  return {
    id: row.order_id,
    orderNumber: row.order_number,
    userId: row.user_id,
    customerEmail: row.customer_email,
    customerName: row.customer_name,
    customerPhone: row.customer_phone ?? null,
    status: row.status,
    subtotal: Number(row.subtotal),
    tax: Number(row.tax),
    deliveryFee: Number(row.delivery_fee),
    discount: Number(row.discount),
    total: Number(row.total),
    currency: row.currency,
    paymentMethod: row.payment_method ?? 'COD',
    shippingAddress: row.shipping_address_json ?? null,
    notes: row.notes ?? null,
    createdAt: row.created_at_utc,
    updatedAt: row.updated_at_utc,
    items: items.map((item) => ({
      id: item.order_item_id,
      productId: item.product_id,
      productName: item.product_name,
      productImageUrl: item.image_url ?? item.product_image_url ?? null,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      lineTotal: Number(item.line_total),
    })),
  }
}

export async function listOrders({ page, pageSize, status, userId }) {
  const conditions = []
  const params = []
  let i = 1

  if (status) {
    conditions.push(`status = $${i++}`)
    params.push(status)
  }
  if (userId) {
    conditions.push(`user_id = $${i++}`)
    params.push(userId)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM orders ${where}`,
    params,
  )
  const totalItems = countResult.rows[0].total
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1)
  const offset = (page - 1) * pageSize

  const result = await query(
    `SELECT * FROM orders ${where}
     ORDER BY created_at_utc DESC
     LIMIT $${i} OFFSET $${i + 1}`,
    [...params, pageSize, offset],
  )

  const orderIds = result.rows.map((r) => r.order_id)
  let itemsByOrder = {}
  if (orderIds.length) {
    const items = await query(
      `SELECT oi.*, p.image_url
       FROM order_items oi
       LEFT JOIN products p ON p.product_id = oi.product_id
       WHERE oi.order_id = ANY($1)`,
      [orderIds],
    )
    itemsByOrder = items.rows.reduce((acc, item) => {
      ;(acc[item.order_id] ??= []).push(item)
      return acc
    }, {})
  }

  return {
    data: result.rows.map((row) => mapOrder(row, itemsByOrder[row.order_id] ?? [])),
    page,
    pageSize,
    totalItems,
    totalPages,
  }
}

export async function getOrderById(id) {
  const result = await query(`SELECT * FROM orders WHERE order_id = $1`, [id])
  assertFound(result.rows[0], 'Order not found')
  const items = await query(
    `SELECT oi.*, p.image_url
     FROM order_items oi
     LEFT JOIN products p ON p.product_id = oi.product_id
     WHERE oi.order_id = $1`,
    [id],
  )
  return mapOrder(result.rows[0], items.rows)
}

const ORDER_NUMBER_PREFIX = 'ORD-'

const CANCELLED_STATUSES = new Set(['CANCELLED', 'FAILED'])

export async function updateOrderStatus(id, status, changedByUserId = null) {
  if (!ORDER_STATUSES.includes(status)) {
    throw new AppError(`Invalid status. Allowed: ${ORDER_STATUSES.join(', ')}`, 400)
  }
  const existing = await getOrderById(id)
  const fromStatus = existing.status
  if (fromStatus === status) {
    return existing
  }

  if (status === 'DELIVERED' && fromStatus !== 'DELIVERED') {
    await fulfillOrderStock(existing, changedByUserId)
  }

  if (
    CANCELLED_STATUSES.has(status) &&
    !CANCELLED_STATUSES.has(fromStatus) &&
    fromStatus !== 'DELIVERED'
  ) {
    await releaseOrderStock(existing, changedByUserId)
  }

  await query(
    `UPDATE orders SET status = $2, updated_at_utc = NOW() WHERE order_id = $1`,
    [id, status],
  )
  await query(
    `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by_user_id)
     VALUES ($1, $2, $3, $4)`,
    [id, fromStatus, status, changedByUserId],
  )
  return getOrderById(id)
}

export async function getOrderStatusHistory(orderId) {
  await getOrderById(orderId)
  const result = await query(
    `SELECT history_id, order_id, from_status, to_status, changed_by_user_id, changed_at_utc
     FROM order_status_history
     WHERE order_id = $1
     ORDER BY changed_at_utc ASC`,
    [orderId],
  )
  return result.rows.map((row) => ({
    id: row.history_id,
    orderId: row.order_id,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    changedByUserId: row.changed_by_user_id,
    changedAt: row.changed_at_utc,
  }))
}

function computeTotals(subtotal) {
  const tax = Math.round(subtotal * 0.05)
  const deliveryFee = subtotal >= 500 ? 0 : 40
  const discount = 0
  const total = Math.round(subtotal + tax + deliveryFee - discount)
  return { tax, deliveryFee, discount, total }
}

async function generateOrderNumber() {
  await query(`CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1`)
  const result = await query(`SELECT nextval('order_number_seq')::bigint AS n`)
  const n = Number(result.rows[0]?.n ?? 1)
  return `${ORDER_NUMBER_PREFIX}${String(n).padStart(3, '0')}`
}

export async function createOrder(input) {
  const items = input.items || []
  if (!items.length) throw new AppError('Cart is empty.', 400)

  const productIds = [...new Set(items.map((i) => i.productId))]
  const products = await query(
    `SELECT p.product_id, p.name, p.unit_price, p.currency, p.status, p.is_available,
            COALESCE(i.available_quantity, 0) AS available_quantity
     FROM products p
     LEFT JOIN inventory i ON i.product_id = p.product_id
     WHERE p.product_id = ANY($1)`,
    [productIds],
  )
  const byId = Object.fromEntries(products.rows.map((p) => [p.product_id, p]))

  const lineItems = []
  let subtotal = 0
  for (const item of items) {
    const product = byId[item.productId]
    if (!product || product.status !== 'ACTIVE' || !product.is_available) {
      throw new AppError(`Product unavailable: ${item.productId}`, 400)
    }
    const qty = Number(item.quantity)
    if (!Number.isInteger(qty) || qty < 1) {
      throw new AppError('Invalid quantity.', 400)
    }
    if (product.available_quantity < qty) {
      throw new AppError(`Insufficient stock for ${product.name}.`, 409)
    }
    const unitPrice = Number(product.unit_price)
    const lineTotal = Math.round(unitPrice * qty)
    subtotal += lineTotal
    lineItems.push({
      productId: product.product_id,
      productName: product.name,
      quantity: qty,
      unitPrice,
      lineTotal,
    })
  }

  const { tax, deliveryFee, discount, total } = computeTotals(subtotal)
  const orderId = (await query(`SELECT gen_random_uuid() AS id`)).rows[0].id
  const orderNumber = await generateOrderNumber()
  const currency = products.rows[0]?.currency || 'INR'
  const address = input.shippingAddress || null

  await query(
    `INSERT INTO orders (
       order_id, order_number, user_id, customer_email, customer_name, customer_phone,
       status, subtotal, tax, delivery_fee, discount, total, currency,
       shipping_address_json, payment_method, notes
     ) VALUES (
       $1,$2,$3,$4,$5,$6,'PENDING',$7,$8,$9,$10,$11,$12,$13,$14,$15
     )`,
    [
      orderId,
      orderNumber,
      input.userId,
      input.customerEmail,
      input.customerName,
      input.customerPhone ?? null,
      subtotal,
      tax,
      deliveryFee,
      discount,
      total,
      currency,
      address ? JSON.stringify(address) : null,
      input.paymentMethod || 'COD',
      input.notes ?? null,
    ],
  )

  for (const line of lineItems) {
    await query(
      `INSERT INTO order_items (
         order_item_id, order_id, product_id, product_name, quantity, unit_price, line_total
       ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)`,
      [orderId, line.productId, line.productName, line.quantity, line.unitPrice, line.lineTotal],
    )
    await reserveStockForOrderLine({
      productId: line.productId,
      quantity: line.quantity,
      orderId,
      orderNumber,
      userId: input.userId ?? null,
    })
  }

  await query(
    `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by_user_id)
     VALUES ($1, NULL, 'PENDING', $2)`,
    [orderId, input.userId],
  )

  return getOrderById(orderId)
}

export { ORDER_STATUSES }
