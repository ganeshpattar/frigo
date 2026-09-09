import { Outlet } from 'react-router-dom'
import { Header } from '@/components/navigation/Header'
import { Footer } from '@/components/navigation/Footer'
import { MobileNavigation } from '@/components/navigation/MobileNavigation'
import { ToastViewport } from '@/components/common/Toast'
import siteBg from '@/assets/site-bg.png'

export function CustomerLayout() {
  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <img src={siteBg} alt="" className="h-full w-full scale-105 object-cover" />
        <div className="absolute inset-0 bg-site-wash" />
      </div>

      <Header />
      <div className="relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-20 md:pb-0">
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
