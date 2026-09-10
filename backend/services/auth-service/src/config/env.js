import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

function required(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env ${name}`)
  return value
}

const smtpHost = process.env.SMTP_HOST?.trim() || ''
const smtpUser = process.env.SMTP_USER?.trim() || ''
// Gmail app passwords are accepted with or without spaces
const smtpPass = (process.env.SMTP_PASS ?? '').replace(/\s+/g, '').trim()
const smtpFrom = process.env.SMTP_FROM?.trim() || smtpUser
const smtpConfigured = Boolean(smtpHost && smtpUser && smtpPass)

export const env = {
  port: Number(process.env.PORT ?? 4001),
  databaseUrl: required('DATABASE_URL'),
  jwtAccessSecret: required('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET'),
  accessTokenTtlSeconds: Number(process.env.ACCESS_TOKEN_TTL_SECONDS ?? 3600),
  refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30),
  resetCodeTtlMinutes: Number(process.env.RESET_CODE_TTL_MINUTES ?? 15),
  otpTtlMinutes: Number(process.env.OTP_TTL_MINUTES ?? process.env.RESET_CODE_TTL_MINUTES ?? 15),
  userServiceUrl: process.env.USER_SERVICE_URL ?? 'http://localhost:4002',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 12),
  exposeDemoResetCode: process.env.EXPOSE_DEMO_RESET_CODE === 'true',
  smtpHost,
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser,
  smtpPass,
  smtpFrom,
  smtpConfigured,
}
