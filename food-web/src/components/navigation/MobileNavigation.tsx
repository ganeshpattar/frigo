import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Search, ShoppingBag, UtensilsCrossed, User, Shield } from 'lucide-react'
import { ROUTES } from '@/constants'
import { useAuth, useCart, useUI } from '@/context'
import { Drawer } from '@/components/common/Drawer'
import { SidebarProfile } from '@/components/navigation/SidebarProfile'
import { cn } from '@/utils/cn'

const links = [
  { to: ROUTES.HOME, label: 'Home', icon: Home },
  { to: ROUTES.PRODUCTS, label: 'Products', icon: UtensilsCrossed },
  { to: ROUTES.SEARCH, label: 'Search', icon: Search },
  { to: ROUTES.CART, label: 'Cart', icon: ShoppingBag },
  { to: ROUTES.PROFILE, label: 'Profile', icon: User },
]

export function MobileNavigation() {
  const navigate = useNavigate()
  const { mobileNavOpen, setMobileNavOpen, theme, toggleTheme } = useUI()
  const { itemCount } = useCart()
  const { isAuthenticated, user, logout, hasRole } = useAuth()

  const displayName =
    `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || user?.email || 'Customer'

  const profileLinks = [
    { to: ROUTES.PROFILE, label: 'Profile', icon: <User className="h-4 w-4 shrink-0" aria-hidden /> },
    ...(hasRole('ADMIN')
      ? [{ to: ROUTES.ADMIN, label: 'Admin portal', icon: <Shield className="h-4 w-4 shrink-0" aria-hidden /> }]
      : []),
    ...(hasRole('MANAGER')
      ? [{ to: ROUTES.MANAGER, label: 'Manager portal', icon: <Shield className="h-4 w-4 shrink-0" aria-hidden /> }]
      : []),
  ]

  return (
    <>
      <Drawer
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        title="Menu"
        side="left"
        footer={
          isAuthenticated && user
            ? (
              <SidebarProfile
                name={displayName}
                email={user.email}
                theme={theme}
                onToggleTheme={toggleTheme}
                onLogout={async () => {
                  setMobileNavOpen(false)
                  await logout()
                  navigate(ROUTES.HOME)
                }}
                links={profileLinks}
              />
            )
            : undefined
        }
      >
        <nav className="space-y-1" aria-label="Mobile">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileNavOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-ink-muted',
                  isActive && 'bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200',
                )
              }
            >
              <Icon className="h-5 w-5" aria-hidden />
              {label}
              {to === ROUTES.CART && itemCount > 0 ? (
                <span className="ml-auto rounded-full bg-accent-500 px-2 py-0.5 text-xs text-white">
                  {itemCount}
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>
      </Drawer>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface-elevated/95 backdrop-blur md:hidden"
        aria-label="Bottom navigation"
      >
        <ul className="grid grid-cols-5">
          {links.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    'relative flex flex-col items-center gap-1 px-1 py-2 text-[10px] font-semibold text-ink-muted',
                    isActive && 'text-brand-700 dark:text-brand-300',
                  )
                }
              >
                <Icon className="h-5 w-5" aria-hidden />
                {label}
                {to === ROUTES.CART && itemCount > 0 ? (
                  <span className="absolute right-3 top-1 h-2 w-2 rounded-full bg-accent-500" />
                ) : null}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
