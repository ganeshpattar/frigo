import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/forms/Input'
import { AlertModal } from '@/components/common/AlertModal'
import { AdminPageShell } from '@/components/admin/AdminPageShell'
import { DataTable } from '@/components/data-display/DataTable'
import { inventoryApi, type InventoryItem } from '@/services/api/inventory.api'
import { getUserFriendlyMessage } from '@/utils/apiError'
import { StockHistoryModal } from '@/components/admin/StockHistoryModal'

export function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await inventoryApi.list()
      setItems(data)
      setDrafts(Object.fromEntries(data.map((item) => [item.productId, String(item.available)])))
    } catch (err) {
      setError(getUserFriendlyMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const save = async (productId: string) => {
    setSavingId(productId)
    setMessage(null)
    setError(null)
    try {
      const availableQuantity = Number(drafts[productId])
      if (Number.isNaN(availableQuantity) || availableQuantity < 0) {
        throw new Error('Enter a valid non-negative quantity')
      }
      await inventoryApi.setAvailable(productId, availableQuantity)
      setMessage('Inventory updated')
      await load()
    } catch (err) {
      setError(getUserFriendlyMessage(err))
    } finally {
      setSavingId(null)
    }
  }

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
      { key: 'available', header: 'Available', render: (item: InventoryItem) => item.available },
      {
        key: 'history',
        header: 'History',
        render: (item: InventoryItem) => (
          <Button size="sm" variant="ghost" onClick={() => setHistoryItem(item)}>
            View
          </Button>
        ),
      },
      {
        key: 'set',
        header: 'Set available',
        render: (item: InventoryItem) => (
          <div className="flex max-w-xs items-center gap-2">
            <Input
              type="number"
              min="0"
              value={drafts[item.productId] ?? '0'}
              onChange={(e) =>
                setDrafts((prev) => ({ ...prev, [item.productId]: e.target.value }))
              }
            />
            <Button
              size="sm"
              variant="secondary"
              disabled={savingId === item.productId}
              onClick={() => void save(item.productId)}
            >
              Save
            </Button>
          </div>
        ),
      },
    ],
    [drafts, savingId],
  )

  return (
    <AdminPageShell title="Inventory" description={`Stock levels per product. ${items.length} SKUs listed.`}>
      <AlertModal
        open={Boolean(error)}
        onClose={() => setError(null)}
        variant="error"
        title="Inventory error"
        description={error ?? undefined}
      />
      <AlertModal
        open={Boolean(message)}
        onClose={() => setMessage(null)}
        variant="success"
        title={message ?? 'Success'}
      />

      <DataTable
        columns={columns}
        data={items}
        rowKey={(item) => item.productId}
        loading={loading}
        emptyMessage="No inventory rows yet. Create a product first."
      />

      <StockHistoryModal
        item={historyItem}
        open={Boolean(historyItem)}
        onClose={() => setHistoryItem(null)}
      />
    </AdminPageShell>
  )
}
