import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { env } from '../config/env.js'
import { createPgOptions } from './pgConfig.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function migrate() {
  const sqlDir = path.join(__dirname, '../../sql')
  const files = fs
    .readdirSync(sqlDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()
  const client = new pg.Client(createPgOptions(env.databaseUrl))
  await client.connect()
  try {
    for (const file of files) {
      const sqlPath = path.join(sqlDir, file)
      const sql = fs.readFileSync(sqlPath, 'utf8')
      await client.query(sql)
      console.log('Applied', file)
    }
    console.log('Auth migration complete')
  } finally {
    await client.end()
  }
}

migrate().catch((err) => {
  console.error(err)
  process.exit(1)
})
