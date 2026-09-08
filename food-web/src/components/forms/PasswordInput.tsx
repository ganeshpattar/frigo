import { forwardRef, useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/utils/cn'
import { IconButton } from '@/components/common/IconButton'

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  invalid?: boolean
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, invalid, id, ...props }, ref) => {
    const [visible, setVisible] = useState(false)
    return (
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={visible ? 'text' : 'password'}
          aria-invalid={invalid || undefined}
          className={cn(
            'h-11 w-full rounded-xl border border-border bg-surface-elevated px-3 pr-11 text-base text-ink placeholder:text-ink-muted/70',
            'hover:border-brand-300 focus:border-brand-600 focus:outline-none',
            invalid && 'border-danger focus:border-danger',
            className,
          )}
          {...props}
        />
        <div className="absolute inset-y-0 right-1 flex items-center">
          <IconButton
            label={visible ? 'Hide password' : 'Show password'}
            icon={visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            onClick={() => setVisible((v) => !v)}
          />
        </div>
      </div>
    )
  },
)

PasswordInput.displayName = 'PasswordInput'
