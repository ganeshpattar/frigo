import 'dotenv/config'
import { hashPassword, newId } from '../utils/crypto.js'
import { query, closeDb } from './pool.js'
import { createCustomerProfile } from '../services/userClient.js'

const DEMO_USERS = [
  {
    email: 'customer@frigo.test',
    password: 'Customer123!',
    firstName: 'Casey',
    lastName: 'Customer',
    role: 'CUSTOMER',
  },
  {
    email: 'manager@frigo.test',
    password: 'Manager123!',
    firstName: 'Morgan',
    lastName: 'Manager',
    role: 'MANAGER',
  },
  {
    email: 'admin@frigo.test',
    password: 'Admin123!',
    firstName: 'Avery',
    lastName: 'Admin',
    role: 'ADMIN',
  },
]

async function seed() {
  for (const demo of DEMO_USERS) {
    const existing = await query(`SELECT user_id FROM users WHERE email = $1`, [demo.email])
    let userId = existing.rows[0]?.user_id
    const passwordHash = await hashPassword(demo.password)
    if (!userId) {
      userId = newId()
      await query(
        `INSERT INTO users (user_id, email, password_hash, user_status, account_status, email_verified_at_utc)
         VALUES ($1, $2, $3, 'ACTIVE', 'ACTIVE', NOW())`,
        [userId, demo.email, passwordHash],
      )
      console.log(`Created user ${demo.email}`)
    } else {
      await query(
        `UPDATE users
         SET password_hash = $2,
             user_status = 'ACTIVE',
             account_status = 'ACTIVE',
             failed_login_count = 0,
             locked_until_utc = NULL,
             updated_at_utc = NOW()
         WHERE user_id = $1`,
        [userId, passwordHash],
      )
      console.log(`Updated password for ${demo.email}`)
    }

    const role = await query(`SELECT role_id FROM roles WHERE role_code = $1`, [demo.role])
    if (role.rows[0]) {
      await query(
        `INSERT INTO user_roles (user_role_id, user_id, role_id)
         SELECT $1, $2, $3
         WHERE NOT EXISTS (
           SELECT 1 FROM user_roles
           WHERE user_id = $2 AND role_id = $3 AND revoked_at_utc IS NULL
         )`,
        [newId(), userId, role.rows[0].role_id],
      )
    }

    try {
      await createCustomerProfile({
        userId,
        firstName: demo.firstName,
        lastName: demo.lastName,
      })
    } catch (err) {
      console.warn(`Profile upsert skipped/failed for ${demo.email}:`, err.message)
    }
  }
}

seed()
  .then(async () => {
    console.log('Seed complete')
    await closeDb()
  })
  .catch(async (err) => {
    console.error(err)
    await closeDb()
    process.exit(1)
  })
