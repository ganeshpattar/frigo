import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'min-h-28 w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-base text-ink',
        'hover:border-brand-300 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
        invalid && 'border-danger',
        className,
      )}
      {...props}
    />
  ),
)

Textarea.displayName = 'Textarea'
