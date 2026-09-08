import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/common/Badge'
import { AlertModal } from '@/components/common/AlertModal'
import { AdminPageShell } from '@/components/admin/AdminPageShell'
import { TableToolbar } from '@/components/admin/TableToolbar'
import { UserAvatar } from '@/components/admin/UserAvatar'
import { DataTable } from '@/components/data-display/DataTable'
import { Select } from '@/components/forms/Select'
import { managerOrderPath } from '@/constants'
import { ordersApi } from '@/services/api'
import type { Order, OrderStatus } from '@/types'
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

export function ManagerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const load = useCallback(async (nextPage: number) => {
    setLoading(true)
    setError(null)
    try {
      const result = await ordersApi.list(nextPage, 20)
      setOrders(result.data)
      setPage(result.page)
      setTotalPages(result.totalPages)
      setTotalItems(result.totalItems)
    } catch (err) {
      setError(getUserFriendlyMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(1)
  }, [load])

  const onStatusChange = async (orderId: string, status: OrderStatus) => {
    setUpdatingId(orderId)
    setError(null)
    try {
      await ordersApi.updateStatus(orderId, status)
      await load(page)
    } catch (err) {
      setError(getUserFriendlyMessage(err))
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders.filter((order) => {
      const matchesSearch =
        !q ||
        order.orderNumber.toLowerCase().includes(q) ||
        (order.customerName ?? '').toLowerCase().includes(q) ||
        (order.customerEmail ?? '').toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [orders, search, statusFilter])

  const columns = useMemo(
    () => [
      {
        key: 'order',
        header: 'Order',
        render: (order: Order) => <span className="font-medium text-ink">{order.orderNumber}</span>,
      },
      {
        key: 'customer',
        header: 'Customer',
        render: (order: Order) => (
          <div className="flex items-center gap-3">
            <UserAvatar name={order.customerName ?? '?'} />
            <div>
              <p className="font-medium text-ink">{order.customerName ?? '—'}</p>
              <p className="text-xs text-ink-muted">{order.customerEmail ?? ''}</p>
            </div>
          </div>
        ),
      },
      {
        key: 'items',
        header: 'Items',
        render: (order: Order) => (
          <div className="max-w-xs text-sm text-ink-muted">
            {order.items?.map((item) => (
              <div key={item.id}>{item.quantity}× {item.productName}</div>
            ))}
          </div>
        ),
      },
      {
        key: 'total',
        header: 'Total',
        render: (order: Order) => <span className="font-medium">{formatInr(order.total)}</span>,
      },
      {
        key: 'status',
        header: 'Status',
        render: (order: Order) => (
          <div className="flex min-w-[10rem] flex-col gap-2">
            <Badge variant={statusVariant(order.status)} uppercase>{order.status}</Badge>
            <Select
              className="h-9 text-sm"
              value={order.status}
              disabled={updatingId === order.id}
              onChange={(e) => void onStatusChange(order.id, e.target.value as OrderStatus)}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </Select>
          </div>
        ),
      },
      {
        key: 'created',
        header: 'Created',
        render: (order: Order) => formatDateTime(order.createdAt),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (order: Order) => (
          <Link
            to={managerOrderPath(order.id)}
            className="text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            View history
          </Link>
        ),
      },
    ],
    [page, updatingId],
  )

  return (
    <AdminPageShell
      title="Orders"
      description={`Manage order status and view history. Total: ${totalItems}`}
    >
      <TableToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by order number or customer…"
        filters={[
          {
            id: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: 'ALL', label: 'All statuses' },
              ...STATUS_OPTIONS.map((s) => ({ value: s, label: s })),
            ],
          },
        ]}
      />

      <AlertModal
        open={Boolean(error)}
        onClose={() => setError(null)}
        variant="error"
        title="Orders error"
        description={error ?? undefined}
      />

      <DataTable
        columns={columns}
        data={filteredOrders}
        rowKey={(o) => o.id}
        loading={loading}
        emptyMessage="No orders yet."
      />

      {totalPages > 1 ? (
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1 || loading} onClick={() => void load(page - 1)}>
            Previous
          </Button>
          <span className="text-sm text-ink-muted">Page {page} of {totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page >= totalPages || loading} onClick={() => void load(page + 1)}>
            Next
          </Button>
        </div>
      ) : null}
    </AdminPageShell>
  )
}
