import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Modal } from './Modal'
import { Button } from './Button'

type AlertVariant = 'info' | 'success' | 'error' | 'warning'

interface AlertModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  variant?: AlertVariant
  confirmLabel?: string
}

const icons: Record<AlertVariant, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertCircle,
}

const iconStyles: Record<AlertVariant, string> = {
  info: 'text-brand-600',
  success: 'text-emerald-600',
  error: 'text-danger',
  warning: 'text-warning',
}

export function AlertModal({
  open,
  onClose,
  title,
  description,
  variant = 'info',
  confirmLabel = 'OK',
}: AlertModalProps) {
  const Icon = icons[variant]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <Button type="button" onClick={onClose}>
          {confirmLabel}
        </Button>
      }
    >
      <div className="flex gap-3">
        <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', iconStyles[variant])} aria-hidden />
        <div className="min-w-0">
          {description ? <p className="text-sm text-ink-muted">{description}</p> : null}
        </div>
      </div>
    </Modal>
  )
}
