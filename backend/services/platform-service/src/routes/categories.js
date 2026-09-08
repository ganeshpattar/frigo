import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import {
  createCategory,
  deleteCategory,
  getCategoryById,
  listCategories,
  setCategoryActive,
  updateCategory,
} from '../services/categoryService.js'

export const categoriesRouter = Router()

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
  slug: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  imageUrl: imageDataSchema,
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  sortOrder: z.coerce.number().int().optional(),
})

const updateSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    slug: z.string().trim().min(1).optional(),
    description: z.string().trim().nullable().optional(),
    imageUrl: imageDataSchema.nullable(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    sortOrder: z.coerce.number().int().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: 'No fields to update' })

const statusSchema = z.object({
  active: z.boolean(),
})

categoriesRouter.get('/', async (_req, res, next) => {
  try {
    const data = await listCategories({ includeInactive: false })
    res.json(data)
  } catch (err) {
    next(err)
  }
})

categoriesRouter.get('/manage', requireAuth, async (_req, res, next) => {
  try {
    const data = await listCategories({ includeInactive: true })
    res.json({ data, totalItems: data.length })
  } catch (err) {
    next(err)
  }
})

categoriesRouter.get('/:id', async (req, res, next) => {
  try {
    const data = await getCategoryById(req.params.id)
    res.json(data)
  } catch (err) {
    next(err)
  }
})

categoriesRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body)
    const data = await createCategory(body)
    res.status(201).json(data)
  } catch (err) {
    next(err)
  }
})

categoriesRouter.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const body = updateSchema.parse(req.body)
    const data = await updateCategory(req.params.id, body)
    res.json(data)
  } catch (err) {
    next(err)
  }
})

categoriesRouter.patch('/:id/status', requireAuth, async (req, res, next) => {
  try {
    const body = statusSchema.parse(req.body)
    const data = await setCategoryActive(req.params.id, body.active)
    res.json(data)
  } catch (err) {
    next(err)
  }
})

categoriesRouter.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const data = await deleteCategory(req.params.id)
    res.json(data)
  } catch (err) {
    next(err)
  }
})
