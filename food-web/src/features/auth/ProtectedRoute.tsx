import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { RoleCode } from '@/types'
import { ROUTES } from '@/constants'
import { useAuth } from '@/context'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

interface ProtectedRouteProps {
  roles?: RoleCode[]
  redirectTo?: string
}

export function ProtectedRoute({ roles, redirectTo = ROUTES.LOGIN }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner label="Checking session" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace state={{ from: location.pathname }} />
  }

  if (roles && roles.length > 0) {
    const allowed = roles.some((role) => user?.roles.includes(role))
    if (!allowed) {
      return <Navigate to={ROUTES.HOME} replace />
    }
  }

  return <Outlet />
}
