import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { loadPermissions, requirePermission } from '../middleware/permissions.js'
import { getDashboard } from '../services/dashboardService.js'

export const adminRouter = Router()

adminRouter.use(requireAuth, loadPermissions)

adminRouter.get('/dashboard', requirePermission('user.manage_roles'), async (_req, res, next) => {
  try {
    const data = await getDashboard()
    res.json(data)
  } catch (err) {
    next(err)
  }
})
