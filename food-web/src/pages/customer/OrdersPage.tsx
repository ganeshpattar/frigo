import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  ClipboardList,
  Headphones,
  Package,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Truck,
  UtensilsCrossed,
} from 'lucide-react'
import { ROUTES } from '@/constants'
import { Card } from '@/components/common/Card'
import { AlertModal } from '@/components/common/AlertModal'
import { Button } from '@/components/common/Button'
import { EmptyState } from '@/components/common/EmptyState'
import { Skeleton } from '@/components/common/Skeleton'
import { OrderStatusBadge } from '@/components/data-display/OrderStatusBadge'
import { CustomerOrderCard } from '@/components/data-display/CustomerOrderCard'
import { ordersApi } from '@/services/api'
import type { Order, OrderStatus } from '@/types'
import { getUserFriendlyMessage } from '@/utils/apiError'
import { cn } from '@/utils/cn'
import { formatDateTime, formatInr } from '@/utils/format'

type OrderFilter = 'all' | 'active' | 'delivered' | 'cancelled'

const FILTERS: Array<{ id: OrderFilter; label: string; shortLabel: string }> = [
  { id: 'all', label: 'All orders', shortLabel: 'All' },
  { id: 'active', label: 'Active', shortLabel: 'Active' },
  { id: 'delivered', label: 'Delivered', shortLabel: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled', shortLabel: 'Cancelled' },
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
    <Card padding={false} className="overflow-hidden">
      <div className="border-b border-border/60 px-4 py-4 sm:px-6">
        <div className="flex justify-between gap-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="mt-4 h-10 w-full" />
      </div>
      <div className="space-y-2 px-4 py-4 sm:px-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="mt-2 h-10 w-32" />
      </div>
    </Card>
  )
}

interface OrdersSidebarProps {
  filter: OrderFilter
  filterCounts: Record<OrderFilter, number>
  onFilterChange: (filter: OrderFilter) => void
  stats: { total: number; active: number; delivered: number; totalSpent: number }
  variant: 'mobile' | 'desktop'
}

function OrdersFilterPanel({ filter, filterCounts, onFilterChange, stats, variant }: OrdersSidebarProps) {
  const isMobile = variant === 'mobile'

  return (
    <div className={cn(isMobile ? 'space-y-0' : 'space-y-5')}>
      {!isMobile ? (
        <Card className="bg-gradient-to-br from-brand-50/50 to-surface-elevated">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Your summary</p>
          <div className="mt-3 space-y-3">
            {[
              { label: 'Total orders', value: String(stats.total), icon: Package },
              { label: 'Active now', value: String(stats.active), icon: Truck },
              { label: 'Delivered', value: String(stats.delivered), icon: Sparkles },
              { label: 'Total spent', value: formatInr(stats.totalSpent), icon: ShoppingBag },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-ink-muted">
                  <stat.icon className="h-4 w-4 text-brand-600" />
                  {stat.label}
                </div>
                <span className="text-sm font-semibold tabular-nums text-ink">{stat.value}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <div className={cn(!isMobile && 'space-y-2')}>
        {!isMobile ? (
          <p className="px-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">Filter orders</p>
        ) : null}
        <div
          className={cn(
            isMobile
              ? 'flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
              : 'space-y-1.5',
          )}
        >
          {FILTERS.map((tab) => {
            const count = filterCounts[tab.id]
            const active = filter === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onFilterChange(tab.id)}
                className={cn(
                  'inline-flex shrink-0 items-center justify-between gap-3 font-semibold transition-colors',
                  isMobile
                    ? 'rounded-full px-4 py-2 text-sm'
                    : 'w-full rounded-xl px-3 py-2.5 text-sm',
                  active
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/25'
                    : isMobile
                      ? 'bg-surface-elevated text-ink-muted ring-1 ring-border/80'
                      : 'text-ink-muted hover:bg-brand-50 hover:text-brand-700',
                )}
              >
                <span>{isMobile ? tab.shortLabel : tab.label}</span>
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-xs tabular-nums',
                    active ? 'bg-white/20 text-white' : 'bg-canvas text-ink-muted',
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function OrdersRightPanel({
  activeOrders,
  onSelectFilter,
}: {
  activeOrders: Order[]
  onSelectFilter: () => void
}) {
  return (
    <div className="space-y-5">
      <Card>
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-ink">Active deliveries</h2>
            <p className="mt-0.5 text-xs text-ink-muted">Orders still in progress</p>
          </div>
          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-700">
            {activeOrders.length}
          </span>
        </div>
        <div className="mt-4 space-y-2">
          {activeOrders.length === 0 ? (
            <p className="text-sm text-ink-muted">No active orders right now.</p>
          ) : (
            activeOrders.slice(0, 5).map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={onSelectFilter}
                className="flex w-full items-center justify-between gap-3 rounded-xl bg-canvas/80 px-3 py-2.5 text-left ring-1 ring-border/50 transition-colors hover:bg-brand-50/60"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{order.orderNumber}</p>
                  <p className="truncate text-xs text-ink-muted">{formatDateTime(order.createdAt)}</p>
                </div>
                <OrderStatusBadge status={order.status} />
              </button>
            ))
          )}
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white">
          <UtensilsCrossed className="h-6 w-6 opacity-90" />
          <h2 className="mt-3 font-display text-lg font-semibold">Hungry again?</h2>
          <p className="mt-1 text-sm text-white/80">
            Browse fresh batches of pickles, chatni, rotti and more.
          </p>
          <Link to={ROUTES.PRODUCTS} className="mt-4 inline-block">
            <Button
              size="sm"
              className="border-white/20 bg-white/15 text-white hover:bg-white/25"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Browse menu
            </Button>
          </Link>
        </div>
      </Card>

      <Card>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Headphones className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-ink">Need help?</h2>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              For order issues or delivery questions, contact support from your profile page.
            </p>
          </div>
        </div>
      </Card>
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

  const activeOrders = useMemo(
    () => orders.filter((order) => isActiveStatus(order.status)),
    [orders],
  )

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

  const useWideCards = filteredOrders.length === 1

  return (
    <div className="min-h-full bg-canvas">
      <div className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 80%, rgba(255,255,255,0.15) 0%, transparent 45%), radial-gradient(circle at 85% 20%, rgba(255,255,255,0.12) 0%, transparent 40%)',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90 ring-1 ring-white/20">
                <ClipboardList className="h-3.5 w-3.5" />
                Order history
              </div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                My orders
              </h1>
              <p className="mt-2 text-sm text-white/80 sm:text-base">
                Track deliveries, view order details, and reorder your favourites.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void load(true)}
              disabled={refreshing}
              leftIcon={<RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />}
              className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20 sm:w-auto"
            >
              Refresh
            </Button>
          </div>

          {!loading && orders.length > 0 ? (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:mt-8">
              {[
                { label: 'Total orders', value: String(stats.total), icon: Package },
                { label: 'Active now', value: String(stats.active), icon: Truck },
                { label: 'Delivered', value: String(stats.delivered), icon: Sparkles },
                { label: 'Total spent', value: formatInr(stats.totalSpent), icon: ShoppingBag },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl bg-white/10 px-3 py-3 ring-1 ring-white/15 backdrop-blur-sm sm:px-4"
                >
                  <div className="flex items-center gap-1.5 text-white/70 sm:gap-2">
                    <stat.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="text-[10px] font-medium uppercase tracking-wide sm:text-xs">
                      {stat.label}
                    </span>
                  </div>
                  <p className="mt-1 font-display text-lg font-semibold tabular-nums text-white sm:text-xl">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <AlertModal
          open={Boolean(error)}
          onClose={() => setError(null)}
          variant="error"
          title="Could not load orders"
          description={error ?? undefined}
        />

        {loading ? (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[280px_minmax(0,1fr)_300px]">
            <div className="hidden xl:block">
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="space-y-4 lg:col-span-2 xl:col-span-1">
              <OrderCardSkeleton />
              <OrderCardSkeleton />
            </div>
            <div className="hidden xl:block">
              <Skeleton className="h-72 w-full" />
            </div>
          </div>
        ) : null}

        {!loading && !orders.length ? (
          <Card className="overflow-hidden">
            <EmptyState
              title="No orders yet"
              description="When you place an order, it will appear here with live tracking and full details."
              icon={<ShoppingBag className="h-7 w-7" />}
              actionLabel="Browse menu"
              onAction={() => navigate(ROUTES.PRODUCTS)}
            />
            <div className="border-t border-border/60 px-6 pb-6 text-center">
              <Link
                to={ROUTES.PRODUCTS}
                className="text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                Explore our menu →
              </Link>
            </div>
          </Card>
        ) : null}

        {!loading && orders.length > 0 ? (
          <div className="space-y-5 lg:space-y-0 lg:grid lg:grid-cols-[minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_300px] xl:gap-8">
            <aside className="hidden xl:block">
              <div className="sticky top-24">
                <OrdersFilterPanel
                  variant="desktop"
                  filter={filter}
                  filterCounts={filterCounts}
                  onFilterChange={setFilter}
                  stats={stats}
                />
              </div>
            </aside>

            <main className="min-w-0 space-y-5">
              <div className="xl:hidden">
                <OrdersFilterPanel
                  variant="mobile"
                  filter={filter}
                  filterCounts={filterCounts}
                  onFilterChange={setFilter}
                  stats={stats}
                />
              </div>

              <div className="hidden items-center justify-between gap-3 lg:flex xl:hidden">
                <div>
                  <h2 className="font-display text-xl font-semibold text-ink">
                    {FILTERS.find((f) => f.id === filter)?.label}
                  </h2>
                  <p className="text-sm text-ink-muted">
                    Showing {filteredOrders.length} of {orders.length} orders
                  </p>
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <Card>
                  <EmptyState
                    title="No orders in this view"
                    description="Try another filter or place a new order from the menu."
                    icon={<Package className="h-7 w-7" />}
                  />
                </Card>
              ) : (
                <div
                  className={cn(
                    'grid gap-5',
                    useWideCards ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2',
                  )}
                >
                  {filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      className={cn(
                        'min-w-0',
                        expandedOrderId === order.id && !useWideCards && 'lg:col-span-2',
                      )}
                    >
                      <CustomerOrderCard
                        order={order}
                        layout={useWideCards || expandedOrderId === order.id ? 'wide' : 'stacked'}
                        expanded={expandedOrderId === order.id}
                        onExpandedChange={(expanded) =>
                          setExpandedOrderId(expanded ? order.id : null)
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </main>

            <aside className="hidden xl:block">
              <div className="sticky top-24">
                <OrdersRightPanel
                  activeOrders={activeOrders}
                  onSelectFilter={() => setFilter('active')}
                />
              </div>
            </aside>

            <div className="space-y-5 xl:hidden">
              <OrdersRightPanel
                activeOrders={activeOrders}
                onSelectFilter={() => setFilter('active')}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
