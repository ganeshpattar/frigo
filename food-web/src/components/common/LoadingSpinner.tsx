import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
}

const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }

export function LoadingSpinner({ size = 'md', label = 'Loading', className }: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex flex-col items-center justify-center gap-2 text-ink-muted', className)}
    >
      <Loader2 className={cn('animate-spin text-brand-600', sizes[size])} aria-hidden />
      <span className="sr-only">{label}</span>
    </div>
  )
}
