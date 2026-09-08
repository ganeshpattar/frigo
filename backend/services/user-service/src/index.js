import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { ZodError } from 'zod'
import { env } from './config/env.js'
import { profilesRouter } from './routes/profiles.js'
import { ensureDb, query } from './db/pool.js'

const app = express()
app.use(helmet())
app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/health', async (_req, res) => {
  await query('SELECT 1')
  res.json({ status: 'ok', service: 'user-service' })
})

app.use('/internal/profiles', profilesRouter)

app.use((err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ message: err.errors[0]?.message ?? 'Validation failed' })
  }
  console.error(err)
  return res.status(500).json({ message: 'Internal server error' })
})

await ensureDb()
app.listen(env.port, () => {
  console.log(`User service listening on :${env.port}`)
})
