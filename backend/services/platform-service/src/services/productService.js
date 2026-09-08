import { v4 as uuidv4 } from 'uuid'
import { query } from '../db/pool.js'
import { AppError, assertFound } from '../utils/errors.js'
import { uniqueSlug } from '../utils/slug.js'
import { recordInitialStock } from './inventoryService.js'

function mapProduct(row) {
  const images = []
  if (row.image_url) {
    images.push({
      id: row.product_id,
      url: row.image_url,
      altText: row.name,
      isPrimary: true,
      sortOrder: 0,
    })
  }
  return {
    id: row.product_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    shortDescription: row.short_description,
    categoryId: row.category_id,
    categoryName: row.category_name ?? null,
    status: row.status,
    unitPrice: Number(row.unit_price),
    currency: row.currency,
    images,
    isAvailable: row.is_available,
    tags: row.tags ?? [],
    sku: row.sku ?? null,
  }
}

const PRODUCT_SELECT = `
  SELECT p.product_id, p.category_id, p.name, p.slug, p.description, p.short_description,
         p.sku, p.status, p.unit_price, p.currency, p.image_url, p.tags, p.is_available,
         c.name AS category_name
  FROM products p
  LEFT JOIN categories c ON c.category_id = p.category_id
`

export async function listProducts({ page, pageSize, categoryId, search, sort }) {
  const conditions = [`p.status <> 'ARCHIVED'`]
  const params = []
  let i = 1

  if (categoryId) {
    conditions.push(`p.category_id = $${i++}`)
    params.push(categoryId)
  }
  if (search) {
    conditions.push(`(p.name ILIKE $${i} OR p.description ILIKE $${i} OR p.sku ILIKE $${i})`)
    params.push(`%${search}%`)
    i += 1
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  let orderBy = 'p.created_at_utc DESC'
  if (sort === 'price_asc') orderBy = 'p.unit_price ASC'
  else if (sort === 'price_desc') orderBy = 'p.unit_price DESC'
  else if (sort === 'name') orderBy = 'p.name ASC'
  else if (sort === 'newest') orderBy = 'p.created_at_utc DESC'

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM products p ${where}`,
    params,
  )
  const totalItems = countResult.rows[0].total
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const offset = (page - 1) * pageSize

  const result = await query(
    `${PRODUCT_SELECT} ${where} ORDER BY ${orderBy} LIMIT $${i} OFFSET $${i + 1}`,
    [...params, pageSize, offset],
  )

  return {
    data: result.rows.map(mapProduct),
    page,
    pageSize,
    totalItems,
    totalPages,
  }
}

export async function getProductById(id) {
  const result = await query(`${PRODUCT_SELECT} WHERE p.product_id = $1`, [id])
  return assertFound(result.rows[0] ? mapProduct(result.rows[0]) : null, 'Product not found')
}

async function slugExists(slug, excludeId) {
  const result = excludeId
    ? await query(
        `SELECT 1 FROM products WHERE slug = $1 AND product_id <> $2 LIMIT 1`,
        [slug, excludeId],
      )
    : await query(`SELECT 1 FROM products WHERE slug = $1 LIMIT 1`, [slug])
  return result.rows.length > 0
}

export async function createProduct(body) {
  const category = await query(
    `SELECT category_id FROM categories WHERE category_id = $1 AND status <> 'DELETED'`,
    [body.categoryId],
  )
  if (!category.rows[0]) throw new AppError('Category not found', 404)

  const productId = uuidv4()
  const slug = await uniqueSlug(body.name, (s) => slugExists(s))
  const sku = body.sku ?? `SKU-${productId.slice(0, 8).toUpperCase()}`
  const status = body.status ?? 'ACTIVE'
  const currency = body.currency ?? 'INR'
  const tags = body.tags ?? []
  const initialQuantity = body.initialQuantity ?? 0

  await query(
    `INSERT INTO products (
       product_id, category_id, name, slug, description, short_description,
       sku, status, unit_price, currency, image_url, tags, is_available
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [
      productId,
      body.categoryId,
      body.name,
      slug,
      body.description ?? null,
      body.shortDescription ?? null,
      sku,
      status,
      body.unitPrice,
      currency,
      body.imageUrl ?? null,
      tags,
      status === 'ACTIVE',
    ],
  )

  await query(
    `INSERT INTO inventory (inventory_id, product_id, available_quantity, reserved_quantity)
     VALUES ($1, $2, $3, 0)`,
    [uuidv4(), productId, initialQuantity],
  )

  await recordInitialStock({
    productId,
    quantity: initialQuantity,
    userId: body.createdByUserId ?? null,
  })

  return getProductById(productId)
}

export async function updateProduct(id, body) {
  await getProductById(id)

  const fields = []
  const params = []
  let i = 1

  const map = {
    name: 'name',
    categoryId: 'category_id',
    description: 'description',
    shortDescription: 'short_description',
    unitPrice: 'unit_price',
    currency: 'currency',
    status: 'status',
    imageUrl: 'image_url',
    tags: 'tags',
    sku: 'sku',
    isAvailable: 'is_available',
  }

  for (const [key, col] of Object.entries(map)) {
    if (body[key] !== undefined) {
      fields.push(`${col} = $${i++}`)
      params.push(body[key])
    }
  }

  if (body.name) {
    const slug = await uniqueSlug(body.name, (s) => slugExists(s, id))
    fields.push(`slug = $${i++}`)
    params.push(slug)
  }

  if (fields.length === 0) return getProductById(id)

  fields.push('updated_at_utc = NOW()')
  params.push(id)

  await query(
    `UPDATE products SET ${fields.join(', ')} WHERE product_id = $${i}`,
    params,
  )

  return getProductById(id)
}

export async function archiveProduct(id) {
  await getProductById(id)
  await query(
    `UPDATE products
     SET status = 'ARCHIVED', is_available = false, updated_at_utc = NOW()
     WHERE product_id = $1`,
    [id],
  )
  return { id, status: 'ARCHIVED' }
}
