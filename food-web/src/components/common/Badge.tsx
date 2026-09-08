import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'brand' | 'accent'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
  uppercase?: boolean
}

const styles: Record<BadgeVariant, string> = {
  neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-200',
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  warning: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  brand: 'bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-200',
  accent: 'bg-brand-50 text-brand-700 border border-brand-100',
}

export function Badge({ children, variant = 'neutral', className, uppercase = false }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        uppercase && 'uppercase tracking-wide',
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
