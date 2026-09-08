import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-500 text-white hover:bg-brand-600 shadow-sm shadow-brand-500/25 disabled:bg-brand-500/50',
  secondary:
    'bg-surface-elevated text-ink border border-border hover:bg-brand-50 dark:hover:bg-brand-900/40',
  ghost: 'bg-transparent text-ink hover:bg-brand-50 dark:hover:bg-brand-900/30',
  danger: 'bg-danger text-white hover:bg-red-600',
  outline:
    'border border-brand-500 text-brand-600 hover:bg-brand-50 dark:text-brand-300 dark:border-brand-400 dark:hover:bg-brand-900/40',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-base gap-1.5 rounded-lg',
  md: 'h-11 px-4 text-base gap-2 rounded-xl',
  lg: 'h-12 px-5 text-base gap-2 rounded-xl',
}

export function Button({
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  fullWidth,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  )
}
