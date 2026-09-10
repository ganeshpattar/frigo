import type { ApiErrorBody } from '@/types'

export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly errors?: Record<string, string[]>
  readonly requestId?: string
  readonly isNetworkError: boolean
  readonly isTimeout: boolean

  constructor(params: {
    message: string
    status: number
    code?: string
    errors?: Record<string, string[]>
    requestId?: string
    isNetworkError?: boolean
    isTimeout?: boolean
  }) {
    super(params.message)
    this.name = 'ApiError'
    this.status = params.status
    this.code = params.code
    this.errors = params.errors
    this.requestId = params.requestId
    this.isNetworkError = params.isNetworkError ?? false
    this.isTimeout = params.isTimeout ?? false
  }
}

const STATUS_MESSAGES: Record<number, string> = {
  400: 'The request could not be processed. Please check your input.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'This action conflicts with the current state. Please refresh and try again.',
  422: 'Some fields are invalid. Please review and try again.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Something went wrong on our side. Please try again later.',
  503: 'The service is temporarily unavailable. Please try again shortly.',
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (typeof error === 'object' && error !== null && 'isAxiosError' in error) {
    const axiosError = error as {
      code?: string
      message?: string
      response?: { status?: number; data?: ApiErrorBody; headers?: Record<string, string> }
      request?: unknown
    }

    if (axiosError.code === 'ECONNABORTED') {
      return new ApiError({
        message:
          'The server took too long to respond (Render free services wake from sleep). Wait a few seconds and try again.',
        status: 0,
        isTimeout: true,
      })
    }

    if (!axiosError.response) {
      return new ApiError({
        message: 'Unable to reach the server. Check your connection and try again.',
        status: 0,
        isNetworkError: true,
      })
    }

    const status = axiosError.response.status ?? 500
    const body = axiosError.response.data
    const requestId =
      body?.requestId ??
      axiosError.response.headers?.['x-request-id'] ??
      axiosError.response.headers?.['x-correlation-id']

    const message =
      body?.message ||
      STATUS_MESSAGES[status] ||
      'Something went wrong. Please try again.'

    return new ApiError({
      message,
      status,
      code: body?.code,
      errors: body?.errors,
      requestId,
    })
  }

  return new ApiError({
    message: 'An unexpected error occurred. Please try again.',
    status: 500,
  })
}

export function getUserFriendlyMessage(error: unknown): string {
  return normalizeApiError(error).message
}
