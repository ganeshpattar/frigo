import type { ReactNode } from 'react'
import { AuthProvider, CartProvider, UIProvider } from '@/context'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <UIProvider>
      <AuthProvider>
        <CartProvider>{children}</CartProvider>
      </AuthProvider>
    </UIProvider>
  )
}
