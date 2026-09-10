import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AuthUser, LoginRequest, RegisterRequest, RoleCode, PermissionCode } from '@/types'
import { authApi, registerAuthHandlers } from '@/services/api'
import { tokenStorage, storage } from '@/services/storage'
import { hasPermission, hasRole, hasAnyPermission, hasAllPermissions } from '@/utils/rbac'
import { getUserFriendlyMessage } from '@/utils/apiError'

const USER_SNAPSHOT_KEY = 'frigo.user_snapshot'

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  roles: RoleCode[]
  permissions: PermissionCode[]
  login: (payload: LoginRequest) => Promise<void>
  register: (payload: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<string | null>
  hasRole: (role: RoleCode) => boolean
  hasPermission: (permission: PermissionCode) => boolean
  hasAnyPermission: (permissions: PermissionCode[]) => boolean
  hasAllPermissions: (permissions: PermissionCode[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const clearSession = useCallback(() => {
    setUser(null)
    tokenStorage.clear()
    storage.remove(USER_SNAPSHOT_KEY)
  }, [])

  const refreshSession = useCallback(async (): Promise<string | null> => {
    const refreshToken = tokenStorage.getRefreshToken()
    if (!refreshToken) {
      clearSession()
      return null
    }
    try {
      const tokens = await authApi.refresh(refreshToken)
      tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken, tokens.expiresAt)
      return tokens.accessToken
    } catch {
      clearSession()
      return null
    }
  }, [clearSession])

  useEffect(() => {
    registerAuthHandlers({
      refresh: refreshSession,
      unauthorized: clearSession,
    })
  }, [refreshSession, clearSession])

  useEffect(() => {
    const restore = async () => {
      try {
        const access = tokenStorage.getAccessToken()
        const refresh = tokenStorage.getRefreshToken()
        const snapshot = storage.getJson<AuthUser>(USER_SNAPSHOT_KEY)

        if (access && snapshot) {
          setUser(snapshot)
          return
        }

        if (refresh) {
          const token = await refreshSession()
          if (token && snapshot) {
            setUser(snapshot)
          }
        }
      } finally {
        setIsLoading(false)
      }
    }
    void restore()
  }, [refreshSession])

  const login = useCallback(async (payload: LoginRequest) => {
    const { user: nextUser, tokens } = await authApi.login(payload)
    tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken, tokens.expiresAt)
    storage.setJson(USER_SNAPSHOT_KEY, nextUser)
    setUser(nextUser)
  }, [])

  const register = useCallback(async (payload: RegisterRequest) => {
    const { user: nextUser, tokens } = await authApi.register(payload)
    tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken, tokens.expiresAt)
    storage.setJson(USER_SNAPSHOT_KEY, nextUser)
    setUser(nextUser)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // still clear local session
    } finally {
      clearSession()
    }
  }, [clearSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      roles: user?.roles ?? [],
      permissions: user?.permissions ?? [],
      login,
      register,
      logout,
      refreshSession,
      hasRole: (role) => hasRole(user, role),
      hasPermission: (permission) => hasPermission(user, permission),
      hasAnyPermission: (permissions) => hasAnyPermission(user, permissions),
      hasAllPermissions: (permissions) => hasAllPermissions(user, permissions),
    }),
    [user, isLoading, login, register, logout, refreshSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function getAuthErrorMessage(error: unknown): string {
  return getUserFriendlyMessage(error)
}
