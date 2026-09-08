import { query } from '../db/pool.js'
import { AppError, assertFound } from '../utils/errors.js'
import { recordStockTransaction } from './stockTransactionService.js'

export async function listInventory() {
  const result = await query(
    `SELECT i.product_id, p.name AS product_name, p.sku, p.image_url,
            i.available_quantity, i.reserved_quantity
     FROM inventory i
     JOIN products p ON p.product_id = i.product_id
     WHERE p.status <> 'ARCHIVED'
     ORDER BY p.name ASC`,
  )
  return result.rows.map((row) => ({
    productId: row.product_id,
    productName: row.product_name,
    sku: row.sku ?? null,
    imageUrl: row.image_url ?? null,
    quantityOnHand: row.available_quantity + row.reserved_quantity,
    reserved: row.reserved_quantity,
    available: row.available_quantity,
  }))
}

async function getInventoryRow(productId) {
  const result = await query(
    `SELECT available_quantity, reserved_quantity FROM inventory WHERE product_id = $1`,
    [productId],
  )
  return result.rows[0] ?? null
}

export async function updateInventory(productId, body, meta = {}) {
  const existing = await query(
    `SELECT inventory_id, available_quantity FROM inventory WHERE product_id = $1`,
    [productId],
  )
  assertFound(existing.rows[0], 'Inventory not found')

  const quantityBefore = existing.rows[0].available_quantity
  let nextAvailable
  let transactionType
  let quantityChange
  let referenceNote = meta.referenceNote ?? null

  if (body.availableQuantity !== undefined) {
    nextAvailable = body.availableQuantity
    quantityChange = nextAvailable - quantityBefore
    transactionType = 'MANUAL_SET'
    if (!referenceNote) {
      referenceNote = `Stock set to ${nextAvailable}`
    }
  } else if (body.adjustment !== undefined) {
    quantityChange = body.adjustment
    nextAvailable = quantityBefore + body.adjustment
    transactionType = 'ADJUSTMENT'
    if (!referenceNote) {
      referenceNote = `Adjusted by ${body.adjustment > 0 ? '+' : ''}${body.adjustment}`
    }
  } else {
    throw new AppError('Provide availableQuantity or adjustment', 400)
  }

  if (nextAvailable < 0) {
    throw new AppError('Available quantity cannot be negative', 400)
  }

  if (quantityChange === 0) {
    const list = await listInventory()
    return list.find((item) => item.productId === productId)
  }

  await query(
    `UPDATE inventory
     SET available_quantity = $2, updated_at_utc = NOW()
     WHERE product_id = $1`,
    [productId, nextAvailable],
  )

  await recordStockTransaction({
    productId,
    transactionType,
    quantityChange,
    quantityBefore,
    quantityAfter: nextAvailable,
    referenceNote,
    createdByUserId: meta.userId ?? null,
  })

  const list = await listInventory()
  return list.find((item) => item.productId === productId)
}

export async function reserveStockForOrderLine({
  productId,
  quantity,
  orderId,
  orderNumber,
  userId = null,
}) {
  const row = await getInventoryRow(productId)
  if (!row) {
    throw new AppError('Inventory not found for product', 404)
  }
  if (row.available_quantity < quantity) {
    throw new AppError('Insufficient available stock to reserve', 409)
  }

  const availBefore = row.available_quantity
  const reservedBefore = row.reserved_quantity
  const onHand = availBefore + reservedBefore

  const updated = await query(
    `UPDATE inventory
     SET available_quantity = available_quantity - $2,
         reserved_quantity = reserved_quantity + $2,
         updated_at_utc = NOW()
     WHERE product_id = $1 AND available_quantity >= $2
     RETURNING available_quantity, reserved_quantity`,
    [productId, quantity],
  )
  if (!updated.rows[0]) {
    throw new AppError('Insufficient available stock to reserve', 409)
  }

  await recordStockTransaction({
    productId,
    transactionType: 'RESERVE',
    quantityChange: -quantity,
    quantityBefore: availBefore,
    quantityAfter: availBefore - quantity,
    orderId,
    orderNumber,
    referenceNote: `Reserved for ${orderNumber} (on hand ${onHand}, reserved ${reservedBefore}→${reservedBefore + quantity})`,
    createdByUserId: userId,
  })
}

export async function fulfillOrderStock(order, userId = null) {
  for (const line of order.items) {
    const row = await getInventoryRow(line.productId)
    if (!row) continue

    const onHandBefore = row.available_quantity + row.reserved_quantity
    const reservedBefore = row.reserved_quantity

    const updated = await query(
      `UPDATE inventory
       SET reserved_quantity = reserved_quantity - $2,
           updated_at_utc = NOW()
       WHERE product_id = $1 AND reserved_quantity >= $2
       RETURNING available_quantity, reserved_quantity`,
      [line.productId, line.quantity],
    )
    if (!updated.rows[0]) {
      throw new AppError(
        `Cannot fulfill order ${order.orderNumber}: reserved stock missing for ${line.productName}`,
        409,
      )
    }

    const onHandAfter = onHandBefore - line.quantity
    await recordStockTransaction({
      productId: line.productId,
      transactionType: 'FULFILL',
      quantityChange: -line.quantity,
      quantityBefore: onHandBefore,
      quantityAfter: onHandAfter,
      orderId: order.id,
      orderNumber: order.orderNumber,
      referenceNote: `Delivered on ${order.orderNumber} (reserved ${reservedBefore}→${reservedBefore - line.quantity})`,
      createdByUserId: userId,
    })
  }
}

export async function releaseOrderStock(order, userId = null) {
  for (const line of order.items) {
    const row = await getInventoryRow(line.productId)
    if (!row) continue

    const availBefore = row.available_quantity
    const reservedBefore = row.reserved_quantity

    const updated = await query(
      `UPDATE inventory
       SET available_quantity = available_quantity + $2,
           reserved_quantity = reserved_quantity - $2,
           updated_at_utc = NOW()
       WHERE product_id = $1 AND reserved_quantity >= $2
       RETURNING available_quantity, reserved_quantity`,
      [line.productId, line.quantity],
    )
    if (!updated.rows[0]) {
      throw new AppError(
        `Cannot release stock for ${order.orderNumber}: no reservation for ${line.productName}`,
        409,
      )
    }

    await recordStockTransaction({
      productId: line.productId,
      transactionType: 'RELEASE',
      quantityChange: line.quantity,
      quantityBefore: availBefore,
      quantityAfter: availBefore + line.quantity,
      orderId: order.id,
      orderNumber: order.orderNumber,
      referenceNote: `Released from ${order.orderNumber} (reserved ${reservedBefore}→${reservedBefore - line.quantity})`,
      createdByUserId: userId,
    })
  }
}

export async function recordInitialStock({
  productId,
  quantity,
  userId = null,
  referenceNote = 'Initial stock on product creation',
}) {
  if (!quantity || quantity <= 0) return

  await recordStockTransaction({
    productId,
    transactionType: 'INITIAL',
    quantityChange: quantity,
    quantityBefore: 0,
    quantityAfter: quantity,
    referenceNote,
    createdByUserId: userId,
  })
}
