import {
  LayoutDashboard,
  Users,
  Shield,
  Tags,
  UtensilsCrossed,
  DollarSign,
  Package,
  ClipboardList,
  CreditCard,
  Bell,
  ScrollText,
  UserCircle,
} from 'lucide-react'
import { ROUTES, PERMISSIONS } from '@/constants'
import { useAuth } from '@/context'
import { type SidebarItem } from '@/components/navigation/Sidebar'
import { AppShellLayout } from '@/layouts/AppShellLayout'
import { hasPermission } from '@/utils/rbac'

export function AdminLayout() {
  const { user } = useAuth()

  const allItems: Array<SidebarItem & { permission?: string }> = [
    { to: ROUTES.ADMIN, label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, permission: PERMISSIONS.DASHBOARD_VIEW },
    { to: ROUTES.ADMIN_USERS, label: 'Users', icon: <Users className="h-4 w-4" />, permission: PERMISSIONS.USERS_READ },
    { to: ROUTES.ADMIN_ROLES, label: 'Roles', icon: <Shield className="h-4 w-4" />, permission: PERMISSIONS.ROLES_MANAGE },
    { to: ROUTES.ADMIN_CUSTOMERS, label: 'Customers', icon: <UserCircle className="h-4 w-4" />, permission: PERMISSIONS.CUSTOMERS_READ },
    { to: ROUTES.ADMIN_CATEGORIES, label: 'Categories', icon: <Tags className="h-4 w-4" />, permission: PERMISSIONS.CATALOG_WRITE },
    { to: ROUTES.ADMIN_PRODUCTS, label: 'Products', icon: <UtensilsCrossed className="h-4 w-4" />, permission: PERMISSIONS.CATALOG_WRITE },
    { to: ROUTES.ADMIN_PRICING, label: 'Pricing', icon: <DollarSign className="h-4 w-4" />, permission: PERMISSIONS.PRICING_MANAGE },
    { to: ROUTES.ADMIN_INVENTORY, label: 'Inventory', icon: <Package className="h-4 w-4" />, permission: PERMISSIONS.INVENTORY_READ },
    { to: ROUTES.ADMIN_ORDERS, label: 'Orders', icon: <ClipboardList className="h-4 w-4" />, permission: PERMISSIONS.ORDERS_READ },
    { to: ROUTES.ADMIN_PAYMENTS, label: 'Payments', icon: <CreditCard className="h-4 w-4" />, permission: PERMISSIONS.PAYMENTS_READ },
    { to: ROUTES.ADMIN_NOTIFICATIONS, label: 'Notifications', icon: <Bell className="h-4 w-4" />, permission: PERMISSIONS.NOTIFICATIONS_READ },
    { to: ROUTES.ADMIN_AUDIT, label: 'Audit', icon: <ScrollText className="h-4 w-4" />, permission: PERMISSIONS.AUDIT_READ },
  ]

  const items = allItems.filter(
    (item) => !item.permission || hasPermission(user, item.permission),
  )

  return (
    <AppShellLayout
      brandLabel="Admin"
      homeRoute={ROUTES.ADMIN}
      drawerTitle="Administration"
      sidebarAriaLabel="Admin sidebar"
      navItems={items}
      userFallback="Admin user"
    />
  )
}
