import type { OrderStatus } from '@/types'

const STATUS_CHART_COLORS: Record<OrderStatus, string> = {
  PENDING: '#F59E0B',
  CONFIRMED: '#900000',
  PREPARING: '#6366F1',
  READY: '#22C55E',
  OUT_FOR_DELIVERY: '#06B6D4',
  DELIVERED: '#16A34A',
  CANCELLED: '#EF4444',
  FAILED: '#DC2626',
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  READY: 'Ready',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  FAILED: 'Failed',
}

export function orderStatusChartColor(status: string): string {
  return STATUS_CHART_COLORS[status as OrderStatus] ?? '#94A3B8'
}

export function orderStatusLabel(status: string): string {
  return STATUS_LABELS[status as OrderStatus] ?? status.replace(/_/g, ' ')
}
