import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/common/Badge'
import { AlertModal } from '@/components/common/AlertModal'
import { Button } from '@/components/common/Button'
import { Switch } from '@/components/common/Switch'
import { AdminPageShell } from '@/components/admin/AdminPageShell'
import { TableToolbar } from '@/components/admin/TableToolbar'
import { UserAvatar } from '@/components/admin/UserAvatar'
import { DataTable } from '@/components/data-display/DataTable'
import { useAuth } from '@/context'
import { usersApi, type AdminUser } from '@/services/api/users.api'
import { getUserFriendlyMessage } from '@/utils/apiError'
import { formatDate } from '@/utils/format'

function roleVariant(role: string) {
  if (role === 'ADMIN') return 'danger' as const
  if (role === 'MANAGER') return 'warning' as const
  return 'brand' as const
}

function isUserActive(user: AdminUser) {
  if (typeof user.isActive === 'boolean') return user.isActive
  return user.status === 'ACTIVE' && user.accountStatus === 'ACTIVE'
}

function displayName(user: AdminUser) {
  if (user.firstName || user.lastName) {
    return `${user.firstName} ${user.lastName}`.trim()
  }
  return user.email
}

export function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const load = useCallback(async (nextPage: number) => {
    setLoading(true)
    setError(null)
    try {
      const result = await usersApi.list(nextPage, 20)
      setUsers(result.data)
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

  const onToggleActive = async (user: AdminUser, active: boolean) => {
    setUpdatingId(user.id)
    setError(null)
    setMessage(null)
    try {
      const updated = await usersApi.setActive(user.id, active)
      setUsers((prev) => prev.map((row) => (row.id === user.id ? updated : row)))
      setMessage(active ? `${updated.email} is now active.` : `${updated.email} has been deactivated.`)
    } catch (err) {
      setError(getUserFriendlyMessage(err))
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((user) => {
      const matchesSearch =
        !q ||
        displayName(user).toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q)
      const roles = user.roles?.length ? user.roles : ['CUSTOMER']
      const matchesRole = roleFilter === 'ALL' || roles.includes(roleFilter)
      return matchesSearch && matchesRole
    })
  }, [users, search, roleFilter])

  const columns = useMemo(
    () => [
      {
        key: 'name',
        header: 'User name',
        render: (user: AdminUser) => (
          <div className="flex items-center gap-3">
            <UserAvatar name={displayName(user)} />
            <div>
              <p className="font-medium text-ink">{displayName(user)}</p>
              <p className="text-xs text-ink-muted">{user.email}</p>
            </div>
          </div>
        ),
      },
      {
        key: 'roles',
        header: 'Category',
        render: (user: AdminUser) => (
          <div className="flex flex-wrap gap-1">
            {(user.roles?.length ? user.roles : ['CUSTOMER']).map((role) => (
              <Badge key={role} variant={roleVariant(role)} uppercase>{role}</Badge>
            ))}
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (user: AdminUser) => {
          const active = isUserActive(user)
          return (
            <Badge variant={active ? 'success' : 'danger'} uppercase>
              {active ? 'Active' : 'Inactive'}
            </Badge>
          )
        },
      },
      {
        key: 'joined',
        header: 'Joined',
        render: (user: AdminUser) => formatDate(user.createdAt),
      },
      {
        key: 'action',
        header: 'Active',
        render: (user: AdminUser) => {
          const active = isUserActive(user)
          const isSelf = currentUser?.id === user.id
          return (
            <Switch
              checked={active}
              disabled={isSelf || updatingId === user.id}
              label={active ? 'Deactivate user' : 'Activate user'}
              onCheckedChange={(next) => void onToggleActive(user, next)}
            />
          )
        },
      },
      {
        key: 'view',
        header: 'Actions',
        render: (user: AdminUser) => (
          <button
            type="button"
            className="text-sm font-semibold text-brand-600 hover:text-brand-700"
            onClick={() => window.alert(`${displayName(user)}\n${user.email}\nStatus: ${user.status}`)}
          >
            View
          </button>
        ),
      },
    ],
    [currentUser?.id, updatingId],
  )

  return (
    <AdminPageShell
      title="Users"
      description={`Manage registered accounts, roles, and access. Total: ${totalItems}`}
    >
      <TableToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name or email…"
        filters={[
          {
            id: 'role',
            label: 'Role',
            value: roleFilter,
            onChange: setRoleFilter,
            options: [
              { value: 'ALL', label: 'All roles' },
              { value: 'ADMIN', label: 'Admin' },
              { value: 'MANAGER', label: 'Manager' },
              { value: 'CUSTOMER', label: 'Customer' },
            ],
          },
        ]}
      />

      <AlertModal
        open={Boolean(error)}
        onClose={() => setError(null)}
        variant="error"
        title="Users error"
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
        data={filteredUsers}
        rowKey={(u) => u.id}
        loading={loading}
        showIndex
        indexOffset={(page - 1) * 20}
        emptyMessage="No users found."
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
