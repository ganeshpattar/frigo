import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { env } from '../config/env.js'
import { createPgOptions } from './pgConfig.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function migrate() {
  const sqlPath = path.join(__dirname, '../../sql/001_init.sql')
  const sql = fs.readFileSync(sqlPath, 'utf8')
  const client = new pg.Client(createPgOptions(env.databaseUrl))
  await client.connect()
  try {
    await client.query(sql)
    console.log('User migration complete:', sqlPath)
  } finally {
    await client.end()
  }
}

migrate().catch((err) => {
  console.error(err)
  process.exit(1)
})
