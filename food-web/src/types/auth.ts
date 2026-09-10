export type RoleCode = 'ADMIN' | 'MANAGER' | 'CUSTOMER'

export type PermissionCode = string

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  roles: RoleCode[]
  permissions: PermissionCode[]
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED'
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}

export interface RegisterPendingResponse {
  message: string
  email: string
  /** Present in mock/dev only so the verify flow can be tested without email */
  demoCode?: string
}

export interface VerifyEmailRequest {
  email: string
  code: string
}

export interface ResendOtpRequest {
  email: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ForgotPasswordResponse {
  message: string
  /** Present in mock/dev only so the reset flow can be tested without email */
  demoCode?: string
}

export interface ResetPasswordRequest {
  email: string
  code: string
  password: string
}

export interface ResetPasswordResponse {
  message: string
}
