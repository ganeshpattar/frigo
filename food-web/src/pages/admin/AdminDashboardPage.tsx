import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  DollarSign,
  ShoppingBag,
  Users,
  Warehouse,
  UtensilsCrossed,
  Package,
  Tags,
  Plus,
  ArrowRight,
} from 'lucide-react'
import { AdminPageShell } from '@/components/admin/AdminPageShell'
import { StatCard } from '@/components/admin/StatCard'
import { CompositionBar } from '@/components/admin/CompositionBar'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { AlertModal } from '@/components/common/AlertModal'
import {
  DonutChart,
  HorizontalBarChart,
  TrendChart,
} from '@/components/charts/DashboardCharts'
import { ROUTES } from '@/constants'
import { dashboardApi, type AdminDashboardStats } from '@/services/api/dashboard.api'
import { getUserFriendlyMessage } from '@/utils/apiError'
import { orderStatusChartColor, orderStatusLabel } from '@/utils/chartUtils'
import { formatInr } from '@/utils/format'

const quickLinks = [
  { to: ROUTES.ADMIN_PRODUCTS, label: 'Products', description: 'Manage catalog items' },
  { to: ROUTES.ADMIN_ORDERS, label: 'Orders', description: 'View and update order status' },
  { to: ROUTES.ADMIN_USERS, label: 'Users', description: 'Manage registered accounts' },
  { to: ROUTES.ADMIN_INVENTORY, label: 'Inventory', description: 'Track stock levels' },
]

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await dashboardApi.getStats()
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

  const inactiveProducts = stats ? Math.max(stats.productsCount - stats.activeProductsCount, 0) : 0
  const charts = stats?.charts

  return (
    <AdminPageShell
      title="Dashboard"
      description="Live platform metrics, trends, and quick access to administration."
      actions={
        <Link to={ROUTES.ADMIN_PRODUCT_NEW}>
          <Button variant="secondary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
            Add product
          </Button>
        </Link>
      }
    >
      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : null}

      <AlertModal
        open={Boolean(error)}
        onClose={() => setError(null)}
        variant="error"
        title="Could not load dashboard"
        description={error ?? undefined}
      />

      {stats ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Gross sales (today)"
              value={formatInr(stats.grossSalesToday)}
              icon={<DollarSign className="h-5 w-5" />}
              tone="brand"
            />
            <StatCard
              label="Orders"
              value={String(stats.ordersCount)}
              icon={<ShoppingBag className="h-5 w-5" />}
              tone="info"
            />
            <StatCard
              label="Users"
              value={String(stats.usersCount)}
              icon={<Users className="h-5 w-5" />}
              tone="success"
            />
            <StatCard
              label="SKU in stock"
              value={String(stats.inventorySkuInStock)}
              icon={<Warehouse className="h-5 w-5" />}
              tone="danger"
            />
          </div>

          {charts ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <TrendChart
                title="Sales trend"
                subtitle="Last 7 days — completed orders"
                data={charts.salesTrend.map((d) => ({ label: d.label, value: d.sales ?? 0 }))}
                formatValue={(v) => formatInr(v)}
                tone="brand"
              />
              <DonutChart
                title="Orders by status"
                subtitle="Current distribution across all orders"
                segments={charts.ordersByStatus.map((row) => ({
                  label: orderStatusLabel(row.status),
                  value: row.count,
                  color: orderStatusChartColor(row.status),
                }))}
              />
            </div>
          ) : null}

          {charts ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <HorizontalBarChart
                title="Top products"
                subtitle="By units sold (all time)"
                data={charts.topProducts.map((p) => ({
                  label: p.productName,
                  value: p.quantity,
                  sublabel: formatInr(p.revenue),
                }))}
                valueFormatter={(v) => `${v} sold`}
                tone="success"
              />
              <DonutChart
                title="Inventory health"
                subtitle="Active catalog SKUs by stock level"
                segments={[
                  {
                    label: 'In stock (>10)',
                    value: charts.inventoryHealth.inStock,
                    color: '#22C55E',
                  },
                  {
                    label: 'Low stock (1–10)',
                    value: charts.inventoryHealth.lowStock,
                    color: '#F59E0B',
                  },
                  {
                    label: 'Out of stock',
                    value: charts.inventoryHealth.outOfStock,
                    color: '#EF4444',
                  },
                ]}
              />
            </div>
          ) : null}

          <CompositionBar
            title="Platform overview"
            items={[
              {
                icon: <UtensilsCrossed className="h-3.5 w-3.5" />,
                label: `${stats.activeProductsCount} Active products`,
                tone: 'brand',
              },
              {
                icon: <Package className="h-3.5 w-3.5" />,
                label: `${inactiveProducts} Inactive / draft`,
                tone: 'accent',
              },
              {
                icon: <Tags className="h-3.5 w-3.5" />,
                label: `${stats.productsCount} Total products`,
                tone: 'success',
              },
            ]}
          />

          <Card padding={false} className="overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-ink">Quick links</h2>
                  <p className="mt-0.5 text-sm text-ink-muted">Jump to common admin tasks</p>
                </div>
                <Badge variant="success" uppercase>Live</Badge>
              </div>
            </div>
            <div className="divide-y divide-border/40">
              {quickLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-brand-50/40"
                >
                  <div>
                    <p className="font-medium text-ink">{link.label}</p>
                    <p className="text-sm text-ink-muted">{link.description}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
                    View
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      ) : null}
    </AdminPageShell>
  )
}
