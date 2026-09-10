import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dns from 'node:dns'
import { env } from './config/env.js'
import { authRouter } from './routes/authRoutes.js'
import { errorHandler } from './middleware/errorHandler.js'
import { ensureDb, query } from './db/pool.js'

// Prefer IPv4 — Render free tier often cannot reach Gmail SMTP over IPv6
dns.setDefaultResultOrder('ipv4first')

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/health', async (_req, res) => {
  await query('SELECT 1')
  res.json({
    status: 'ok',
    service: 'auth-service',
    smtpConfigured: env.smtpConfigured,
  })
})

app.use('/auth', authRouter)

app.use(errorHandler)

await ensureDb()
app.listen(env.port, () => {
  console.log(`Auth service listening on :${env.port}`)
  console.log(
    env.smtpConfigured
      ? `[auth] SMTP enabled via ${env.smtpHost} as ${env.smtpUser}`
      : '[auth] SMTP not configured — OTP emails will not be sent',
  )
})
