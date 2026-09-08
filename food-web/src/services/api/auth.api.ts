import type {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  AuthUser,
  AuthTokens,
} from '@/types'
import { MOCK_USERS, delay } from '@/mocks/data'
import { appConfig } from '@/app/config/env'
import { apiClient } from './apiClient'
import { ApiError } from '@/utils/apiError'
import { PERMISSIONS } from '@/constants'

function toPublicUser(user: AuthUser & { password?: string }): AuthUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roles: user.roles,
    permissions: user.permissions,
    status: user.status,
  }
}

function mockTokens(userId: string): AuthTokens {
  return {
    accessToken: `mock_access_${userId}`,
    refreshToken: `mock_refresh_${userId}`,
    expiresAt: Date.now() + 60 * 60 * 1000,
  }
}

/** In-memory reset codes for mock mode */
const mockResetCodes = new Map<string, { code: string; expiresAt: number }>()

export const authApi = {
  async login(payload: LoginRequest): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    if (appConfig.useAuthMocks) {
      await delay()
      const record = MOCK_USERS[payload.email.toLowerCase()]
      if (!record || record.password !== payload.password) {
        throw new ApiError({ message: 'Invalid email or password.', status: 401 })
      }
      return {
        user: toPublicUser(record),
        tokens: mockTokens(record.id),
      }
    }

    const { data } = await apiClient.post<{ user: AuthUser; tokens: AuthTokens }>('/auth/login', {
      email: payload.email.trim(),
      password: payload.password,
    })
    return data
  },

  async register(payload: RegisterRequest): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    if (appConfig.useAuthMocks) {
      await delay(500)
      if (MOCK_USERS[payload.email.toLowerCase()]) {
        throw new ApiError({ message: 'An account with this email already exists.', status: 409 })
      }
      const user: AuthUser = {
        id: `user_${crypto.randomUUID()}`,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        roles: ['CUSTOMER'],
        permissions: [],
        status: 'ACTIVE',
      }
      return { user, tokens: mockTokens(user.id) }
    }

    const body = {
      email: payload.email.trim(),
      password: payload.password,
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      ...(payload.phone?.trim() ? { phone: payload.phone.trim() } : {}),
    }

    const { data } = await apiClient.post<{ user: AuthUser; tokens: AuthTokens }>(
      '/auth/register',
      body,
    )
    return data
  },

  async forgotPassword(payload: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    if (appConfig.useAuthMocks) {
      await delay(500)
      const email = payload.email.trim().toLowerCase()
      const record = MOCK_USERS[email]
      const message = 'If an account exists for that email, we sent a password reset code.'
      if (record) {
        const code = '123456'
        mockResetCodes.set(email, {
          code,
          expiresAt: Date.now() + 15 * 60 * 1000,
        })
        return { message, demoCode: code }
      }
      return { message }
    }

    const { data } = await apiClient.post<ForgotPasswordResponse>(
      '/auth/forgot-password',
      payload,
    )
    return data
  },

  async resetPassword(payload: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    if (appConfig.useAuthMocks) {
      await delay(500)
      const email = payload.email.trim().toLowerCase()
      const record = MOCK_USERS[email]
      const pending = mockResetCodes.get(email)
      if (
        !record ||
        !pending ||
        pending.code !== payload.code.trim() ||
        pending.expiresAt < Date.now()
      ) {
        throw new ApiError({
          message: 'Invalid or expired reset code. Request a new one.',
          status: 400,
        })
      }
      record.password = payload.password
      mockResetCodes.delete(email)
      return { message: 'Your password has been updated. You can sign in now.' }
    }

    const { data } = await apiClient.post<ResetPasswordResponse>(
      '/auth/reset-password',
      payload,
    )
    return data
  },

  async me(): Promise<AuthUser> {
    if (appConfig.useAuthMocks) {
      await delay(200)
      throw new ApiError({ message: 'Not implemented in mock mode', status: 401 })
    }
    const { data } = await apiClient.get<AuthUser>('/auth/me')
    return data
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    if (appConfig.useAuthMocks) {
      await delay(150)
      if (!refreshToken.startsWith('mock_refresh_')) {
        throw new ApiError({ message: 'Invalid refresh token.', status: 401 })
      }
      const userId = refreshToken.replace('mock_refresh_', '')
      return mockTokens(userId)
    }
    const { data } = await apiClient.post<AuthTokens>('/auth/refresh', { refreshToken })
    return data
  },

  async logout(): Promise<void> {
    if (appConfig.useAuthMocks) {
      await delay(100)
      return
    }
    await apiClient.post('/auth/logout')
  },
}

/** Demo helper — not for production */
export const DEMO_CREDENTIALS = {
  admin: { email: 'admin@frigo.test', password: 'Admin123!' },
  manager: { email: 'manager@frigo.test', password: 'Manager123!' },
  customer: { email: 'customer@frigo.test', password: 'Customer123!' },
  permissions: PERMISSIONS,
}
