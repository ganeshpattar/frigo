import { query } from '../db/pool.js'
import { listOrders } from './orderService.js'

const OPEN_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY']

function dayLabels(days) {
  const labels = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setUTCDate(d.getUTCDate() - i)
    labels.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    })
  }
  return labels
}

async function getSalesTrend(days = 7) {
  const result = await query(
    `SELECT created_at_utc::date AS day,
            COUNT(*)::int AS orders,
            COALESCE(SUM(total), 0)::numeric AS sales
     FROM orders
     WHERE created_at_utc::date >= (NOW() AT TIME ZONE 'UTC')::date - $1::int
       AND status NOT IN ('CANCELLED', 'FAILED')
     GROUP BY day
     ORDER BY day ASC`,
    [days - 1],
  )
  const byDay = Object.fromEntries(
    result.rows.map((row) => [
      String(row.day).slice(0, 10),
      { orders: row.orders, sales: Number(row.sales) },
    ]),
  )
  return dayLabels(days).map(({ date, label }) => ({
    date,
    label,
    orders: byDay[date]?.orders ?? 0,
    sales: byDay[date]?.sales ?? 0,
  }))
}

async function getOrdersByStatus() {
  const result = await query(
    `SELECT status, COUNT(*)::int AS count
     FROM orders
     GROUP BY status
     ORDER BY count DESC`,
  )
  return result.rows.map((row) => ({
    status: row.status,
    count: row.count,
  }))
}

async function getTopProducts(limit = 5) {
  const result = await query(
    `SELECT oi.product_name,
            SUM(oi.quantity)::int AS quantity,
            SUM(oi.line_total)::numeric AS revenue
     FROM order_items oi
     JOIN orders o ON o.order_id = oi.order_id
     WHERE o.status NOT IN ('CANCELLED', 'FAILED')
     GROUP BY oi.product_name
     ORDER BY quantity DESC
     LIMIT $1`,
    [limit],
  )
  return result.rows.map((row) => ({
    productName: row.product_name,
    quantity: row.quantity,
    revenue: Number(row.revenue),
  }))
}

async function getInventoryHealth() {
  const result = await query(
    `SELECT
       COUNT(*) FILTER (WHERE available_quantity > 10)::int AS in_stock,
       COUNT(*) FILTER (WHERE available_quantity > 0 AND available_quantity <= 10)::int AS low_stock,
       COUNT(*) FILTER (WHERE available_quantity = 0)::int AS out_of_stock
     FROM inventory i
     JOIN products p ON p.product_id = i.product_id
     WHERE p.status <> 'ARCHIVED'`,
  )
  const row = result.rows[0]
  return {
    inStock: row.in_stock,
    lowStock: row.low_stock,
    outOfStock: row.out_of_stock,
  }
}

async function getLowStockProducts(limit = 6) {
  const result = await query(
    `SELECT p.product_id, p.name AS product_name, p.image_url,
            i.available_quantity, i.reserved_quantity
     FROM inventory i
     JOIN products p ON p.product_id = i.product_id
     WHERE p.status <> 'ARCHIVED' AND i.available_quantity < 10
     ORDER BY i.available_quantity ASC, p.name ASC
     LIMIT $1`,
    [limit],
  )
  return result.rows.map((row) => ({
    productId: row.product_id,
    productName: row.product_name,
    imageUrl: row.image_url,
    available: row.available_quantity,
    reserved: row.reserved_quantity,
  }))
}

export async function getDashboard() {
  const [orders, products, inventory, sales, activeProducts, salesTrend, ordersByStatus, topProducts, inventoryHealth] =
    await Promise.all([
      query(`SELECT COUNT(*)::int AS count FROM orders`),
      query(`SELECT COUNT(*)::int AS count FROM products WHERE status <> 'ARCHIVED'`),
      query(`SELECT COUNT(*)::int AS count FROM inventory WHERE available_quantity > 0`),
      query(
        `SELECT COALESCE(SUM(total), 0)::numeric AS gross
         FROM orders
         WHERE created_at_utc::date = (NOW() AT TIME ZONE 'UTC')::date
           AND status NOT IN ('CANCELLED', 'FAILED')`,
      ),
      query(
        `SELECT COUNT(*)::int AS count FROM products WHERE status = 'ACTIVE' AND is_available = true`,
      ),
      getSalesTrend(7),
      getOrdersByStatus(),
      getTopProducts(5),
      getInventoryHealth(),
    ])

  let usersCount = 0
  try {
    const users = await query(`SELECT COUNT(*)::int AS count FROM users`)
    usersCount = users.rows[0]?.count ?? 0
  } catch {
    usersCount = 0
  }

  return {
    ordersCount: orders.rows[0].count,
    usersCount,
    productsCount: products.rows[0].count,
    inventorySkuInStock: inventory.rows[0].count,
    grossSalesToday: Number(sales.rows[0].gross),
    activeProductsCount: activeProducts.rows[0].count,
    charts: {
      salesTrend,
      ordersByStatus,
      topProducts,
      inventoryHealth,
    },
  }
}

export async function getManagerDashboard() {
  const [openOrders, preparing, lowStock, customers, recent, ordersByStatus, ordersTrend, lowStockProducts] =
    await Promise.all([
      query(`SELECT COUNT(*)::int AS count FROM orders WHERE status = ANY($1)`, [OPEN_STATUSES]),
      query(`SELECT COUNT(*)::int AS count FROM orders WHERE status = 'PREPARING'`),
      query(`SELECT COUNT(*)::int AS count FROM inventory WHERE available_quantity < 10`),
      query(
        `SELECT COUNT(DISTINCT u.user_id)::int AS count
         FROM users u
         JOIN user_roles ur ON ur.user_id = u.user_id AND ur.revoked_at_utc IS NULL
         JOIN roles r ON r.role_id = ur.role_id AND r.role_code = 'CUSTOMER'`,
      ),
      listOrders({ page: 1, pageSize: 8, status: undefined, userId: undefined }),
      getOrdersByStatus(),
      getSalesTrend(7).then((trend) =>
        trend.map((d) => ({ date: d.date, label: d.label, orders: d.orders })),
      ),
      getLowStockProducts(6),
    ])

  return {
    openOrdersCount: openOrders.rows[0].count,
    preparingCount: preparing.rows[0].count,
    lowStockCount: lowStock.rows[0].count,
    customersCount: customers.rows[0]?.count ?? 0,
    recentOrders: recent.data,
    charts: {
      ordersByStatus,
      ordersTrend,
      lowStockProducts,
    },
  }
}
