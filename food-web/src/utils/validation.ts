export type ValidationResult = string | true

export function validateRequired(value: unknown, label = 'This field'): ValidationResult {
  if (value === null || value === undefined) return `${label} is required`
  if (typeof value === 'string' && value.trim().length === 0) return `${label} is required`
  return true
}

export function validateEmail(value: string): ValidationResult {
  const required = validateRequired(value, 'Email')
  if (required !== true) return required
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!pattern.test(value.trim())) return 'Enter a valid email address'
  return true
}

export function validatePhone(value: string): ValidationResult {
  if (!value || value.trim().length === 0) return true
  const digits = value.replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 15) return 'Enter a valid phone number'
  return true
}

export function validatePassword(value: string): ValidationResult {
  const required = validateRequired(value, 'Password')
  if (required !== true) return required
  if (value.length < 8) return 'Password must be at least 8 characters'
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return 'Password must include letters and numbers'
  }
  return true
}

export function validateQuantity(value: number | string, min = 1, max = 99): ValidationResult {
  const num = typeof value === 'string' ? Number(value) : value
  if (!Number.isFinite(num) || !Number.isInteger(num)) return 'Enter a valid quantity'
  if (num < min) return `Quantity must be at least ${min}`
  if (num > max) return `Quantity cannot exceed ${max}`
  return true
}

/** React Hook Form compatible wrappers */
export const rhf = {
  required: (label?: string) => (value: unknown) => validateRequired(value, label),
  email: (value: string) => validateEmail(value),
  phone: (value: string) => validatePhone(value),
  password: (value: string) => validatePassword(value),
  quantity: (min?: number, max?: number) => (value: number | string) =>
    validateQuantity(value, min, max),
}
