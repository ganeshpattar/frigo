import type { RoleCode } from '@/types'

export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  CUSTOMER: 'CUSTOMER',
} as const satisfies Record<RoleCode, RoleCode>

export const PERMISSIONS = {
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  ROLES_MANAGE: 'roles:manage',
  CATALOG_READ: 'catalog:read',
  CATALOG_WRITE: 'catalog:write',
  PRICING_MANAGE: 'pricing:manage',
  INVENTORY_READ: 'inventory:read',
  INVENTORY_WRITE: 'inventory:write',
  ORDERS_READ: 'orders:read',
  ORDERS_MANAGE: 'orders:manage',
  CUSTOMERS_READ: 'customers:read',
  PAYMENTS_READ: 'payments:read',
  NOTIFICATIONS_READ: 'notifications:read',
  AUDIT_READ: 'audit:read',
  DASHBOARD_VIEW: 'dashboard:view',
} as const

export type AppPermission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
