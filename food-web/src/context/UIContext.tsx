import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { STORAGE_KEYS } from '@/constants'
import { storage } from '@/services/storage'

export type ThemeMode = 'light' | 'dark'

interface ToastItem {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'success' | 'error'
}

interface UIContextValue {
  theme: ThemeMode
  toggleTheme: () => void
  setTheme: (theme: ThemeMode) => void
  mobileNavOpen: boolean
  setMobileNavOpen: (open: boolean) => void
  toasts: ToastItem[]
  pushToast: (toast: Omit<ToastItem, 'id'>) => void
  dismissToast: (id: string) => void
}

const UIContext = createContext<UIContextValue | null>(null)

function getInitialTheme(): ThemeMode {
  const saved = storage.get(STORAGE_KEYS.THEME)
  if (saved === 'light' || saved === 'dark') return saved
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

export function UIProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => getInitialTheme())
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    storage.set(STORAGE_KEYS.THEME, theme)
  }, [theme])

  const setTheme = useCallback((next: ThemeMode) => setThemeState(next), [])
  const toggleTheme = useCallback(
    () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')),
    [],
  )

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const pushToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = crypto.randomUUID()
      setToasts((prev) => [...prev, { ...toast, id }])
      window.setTimeout(() => dismissToast(id), 4000)
    },
    [dismissToast],
  )

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      setTheme,
      mobileNavOpen,
      setMobileNavOpen,
      toasts,
      pushToast,
      dismissToast,
    }),
    [theme, toggleTheme, setTheme, mobileNavOpen, toasts, pushToast, dismissToast],
  )

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used within UIProvider')
  return ctx
}
