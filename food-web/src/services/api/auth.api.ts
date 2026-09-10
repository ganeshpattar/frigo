import type {
  LoginRequest,
  RegisterRequest,
  RegisterPendingResponse,
  VerifyEmailRequest,
  ResendOtpRequest,
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
/** In-memory signup OTP codes for mock mode */
const mockSignupOtps = new Map<
  string,
  { code: string; expiresAt: number; payload: RegisterRequest; userId: string }
>()

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

  async register(payload: RegisterRequest): Promise<RegisterPendingResponse> {
    if (appConfig.useAuthMocks) {
      await delay(500)
      const email = payload.email.trim().toLowerCase()
      if (MOCK_USERS[email]) {
        throw new ApiError({ message: 'An account with this email already exists.', status: 409 })
      }
      const code = '123456'
      const userId = `user_${crypto.randomUUID()}`
      mockSignupOtps.set(email, {
        code,
        expiresAt: Date.now() + 15 * 60 * 1000,
        payload: { ...payload, email },
        userId,
      })
      return {
        message: 'We sent a verification code to your email.',
        email,
        demoCode: code,
      }
    }

    const body = {
      email: payload.email.trim(),
      password: payload.password,
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      ...(payload.phone?.trim() ? { phone: payload.phone.trim() } : {}),
    }

    const { data } = await apiClient.post<RegisterPendingResponse>('/auth/register', body)
    return data
  },

  async verifyEmail(payload: VerifyEmailRequest): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    if (appConfig.useAuthMocks) {
      await delay(400)
      const email = payload.email.trim().toLowerCase()
      const pending = mockSignupOtps.get(email)
      if (!pending || pending.code !== payload.code.trim() || pending.expiresAt < Date.now()) {
        throw new ApiError({
          message: 'Invalid or expired verification code. Request a new one.',
          status: 400,
        })
      }
      const user: AuthUser = {
        id: pending.userId,
        email,
        firstName: pending.payload.firstName,
        lastName: pending.payload.lastName,
        roles: ['CUSTOMER'],
        permissions: [],
        status: 'ACTIVE',
      }
      MOCK_USERS[email] = { ...user, password: pending.payload.password }
      mockSignupOtps.delete(email)
      return { user, tokens: mockTokens(user.id) }
    }

    const { data } = await apiClient.post<{ user: AuthUser; tokens: AuthTokens }>(
      '/auth/verify-email',
      {
        email: payload.email.trim(),
        code: payload.code.trim(),
      },
    )
    return data
  },

  async resendSignupOtp(payload: ResendOtpRequest): Promise<RegisterPendingResponse> {
    if (appConfig.useAuthMocks) {
      await delay(300)
      const email = payload.email.trim().toLowerCase()
      const pending = mockSignupOtps.get(email)
      if (!pending) {
        throw new ApiError({ message: 'No pending signup found for that email.', status: 404 })
      }
      const code = '123456'
      mockSignupOtps.set(email, { ...pending, code, expiresAt: Date.now() + 15 * 60 * 1000 })
      return {
        message: 'We sent a verification code to your email.',
        email,
        demoCode: code,
      }
    }

    const { data } = await apiClient.post<RegisterPendingResponse>('/auth/resend-otp', {
      email: payload.email.trim(),
    })
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
