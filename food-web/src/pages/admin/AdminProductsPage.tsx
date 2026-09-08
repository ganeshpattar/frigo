import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Archive, Pencil, Plus } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { AlertModal } from '@/components/common/AlertModal'
import { AdminPageShell } from '@/components/admin/AdminPageShell'
import { TableToolbar } from '@/components/admin/TableToolbar'
import { DataTable } from '@/components/data-display/DataTable'
import { ROUTES } from '@/constants'
import { catalogApi } from '@/services/api'
import type { Product } from '@/types'
import { getUserFriendlyMessage } from '@/utils/apiError'
import { formatCurrency } from '@/utils/format'

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalItems, setTotalItems] = useState(0)

  const load = useCallback(async (q?: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await catalogApi.getProducts({
        page: 1,
        pageSize: 50,
        search: q || undefined,
        sort: 'newest',
      })
      setProducts(result.data)
      setTotalItems(result.totalItems)
    } catch (err) {
      setError(getUserFriendlyMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const onArchive = async (productId: string) => {
    if (!window.confirm('Archive this product?')) return
    try {
      await catalogApi.deleteProduct(productId)
      await load(search)
    } catch (err) {
      setError(getUserFriendlyMessage(err))
    }
  }

  const filteredProducts = useMemo(() => {
    if (statusFilter === 'ALL') return products
    return products.filter((p) => p.status === statusFilter)
  }, [products, statusFilter])

  const columns = [
    {
      key: 'image',
      header: 'Image',
      className: 'w-16',
      render: (product: Product) => {
        const thumb = product.images?.[0]?.url
        return thumb ? (
          <img src={thumb} alt={product.name} className="h-11 w-11 rounded-lg object-cover" />
        ) : (
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-xs text-ink-muted">
            N/A
          </span>
        )
      },
    },
    {
      key: 'product',
      header: 'Product name',
      render: (product: Product) => (
        <div>
          <p className="font-medium text-ink">{product.name}</p>
          <p className="text-xs text-ink-muted">{product.slug}</p>
        </div>
      ),
    },
    {
      key: 'sku',
      header: 'SKU',
      render: (product: Product) => (
        <span className="font-mono text-xs text-ink-muted">{product.sku || '—'}</span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (product: Product) => (
        <Badge variant="accent">{product.categoryName ?? '—'}</Badge>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      render: (product: Product) => formatCurrency(product.unitPrice),
    },
    {
      key: 'status',
      header: 'Status',
      render: (product: Product) => (
        <Badge variant={product.status === 'ACTIVE' ? 'success' : 'neutral'} uppercase>
          {product.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'w-32',
      render: (product: Product) => (
        <div className="flex items-center gap-3">
          <Link
            to={`/admin/products/${product.id}/edit`}
            className="text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            Edit
          </Link>
          <Link to={`/admin/products/${product.id}/edit`} aria-label="Edit product">
            <Pencil className="h-4 w-4 text-ink-muted hover:text-brand-600" />
          </Link>
          <button
            type="button"
            aria-label="Archive product"
            className="text-ink-muted hover:text-danger"
            onClick={() => void onArchive(product.id)}
          >
            <Archive className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <AdminPageShell
      title="Products"
      description={`Manage your catalog items and menu products. Total: ${totalItems}`}
      actions={
        <Link to={ROUTES.ADMIN_PRODUCT_NEW}>
          <Button variant="secondary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
            Add product
          </Button>
        </Link>
      }
    >
      <TableToolbar
        searchValue={search}
        onSearchChange={setSearch}
        onSearchSubmit={() => void load(search.trim())}
        searchPlaceholder="Search by name or SKU…"
        filters={[
          {
            id: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: 'ALL', label: 'All statuses' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'DRAFT', label: 'Draft' },
              { value: 'INACTIVE', label: 'Inactive' },
            ],
          },
        ]}
      />

      <AlertModal
        open={Boolean(error)}
        onClose={() => setError(null)}
        variant="error"
        title="Products error"
        description={error ?? undefined}
      />

      <DataTable
        columns={columns}
        data={filteredProducts}
        rowKey={(p) => p.id}
        loading={loading}
        showIndex
        emptyMessage="No products yet."
      />
    </AdminPageShell>
  )
}
