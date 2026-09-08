import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { IconButton } from './IconButton'

interface AlertProps {
  title: string
  description?: string
  variant?: 'info' | 'success' | 'error' | 'warning'
  onClose?: () => void
  className?: string
}

const icons = {
  info: Info,
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertCircle,
}

const styles = {
  info: 'border-brand-200 bg-brand-50 text-brand-900 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-100',
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-100',
  error:
    'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-900/30 dark:text-red-100',
  warning:
    'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-100',
}

export function Alert({ title, description, variant = 'info', onClose, className }: AlertProps) {
  const Icon = icons[variant]
  return (
    <div
      role="alert"
      className={cn('flex gap-3 rounded-xl border p-3', styles[variant], className)}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        {description ? <p className="mt-0.5 text-sm opacity-90">{description}</p> : null}
      </div>
      {onClose ? <IconButton label="Dismiss" icon={<X className="h-4 w-4" />} onClick={onClose} /> : null}
    </div>
  )
}
