import { ZodError } from 'zod'
import { AppError } from '../utils/errors.js'

export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: err.errors[0]?.message ?? 'Validation failed',
      errors: err.errors,
    })
  }
  if (err instanceof AppError) {
    return res.status(err.status).json({ message: err.message, code: err.code })
  }
  console.error(err)
  return res.status(500).json({ message: 'Internal server error' })
}
