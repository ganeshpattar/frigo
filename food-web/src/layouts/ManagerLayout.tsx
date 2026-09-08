import { LayoutDashboard, ClipboardList, Users, Package, Shield } from 'lucide-react'
import { ROUTES } from '@/constants'
import { useAuth } from '@/context'
import { AppShellLayout } from '@/layouts/AppShellLayout'

export function ManagerLayout() {
  const { hasRole } = useAuth()

  const items = [
    { to: ROUTES.MANAGER, label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { to: ROUTES.MANAGER_ORDERS, label: 'Orders', icon: <ClipboardList className="h-4 w-4" /> },
    { to: ROUTES.MANAGER_CUSTOMERS, label: 'Customers', icon: <Users className="h-4 w-4" /> },
    { to: ROUTES.MANAGER_INVENTORY, label: 'Inventory', icon: <Package className="h-4 w-4" /> },
  ]

  const profileLinks = hasRole('ADMIN')
    ? [{ to: ROUTES.ADMIN, label: 'Admin portal', icon: <Shield className="h-4 w-4 shrink-0" aria-hidden /> }]
    : []

  return (
    <AppShellLayout
      brandLabel="Manager"
      homeRoute={ROUTES.MANAGER}
      drawerTitle="Operations"
      sidebarAriaLabel="Manager sidebar"
      navItems={items}
      profileLinks={profileLinks}
      userFallback="Manager user"
    />
  )
}
