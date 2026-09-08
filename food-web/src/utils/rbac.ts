import type { AuthUser, PermissionCode, RoleCode } from '@/types'

export function hasRole(user: AuthUser | null | undefined, role: RoleCode): boolean {
  return Boolean(user?.roles.includes(role))
}

export function hasPermission(
  user: AuthUser | null | undefined,
  permission: PermissionCode,
): boolean {
  if (!user) return false
  // Admins have full access across the admin console
  if (user.roles.includes('ADMIN')) return true
  return user.permissions.includes(permission)
}

export function hasAnyPermission(
  user: AuthUser | null | undefined,
  permissions: PermissionCode[],
): boolean {
  if (!user) return false
  if (user.roles.includes('ADMIN')) return true
  return permissions.some((p) => user.permissions.includes(p))
}

export function hasAllPermissions(
  user: AuthUser | null | undefined,
  permissions: PermissionCode[],
): boolean {
  if (!user) return false
  if (user.roles.includes('ADMIN')) return true
  return permissions.every((p) => user.permissions.includes(p))
}

export function isStaff(user: AuthUser | null | undefined): boolean {
  return hasRole(user, 'ADMIN') || hasRole(user, 'MANAGER')
}
