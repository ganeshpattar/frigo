import pg from 'pg'
import { env } from '../config/env.js'
import { createPgOptions } from './pgConfig.js'

let pool = null

export function getPool() {
  if (!pool) {
    pool = new pg.Pool(createPgOptions(env.databaseUrl))
  }
  return pool
}

export async function ensureDb() {
  const p = getPool()
  await p.query('SELECT 1')
  return p
}

export async function query(text, params) {
  await ensureDb()
  const result = await getPool().query(text, params)
  return { rows: result.rows, rowCount: result.rowCount }
}

export async function closeDb() {
  if (pool) {
    await pool.end()
    pool = null
  }
}
