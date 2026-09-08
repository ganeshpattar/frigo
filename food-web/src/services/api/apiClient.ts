import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'
import { appConfig } from '@/app/config/env'
import { tokenStorage } from '@/services/storage'
import { ApiError, normalizeApiError } from '@/utils/apiError'

let refreshHandler: (() => Promise<string | null>) | null = null
let onUnauthorized: (() => void) | null = null

export function registerAuthHandlers(handlers: {
  refresh: () => Promise<string | null>
  unauthorized: () => void
}): void {
  refreshHandler = handlers.refresh
  onUnauthorized = handlers.unauthorized
}

function createCorrelationId(): string {
  return crypto.randomUUID()
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: appConfig.apiBaseUrl,
  timeout: appConfig.requestTimeoutMs,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  const correlationId = createCorrelationId()
  config.headers['X-Request-Id'] = correlationId
  config.headers['X-Correlation-Id'] = correlationId

  return config
})

let isRefreshing = false
let pendingQueue: Array<{
  resolve: (token: string | null) => void
  reject: (err: unknown) => void
}> = []

function flushQueue(token: string | null, error?: unknown) {
  pendingQueue.forEach((p) => {
    if (error) p.reject(error)
    else p.resolve(token)
  })
  pendingQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined

    if (error.response?.status === 401 && original && !original._retry && refreshHandler) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({
            resolve: (token) => {
              if (!token) {
                reject(normalizeApiError(error))
                return
              }
              original.headers.Authorization = `Bearer ${token}`
              resolve(apiClient(original))
            },
            reject,
          })
        })
      }

      original._retry = true
      isRefreshing = true

      try {
        const newToken = await refreshHandler()
        flushQueue(newToken)
        if (!newToken) {
          onUnauthorized?.()
          throw normalizeApiError(error)
        }
        original.headers.Authorization = `Bearer ${newToken}`
        return apiClient(original)
      } catch (refreshError) {
        flushQueue(null, refreshError)
        onUnauthorized?.()
        throw normalizeApiError(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    throw normalizeApiError(error)
  },
)

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
