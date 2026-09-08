import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { DataTable } from '@/components/data-display/DataTable'
import {
  inventoryApi,
  type InventoryItem,
  type StockTransaction,
  type StockTransactionType,
} from '@/services/api/inventory.api'
import { getUserFriendlyMessage } from '@/utils/apiError'
import { formatDateTime } from '@/utils/format'

function typeLabel(type: StockTransactionType) {
  switch (type) {
    case 'INITIAL':
      return 'Initial stock'
    case 'ORDER':
      return 'Order'
    case 'RESERVE':
      return 'Reserved'
    case 'FULFILL':
      return 'Delivered'
    case 'RELEASE':
      return 'Released'
    case 'ADJUSTMENT':
      return 'Adjustment'
    case 'MANUAL_SET':
      return 'Manual update'
    default:
      return type
  }
}

function typeVariant(type: StockTransactionType) {
  if (type === 'ORDER' || type === 'FULFILL') return 'warning' as const
  if (type === 'RESERVE') return 'brand' as const
  if (type === 'RELEASE' || type === 'INITIAL') return 'success' as const
  if (type === 'ADJUSTMENT') return 'accent' as const
  return 'neutral' as const
}

function formatChange(value: number) {
  return value > 0 ? `+${value}` : String(value)
}

interface StockHistoryModalProps {
  item: InventoryItem | null
  open: boolean
  onClose: () => void
}

export function StockHistoryModal({ item, open, onClose }: StockHistoryModalProps) {
  const [transactions, setTransactions] = useState<StockTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const load = useCallback(
    async (nextPage: number) => {
      if (!item) return
      setLoading(true)
      setError(null)
      try {
        const result = await inventoryApi.getTransactions(item.productId, nextPage, 20)
        setTransactions(result.data)
        setPage(result.page)
        setTotalPages(result.totalPages)
      } catch (err) {
        setError(getUserFriendlyMessage(err))
      } finally {
        setLoading(false)
      }
    },
    [item],
  )

  useEffect(() => {
    if (open && item) {
      void load(1)
    } else {
      setTransactions([])
      setError(null)
      setPage(1)
      setTotalPages(1)
    }
  }, [open, item, load])

  const columns = [
    {
      key: 'when',
      header: 'Date',
      render: (row: StockTransaction) => formatDateTime(row.createdAt),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row: StockTransaction) => (
        <Badge variant={typeVariant(row.type)} uppercase>{typeLabel(row.type)}</Badge>
      ),
    },
    {
      key: 'change',
      header: 'Change',
      render: (row: StockTransaction) => (
        <span
          className={
            row.quantityChange < 0
              ? 'font-semibold text-danger'
              : row.quantityChange > 0
                ? 'font-semibold text-success'
                : 'text-ink-muted'
          }
        >
          {formatChange(row.quantityChange)}
        </span>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      render: (row: StockTransaction) => (
        <span className="tabular-nums text-sm">
          {row.quantityBefore} → <span className="font-semibold text-ink">{row.quantityAfter}</span>
        </span>
      ),
    },
    {
      key: 'reference',
      header: 'Reference',
      render: (row: StockTransaction) => (
        <div className="max-w-xs text-sm">
          {row.orderNumber ? (
            <p className="font-medium text-brand-600">{row.orderNumber}</p>
          ) : null}
          <p className="text-ink-muted">{row.referenceNote || '—'}</p>
        </div>
      ),
    },
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={item ? `Stock history — ${item.productName}` : 'Stock history'}
    >
      {item ? (
        <p className="mb-4 text-sm text-ink-muted">
          Current available: <span className="font-semibold text-ink">{item.available}</span>
          {item.sku ? <span className="ml-2 font-mono text-xs">SKU {item.sku}</span> : null}
        </p>
      ) : null}

      {loading && transactions.length === 0 ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner />
        </div>
      ) : null}

      {error ? <p className="mb-3 text-sm text-danger">{error}</p> : null}

      <DataTable
        columns={columns}
        data={transactions}
        rowKey={(row) => row.id}
        loading={loading}
        emptyMessage="No stock movements recorded yet. Transactions appear when orders are placed or stock is updated."
      />

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => void load(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-ink-muted">Page {page} of {totalPages}</span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => void load(page + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </Modal>
  )
}
