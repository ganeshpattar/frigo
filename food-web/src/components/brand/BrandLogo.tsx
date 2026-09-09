import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants'
import { cn } from '@/utils/cn'
import logo from '@/assets/Tirumal_Foods.png'

type Size = 'sm' | 'md' | 'lg' | 'xl'
type Variant = 'default' | 'onDark'

/** Website-friendly logo sizes — wide wordmark, constrained height + max-width */
const sizeClass: Record<Size, string> = {
  sm: 'h-9 w-auto max-w-[9.5rem] sm:h-10 sm:max-w-[11rem]',
  md: 'h-11 w-auto max-w-[13rem]',
  lg: 'h-12 w-auto max-w-[15rem] sm:h-14 sm:max-w-[17rem]',
  xl: 'h-14 w-auto max-w-[16rem] sm:h-16 sm:max-w-[20rem] lg:h-[4.5rem] lg:max-w-[22rem]',
}

interface BrandLogoProps {
  size?: Size
  /** onDark = hero/footer (no extra shadow). default = light chrome (soft shadow for contrast). */
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
      alt="Tirumal Foods"
      className={cn(
        'block bg-transparent object-contain object-left',
        sizeClass[size],
        variant === 'default' &&
          'drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.28))]',
        imgClassName,
      )}
    />
  )

  if (to === null) {
    return <div className={cn('inline-flex max-w-full items-center bg-transparent', className)}>{image}</div>
  }

  return (
    <Link
      to={to}
      className={cn('inline-flex max-w-full items-center bg-transparent', className)}
      aria-label="Tirumal Foods home"
    >
      {image}
    </Link>
  )
}
