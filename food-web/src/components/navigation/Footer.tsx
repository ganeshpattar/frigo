import { Link } from 'react-router-dom'
import { Mail, MapPin, Phone } from 'lucide-react'
import { ROUTES } from '@/constants'
import { BrandLogo } from '@/components/brand/BrandLogo'

const COMPANY_ADDRESS = 'Frigo Foods, Gokul Road, Hubballi, Karnataka 580030, India'
const SUPPORT_EMAIL = 'frigosupport@gmail.com'
const SUPPORT_PHONE = '8904633113'

export function Footer() {
  return (
    <footer className="border-t border-border bg-brand-800 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] sm:px-6 lg:py-14">
        <div>
          <BrandLogo size="md" variant="onDark" />
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
            Homestyle North Karnataka pickles, chatni powders, millet rotti, and festive holige —
            ordered fresh for your kitchen.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/90">Contact</h2>
          <ul className="mt-4 space-y-3 text-sm text-white/75">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" aria-hidden />
              <span>{COMPANY_ADDRESS}</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-brand-300" aria-hidden />
              <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-white">
                {SUPPORT_EMAIL}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-brand-300" aria-hidden />
              <a href={`tel:+91${SUPPORT_PHONE}`} className="hover:text-white">
                +91 {SUPPORT_PHONE}
              </a>
            </li>
          </ul>
        </div>

        <nav
          className="grid grid-cols-2 gap-3 text-sm font-medium text-white/75 sm:justify-items-end"
          aria-label="Footer"
        >
          <Link to={ROUTES.PRODUCTS} className="hover:text-white">
            Full menu
          </Link>
          <Link to={ROUTES.SEARCH} className="hover:text-white">
            Search
          </Link>
          <Link to={ROUTES.CART} className="hover:text-white">
            Cart
          </Link>
          <Link to={ROUTES.ORDERS} className="hover:text-white">
            Orders
          </Link>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-white/50 sm:px-6">
          © {new Date().getFullYear()} Frigo. Browse as a guest — secure checkout when you are ready.
        </p>
      </div>
    </footer>
  )
}
