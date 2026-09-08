import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import { loadPermissions, requirePermission } from '../middleware/permissions.js'
import { listInventory, updateInventory } from '../services/inventoryService.js'
import { listStockTransactions } from '../services/stockTransactionService.js'

export const inventoryRouter = Router()

const updateSchema = z
  .object({
    availableQuantity: z.coerce.number().int().min(0).optional(),
    adjustment: z.coerce.number().int().optional(),
  })
  .refine(
    (body) => body.availableQuantity !== undefined || body.adjustment !== undefined,
    { message: 'Provide availableQuantity or adjustment' },
  )

inventoryRouter.use(requireAuth, loadPermissions)

inventoryRouter.get('/', requirePermission('inventory.read'), async (_req, res, next) => {
  try {
    const data = await listInventory()
    res.json(data)
  } catch (err) {
    next(err)
  }
})

inventoryRouter.get(
  '/:productId/transactions',
  requirePermission('inventory.read'),
  async (req, res, next) => {
    try {
      const page = Number(req.query.page) || 1
      const pageSize = Math.min(Number(req.query.pageSize) || 50, 100)
      const data = await listStockTransactions(req.params.productId, { page, pageSize })
      res.json(data)
    } catch (err) {
      next(err)
    }
  },
)

inventoryRouter.patch(
  '/:productId',
  requirePermission('inventory.adjust'),
  async (req, res, next) => {
    try {
      const body = updateSchema.parse(req.body)
      const item = await updateInventory(req.params.productId, body, { userId: req.userId })
      res.json(item)
    } catch (err) {
      next(err)
    }
  },
)
