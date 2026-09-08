import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  icon: ReactNode
  variant?: 'ghost' | 'filled'
}

export function IconButton({
  label,
  icon,
  variant = 'ghost',
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
        variant === 'ghost' && 'hover:bg-brand-50 dark:hover:bg-brand-900/40',
        variant === 'filled' && 'bg-surface-elevated border border-border shadow-sm',
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  )
}
