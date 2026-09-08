import { verifyAccessToken } from '../utils/crypto.js'
import { AppError } from '../utils/errors.js'

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('Unauthorized', 401))
  }
  try {
    const payload = verifyAccessToken(header.slice(7))
    req.userId = payload.sub
    next()
  } catch {
    next(new AppError('Unauthorized', 401))
  }
}
