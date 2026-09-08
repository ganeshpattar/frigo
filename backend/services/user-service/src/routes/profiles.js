import { Router } from 'express'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { query } from '../db/pool.js'

export const profilesRouter = Router()

const createSchema = z.object({
  userId: z.string().uuid(),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().optional(),
  phone: z.string().trim().optional(),
})

profilesRouter.post('/', async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body)
    const existing = await query(
      `SELECT customer_id FROM customer_profiles WHERE user_id = $1`,
      [body.userId],
    )

    if (existing.rows[0]) {
      await query(
        `UPDATE customer_profiles
         SET first_name = $2,
             last_name = COALESCE($3, last_name),
             phone = COALESCE($4, phone),
             updated_at_utc = NOW()
         WHERE user_id = $1`,
        [body.userId, body.firstName, body.lastName ?? null, body.phone ?? null],
      )
      const updated = await query(
        `SELECT customer_id, user_id, first_name, last_name, phone
         FROM customer_profiles WHERE user_id = $1`,
        [body.userId],
      )
      const row = updated.rows[0]
      return res.json({
        customerId: row.customer_id,
        userId: row.user_id,
        firstName: row.first_name,
        lastName: row.last_name,
        phone: row.phone,
      })
    }

    const customerId = uuidv4()
    await query(
      `INSERT INTO customer_profiles (customer_id, user_id, first_name, last_name, phone)
       VALUES ($1, $2, $3, $4, $5)`,
      [customerId, body.userId, body.firstName, body.lastName ?? null, body.phone ?? null],
    )

    res.status(201).json({
      customerId,
      userId: body.userId,
      firstName: body.firstName,
      lastName: body.lastName ?? null,
      phone: body.phone ?? null,
    })
  } catch (err) {
    next(err)
  }
})

profilesRouter.get('/by-user/:userId', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT customer_id, user_id, first_name, last_name, phone
       FROM customer_profiles WHERE user_id = $1`,
      [req.params.userId],
    )
    const row = result.rows[0]
    if (!row) return res.status(404).json({ message: 'Profile not found' })
    res.json({
      customerId: row.customer_id,
      userId: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
    })
  } catch (err) {
    next(err)
  }
})
