import { formatCurrency } from '@/utils/format'
import { cn } from '@/utils/cn'

interface PriceDisplayProps {
  amount: number
  currency?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'text-sm',
  md: 'text-base font-semibold',
  lg: 'text-2xl font-bold',
}

export function PriceDisplay({
  amount,
  currency = 'INR',
  className,
  size = 'md',
}: PriceDisplayProps) {
  return (
    <span className={cn('tabular-nums text-ink', sizes[size], className)}>
      {formatCurrency(amount, currency)}
    </span>
  )
}
