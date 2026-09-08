import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, id, ...props }, ref) => (
    <input
      ref={ref}
      id={id}
      aria-invalid={invalid || undefined}
      className={cn(
        'h-11 w-full rounded-xl border border-border bg-surface-elevated px-3 text-base text-ink placeholder:text-ink-muted/70 transition-colors',
        'hover:border-brand-300 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
        invalid && 'border-danger focus:border-danger',
        className,
      )}
      {...props}
    />
  ),
)

Input.displayName = 'Input'
