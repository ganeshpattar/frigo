import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import {
  loadPermissions,
  requirePermission,
  canReadAllOrders,
  canReadOwnOrders,
} from '../middleware/permissions.js'
import {
  ORDER_STATUSES,
  createOrder,
  getOrderById,
  getOrderStatusHistory,
  listOrders,
  updateOrderStatus,
} from '../services/orderService.js'
import { query } from '../db/pool.js'
import { AppError } from '../utils/errors.js'

export const ordersRouter = Router()

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(ORDER_STATUSES).optional(),
  mine: z
    .union([z.literal('true'), z.literal('1'), z.literal('false'), z.literal('0')])
    .optional(),
})

const statusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
})

const addressSchema = z.object({
  label: z.string().trim().optional(),
  recipientName: z.string().trim().min(1),
  phone: z.string().trim().min(8).optional(),
  line1: z.string().trim().min(1),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(1),
  state: z.string().trim().min(1),
  postalCode: z.string().trim().min(4),
  country: z.string().trim().min(2).default('IN'),
})

const createSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.coerce.number().int().min(1),
      }),
    )
    .min(1),
  shippingAddress: addressSchema,
  customerName: z.string().trim().min(1).optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().trim().optional(),
  paymentMethod: z.enum(['COD', 'UPI', 'CARD']).optional(),
  notes: z.string().trim().optional(),
})

ordersRouter.use(requireAuth, loadPermissions)

async function resolveCustomer(userId) {
  try {
    const result = await query(
      `SELECT u.email, cp.first_name, cp.last_name, cp.phone
       FROM users u
       LEFT JOIN customer_profiles cp ON cp.user_id = u.user_id
       WHERE u.user_id = $1`,
      [userId],
    )
    return result.rows[0] || null
  } catch {
    return null
  }
}

async function assertCanReadOrder(req, order) {
  if (canReadAllOrders(req)) return
  if (canReadOwnOrders(req) && order.userId === req.userId) return
  throw new AppError('Forbidden', 403)
}

ordersRouter.get('/', async (req, res, next) => {
  try {
    const parsed = listQuerySchema.parse(req.query)
    const mineRequested = parsed.mine === 'true' || parsed.mine === '1'

    let userId
    if (canReadAllOrders(req)) {
      userId = mineRequested ? req.userId : undefined
    } else if (canReadOwnOrders(req)) {
      userId = req.userId
    } else {
      throw new AppError('Forbidden', 403)
    }

    const result = await listOrders({
      page: parsed.page,
      pageSize: parsed.pageSize,
      status: parsed.status,
      userId,
    })
    res.json(result)
  } catch (err) {
    next(err)
  }
})

ordersRouter.get('/:id/history', async (req, res, next) => {
  try {
    const order = await getOrderById(req.params.id)
    await assertCanReadOrder(req, order)
    const history = await getOrderStatusHistory(req.params.id)
    res.json({ data: history })
  } catch (err) {
    next(err)
  }
})

ordersRouter.get('/:id', async (req, res, next) => {
  try {
    const order = await getOrderById(req.params.id)
    await assertCanReadOrder(req, order)
    res.json(order)
  } catch (err) {
    next(err)
  }
})

ordersRouter.post('/', requirePermission('order.create'), async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body)
    const profile = await resolveCustomer(req.userId)
    const customerName =
      body.customerName ||
      [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
      'Customer'
    const customerEmail = body.customerEmail || profile?.email
    if (!customerEmail) {
      return res.status(400).json({ message: 'Customer email is required.' })
    }
    const order = await createOrder({
      userId: req.userId,
      items: body.items,
      shippingAddress: body.shippingAddress,
      customerName,
      customerEmail,
      customerPhone: body.customerPhone || body.shippingAddress.phone || profile?.phone,
      paymentMethod: body.paymentMethod || 'COD',
      notes: body.notes,
    })
    res.status(201).json(order)
  } catch (err) {
    next(err)
  }
})

ordersRouter.patch('/:id/status', requirePermission('order.update_status'), async (req, res, next) => {
  try {
    const body = statusSchema.parse(req.body)
    const order = await updateOrderStatus(req.params.id, body.status, req.userId)
    res.json(order)
  } catch (err) {
    next(err)
  }
})
