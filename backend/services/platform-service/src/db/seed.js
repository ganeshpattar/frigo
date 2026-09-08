import 'dotenv/config'
import { v4 as uuidv4 } from 'uuid'
import { closeDb, ensureDb, query } from './pool.js'

const categories = [
  {
    name: 'Pickles',
    slug: 'pickles',
    description: 'Traditional South Indian pickles',
    sortOrder: 1,
  },
  {
    name: 'Chatni',
    slug: 'chatni',
    description: 'Fresh and aromatic chutneys',
    sortOrder: 2,
  },
  {
    name: 'Rotti',
    slug: 'rotti',
    description: 'Handmade rottis and flatbreads',
    sortOrder: 3,
  },
  {
    name: 'Holige',
    slug: 'holige',
    description: 'Sweet stuffed flatbreads',
    sortOrder: 4,
  },
]

const productsByCategory = {
  pickles: [
    {
      name: 'Mango Pickle',
      slug: 'mango-pickle',
      shortDescription: 'Tangy homemade mango pickle',
      description: 'Sun-cured mango pickle with mustard and chilli.',
      unitPrice: 249,
      sku: 'PICK-MANGO-250',
      qty: 120,
      tags: ['spicy', 'classic'],
    },
    {
      name: 'Lemon Pickle',
      slug: 'lemon-pickle',
      shortDescription: 'Zesty lemon pickle',
      description: 'Bright lemon pickle with fenugreek and chilli.',
      unitPrice: 199,
      sku: 'PICK-LEMON-250',
      qty: 90,
      tags: ['tangy'],
    },
    {
      name: 'Mixed Vegetable Pickle',
      slug: 'mixed-vegetable-pickle',
      shortDescription: 'Assorted veg pickle',
      description: 'Carrot, beans, and cauliflower in spicy masala.',
      unitPrice: 279,
      sku: 'PICK-MIX-300',
      qty: 75,
      tags: ['mixed'],
    },
  ],
  chatni: [
    {
      name: 'Coconut Chatni',
      slug: 'coconut-chatni',
      shortDescription: 'Fresh coconut chutney',
      description: 'Creamy coconut chutney with green chilli.',
      unitPrice: 149,
      sku: 'CHAT-COCO-200',
      qty: 150,
      tags: ['fresh'],
    },
    {
      name: 'Tomato Chatni',
      slug: 'tomato-chatni',
      shortDescription: 'Spicy tomato chutney',
      description: 'Roasted tomato chutney with garlic.',
      unitPrice: 159,
      sku: 'CHAT-TOMA-200',
      qty: 110,
      tags: ['spicy'],
    },
    {
      name: 'Peanut Chatni',
      slug: 'peanut-chatni',
      shortDescription: 'Roasted peanut chutney powder',
      description: 'Crunchy peanut chutney powder for dosa and idli.',
      unitPrice: 189,
      sku: 'CHAT-PEAN-200',
      qty: 130,
      tags: ['powder'],
    },
  ],
  rotti: [
    {
      name: 'Akki Rotti Mix',
      slug: 'akki-rotti-mix',
      shortDescription: 'Ready rice flour rotti mix',
      description: 'Seasoned rice flour mix for soft akki rotti.',
      unitPrice: 129,
      sku: 'ROTT-AKKI-500',
      qty: 200,
      tags: ['mix'],
    },
    {
      name: 'Ragi Rotti',
      slug: 'ragi-rotti',
      shortDescription: 'Finger millet rotti pack',
      description: 'Wholesome ragi rotti, ready to warm and serve.',
      unitPrice: 179,
      sku: 'ROTT-RAGI-6PK',
      qty: 85,
      tags: ['healthy'],
    },
  ],
  holige: [
    {
      name: 'Coconut Holige',
      slug: 'coconut-holige',
      shortDescription: 'Sweet coconut-filled holige',
      description: 'Soft holige stuffed with jaggery coconut filling.',
      unitPrice: 299,
      sku: 'HOLI-COCO-6PK',
      qty: 60,
      tags: ['sweet', 'festival'],
    },
    {
      name: 'Puran Holige',
      slug: 'puran-holige',
      shortDescription: 'Classic dal-jaggery holige',
      description: 'Traditional puran poli style holige.',
      unitPrice: 319,
      sku: 'HOLI-PURAN-6PK',
      qty: 55,
      tags: ['sweet', 'classic'],
    },
  ],
}

async function upsertCategory(cat) {
  const existing = await query(`SELECT category_id FROM categories WHERE slug = $1`, [cat.slug])
  if (existing.rows[0]) {
    await query(
      `UPDATE categories
       SET name = $2, description = $3, sort_order = $4, status = 'ACTIVE', updated_at_utc = NOW()
       WHERE slug = $1`,
      [cat.slug, cat.name, cat.description, cat.sortOrder],
    )
    return existing.rows[0].category_id
  }
  const id = uuidv4()
  await query(
    `INSERT INTO categories (category_id, name, slug, description, status, sort_order)
     VALUES ($1, $2, $3, $4, 'ACTIVE', $5)`,
    [id, cat.name, cat.slug, cat.description, cat.sortOrder],
  )
  return id
}

async function upsertProduct(categoryId, product) {
  const existing = await query(`SELECT product_id FROM products WHERE slug = $1`, [product.slug])
  let productId
  if (existing.rows[0]) {
    productId = existing.rows[0].product_id
    await query(
      `UPDATE products
       SET category_id = $2, name = $3, description = $4, short_description = $5,
           sku = $6, status = 'ACTIVE', unit_price = $7, currency = 'INR',
           tags = $8, is_available = true, updated_at_utc = NOW()
       WHERE product_id = $1`,
      [
        productId,
        categoryId,
        product.name,
        product.description,
        product.shortDescription,
        product.sku,
        product.unitPrice,
        product.tags,
      ],
    )
  } else {
    productId = uuidv4()
    await query(
      `INSERT INTO products (
         product_id, category_id, name, slug, description, short_description,
         sku, status, unit_price, currency, tags, is_available
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,'ACTIVE',$8,'INR',$9,true)`,
      [
        productId,
        categoryId,
        product.name,
        product.slug,
        product.description,
        product.shortDescription,
        product.sku,
        product.unitPrice,
        product.tags,
      ],
    )
  }

  const inv = await query(`SELECT inventory_id FROM inventory WHERE product_id = $1`, [productId])
  if (inv.rows[0]) {
    await query(
      `UPDATE inventory SET available_quantity = $2, updated_at_utc = NOW() WHERE product_id = $1`,
      [productId, product.qty],
    )
  } else {
    await query(
      `INSERT INTO inventory (inventory_id, product_id, available_quantity, reserved_quantity)
       VALUES ($1, $2, $3, 0)`,
      [uuidv4(), productId, product.qty],
    )
  }
  return productId
}

async function seedOrders(productMap) {
  const existing = await query(`SELECT COUNT(*)::int AS count FROM orders`)
  if (existing.rows[0].count > 0) {
    console.log('Orders already present, skipping order seed')
    return
  }

  const samples = [
    {
      orderNumber: 'ORD-001',
      customerEmail: 'priya@example.com',
      customerName: 'Priya Sharma',
      status: 'DELIVERED',
      items: [
        { slug: 'mango-pickle', qty: 2 },
        { slug: 'coconut-chatni', qty: 1 },
      ],
      tax: 30,
      deliveryFee: 40,
      discount: 20,
    },
    {
      orderNumber: 'ORD-002',
      customerEmail: 'arjun@example.com',
      customerName: 'Arjun Rao',
      status: 'PREPARING',
      items: [
        { slug: 'puran-holige', qty: 1 },
        { slug: 'ragi-rotti', qty: 2 },
      ],
      tax: 45,
      deliveryFee: 40,
      discount: 0,
    },
    {
      orderNumber: 'ORD-003',
      customerEmail: 'meera@example.com',
      customerName: 'Meera Iyer',
      status: 'PENDING',
      items: [
        { slug: 'lemon-pickle', qty: 1 },
        { slug: 'peanut-chatni', qty: 2 },
        { slug: 'akki-rotti-mix', qty: 1 },
      ],
      tax: 35,
      deliveryFee: 50,
      discount: 10,
    },
  ]

  for (const sample of samples) {
    const lineItems = sample.items.map((item) => {
      const product = productMap[item.slug]
      const unitPrice = product.unitPrice
      return {
        productId: product.id,
        productName: product.name,
        quantity: item.qty,
        unitPrice,
        lineTotal: unitPrice * item.qty,
      }
    })
    const subtotal = lineItems.reduce((sum, li) => sum + li.lineTotal, 0)
    const total = subtotal + sample.tax + sample.deliveryFee - sample.discount
    const orderId = uuidv4()

    await query(
      `INSERT INTO orders (
         order_id, order_number, customer_email, customer_name, status,
         subtotal, tax, delivery_fee, discount, total, currency
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'INR')`,
      [
        orderId,
        sample.orderNumber,
        sample.customerEmail,
        sample.customerName,
        sample.status,
        subtotal,
        sample.tax,
        sample.deliveryFee,
        sample.discount,
        total,
      ],
    )

    for (const li of lineItems) {
      await query(
        `INSERT INTO order_items (
           order_item_id, order_id, product_id, product_name, quantity, unit_price, line_total
         ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [uuidv4(), orderId, li.productId, li.productName, li.quantity, li.unitPrice, li.lineTotal],
      )
    }
  }

  await syncOrderNumberSequence()
}

async function syncOrderNumberSequence() {
  await query(`CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1`)
  await query(
    `SELECT setval(
      'order_number_seq',
      GREATEST(
        COALESCE(
          (
            SELECT MAX(
              CASE
                WHEN order_number ~ '^ORD-[0-9]+$' THEN substring(order_number FROM 5)::bigint
                WHEN order_number ~ '^[0-9]+$' THEN order_number::bigint
                ELSE 0
              END
            )
            FROM orders
          ),
          0
        ),
        0
      ),
      true
    )`,
  )
}

async function seed() {
  await ensureDb()

  const categoryIds = {}
  for (const cat of categories) {
    categoryIds[cat.slug] = await upsertCategory(cat)
  }

  const productMap = {}
  for (const [catSlug, products] of Object.entries(productsByCategory)) {
    for (const product of products) {
      const id = await upsertProduct(categoryIds[catSlug], product)
      productMap[product.slug] = { id, name: product.name, unitPrice: product.unitPrice }
    }
  }

  await seedOrders(productMap)
  await syncOrderNumberSequence()

  console.log('Platform seed complete:', {
    categories: Object.keys(categoryIds).length,
    products: Object.keys(productMap).length,
  })
  await closeDb()
}

seed().catch(async (err) => {
  console.error(err)
  await closeDb()
  process.exit(1)
})
