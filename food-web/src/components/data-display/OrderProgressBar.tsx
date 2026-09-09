import {
  CheckCircle2,
  ChefHat,
  CircleCheck,
  Clock,
  PackageCheck,
  Truck,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { OrderStatus } from '@/types'
import { cn } from '@/utils/cn'

const PROGRESS_STEPS: Array<{ status: OrderStatus; label: string; shortLabel: string; icon: LucideIcon }> = [
  { status: 'PENDING', label: 'Placed', shortLabel: 'Placed', icon: Clock },
  { status: 'CONFIRMED', label: 'Confirmed', shortLabel: 'Confirmed', icon: CheckCircle2 },
  { status: 'PREPARING', label: 'Preparing', shortLabel: 'Prep', icon: ChefHat },
  { status: 'READY', label: 'Ready', shortLabel: 'Ready', icon: PackageCheck },
  { status: 'OUT_FOR_DELIVERY', label: 'On the way', shortLabel: 'Transit', icon: Truck },
  { status: 'DELIVERED', label: 'Delivered', shortLabel: 'Done', icon: CircleCheck },
]

const STATUS_INDEX: Record<OrderStatus, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  PREPARING: 2,
  READY: 3,
  OUT_FOR_DELIVERY: 4,
  DELIVERED: 5,
  CANCELLED: -1,
  FAILED: -1,
}

interface OrderProgressBarProps {
  status: OrderStatus
  compact?: boolean
}

export function OrderProgressBar({ status, compact = false }: OrderProgressBarProps) {
  if (status === 'CANCELLED' || status === 'FAILED') {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-100">
        <XCircle className="h-4 w-4 shrink-0" />
        <span className="font-medium">
          {status === 'CANCELLED' ? 'This order was cancelled' : 'This order could not be completed'}
        </span>
      </div>
    )
  }

  const currentIndex = STATUS_INDEX[status]
  const currentStep = PROGRESS_STEPS[currentIndex]

  return (
    <div className={cn('w-full', compact ? 'pt-1' : 'pt-2')}>
      <div className="mb-2 flex items-center justify-between gap-2 md:hidden">
        <p className="text-xs font-semibold text-brand-700">
          Step {currentIndex + 1} of {PROGRESS_STEPS.length}
        </p>
        <p className="truncate text-xs text-ink-muted">{currentStep?.label}</p>
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-1 md:overflow-visible md:pb-0">
        <div className="relative flex min-w-[28rem] items-start justify-between md:min-w-0">
          {/* Track runs only between first and last step centers */}
          <div
            className="absolute top-[13px] h-0.5 bg-border md:top-[15px]"
            style={{
              left: `calc(100% / ${PROGRESS_STEPS.length * 2})`,
              right: `calc(100% / ${PROGRESS_STEPS.length * 2})`,
            }}
            aria-hidden
          />
          <div
            className="absolute top-[13px] h-0.5 bg-brand-500 transition-all duration-500 md:top-[15px]"
            style={{
              left: `calc(100% / ${PROGRESS_STEPS.length * 2})`,
              width: `calc(${currentIndex} / ${PROGRESS_STEPS.length} * 100%)`,
            }}
            aria-hidden
          />
          {PROGRESS_STEPS.map((step, index) => {
            const done = index <= currentIndex
            const active = index === currentIndex
            const Icon = step.icon
            return (
              <div
                key={step.status}
                className="relative z-10 flex min-w-[3.25rem] flex-1 flex-col items-center gap-1 md:min-w-0 md:gap-1.5"
              >
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors md:h-8 md:w-8',
                    done
                      ? 'border-brand-500 bg-brand-500 text-white shadow-sm shadow-brand-500/25'
                      : 'border-border bg-surface-elevated text-ink-muted',
                    active && done && 'ring-4 ring-brand-100',
                  )}
                >
                  <Icon className="h-3 w-3 md:h-3.5 md:w-3.5" />
                </span>
                {!compact ? (
                  <span
                    className={cn(
                      'max-w-[3.5rem] truncate text-center text-[9px] font-semibold leading-tight sm:max-w-none sm:text-[10px]',
                      done ? 'text-brand-700' : 'text-ink-muted',
                    )}
                  >
                    <span className="md:hidden">{step.shortLabel}</span>
                    <span className="hidden md:inline">{step.label}</span>
                  </span>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function getOrderStatusMessage(status: OrderStatus): string {
  const messages: Record<OrderStatus, string> = {
    PENDING: 'We received your order and will confirm it shortly.',
    CONFIRMED: 'Your order is confirmed and will be prepared soon.',
    PREPARING: 'Our kitchen is preparing your order.',
    READY: 'Your order is packed and ready for pickup or dispatch.',
    OUT_FOR_DELIVERY: 'Your order is on the way to you.',
    DELIVERED: 'Enjoy your meal — order delivered successfully.',
    CANCELLED: 'This order was cancelled.',
    FAILED: 'Something went wrong with this order.',
  }
  return messages[status]
}
