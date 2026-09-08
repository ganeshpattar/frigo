import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { loadPermissions, requirePermission } from '../middleware/permissions.js'
import { getManagerDashboard } from '../services/dashboardService.js'

export const managerRouter = Router()

managerRouter.use(requireAuth, loadPermissions)

managerRouter.get(
  '/dashboard',
  requirePermission('order.read_all', 'inventory.read'),
  async (_req, res, next) => {
    try {
      const data = await getManagerDashboard()
      res.json(data)
    } catch (err) {
      next(err)
    }
  },
)
