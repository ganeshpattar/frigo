import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { AuthProvider } from '@/context/AuthContext'
import { UIProvider } from '@/context/UIContext'

function renderProtected() {
  return render(
    <UIProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={['/orders']}>
          <Routes>
            <Route path="/auth/login" element={<div>Login screen</div>} />
            <Route element={<ProtectedRoute />}>
              <Route path="/orders" element={<div>Orders screen</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </UIProvider>,
  )
}

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to login', async () => {
    renderProtected()
    expect(await screen.findByText('Login screen')).toBeInTheDocument()
  })
})
