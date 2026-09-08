import type { ReactNode } from 'react'
import type { PermissionCode } from '@/types'
import { useAuth } from '@/context'
import { hasAllPermissions, hasAnyPermission } from '@/utils/rbac'

interface PermissionGuardProps {
  children: ReactNode
  permission?: PermissionCode
  anyOf?: PermissionCode[]
  allOf?: PermissionCode[]
  fallback?: ReactNode
}

export function PermissionGuard({
  children,
  permission,
  anyOf,
  allOf,
  fallback = null,
}: PermissionGuardProps) {
  const { user } = useAuth()

  let allowed = true
  if (permission) allowed = hasAnyPermission(user, [permission])
  if (anyOf) allowed = allowed && hasAnyPermission(user, anyOf)
  if (allOf) allowed = allowed && hasAllPermissions(user, allOf)

  if (!allowed) return <>{fallback}</>
  return <>{children}</>
}
