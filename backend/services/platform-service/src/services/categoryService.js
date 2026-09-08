import { v4 as uuidv4 } from 'uuid'
import { query } from '../db/pool.js'
import { AppError, assertFound } from '../utils/errors.js'
import { uniqueSlug } from '../utils/slug.js'

function mapCategory(row) {
  return {
    id: row.category_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    imageUrl: row.image_url,
    status: row.status,
    sortOrder: Number(row.sort_order ?? 0),
    productCount: Number(row.product_count ?? 0),
    isActive: row.status === 'ACTIVE',
  }
}

const CATEGORY_SELECT = `
  SELECT c.category_id, c.name, c.slug, c.description, c.image_url, c.status, c.sort_order,
         COUNT(p.product_id) FILTER (WHERE p.status <> 'ARCHIVED')::int AS product_count
  FROM categories c
  LEFT JOIN products p ON p.category_id = c.category_id
`

export async function listCategories({ includeInactive = false } = {}) {
  const where = includeInactive
    ? `WHERE c.status <> 'DELETED'`
    : `WHERE c.status = 'ACTIVE'`
  const result = await query(
    `${CATEGORY_SELECT}
     ${where}
     GROUP BY c.category_id
     ORDER BY c.sort_order ASC, c.name ASC`,
  )
  return result.rows.map(mapCategory)
}

export async function getCategoryById(id) {
  const result = await query(
    `${CATEGORY_SELECT}
     WHERE c.category_id = $1 AND c.status <> 'DELETED'
     GROUP BY c.category_id`,
    [id],
  )
  return assertFound(result.rows[0] ? mapCategory(result.rows[0]) : null, 'Category not found')
}

async function slugExists(slug, excludeId) {
  const result = excludeId
    ? await query(
        `SELECT 1 FROM categories WHERE slug = $1 AND category_id <> $2 LIMIT 1`,
        [slug, excludeId],
      )
    : await query(`SELECT 1 FROM categories WHERE slug = $1 LIMIT 1`, [slug])
  return result.rows.length > 0
}

export async function createCategory(body) {
  const categoryId = uuidv4()
  const slug = body.slug?.trim()
    ? body.slug.trim()
    : await uniqueSlug(body.name, (s) => slugExists(s))
  if (await slugExists(slug)) throw new AppError('Category slug already exists', 409)

  await query(
    `INSERT INTO categories (category_id, name, slug, description, image_url, status, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      categoryId,
      body.name,
      slug,
      body.description ?? null,
      body.imageUrl ?? null,
      body.status ?? 'ACTIVE',
      body.sortOrder ?? 0,
    ],
  )
  return getCategoryById(categoryId)
}

export async function updateCategory(id, body) {
  await getCategoryById(id)
  const fields = []
  const params = []
  let i = 1
  const map = {
    name: 'name',
    description: 'description',
    imageUrl: 'image_url',
    status: 'status',
    sortOrder: 'sort_order',
  }
  for (const [key, col] of Object.entries(map)) {
    if (body[key] !== undefined) {
      fields.push(`${col} = $${i++}`)
      params.push(body[key])
    }
  }
  if (body.name && body.slug === undefined) {
    const slug = await uniqueSlug(body.name, (s) => slugExists(s, id))
    fields.push(`slug = $${i++}`)
    params.push(slug)
  } else if (body.slug !== undefined) {
    if (await slugExists(body.slug, id)) throw new AppError('Category slug already exists', 409)
    fields.push(`slug = $${i++}`)
    params.push(body.slug)
  }
  if (!fields.length) return getCategoryById(id)
  fields.push('updated_at_utc = NOW()')
  params.push(id)
  await query(`UPDATE categories SET ${fields.join(', ')} WHERE category_id = $${i}`, params)
  return getCategoryById(id)
}

export async function setCategoryActive(id, active) {
  await getCategoryById(id)
  await query(
    `UPDATE categories
     SET status = $2, updated_at_utc = NOW()
     WHERE category_id = $1`,
    [id, active ? 'ACTIVE' : 'INACTIVE'],
  )
  return getCategoryById(id)
}

export async function deleteCategory(id) {
  await getCategoryById(id)
  await query(
    `UPDATE categories
     SET status = 'DELETED', updated_at_utc = NOW()
     WHERE category_id = $1`,
    [id],
  )
  return { id, status: 'DELETED' }
}
