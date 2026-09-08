import { NavLink } from 'react-router-dom'
import { cn } from '@/utils/cn'

export interface SidebarItem {
  to: string
  label: string
  icon?: React.ReactNode
}

interface SidebarProps {
  items: SidebarItem[]
  title?: string
}

export function Sidebar({ items, title }: SidebarProps) {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-surface-elevated lg:block">
      <div className="sticky top-16 p-4">
        {title ? (
          <p className="mb-3 px-2 text-xs font-bold uppercase tracking-wider text-ink-muted">
            {title}
          </p>
        ) : null}
        <nav className="space-y-1" aria-label={title ?? 'Sidebar'}>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to.split('/').length <= 2}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-xl px-3 py-2.5 text-base font-semibold text-ink-muted transition-colors hover:bg-brand-50 hover:text-ink dark:hover:bg-brand-900/30',
                  isActive && 'bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200',
                )
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  )
}
