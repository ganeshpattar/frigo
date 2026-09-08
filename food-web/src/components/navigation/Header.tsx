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
          ? 'border-border/80 bg-surface-elevated/95 shadow-[0_8px_30px_-18px_rgb(11_37_69/0.35)] backdrop-blur-xl'
          : 'border-white/30 bg-surface-elevated/75 backdrop-blur-md',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <IconButton
            label="Open menu"
            className="lg:hidden"
            icon={<Menu className="h-5 w-5" />}
            onClick={() => setMobileNavOpen(true)}
          />
          <BrandLogo size="sm" />
        </div>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {customerLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'rounded-full px-3.5 py-2 text-sm font-semibold text-ink-muted transition-colors hover:text-ink',
                  isActive && 'bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <IconButton
            label="Search"
            className="hidden sm:inline-flex lg:hidden"
            icon={<Search className="h-5 w-5" />}
            onClick={() => navigate(ROUTES.SEARCH)}
          />
          <NavLink
            to={ROUTES.CART}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-brand-50 dark:hover:bg-brand-900/40"
            aria-label={`Cart, ${itemCount} items`}
          >
            <ShoppingBag className="h-5 w-5" />
            <AnimatePresence>
              {itemCount > 0 ? (
                <motion.span
                  key={itemCount}
                  initial={reduceMotion ? false : { scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={springSoft}
                  className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white"
                >
                  {itemCount > 99 ? '99+' : itemCount}
                </motion.span>
              ) : null}
            </AnimatePresence>
          </NavLink>
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <Button size="sm" variant="secondary" onClick={() => navigate(ROUTES.LOGIN)}>
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
