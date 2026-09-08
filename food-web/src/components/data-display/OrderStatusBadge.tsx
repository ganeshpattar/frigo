import type { OrderStatus } from '@/types'
import { Badge } from '@/components/common/Badge'

const STATUS_META: Record<
  OrderStatus,
  { label: string; variant: 'neutral' | 'success' | 'warning' | 'danger' | 'brand' }
> = {
  PENDING: { label: 'Pending', variant: 'warning' },
  CONFIRMED: { label: 'Confirmed', variant: 'brand' },
  PREPARING: { label: 'Preparing', variant: 'brand' },
  READY: { label: 'Ready', variant: 'success' },
  OUT_FOR_DELIVERY: { label: 'Out for delivery', variant: 'brand' },
  DELIVERED: { label: 'Delivered', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'danger' },
  FAILED: { label: 'Failed', variant: 'danger' },
}

interface OrderStatusBadgeProps {
  status: OrderStatus
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const meta = STATUS_META[status]
  return <Badge variant={meta.variant}>{meta.label}</Badge>
}
