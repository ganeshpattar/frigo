import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Menu, Search, ShoppingBag } from 'lucide-react'
import { ROUTES } from '@/constants'
import { useAuth, useCart, useUI } from '@/context'
import { IconButton } from '@/components/common/IconButton'
import { Button } from '@/components/common/Button'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { UserMenu } from './UserMenu'
import { cn } from '@/utils/cn'
import { springSoft } from '@/utils/motion'

const customerLinks = [
  { to: ROUTES.HOME, label: 'Home' },
  { to: ROUTES.PRODUCTS, label: 'Menu' },
  { to: ROUTES.SEARCH, label: 'Search' },
  { to: ROUTES.ORDERS, label: 'Orders' },
]

export function Header() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { itemCount } = useCart()
  const { setMobileNavOpen } = useUI()
  const [scrolled, setScrolled] = useState(false)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-300',
        scrolled
          ? 'border-border bg-surface-elevated/95 shadow-[0_8px_28px_-20px_rgb(61_8_8/0.4)] backdrop-blur-xl dark:shadow-[0_8px_28px_-18px_rgb(0_0_0/0.55)]'
          : 'border-border/70 bg-surface-elevated/85 backdrop-blur-md',
      )}
    >
      <div className="flex h-16 w-full items-center gap-4 px-4 sm:h-[4.25rem] sm:gap-6 sm:px-6 lg:gap-8 lg:px-8">
        <div className="flex shrink-0 items-center gap-2">
          <IconButton
            label="Open menu"
            className="text-ink lg:hidden"
            icon={<Menu className="h-5 w-5" />}
            onClick={() => setMobileNavOpen(true)}
          />
          <BrandLogo size="sm" className="min-w-0 shrink" />
        </div>

        <nav className="hidden min-w-0 flex-1 items-stretch gap-0.5 lg:flex" aria-label="Primary">
          {customerLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === ROUTES.HOME}
              className={({ isActive }) =>
                cn(
                  'relative inline-flex items-center px-3.5 text-[0.9375rem] font-medium tracking-wide transition-colors',
                  isActive
                    ? 'text-brand-700 dark:text-brand-300'
                    : 'text-ink/70 hover:text-ink dark:text-ink/75 dark:hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  <span
                    aria-hidden
                    className={cn(
                      'absolute inset-x-3.5 bottom-0 h-0.5 rounded-full transition-opacity',
                      isActive ? 'bg-brand-600 opacity-100 dark:bg-brand-400' : 'opacity-0',
                    )}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
          <IconButton
            label="Search"
            className="text-ink sm:inline-flex lg:hidden"
            icon={<Search className="h-5 w-5" />}
            onClick={() => navigate(ROUTES.SEARCH)}
          />

          <NavLink
            to={ROUTES.CART}
            className={({ isActive }) =>
              cn(
                'relative inline-flex h-10 items-center gap-2 rounded-lg px-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'text-brand-700 dark:text-brand-300'
                  : 'text-ink/80 hover:bg-brand-50 hover:text-ink dark:text-ink/80 dark:hover:bg-brand-900/50 dark:hover:text-ink',
              )
            }
            aria-label={`Cart, ${itemCount} items`}
          >
            <ShoppingBag className="h-5 w-5" aria-hidden />
            <span className="hidden sm:inline">Cart</span>
            <AnimatePresence>
              {itemCount > 0 ? (
                <motion.span
                  key={itemCount}
                  initial={reduceMotion ? false : { scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={springSoft}
                  className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white ring-2 ring-surface-elevated dark:bg-brand-500"
                >
                  {itemCount > 99 ? '99+' : itemCount}
                </motion.span>
              ) : null}
            </AnimatePresence>
          </NavLink>

          <span className="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden />

          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <Button size="sm" onClick={() => navigate(ROUTES.LOGIN)}>
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
