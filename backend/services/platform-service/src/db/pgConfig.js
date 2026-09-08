/** Neon / remote Postgres needs SSL; strip channel_binding for node-pg compatibility. */
export function createPgOptions(connectionString) {
  const normalized = connectionString
    .replace(/([?&])channel_binding=[^&]*/gi, '')
    .replace(/\?&/, '?')
    .replace(/\?$/, '')

  const needsSsl =
    normalized.includes('neon.tech') || /sslmode=require/i.test(normalized)

  return {
    connectionString: normalized,
    ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  }
}
