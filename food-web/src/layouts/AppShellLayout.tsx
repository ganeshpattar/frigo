import { useState, type ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, Store } from 'lucide-react'
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
import tabLogo from '@/assets/Tirumal_Tab.png'

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
  homeRoute: _homeRoute,
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

  const toggleSidebar = () => setSidebarExpanded((open) => !open)

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
                'flex shrink-0 items-center justify-center border-b border-border',
                sidebarExpanded ? 'px-3 py-3' : 'px-2 py-3',
              )}
            >
              <button
                type="button"
                onClick={toggleSidebar}
                className="inline-flex items-center justify-center rounded-xl transition-colors hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:hover:bg-brand-900/40"
                aria-label={sidebarExpanded ? 'Collapse menu' : 'Expand menu'}
                title={sidebarExpanded ? 'Collapse menu' : 'Expand menu'}
              >
                {sidebarExpanded ? (
                  <BrandLogo size="sm" to={null} />
                ) : (
                  <img
                    src={tabLogo}
                    alt="Tirumal Foods"
                    className="h-9 w-9 object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.28)]"
                  />
                )}
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-2">
              <AdminNav items={navItems} collapsed={!sidebarExpanded} />
            </div>

            <div className="shrink-0 border-t border-border">
              <SidebarProfile
                name={userName}
                email={user?.email}
                roleLabel={brandLabel}
                collapsed={!sidebarExpanded}
                theme={theme}
                onToggleTheme={toggleTheme}
                onLogout={() => void logout()}
                links={defaultProfileLinks}
              />
            </div>
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
                roleLabel={brandLabel}
                theme={theme}
                onToggleTheme={toggleTheme}
                onLogout={() => void logout()}
                links={defaultProfileLinks}
              />
            }
          >
            <div className="mb-4 flex items-center border-b border-border pb-4">
              <BrandLogo size="sm" to={null} />
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
