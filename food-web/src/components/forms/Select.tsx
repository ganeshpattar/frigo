import { forwardRef, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid, children, id, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        id={id}
        aria-invalid={invalid || undefined}
        className={cn(
          'h-11 w-full appearance-none rounded-xl border border-border bg-surface-elevated px-3 pr-10 text-base text-ink',
          'hover:border-brand-300 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
          invalid && 'border-danger focus:border-danger focus:ring-danger/20',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
        aria-hidden
      />
    </div>
  ),
)

Select.displayName = 'Select'
