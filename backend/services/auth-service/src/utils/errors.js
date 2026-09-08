export class AppError extends Error {
  constructor(message, status = 400, code) {
    super(message)
    this.status = status
    this.code = code
  }
}

export function assertFound(value, message = 'Not found') {
  if (value == null) throw new AppError(message, 404)
  return value
}
