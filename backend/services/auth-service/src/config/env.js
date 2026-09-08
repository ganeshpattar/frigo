import 'dotenv/config'

function required(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env ${name}`)
  return value
}

export const env = {
  port: Number(process.env.PORT ?? 4001),
  databaseUrl: required('DATABASE_URL'),
  jwtAccessSecret: required('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET'),
  accessTokenTtlSeconds: Number(process.env.ACCESS_TOKEN_TTL_SECONDS ?? 3600),
  refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30),
  resetCodeTtlMinutes: Number(process.env.RESET_CODE_TTL_MINUTES ?? 15),
  userServiceUrl: process.env.USER_SERVICE_URL ?? 'http://localhost:4002',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 12),
  exposeDemoResetCode: process.env.EXPOSE_DEMO_RESET_CODE === 'true',
}
