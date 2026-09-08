import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronUp, LogOut, Moon, Sun } from 'lucide-react'
import { Link } from 'react-router-dom'
import { UserAvatar } from '@/components/admin/UserAvatar'
import { cn } from '@/utils/cn'
import type { ThemeMode } from '@/context/UIContext'

export interface SidebarProfileLink {
  to: string
  label: string
  icon: ReactNode
  onClick?: () => void
}

interface SidebarProfileProps {
  name?: string
  email?: string
  collapsed?: boolean
  theme?: ThemeMode
  onToggleTheme?: () => void
  onLogout: () => void
  links?: SidebarProfileLink[]
}

export function SidebarProfile({
  name,
  email,
  collapsed = false,
  theme = 'light',
  onToggleTheme,
  onLogout,
  links = [],
}: SidebarProfileProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const displayName = name?.trim() || 'User'

  useEffect(() => {
    if (!open) return
    const onDocClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const handleLogout = () => {
    setOpen(false)
    onLogout()
  }

  const handleToggleTheme = () => {
    onToggleTheme?.()
    setOpen(false)
  }

  return (
    <div
      ref={rootRef}
      className={cn('relative bg-surface-elevated', collapsed ? 'px-2 pb-2 pt-2' : 'px-3 pb-2 pt-3')}
    >
      {open ? (
        <div
          className={cn(
            'absolute z-20 mb-2 rounded-xl border border-border bg-surface-elevated p-2 shadow-lg',
            collapsed ? 'bottom-full left-1/2 w-52 -translate-x-1/2' : 'bottom-full left-0 right-0',
          )}
        >
          <div className="border-b border-border px-3 py-2">
            <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
            {email ? <p className="truncate text-xs text-ink-muted">{email}</p> : null}
          </div>
          {onToggleTheme ? (
            <button
              type="button"
              onClick={handleToggleTheme}
              className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-brand-50 hover:text-ink"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 shrink-0" aria-hidden />
              ) : (
                <Moon className="h-4 w-4 shrink-0" aria-hidden />
              )}
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
          ) : null}
          {links.map((link) => (
            <Link
              key={link.to + link.label}
              to={link.to}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-brand-50 hover:text-ink"
              onClick={() => {
                link.onClick?.()
                setOpen(false)
              }}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden />
            Logout
          </button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          'flex w-full items-center rounded-lg transition-colors hover:bg-brand-50',
          collapsed ? 'justify-center p-2' : 'gap-3 px-2 py-2',
        )}
      >
        <UserAvatar name={displayName} className={collapsed ? 'h-9 w-9 text-xs' : undefined} />
        {!collapsed ? (
          <>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
              {email ? <p className="truncate text-xs text-ink-muted">{email}</p> : null}
            </div>
            <ChevronUp
              className={cn('h-4 w-4 shrink-0 text-ink-muted transition-transform', open && 'rotate-180')}
              aria-hidden
            />
          </>
        ) : null}
      </button>
    </div>
  )
}
