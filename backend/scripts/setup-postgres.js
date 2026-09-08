import pg from 'pg'

const adminUrl =
  process.env.PG_ADMIN_URL ?? 'postgresql://postgres:root@127.0.0.1:5432/postgres'

async function setup() {
  const client = new pg.Client({ connectionString: adminUrl })
  await client.connect()
  try {
    const exists = await client.query(`SELECT 1 FROM pg_database WHERE datname = 'frigo'`)
    if (exists.rowCount === 0) {
      await client.query(`CREATE DATABASE frigo OWNER postgres`)
      console.log('Created database frigo')
    } else {
      console.log('Database frigo already exists')
    }

    console.log('Postgres setup complete')
  } finally {
    await client.end()
  }
}

setup().catch((err) => {
  console.error(err)
  process.exit(1)
})
