import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { IconButton } from '@/components/common/IconButton'
import { LoadingButton } from '@/components/common/LoadingButton'
import { AlertModal } from '@/components/common/AlertModal'
import { Switch } from '@/components/common/Switch'
import { FormField } from '@/components/forms/FormField'
import { Input } from '@/components/forms/Input'
import { Textarea } from '@/components/forms/Textarea'
import { ImageUpload } from '@/components/forms/ImageUpload'
import { Modal } from '@/components/common/Modal'
import { AdminPageShell } from '@/components/admin/AdminPageShell'
import { DataTable } from '@/components/data-display/DataTable'
import { catalogApi, type AdminCategory } from '@/services/api/catalog.api'
import { getUserFriendlyMessage } from '@/utils/apiError'
import { rhf } from '@/utils/validation'

interface CategoryFormValues {
  name: string
  description: string
  sortOrder: string
}

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminCategory | null>(null)
  const [imageData, setImageData] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    defaultValues: { name: '', description: '', sortOrder: '0' },
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await catalogApi.listAdminCategories()
      setCategories(result.data)
    } catch (err) {
      setError(getUserFriendlyMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setImageData(null)
    reset({ name: '', description: '', sortOrder: '0' })
    setModalOpen(true)
  }

  const openEdit = (category: AdminCategory) => {
    setEditing(category)
    setImageData(category.imageUrl ?? null)
    reset({
      name: category.name,
      description: category.description ?? '',
      sortOrder: String(category.sortOrder ?? 0),
    })
    setModalOpen(true)
  }

  const onSubmit = handleSubmit(async (values) => {
    setError(null)
    setMessage(null)
    try {
      const payload = {
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        imageUrl: imageData || undefined,
        sortOrder: Number(values.sortOrder) || 0,
      }
      if (editing) {
        await catalogApi.updateCategory(editing.id, {
          ...payload,
          imageUrl: imageData ?? undefined,
        })
        setMessage('Category updated.')
      } else {
        await catalogApi.createCategory({ ...payload, status: 'ACTIVE' })
        setMessage('Category created.')
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      setError(getUserFriendlyMessage(err))
    }
  })

  const onToggle = async (category: AdminCategory, active: boolean) => {
    setUpdatingId(category.id)
    setError(null)
    setMessage(null)
    try {
      const updated = await catalogApi.setCategoryActive(category.id, active)
      setCategories((prev) => prev.map((row) => (row.id === category.id ? updated : row)))
      setMessage(`${updated.name} is now ${active ? 'active' : 'inactive'}.`)
    } catch (err) {
      setError(getUserFriendlyMessage(err))
    } finally {
      setUpdatingId(null)
    }
  }

  const onDelete = async (category: AdminCategory) => {
    if (!window.confirm(`Delete category "${category.name}"?`)) return
    setError(null)
    try {
      await catalogApi.deleteCategory(category.id)
      setMessage('Category deleted.')
      await load()
    } catch (err) {
      setError(getUserFriendlyMessage(err))
    }
  }

  const columns = useMemo(
    () => [
      {
        key: 'image',
        header: 'Image',
        className: 'w-16',
        render: (category: AdminCategory) =>
          category.imageUrl ? (
            <img src={category.imageUrl} alt={category.name} className="h-11 w-11 rounded-lg object-cover" />
          ) : (
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-border/50 text-xs text-ink-muted">
              N/A
            </span>
          ),
      },
      { key: 'name', header: 'Name', render: (c: AdminCategory) => <span className="font-medium">{c.name}</span> },
      { key: 'slug', header: 'Slug', render: (c: AdminCategory) => <span className="text-ink-muted">{c.slug}</span> },
      { key: 'products', header: 'Products', render: (c: AdminCategory) => c.productCount ?? 0 },
      {
        key: 'status',
        header: 'Status',
        render: (c: AdminCategory) => {
          const active = c.isActive ?? c.status === 'ACTIVE'
          return <Badge variant={active ? 'success' : 'danger'}>{c.status}</Badge>
        },
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (category: AdminCategory) => {
          const active = category.isActive ?? category.status === 'ACTIVE'
          return (
            <div className="flex flex-wrap items-center gap-1">
              <Switch
                checked={active}
                disabled={updatingId === category.id}
                label={active ? 'Deactivate category' : 'Activate category'}
                onCheckedChange={(next) => void onToggle(category, next)}
              />
              <IconButton label="Edit category" icon={<Pencil className="h-4 w-4 text-brand-600" />} onClick={() => openEdit(category)} />
              <IconButton label="Delete category" icon={<Trash2 className="h-4 w-4 text-danger" />} onClick={() => void onDelete(category)} />
            </div>
          )
        },
      },
    ],
    [updatingId],
  )

  return (
    <AdminPageShell
      title="Categories"
      description={`Manage catalog categories. Total: ${categories.length}`}
      actions={
        <Button variant="secondary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add category
        </Button>
      }
    >
      <AlertModal
        open={Boolean(error)}
        onClose={() => setError(null)}
        variant="error"
        title="Categories error"
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
        data={categories}
        rowKey={(c) => c.id}
        loading={loading}
        showIndex
        emptyMessage="No categories yet."
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit category' : 'Add category'}
      >
        <form className="space-y-4" onSubmit={onSubmit}>
          <FormField label="Category image">
            <ImageUpload
              value={imageData}
              onChange={setImageData}
              disabled={isSubmitting}
              label="Category image"
            />
          </FormField>
          <FormField label="Name" required error={errors.name?.message}>
            <Input {...register('name', { validate: rhf.required('Name') })} />
          </FormField>
          <FormField label="Description">
            <Textarea {...register('description')} className="min-h-24" />
          </FormField>
          <FormField label="Sort order">
            <Input type="number" {...register('sortOrder')} />
          </FormField>
          <LoadingButton type="submit" isLoading={isSubmitting} fullWidth size="sm">
            {editing ? 'Save' : 'Create'}
          </LoadingButton>
        </form>
      </Modal>
    </AdminPageShell>
  )
}
