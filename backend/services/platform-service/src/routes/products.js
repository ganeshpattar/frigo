import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import {
  archiveProduct,
  createProduct,
  getProductById,
  listProducts,
  updateProduct,
} from '../services/productService.js'

export const productsRouter = Router()

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  categoryId: z.string().uuid().optional(),
  search: z.string().trim().optional(),
  sort: z.enum(['price_asc', 'price_desc', 'name', 'newest']).optional(),
})

const imageDataSchema = z
  .string()
  .trim()
  .refine(
    (value) =>
      !value ||
      value.startsWith('data:image/') ||
      value.startsWith('http://') ||
      value.startsWith('https://'),
    { message: 'Image must be a data URL or http(s) URL' },
  )
  .optional()

const createSchema = z.object({
  name: z.string().trim().min(1),
  categoryId: z.string().uuid(),
  description: z.string().trim().optional(),
  shortDescription: z.string().trim().optional(),
  unitPrice: z.coerce.number().positive(),
  currency: z.string().trim().min(1).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
  imageUrl: imageDataSchema,
  tags: z.array(z.string()).optional(),
  sku: z.string().trim().optional(),
  initialQuantity: z.coerce.number().int().min(0).optional(),
})

const updateSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    categoryId: z.string().uuid().optional(),
    description: z.string().trim().nullable().optional(),
    shortDescription: z.string().trim().nullable().optional(),
    unitPrice: z.coerce.number().positive().optional(),
    currency: z.string().trim().min(1).optional(),
    status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
    imageUrl: imageDataSchema.nullable(),
    tags: z.array(z.string()).optional(),
    sku: z.string().trim().nullable().optional(),
    isAvailable: z.boolean().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: 'No fields to update' })

productsRouter.get('/', async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query)
    const result = await listProducts(query)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

productsRouter.get('/:id', async (req, res, next) => {
  try {
    const product = await getProductById(req.params.id)
    res.json(product)
  } catch (err) {
    next(err)
  }
})

productsRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body)
    if (body.imageUrl === '') body.imageUrl = undefined
    const product = await createProduct(body)
    res.status(201).json(product)
  } catch (err) {
    next(err)
  }
})

productsRouter.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const body = updateSchema.parse(req.body)
    const product = await updateProduct(req.params.id, body)
    res.json(product)
  } catch (err) {
    next(err)
  }
})

productsRouter.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const result = await archiveProduct(req.params.id)
    res.json(result)
  } catch (err) {
    next(err)
  }
})
