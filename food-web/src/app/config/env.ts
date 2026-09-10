export const appConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1',
  appName: 'Tirumal Foods',
  // Render free tier cold-starts + SMTP can exceed 30s
  requestTimeoutMs: Number(import.meta.env.VITE_REQUEST_TIMEOUT_MS ?? 90_000),
  /** Catalog/cart mocks until those services exist */
  useMocks: import.meta.env.VITE_USE_MOCKS !== 'false',
  /** Auth uses real gateway APIs unless explicitly mocked */
  useAuthMocks: import.meta.env.VITE_USE_AUTH_MOCKS === 'true',
} as const
