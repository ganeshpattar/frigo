import { env } from '../config/env.js'
import { AppError } from '../utils/errors.js'

export async function createCustomerProfile(input) {
  const response = await fetch(`${env.userServiceUrl}/internal/profiles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new AppError(body.message ?? 'Failed to create customer profile', response.status)
  }

  return response.json()
}

export async function getCustomerProfile(userId) {
  const response = await fetch(`${env.userServiceUrl}/internal/profiles/by-user/${userId}`)
  if (response.status === 404) return null
  if (!response.ok) {
    throw new AppError('Failed to load customer profile', response.status)
  }
  return response.json()
}
