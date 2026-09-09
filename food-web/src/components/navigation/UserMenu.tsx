import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, Moon, Shield, Sun, User } from 'lucide-react'
import { ROUTES } from '@/constants'
import { useAuth, useUI } from '@/context'
import { cn } from '@/utils/cn'

const menuItemClass =
  'flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-brand-50 hover:text-brand-800 dark:hover:bg-brand-900/50 dark:hover:text-brand-200'

export function UserMenu() {
  const { user, logout, hasRole } = useAuth()
  const { theme, toggleTheme } = useUI()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (!user) return null

  const displayName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className={cn(
          'inline-flex h-10 items-center gap-2 rounded-lg px-1.5 text-sm font-medium text-ink transition-colors',
          'hover:bg-brand-50 dark:hover:bg-brand-900/50',
          open && 'bg-brand-50 dark:bg-brand-900/50',
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white dark:bg-brand-500">
          {initial}
        </span>
        <span className="hidden max-w-[7rem] truncate md:inline">{displayName.split(' ')[0]}</span>
        <ChevronDown
          className={cn('h-4 w-4 text-ink-muted transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-surface-elevated p-2 shadow-lg"
        >
          <div className="border-b border-border px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
            <p className="truncate text-xs text-ink-muted">{user.email}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            className={cn(menuItemClass, 'mt-1')}
            onClick={() => {
              toggleTheme()
              setOpen(false)
            }}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <Link role="menuitem" to={ROUTES.PROFILE} className={menuItemClass} onClick={() => setOpen(false)}>
            <User className="h-4 w-4 shrink-0" /> Profile
          </Link>
          {hasRole('ADMIN') ? (
            <Link role="menuitem" to={ROUTES.ADMIN} className={menuItemClass} onClick={() => setOpen(false)}>
              <Shield className="h-4 w-4 shrink-0" /> Admin portal
            </Link>
          ) : null}
          {hasRole('MANAGER') ? (
            <Link role="menuitem" to={ROUTES.MANAGER} className={menuItemClass} onClick={() => setOpen(false)}>
              <Shield className="h-4 w-4 shrink-0" /> Manager portal
            </Link>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-red-50 dark:hover:bg-red-950/40"
            onClick={async () => {
              setOpen(false)
              await logout()
              navigate(ROUTES.HOME)
            }}
          >
            <LogOut className="h-4 w-4 shrink-0" /> Logout
          </button>
        </div>
      ) : null}
    </div>
  )
}
