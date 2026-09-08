import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/common/Badge'
import { AlertModal } from '@/components/common/AlertModal'
import { Button } from '@/components/common/Button'
import { AdminPageShell } from '@/components/admin/AdminPageShell'
import { TableToolbar } from '@/components/admin/TableToolbar'
import { UserAvatar } from '@/components/admin/UserAvatar'
import { DataTable } from '@/components/data-display/DataTable'
import { customersApi, type AdminCustomer } from '@/services/api/customers.api'
import { getUserFriendlyMessage } from '@/utils/apiError'
import { formatDate } from '@/utils/format'

function displayName(customer: AdminCustomer) {
  if (customer.firstName || customer.lastName) {
    return `${customer.firstName} ${customer.lastName}`.trim()
  }
  return customer.email
}

export function ManagerCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (nextPage: number) => {
    setLoading(true)
    setError(null)
    try {
      const result = await customersApi.list(nextPage, 20)
      setCustomers(result.data)
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

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return customers
    return customers.filter(
      (c) =>
        displayName(c).toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone ?? '').includes(q),
    )
  }, [customers, search])

  const columns = useMemo(
    () => [
      {
        key: 'name',
        header: 'Customer name',
        render: (customer: AdminCustomer) => (
          <div className="flex items-center gap-3">
            <UserAvatar name={displayName(customer)} />
            <div>
              <p className="font-medium text-ink">{displayName(customer)}</p>
              <p className="text-xs text-ink-muted">{customer.email}</p>
            </div>
          </div>
        ),
      },
      { key: 'phone', header: 'Phone', render: (c: AdminCustomer) => c.phone || '—' },
      {
        key: 'status',
        header: 'Status',
        render: (c: AdminCustomer) => (
          <Badge variant={c.isActive ? 'success' : 'danger'} uppercase>
            {c.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        key: 'joined',
        header: 'Joined',
        render: (c: AdminCustomer) => formatDate(c.createdAt),
      },
    ],
    [],
  )

  return (
    <AdminPageShell
      title="Customers"
      description={`View-only customer list. Total: ${totalItems}`}
    >
      <TableToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, email, or phone…"
      />

      <AlertModal
        open={Boolean(error)}
        onClose={() => setError(null)}
        variant="error"
        title="Customers error"
        description={error ?? undefined}
      />

      <DataTable
        columns={columns}
        data={filteredCustomers}
        rowKey={(c) => c.id}
        loading={loading}
        showIndex
        indexOffset={(page - 1) * 20}
        emptyMessage="No customers found."
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
