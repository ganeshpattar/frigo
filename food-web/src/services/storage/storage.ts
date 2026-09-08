import { STORAGE_KEYS } from '@/constants'

type StorageKind = 'local' | 'session'

function getStore(kind: StorageKind): Storage {
  return kind === 'session' ? sessionStorage : localStorage
}

export const storage = {
  get(key: string, kind: StorageKind = 'local'): string | null {
    try {
      return getStore(kind).getItem(key)
    } catch {
      return null
    }
  },

  set(key: string, value: string, kind: StorageKind = 'local'): void {
    try {
      getStore(kind).setItem(key, value)
    } catch {
      // Storage may be unavailable (private mode / quota)
    }
  },

  remove(key: string, kind: StorageKind = 'local'): void {
    try {
      getStore(kind).removeItem(key)
    } catch {
      // ignore
    }
  },

  getJson<T>(key: string, kind: StorageKind = 'local'): T | null {
    const raw = this.get(key, kind)
    if (!raw) return null
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  },

  setJson(key: string, value: unknown, kind: StorageKind = 'local'): void {
    this.set(key, JSON.stringify(value), kind)
  },
}

/** Access token in sessionStorage (cleared on tab close). Refresh in localStorage for restore. */
export const tokenStorage = {
  getAccessToken(): string | null {
    return storage.get(STORAGE_KEYS.ACCESS_TOKEN, 'session')
  },

  getRefreshToken(): string | null {
    return storage.get(STORAGE_KEYS.REFRESH_TOKEN, 'local')
  },

  getExpiresAt(): number | null {
    const raw = storage.get(STORAGE_KEYS.TOKEN_EXPIRES_AT, 'session')
    if (!raw) return null
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  },

  setTokens(accessToken: string, refreshToken: string, expiresAt: number): void {
    storage.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken, 'session')
    storage.set(STORAGE_KEYS.REFRESH_TOKEN, refreshToken, 'local')
    storage.set(STORAGE_KEYS.TOKEN_EXPIRES_AT, String(expiresAt), 'session')
  },

  clear(): void {
    storage.remove(STORAGE_KEYS.ACCESS_TOKEN, 'session')
    storage.remove(STORAGE_KEYS.REFRESH_TOKEN, 'local')
    storage.remove(STORAGE_KEYS.TOKEN_EXPIRES_AT, 'session')
  },
}
