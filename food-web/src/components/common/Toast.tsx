import { X } from 'lucide-react'
import { useUI } from '@/context'
import { cn } from '@/utils/cn'
import { IconButton } from './IconButton'

export function ToastViewport() {
  const { toasts, dismissToast } = useUI()

  if (toasts.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed bottom-20 right-4 z-[60] flex w-[min(100%-2rem,22rem)] flex-col gap-2 sm:bottom-4"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-surface-elevated p-3 shadow-lg',
            toast.variant === 'success' && 'border-emerald-200',
            toast.variant === 'error' && 'border-red-200',
          )}
          role="status"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">{toast.title}</p>
            {toast.description ? (
              <p className="mt-0.5 text-xs text-ink-muted">{toast.description}</p>
            ) : null}
          </div>
          <IconButton
            label="Dismiss notification"
            icon={<X className="h-4 w-4" />}
            onClick={() => dismissToast(toast.id)}
          />
        </div>
      ))}
    </div>
  )
}
