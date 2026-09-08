import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { IconButton } from './IconButton'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  side?: 'left' | 'right'
}

export function Drawer({ open, onClose, title, children, footer, side = 'right' }: DrawerProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 transition-visibility',
        open ? 'visible' : 'invisible pointer-events-none',
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close drawer"
        className={cn(
          'absolute inset-0 bg-ink/40 transition-opacity',
          open ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'absolute top-0 flex h-full w-[min(100%,22rem)] flex-col border-border bg-surface-elevated shadow-xl transition-transform duration-300',
          side === 'right' ? 'right-0 border-l' : 'left-0 border-r',
          open
            ? 'translate-x-0'
            : side === 'right'
              ? 'translate-x-full'
              : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-display text-base font-semibold">{title}</h2>
          <IconButton label="Close" icon={<X className="h-5 w-5" />} onClick={onClose} />
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-4">{children}</div>
          {footer ? <div className="shrink-0">{footer}</div> : null}
        </div>
      </aside>
    </div>
  )
}
