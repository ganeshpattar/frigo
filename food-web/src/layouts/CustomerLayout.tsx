import { Outlet } from 'react-router-dom'
import { Header } from '@/components/navigation/Header'
import { Footer } from '@/components/navigation/Footer'
import { MobileNavigation } from '@/components/navigation/MobileNavigation'
import { ToastViewport } from '@/components/common/Toast'

export function CustomerLayout() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-surface">
      <Header />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-20 md:pb-0">
        <main>
          <Outlet />
        </main>
        <Footer />
      </div>
      <MobileNavigation />
      <ToastViewport />
    </div>
  )
}
