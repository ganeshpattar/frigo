import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, className, id, ...props }, ref) => (
    <label htmlFor={id} className={cn('inline-flex items-center gap-2 text-base text-ink', className)}>
      <input
        ref={ref}
        id={id}
        type="radio"
        className="h-4 w-4 border-border text-brand-700 focus:ring-brand-600"
        {...props}
      />
      <span>{label}</span>
    </label>
  ),
)

Radio.displayName = 'Radio'
