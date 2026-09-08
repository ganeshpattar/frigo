import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants'
import { cn } from '@/utils/cn'
import logo from '@/assets/Frigo_Logo.png'

type Size = 'sm' | 'md' | 'lg' | 'xl'
type Variant = 'default' | 'onDark'

const heights: Record<Size, string> = {
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-12',
  xl: 'h-14 sm:h-16',
}

interface BrandLogoProps {
  size?: Size
  /** Use on dark backgrounds — keeps logo colors on a light plate */
  variant?: Variant
  to?: string | null
  className?: string
  imgClassName?: string
}

export function BrandLogo({
  size = 'md',
  variant = 'default',
  to = ROUTES.HOME,
  className,
  imgClassName,
}: BrandLogoProps) {
  const image = (
    <img
      src={logo}
      alt="Frigo"
      className={cn(
        'w-auto max-w-full object-contain object-left',
        heights[size],
        imgClassName,
      )}
    />
  )

  const content =
    variant === 'onDark' ? (
      <span
        className={cn(
          'inline-flex items-center rounded-2xl bg-white px-3 py-2 shadow-sm shadow-black/20',
          size === 'xl' && 'rounded-3xl px-4 py-3',
          size === 'lg' && 'px-3.5 py-2.5',
        )}
      >
        {image}
      </span>
    ) : (
      image
    )

  if (to === null) {
    return <div className={cn('inline-flex items-center', className)}>{content}</div>
  }

  return (
    <Link
      to={to}
      className={cn('inline-flex items-center', className)}
      aria-label="Frigo home"
    >
      {content}
    </Link>
  )
}
