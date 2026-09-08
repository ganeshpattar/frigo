import { AppError } from '../utils/errors.js'
import { getUserPermissions, hasAnyPermission } from '../services/permissionsService.js'

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
