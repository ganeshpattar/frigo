import { useState, type ReactNode } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { Menu, PanelLeftClose, PanelLeftOpen, Store } from 'lucide-react'
import { ROUTES } from '@/constants'
import { useAuth, useUI } from '@/context'
import { type SidebarItem } from '@/components/navigation/Sidebar'
import { AdminNav } from '@/components/navigation/AdminNav'
import { SidebarProfile } from '@/components/navigation/SidebarProfile'
import { IconButton } from '@/components/common/IconButton'
import { Drawer } from '@/components/common/Drawer'
import { ToastViewport } from '@/components/common/Toast'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { cn } from '@/utils/cn'

function displayName(firstName?: string, lastName?: string, email?: string, fallback = 'User') {
  const full = `${firstName ?? ''} ${lastName ?? ''}`.trim()
  return full || email || fallback
}

interface AppShellLayoutProps {
  brandLabel: string
  homeRoute: string
  drawerTitle: string
  sidebarAriaLabel: string
  navItems: SidebarItem[]
  profileLinks?: Array<{ to: string; label: string; icon: ReactNode; onClick?: () => void }>
  userFallback?: string
}

export function AppShellLayout({
  brandLabel,
  homeRoute,
  drawerTitle,
  sidebarAriaLabel,
  navItems,
  profileLinks = [],
  userFallback = 'User',
}: AppShellLayoutProps) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useUI()
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const userName = displayName(user?.firstName, user?.lastName, user?.email, userFallback)

  const defaultProfileLinks = [
    { to: ROUTES.HOME, label: 'Storefront', icon: <Store className="h-4 w-4 shrink-0" aria-hidden /> },
    ...profileLinks,
  ]

  const sidebarFooter = (
    <div className="shrink-0 border-t border-border">
      <SidebarProfile
        name={userName}
        email={user?.email}
        collapsed={!sidebarExpanded}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={() => void logout()}
        links={defaultProfileLinks}
      />
      <div className={cn('border-t border-border py-2', sidebarExpanded ? 'px-3' : 'px-2')}>
        <div className={cn('flex', sidebarExpanded ? 'justify-start' : 'justify-center')}>
          <IconButton
            label={sidebarExpanded ? 'Collapse menu' : 'Expand menu'}
            icon={
              sidebarExpanded ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeftOpen className="h-5 w-5" />
              )
            }
            onClick={() => setSidebarExpanded((open) => !open)}
          />
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas">
      <header className="z-40 flex h-14 shrink-0 items-center border-b border-border bg-surface-elevated px-4 shadow-sm lg:hidden">
        <IconButton
          label="Open menu"
          icon={<Menu className="h-5 w-5" />}
          onClick={() => setMobileNavOpen(true)}
        />
      </header>

      <div className="flex min-h-0 flex-1">
        <aside
          className={cn(
            'hidden h-full shrink-0 flex-col border-r border-border bg-surface-elevated shadow-sm transition-[width] duration-300 lg:flex',
            sidebarExpanded ? 'w-60' : 'w-[4.5rem]',
          )}
          aria-label={sidebarAriaLabel}
        >
          <div className="flex h-full min-h-0 flex-col">
            <div
              className={cn(
                'shrink-0 border-b border-border',
                sidebarExpanded ? 'px-4 py-3' : 'px-2 py-3',
              )}
            >
              {sidebarExpanded ? (
                <Link to={homeRoute} className="inline-flex min-w-0 items-center gap-2" aria-label={`Frigo ${brandLabel}`}>
                  <BrandLogo size="sm" to={null} />
                  <span className="font-display text-sm font-bold text-ink">{brandLabel}</span>
                </Link>
              ) : (
                <Link
                  to={homeRoute}
                  className="flex justify-center"
                  aria-label={`Frigo ${brandLabel}`}
                  title={`Frigo ${brandLabel}`}
                >
                  <BrandLogo size="sm" to={null} imgClassName="h-8 w-8 object-contain object-center" />
                </Link>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-2">
              <AdminNav items={navItems} collapsed={!sidebarExpanded} />
            </div>

            {sidebarFooter}
          </div>
        </aside>

        <div className="lg:hidden">
          <Drawer
            open={mobileNavOpen}
            onClose={() => setMobileNavOpen(false)}
            title={drawerTitle}
            side="left"
            footer={
              <SidebarProfile
                name={userName}
                email={user?.email}
                theme={theme}
                onToggleTheme={toggleTheme}
                onLogout={() => void logout()}
                links={defaultProfileLinks}
              />
            }
          >
            <div className="mb-4 flex items-center gap-2 border-b border-border pb-4">
              <BrandLogo size="sm" to={null} />
              <span className="font-display text-sm font-bold text-ink">{brandLabel}</span>
            </div>
            <AdminNav items={navItems} onNavigate={() => setMobileNavOpen(false)} />
          </Drawer>
        </div>

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-5 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
      <ToastViewport />
    </div>
  )
}
