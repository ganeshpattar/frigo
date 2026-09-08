import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginPage } from '@/pages/public/LoginPage'
import { AppProviders } from '@/app/providers/AppProviders'

function renderLogin() {
  return render(
    <AppProviders>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </AppProviders>,
  )
}

describe('LoginPage', () => {
  it('shows validation errors for empty submit', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText(/email is required|valid email/i)).toBeInTheDocument()
  })
})
