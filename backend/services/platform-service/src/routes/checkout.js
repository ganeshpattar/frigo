import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import { createOrder } from '../services/orderService.js'
import { query } from '../db/pool.js'

export const checkoutRouter = Router()

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

const checkoutSchema = z.object({
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

checkoutRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = checkoutSchema.parse(req.body)
    let profile = null
    try {
      const result = await query(
        `SELECT u.email, cp.first_name, cp.last_name, cp.phone
         FROM users u
         LEFT JOIN customer_profiles cp ON cp.user_id = u.user_id
         WHERE u.user_id = $1`,
        [req.userId],
      )
      profile = result.rows[0] || null
    } catch {
      profile = null
    }

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

    res.status(201).json({
      checkoutId: order.id,
      status: 'READY',
      order,
      message: 'Order placed successfully.',
    })
  } catch (err) {
    next(err)
  }
})
