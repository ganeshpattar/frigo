import { Check } from 'lucide-react'
import type { OrderTimelineEvent } from '@/types'
import { cn } from '@/utils/cn'
import { formatDateTime } from '@/utils/format'

interface OrderTimelineProps {
  events: OrderTimelineEvent[]
}

export function OrderTimeline({ events }: OrderTimelineProps) {
  return (
    <ol className="space-y-4">
      {events.map((event, index) => (
        <li key={`${event.status}-${index}`} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border text-xs',
                event.completed
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-border bg-surface-elevated text-ink-muted',
              )}
              aria-hidden
            >
              {event.completed ? <Check className="h-4 w-4" /> : index + 1}
            </span>
            {index < events.length - 1 ? (
              <span className="mt-1 w-px flex-1 bg-border" aria-hidden />
            ) : null}
          </div>
          <div className="pb-4">
            <p className="text-sm font-semibold text-ink">{event.label}</p>
            {event.timestamp ? (
              <p className="text-xs text-ink-muted">{formatDateTime(event.timestamp)}</p>
            ) : (
              <p className="text-xs text-ink-muted">Pending</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
