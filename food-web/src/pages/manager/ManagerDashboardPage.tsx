import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Package, Users, TrendingUp, ArrowRight, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { AlertModal } from '@/components/common/AlertModal'
import { StatCard } from '@/components/admin/StatCard'
import { DonutChart, TrendChart } from '@/components/charts/DashboardCharts'
import { ROUTES, managerOrderPath } from '@/constants'
import { dashboardApi } from '@/services/api/dashboard.api'
import { getUserFriendlyMessage } from '@/utils/apiError'
import { orderStatusChartColor, orderStatusLabel } from '@/utils/chartUtils'
import { formatDateTime, formatInr } from '@/utils/format'
import type { Order, OrderStatus } from '@/types'

function statusVariant(status: OrderStatus) {
  if (status === 'DELIVERED') return 'success' as const
  if (status === 'CANCELLED' || status === 'FAILED') return 'danger' as const
  if (status === 'PENDING') return 'warning' as const
  return 'brand' as const
}

export function ManagerDashboardPage() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof dashboardApi.getManagerStats>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await dashboardApi.getManagerStats()
        if (!cancelled) setStats(data)
      } catch (err) {
        if (!cancelled) setError(getUserFriendlyMessage(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  const charts = stats?.charts

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Manager dashboard</h1>
        <p className="text-sm text-ink-muted">
          Operations overview — orders pipeline, trends, and inventory alerts.
        </p>
      </div>

      <AlertModal
        open={Boolean(error)}
        onClose={() => setError(null)}
        variant="error"
        title="Could not load dashboard"
        description={error ?? undefined}
      />

      {stats ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Open orders"
              value={String(stats.openOrdersCount)}
              icon={<ClipboardList className="h-5 w-5" />}
              tone="brand"
            />
            <StatCard
              label="Preparing"
              value={String(stats.preparingCount)}
              icon={<TrendingUp className="h-5 w-5" />}
              tone="info"
            />
            <StatCard
              label="Low stock SKUs"
              value={String(stats.lowStockCount)}
              icon={<Package className="h-5 w-5" />}
              tone="danger"
            />
            <StatCard
              label="Customers"
              value={String(stats.customersCount)}
              icon={<Users className="h-5 w-5" />}
              tone="success"
            />
          </div>

          {charts ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <TrendChart
                title="Orders per day"
                subtitle="Last 7 days — all non-cancelled orders"
                data={charts.ordersTrend.map((d) => ({ label: d.label, value: d.orders }))}
                tone="success"
              />
              <DonutChart
                title="Order pipeline"
                subtitle="Breakdown by current status"
                segments={charts.ordersByStatus.map((row) => ({
                  label: orderStatusLabel(row.status),
                  value: row.count,
                  color: orderStatusChartColor(row.status),
                }))}
              />
            </div>
          ) : null}

          {charts && charts.lowStockProducts.length > 0 ? (
            <Card>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-ink">Low stock alerts</h2>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    Products with fewer than 10 units available
                  </p>
                </div>
                <Link
                  to={ROUTES.MANAGER_INVENTORY}
                  className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-600"
                >
                  View inventory
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {charts.lowStockProducts.map((product) => (
                  <div
                    key={product.productId}
                    className="flex items-center gap-3 rounded-lg border border-border/80 bg-brand-50/30 p-3"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.productName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-ink-muted">
                          <Package className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{product.productName}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                          <AlertTriangle className="h-3 w-3" />
                          {product.available} left
                        </span>
                        {product.reserved > 0 ? (
                          <span className="text-xs text-ink-muted">{product.reserved} reserved</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          <Card padding={false} className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="font-display text-lg font-semibold">Recent orders</h2>
                <p className="text-sm text-ink-muted">Latest activity across the platform</p>
              </div>
              <Link
                to={ROUTES.MANAGER_ORDERS}
                className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600"
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead className="border-b border-border text-xs uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Order</th>
                    <th className="px-5 py-3 font-semibold">Customer</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Total</th>
                    <th className="px-5 py-3 font-semibold">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-ink-muted">
                        No orders yet.
                      </td>
                    </tr>
                  ) : (
                    stats.recentOrders.map((order: Order) => (
                      <tr key={order.id} className="border-b border-border/70">
                        <td className="px-5 py-3">
                          <Link
                            to={managerOrderPath(order.id)}
                            className="font-medium text-brand-600 hover:text-brand-700"
                          >
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="px-5 py-3">{order.customerName ?? '—'}</td>
                        <td className="px-5 py-3">
                          <Badge variant={statusVariant(order.status)} uppercase>
                            {order.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3">{formatInr(order.total)}</td>
                        <td className="px-5 py-3 text-ink-muted">{formatDateTime(order.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  )
}
