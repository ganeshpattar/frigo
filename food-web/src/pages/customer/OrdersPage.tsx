import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Package,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Truck,
} from 'lucide-react'
import { ROUTES } from '@/constants'
import { AlertModal } from '@/components/common/AlertModal'
import { Button } from '@/components/common/Button'
import { EmptyState } from '@/components/common/EmptyState'
import { Skeleton } from '@/components/common/Skeleton'
import { Breadcrumb } from '@/components/navigation/Breadcrumb'
import { CustomerOrderCard } from '@/components/data-display/CustomerOrderCard'
import { ordersApi } from '@/services/api'
import type { Order, OrderStatus } from '@/types'
import { getUserFriendlyMessage } from '@/utils/apiError'
import { cn } from '@/utils/cn'
import { formatInr } from '@/utils/format'

type OrderFilter = 'all' | 'active' | 'delivered' | 'cancelled'

const FILTERS: Array<{ id: OrderFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
]

function isActiveStatus(status: OrderStatus) {
  return !['DELIVERED', 'CANCELLED', 'FAILED'].includes(status)
}

function matchesFilter(order: Order, filter: OrderFilter) {
  if (filter === 'all') return true
  if (filter === 'active') return isActiveStatus(order.status)
  if (filter === 'delivered') return order.status === 'DELIVERED'
  return order.status === 'CANCELLED' || order.status === 'FAILED'
}

function OrderCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-surface-elevated/75 p-5 shadow-sm backdrop-blur-sm">
      <div className="flex justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-10 w-full" />
      <Skeleton className="mt-4 h-16 w-full" />
    </div>
  )
}

export function OrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<OrderFilter>('all')
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const result = await ordersApi.listMine(1, 50)
      setOrders(result.data)
    } catch (err) {
      setError(getUserFriendlyMessage(err))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const stats = useMemo(() => {
    const active = orders.filter((o) => isActiveStatus(o.status)).length
    const delivered = orders.filter((o) => o.status === 'DELIVERED').length
    const totalSpent = orders
      .filter((o) => o.status !== 'CANCELLED' && o.status !== 'FAILED')
      .reduce((sum, o) => sum + o.total, 0)
    return { total: orders.length, active, delivered, totalSpent }
  }, [orders])

  const filteredOrders = useMemo(
    () => orders.filter((order) => matchesFilter(order, filter)),
    [orders, filter],
  )

  const filterCounts = useMemo(
    () => ({
      all: orders.length,
      active: orders.filter((o) => isActiveStatus(o.status)).length,
      delivered: orders.filter((o) => o.status === 'DELIVERED').length,
      cancelled: orders.filter((o) => o.status === 'CANCELLED' || o.status === 'FAILED').length,
    }),
    [orders],
  )

  return (
    <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(ellipse_at_top,rgb(144_0_0/0.12),transparent_60%)]"
      />

      <Breadcrumb items={[{ label: 'Home', to: ROUTES.HOME }, { label: 'Orders' }]} />

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">
            Order history
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            My orders
          </h1>
          <p className="mt-2 max-w-xl text-ink-muted">
            Track deliveries, view details, and reorder your favourites.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void load(true)}
          disabled={refreshing || loading}
          leftIcon={<RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />}
          className="w-fit bg-surface-elevated/80 backdrop-blur-sm"
        >
          Refresh
        </Button>
      </div>

      <AlertModal
        open={Boolean(error)}
        onClose={() => setError(null)}
        variant="error"
        title="Could not load orders"
        description={error ?? undefined}
      />

      {!loading && orders.length > 0 ? (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total', value: String(stats.total), icon: Package },
            { label: 'Active', value: String(stats.active), icon: Truck },
            { label: 'Delivered', value: String(stats.delivered), icon: Sparkles },
            { label: 'Spent', value: formatInr(stats.totalSpent), icon: ShoppingBag },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-border/70 bg-surface-elevated/70 px-3 py-3 shadow-sm backdrop-blur-sm sm:px-4"
            >
              <div className="flex items-center gap-1.5 text-ink-muted">
                <stat.icon className="h-3.5 w-3.5 text-brand-600 dark:text-brand-300" />
                <span className="text-[11px] font-semibold uppercase tracking-wide">{stat.label}</span>
              </div>
              <p className="mt-1.5 font-display text-lg font-semibold tabular-nums text-ink sm:text-xl">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {!loading && orders.length > 0 ? (
        <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Filter orders">
          {FILTERS.map((tab) => {
            const active = filter === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                  active
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/25 dark:bg-brand-500'
                    : 'bg-surface-elevated/80 text-ink-muted ring-1 ring-border backdrop-blur-sm hover:text-ink dark:hover:bg-brand-900/40',
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-xs tabular-nums',
                    active ? 'bg-white/20 text-white' : 'bg-canvas/80 text-ink-muted',
                  )}
                >
                  {filterCounts[tab.id]}
                </span>
              </button>
            )
          })}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-4">
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </div>
      ) : null}

      {!loading && !orders.length ? (
        <div className="overflow-hidden rounded-[2rem] border border-border/80 bg-surface-elevated/80 px-6 py-16 text-center shadow-[0_24px_60px_-40px_rgb(144_0_0/0.35)] backdrop-blur-sm">
          <EmptyState
            title="No orders yet"
            description="When you place an order, it will show up here with live tracking and full details."
            icon={<ShoppingBag className="h-7 w-7" />}
            actionLabel="Browse menu"
            onAction={() => navigate(ROUTES.PRODUCTS)}
          />
        </div>
      ) : null}

      {!loading && orders.length > 0 && filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-border/70 bg-surface-elevated/75 px-6 py-12 text-center backdrop-blur-sm">
          <EmptyState
            title="No orders in this view"
            description="Try another filter or place a new order from the menu."
            icon={<Package className="h-7 w-7" />}
          />
          <Link
            to={ROUTES.PRODUCTS}
            className="mt-2 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200"
          >
            Browse menu →
          </Link>
        </div>
      ) : null}

      {!loading && filteredOrders.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-ink-muted">
            Showing {filteredOrders.length} of {orders.length} orders
          </p>
          {filteredOrders.map((order) => (
            <CustomerOrderCard
              key={order.id}
              order={order}
              layout="wide"
              expanded={expandedOrderId === order.id}
              onExpandedChange={(expanded) => setExpandedOrderId(expanded ? order.id : null)}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
