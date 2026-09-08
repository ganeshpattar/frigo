import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Card } from '@/components/common/Card'
import { AlertModal } from '@/components/common/AlertModal'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Select } from '@/components/forms/Select'
import { AdminPageShell } from '@/components/admin/AdminPageShell'
import { ROUTES } from '@/constants'
import { ordersApi } from '@/services/api'
import type { Order, OrderStatus, OrderStatusHistoryEntry } from '@/types'
import { getUserFriendlyMessage } from '@/utils/apiError'
import { formatDateTime, formatInr } from '@/utils/format'

const STATUS_OPTIONS: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'FAILED',
]

function statusVariant(status: OrderStatus) {
  if (status === 'DELIVERED') return 'success' as const
  if (status === 'CANCELLED' || status === 'FAILED') return 'danger' as const
  if (status === 'PENDING') return 'warning' as const
  return 'brand' as const
}

function historyLabel(entry: OrderStatusHistoryEntry) {
  if (!entry.fromStatus) return `Order placed — ${entry.toStatus}`
  return `${entry.fromStatus} → ${entry.toStatus}`
}

export function ManagerOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [history, setHistory] = useState<OrderStatusHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!orderId) return
    setLoading(true)
    setError(null)
    try {
      const [orderData, historyData] = await Promise.all([
        ordersApi.getById(orderId),
        ordersApi.getHistory(orderId),
      ])
      setOrder(orderData)
      setHistory(historyData)
    } catch (err) {
      setError(getUserFriendlyMessage(err))
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    void load()
  }, [load])

  const onStatusChange = async (status: OrderStatus) => {
    if (!orderId) return
    setUpdating(true)
    setError(null)
    try {
      const updated = await ordersApi.updateStatus(orderId, status)
      setOrder(updated)
      const historyData = await ordersApi.getHistory(orderId)
      setHistory(historyData)
    } catch (err) {
      setError(getUserFriendlyMessage(err))
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!order) {
    return (
      <AdminPageShell title="Order not found">
        <Link to={ROUTES.MANAGER_ORDERS} className="text-sm font-semibold text-brand-600">
          Back to orders
        </Link>
      </AdminPageShell>
    )
  }

  return (
    <AdminPageShell
      title={order.orderNumber}
      description={`Placed ${formatDateTime(order.createdAt)}`}
      actions={
        <Link
          to={ROUTES.MANAGER_ORDERS}
          className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" />
          All orders
        </Link>
      }
    >
      <AlertModal
        open={Boolean(error)}
        onClose={() => setError(null)}
        variant="error"
        title="Order error"
        description={error ?? undefined}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-ink">Order details</h2>
            <Badge variant={statusVariant(order.status)} uppercase>{order.status}</Badge>
          </div>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-ink-muted">Customer</dt>
              <dd className="font-medium">{order.customerName ?? '—'}</dd>
              <dd className="text-ink-muted">{order.customerEmail ?? ''}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Items</dt>
              <dd className="mt-1 space-y-1">
                {order.items.map((item) => (
                  <div key={item.id}>
                    {item.quantity}× {item.productName} — {formatInr(item.lineTotal)}
                  </div>
                ))}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Total</dt>
              <dd className="text-lg font-semibold">{formatInr(order.total)}</dd>
            </div>
          </dl>
          <div className="mt-5">
            <label className="mb-1 block text-sm font-medium text-ink">Update status</label>
            <Select
              className="max-w-xs"
              value={order.status}
              disabled={updating}
              onChange={(e) => void onStatusChange(e.target.value as OrderStatus)}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </Select>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-semibold text-ink">Status history</h2>
          {history.length === 0 ? (
            <p className="text-sm text-ink-muted">No status changes recorded yet.</p>
          ) : (
            <ol className="relative space-y-4 border-l border-border pl-5">
              {history.map((entry) => (
                <li key={entry.id} className="relative">
                  <span className="absolute -left-[1.35rem] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-500 ring-4 ring-surface" />
                  <p className="font-medium text-ink">{historyLabel(entry)}</p>
                  <p className="text-sm text-ink-muted">{formatDateTime(entry.changedAt)}</p>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </AdminPageShell>
  )
}
