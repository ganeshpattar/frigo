import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { env } from './config/env.js'
import { ensureDb, query } from './db/pool.js'
import { errorHandler } from './middleware/errorHandler.js'
import { categoriesRouter } from './routes/categories.js'
import { productsRouter } from './routes/products.js'
import { inventoryRouter } from './routes/inventory.js'
import { ordersRouter } from './routes/orders.js'
import { checkoutRouter } from './routes/checkout.js'
import { adminRouter } from './routes/admin.js'
import { managerRouter } from './routes/manager.js'

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json({ limit: '6mb' }))

app.get('/health', async (_req, res) => {
  await query('SELECT 1')
  res.json({ status: 'ok', service: 'platform-service' })
})

app.use('/categories', categoriesRouter)
app.use('/products', productsRouter)
app.use('/inventory', inventoryRouter)
app.use('/orders', ordersRouter)
app.use('/checkout', checkoutRouter)
app.use('/admin', adminRouter)
app.use('/manager', managerRouter)

app.use(errorHandler)

await ensureDb()
app.listen(env.port, () => {
  console.log(`Platform service listening on :${env.port}`)
})
