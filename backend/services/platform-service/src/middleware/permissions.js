import { AppError } from '../utils/errors.js'
import { getUserPermissions, hasAnyPermission, hasPermission } from '../services/permissionsService.js'

export async function loadPermissions(req, _res, next) {
  if (!req.userId) {
    return next(new AppError('Unauthorized', 401))
  }
  try {
    req.permissions = await getUserPermissions(req.userId)
    next()
  } catch (err) {
    next(err)
  }
}

export function requirePermission(...codes) {
  return (req, _res, next) => {
    if (!hasAnyPermission(req.permissions ?? [], codes)) {
      return next(new AppError('Forbidden', 403))
    }
    next()
  }
}

export function canReadAllOrders(req) {
  return hasPermission(req.permissions ?? [], 'order.read_all')
}

export function canReadOwnOrders(req) {
  return hasPermission(req.permissions ?? [], 'order.read_own')
}

export function canUpdateOrderStatus(req) {
  return hasPermission(req.permissions ?? [], 'order.update_status')
}
