export const appConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1',
  appName: 'Frigo',
  requestTimeoutMs: 30_000,
  /** Catalog/cart mocks until those services exist */
  useMocks: import.meta.env.VITE_USE_MOCKS !== 'false',
  /** Auth uses real gateway APIs unless explicitly mocked */
  useAuthMocks: import.meta.env.VITE_USE_AUTH_MOCKS === 'true',
} as const
