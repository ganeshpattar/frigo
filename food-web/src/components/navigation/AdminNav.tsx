import { NavLink } from 'react-router-dom'
import { cn } from '@/utils/cn'
import type { SidebarItem } from './Sidebar'

interface AdminNavProps {
  items: SidebarItem[]
  collapsed?: boolean
  onNavigate?: () => void
}

export function AdminNav({ items, collapsed = false, onNavigate }: AdminNavProps) {
  return (
    <nav className="space-y-1" aria-label="Administration">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to.split('/').length <= 2}
          title={collapsed ? item.label : undefined}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center rounded-lg text-base font-medium text-ink-muted transition-colors hover:bg-brand-50 hover:text-ink dark:hover:bg-brand-900/30',
              collapsed
                ? 'justify-center px-2 py-2.5'
                : 'gap-3 border-l-[3px] px-3 py-2.5',
              isActive
                ? collapsed
                  ? 'bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200'
                  : 'border-brand-500 bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200'
                : collapsed
                  ? 'border-transparent'
                  : 'border-transparent',
            )
          }
        >
          {item.icon}
          {!collapsed ? <span className="truncate">{item.label}</span> : null}
        </NavLink>
      ))}
    </nav>
  )
}
