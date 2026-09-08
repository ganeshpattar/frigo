import { render, screen } from '@testing-library/react'
import { PermissionGuard } from '@/features/auth/PermissionGuard'
import { AuthProvider } from '@/context/AuthContext'
import { UIProvider } from '@/context/UIContext'

describe('PermissionGuard', () => {
  it('hides content when user lacks permission', () => {
    render(
      <UIProvider>
        <AuthProvider>
          <PermissionGuard permission="users:write" fallback={<span>Hidden</span>}>
            <span>Secret</span>
          </PermissionGuard>
        </AuthProvider>
      </UIProvider>,
    )
    expect(screen.getByText('Hidden')).toBeInTheDocument()
    expect(screen.queryByText('Secret')).not.toBeInTheDocument()
  })
})
