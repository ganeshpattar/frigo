import 'dotenv/config'

export const env = {
  port: Number(process.env.PORT ?? 4002),
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://frigo:frigo_secret@127.0.0.1:5432/user_db',
}
