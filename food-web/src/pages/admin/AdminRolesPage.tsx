import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { AlertModal } from '@/components/common/AlertModal'
import { Switch } from '@/components/common/Switch'
import { AdminPageShell } from '@/components/admin/AdminPageShell'
import { DataTable } from '@/components/data-display/DataTable'
import { rolesApi, type AdminRole } from '@/services/api/roles.api'
import { getUserFriendlyMessage } from '@/utils/apiError'

function roleVariant(code: string) {
  if (code === 'ADMIN') return 'danger' as const
  if (code === 'MANAGER') return 'warning' as const
  return 'brand' as const
}

export function AdminRolesPage() {
  const [roles, setRoles] = useState<AdminRole[]>([])
  const [selected, setSelected] = useState<AdminRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await rolesApi.list()
      setRoles(result.data)
    } catch (err) {
      setError(getUserFriendlyMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const onToggle = async (role: AdminRole, active: boolean) => {
    setUpdatingId(role.id)
    setError(null)
    setMessage(null)
    try {
      const updated = await rolesApi.setActive(role.id, active)
      setRoles((prev) => prev.map((row) => (row.id === role.id ? { ...row, ...updated } : row)))
      if (selected?.id === role.id) setSelected(updated)
      setMessage(`${updated.code} is now ${active ? 'active' : 'inactive'}.`)
    } catch (err) {
      setError(getUserFriendlyMessage(err))
    } finally {
      setUpdatingId(null)
    }
  }

  const onView = async (role: AdminRole) => {
    setError(null)
    try {
      const detail = await rolesApi.getById(role.id)
      setSelected(detail)
    } catch (err) {
      setError(getUserFriendlyMessage(err))
    }
  }

  const columns = useMemo(
    () => [
      {
        key: 'code',
        header: 'Code',
        render: (role: AdminRole) => (
          <button
            type="button"
            className="font-semibold text-brand-600 hover:underline"
            onClick={() => void onView(role)}
          >
            <Badge variant={roleVariant(role.code)}>{role.code}</Badge>
          </button>
        ),
      },
      { key: 'name', header: 'Name', render: (r: AdminRole) => <span className="font-medium">{r.name}</span> },
      { key: 'users', header: 'Users', render: (r: AdminRole) => r.userCount },
      { key: 'permissions', header: 'Permissions', render: (r: AdminRole) => r.permissionCount },
      {
        key: 'status',
        header: 'Status',
        render: (r: AdminRole) => (
          <Badge variant={r.isActive ? 'success' : 'danger'}>{r.isActive ? 'ACTIVE' : 'INACTIVE'}</Badge>
        ),
      },
      {
        key: 'action',
        header: 'Active',
        render: (role: AdminRole) => (
          <Switch
            checked={role.isActive}
            disabled={role.code === 'ADMIN' || updatingId === role.id}
            label={role.isActive ? 'Deactivate role' : 'Activate role'}
            onCheckedChange={(next) => void onToggle(role, next)}
          />
        ),
      },
    ],
    [updatingId, selected?.id],
  )

  return (
    <AdminPageShell title="Roles" description={`System roles and permissions. Total: ${roles.length}`}>
      <AlertModal
        open={Boolean(error)}
        onClose={() => setError(null)}
        variant="error"
        title="Roles error"
        description={error ?? undefined}
      />
      <AlertModal
        open={Boolean(message)}
        onClose={() => setMessage(null)}
        variant="success"
        title={message ?? 'Success'}
      />

      <div className="grid gap-5 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <DataTable
            columns={columns}
            data={roles}
            rowKey={(r) => r.id}
            loading={loading}
            showIndex
            emptyMessage="No roles found."
          />
        </div>

        <Card className="xl:col-span-2">
          <h2 className="mb-3 font-display text-base font-semibold">Role permissions</h2>
          {!selected ? (
            <p className="text-sm text-ink-muted">Select a role code to view its permissions.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{selected.name}</p>
                  <p className="text-sm text-ink-muted">{selected.description || '—'}</p>
                </div>
                <Badge variant={roleVariant(selected.code)}>{selected.code}</Badge>
              </div>
              <ul className="max-h-96 space-y-1 overflow-auto rounded-lg border border-border p-3">
                {(selected.permissions ?? []).map((perm) => (
                  <li key={perm.code} className="flex justify-between gap-2 border-b border-border/50 py-2 text-sm last:border-0">
                    <span className="font-medium text-ink">{perm.code}</span>
                    <span className="text-ink-muted">{perm.name}</span>
                  </li>
                ))}
                {!selected.permissions?.length ? (
                  <li className="text-sm text-ink-muted">No permissions assigned.</li>
                ) : null}
              </ul>
            </div>
          )}
        </Card>
      </div>
    </AdminPageShell>
  )
}
