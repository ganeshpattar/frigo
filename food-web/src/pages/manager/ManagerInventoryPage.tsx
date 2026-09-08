import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { AlertModal } from '@/components/common/AlertModal'
import { AdminPageShell } from '@/components/admin/AdminPageShell'
import { StockHistoryModal } from '@/components/admin/StockHistoryModal'
import { DataTable } from '@/components/data-display/DataTable'
import { inventoryApi, type InventoryItem } from '@/services/api/inventory.api'
import { getUserFriendlyMessage } from '@/utils/apiError'

export function ManagerInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await inventoryApi.list()
      setItems(data)
    } catch (err) {
      setError(getUserFriendlyMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const columns = useMemo(
    () => [
      {
        key: 'image',
        header: 'Image',
        className: 'w-16',
        render: (item: InventoryItem) =>
          item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.productName}
              className="h-11 w-11 rounded-lg object-cover"
            />
          ) : (
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-xs text-ink-muted">
              N/A
            </span>
          ),
      },
      {
        key: 'product',
        header: 'Product',
        render: (item: InventoryItem) => (
          <div>
            <p className="font-medium">{item.productName}</p>
            {item.sku ? <p className="font-mono text-xs text-ink-muted">{item.sku}</p> : null}
          </div>
        ),
      },
      { key: 'onHand', header: 'On hand', render: (item: InventoryItem) => item.quantityOnHand },
      { key: 'reserved', header: 'Reserved', render: (item: InventoryItem) => item.reserved },
      {
        key: 'available',
        header: 'Available',
        render: (item: InventoryItem) => (
          <div className="flex items-center gap-2">
            <span>{item.available}</span>
            {item.available < 10 ? (
              <Badge variant="warning" uppercase>Low</Badge>
            ) : null}
          </div>
        ),
      },
      {
        key: 'history',
        header: 'History',
        render: (item: InventoryItem) => (
          <Button size="sm" variant="ghost" onClick={() => setHistoryItem(item)}>
            View
          </Button>
        ),
      },
    ],
    [],
  )

  return (
    <AdminPageShell
      title="Inventory"
      description={`View-only stock levels. ${items.length} SKUs listed.`}
    >
      <AlertModal
        open={Boolean(error)}
        onClose={() => setError(null)}
        variant="error"
        title="Inventory error"
        description={error ?? undefined}
      />

      <DataTable
        columns={columns}
        data={items}
        rowKey={(item) => item.productId}
        loading={loading}
        emptyMessage="No inventory rows yet."
      />

      <StockHistoryModal
        item={historyItem}
        open={Boolean(historyItem)}
        onClose={() => setHistoryItem(null)}
      />
    </AdminPageShell>
  )
}
