import { Router } from 'express'
import {
  adminGetRole,
  adminListCustomers,
  adminListRoles,
  adminListUsers,
  adminSetRoleActive,
  adminSetUserActive,
  adminUpdateRole,
  forgot,
  login,
  logoutHandler,
  me,
  refresh,
  register,
  resendOtpHandler,
  reset,
  verifyEmailHandler,
} from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'
import { loadPermissions, requirePermission } from '../middleware/permissions.js'

export const authRouter = Router()

authRouter.post('/register', register)
authRouter.post('/verify-email', verifyEmailHandler)
authRouter.post('/resend-otp', resendOtpHandler)
authRouter.post('/login', login)
authRouter.post('/forgot-password', forgot)
authRouter.post('/reset-password', reset)
authRouter.post('/refresh', refresh)
authRouter.post('/logout', logoutHandler)
authRouter.get('/me', requireAuth, me)

authRouter.get('/admin/users', requireAuth, loadPermissions, requirePermission('user.manage_roles'), adminListUsers)
authRouter.patch('/admin/users/:userId/status', requireAuth, loadPermissions, requirePermission('user.manage_roles'), adminSetUserActive)

authRouter.get('/admin/customers', requireAuth, loadPermissions, requirePermission('customer.read'), adminListCustomers)

authRouter.get('/admin/roles', requireAuth, loadPermissions, requirePermission('user.manage_roles'), adminListRoles)
authRouter.get('/admin/roles/:roleId', requireAuth, loadPermissions, requirePermission('user.manage_roles'), adminGetRole)
authRouter.patch('/admin/roles/:roleId', requireAuth, loadPermissions, requirePermission('user.manage_roles'), adminUpdateRole)
authRouter.patch('/admin/roles/:roleId/status', requireAuth, loadPermissions, requirePermission('user.manage_roles'), adminSetRoleActive)
