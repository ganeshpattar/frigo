import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Package, Save } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { FormField } from '@/components/forms/FormField'
import { Input } from '@/components/forms/Input'
import { Select } from '@/components/forms/Select'
import { Textarea } from '@/components/forms/Textarea'
import { ImageUpload } from '@/components/forms/ImageUpload'
import { LoadingButton } from '@/components/common/LoadingButton'
import { AlertModal } from '@/components/common/AlertModal'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { AdminPageShell } from '@/components/admin/AdminPageShell'
import { ROUTES } from '@/constants'
import { catalogApi } from '@/services/api'
import type { Category, ProductStatus } from '@/types'
import { getUserFriendlyMessage } from '@/utils/apiError'
import { formatCurrency } from '@/utils/format'
import { rhf } from '@/utils/validation'

const FORM_ID = 'admin-product-form'

interface ProductFormValues {
  name: string
  categoryId: string
  description: string
  shortDescription: string
  unitPrice: string
  status: ProductStatus
  sku: string
  tags: string
  initialQuantity: string
}

function statusVariant(status: ProductStatus) {
  if (status === 'ACTIVE') return 'success' as const
  if (status === 'DRAFT') return 'warning' as const
  return 'neutral' as const
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <div className="mb-5 border-b border-border/60 pb-4">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-ink-muted">{description}</p> : null}
      </div>
      <div className="space-y-5">{children}</div>
    </Card>
  )
}

export function AdminProductFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(isEdit)
  const [imageData, setImageData] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    defaultValues: {
      name: '',
      categoryId: '',
      description: '',
      shortDescription: '',
      unitPrice: '',
      status: 'ACTIVE',
      sku: '',
      tags: '',
      initialQuantity: '50',
    },
  })

  const watchedName = watch('name')
  const watchedPrice = watch('unitPrice')
  const watchedStatus = watch('status')
  const watchedCategoryId = watch('categoryId')
  const watchedShortDescription = watch('shortDescription')

  const categoryName = useMemo(
    () => categories.find((c) => c.id === watchedCategoryId)?.name,
    [categories, watchedCategoryId],
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const cats = await catalogApi.getCategories()
        if (!cancelled) setCategories(cats)
        if (isEdit && id) {
          const product = await catalogApi.getProduct(id)
          if (!cancelled) {
            reset({
              name: product.name,
              categoryId: product.categoryId,
              description: product.description ?? '',
              shortDescription: product.shortDescription ?? '',
              unitPrice: String(product.unitPrice),
              status: product.status,
              sku: product.sku ?? '',
              tags: product.tags?.join(', ') ?? '',
              initialQuantity: '0',
            })
            setImageData(product.images?.[0]?.url ?? null)
          }
        }
      } catch (err) {
        if (!cancelled) setError(getUserFriendlyMessage(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, isEdit, reset])

  const onSubmit = handleSubmit(async (values) => {
    setError(null)
    const tags = values.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    try {
      const imageUrl = imageData || undefined
      if (isEdit && id) {
        await catalogApi.updateProduct(id, {
          name: values.name.trim(),
          categoryId: values.categoryId,
          description: values.description.trim() || undefined,
          shortDescription: values.shortDescription.trim() || undefined,
          unitPrice: Number(values.unitPrice),
          status: values.status,
          imageUrl: imageData ?? undefined,
          tags,
          sku: values.sku.trim() || undefined,
        })
      } else {
        await catalogApi.createProduct({
          name: values.name.trim(),
          categoryId: values.categoryId,
          description: values.description.trim() || undefined,
          shortDescription: values.shortDescription.trim() || undefined,
          unitPrice: Number(values.unitPrice),
          status: values.status,
          imageUrl,
          tags,
          sku: values.sku.trim() || undefined,
          initialQuantity: Number(values.initialQuantity) || 0,
        })
      }
      navigate(ROUTES.ADMIN_PRODUCTS)
    } catch (err) {
      setError(getUserFriendlyMessage(err))
    }
  })

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    )
  }

  const previewPrice = Number(watchedPrice)
  const priceLabel =
    watchedPrice && !Number.isNaN(previewPrice) && previewPrice > 0
      ? formatCurrency(previewPrice)
      : '—'

  return (
    <AdminPageShell
      title={isEdit ? 'Edit product' : 'Add product'}
      description={
        isEdit
          ? 'Update catalog details, pricing, and visibility.'
          : 'Create a new menu item for your storefront.'
      }
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate(ROUTES.ADMIN_PRODUCTS)}
          >
            Back
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => navigate(ROUTES.ADMIN_PRODUCTS)}
          >
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            form={FORM_ID}
            size="sm"
            isLoading={isSubmitting}
            leftIcon={<Save className="h-4 w-4" />}
          >
            {isEdit ? 'Save changes' : 'Create product'}
          </LoadingButton>
        </div>
      }
    >
      <AlertModal
        open={Boolean(error)}
        onClose={() => setError(null)}
        variant="error"
        title="Save failed"
        description={error ?? undefined}
      />

      <form id={FORM_ID} className="grid gap-5 lg:grid-cols-[minmax(0,320px)_1fr]" onSubmit={onSubmit}>
        <div className="space-y-5 lg:sticky lg:top-4 lg:self-start">
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <span className="rounded-lg bg-brand-50 p-2 text-brand-600 dark:bg-brand-900/40">
                <Package className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-ink">Product image</h2>
                <p className="text-xs text-ink-muted">Shown on menu and product pages</p>
              </div>
            </div>
            <ImageUpload value={imageData} onChange={setImageData} disabled={isSubmitting} />
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-border/60 bg-brand-50/40 px-4 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Live preview
              </p>
            </div>
            <div className="p-4">
              <div className="overflow-hidden rounded-xl border border-border bg-surface">
                {imageData ? (
                  <img
                    src={imageData}
                    alt={watchedName || 'Product preview'}
                    className="h-36 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-36 items-center justify-center bg-brand-50/50 text-sm text-ink-muted">
                    No image yet
                  </div>
                )}
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-ink">
                    {watchedName.trim() || 'Product name'}
                  </p>
                  <Badge variant={statusVariant(watchedStatus)} uppercase>
                    {watchedStatus}
                  </Badge>
                </div>
                {categoryName ? (
                  <p className="text-xs font-medium text-brand-600">{categoryName}</p>
                ) : null}
                {watchedShortDescription ? (
                  <p className="text-sm text-ink-muted line-clamp-2">{watchedShortDescription}</p>
                ) : null}
                <p className="text-lg font-bold text-ink">{priceLabel}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <FormSection
            title="Basic information"
            description="Name, category, and descriptions customers will see."
          >
            <FormField label="Product name" required error={errors.name?.message}>
              <Input
                {...register('name', { validate: rhf.required('Product name') })}
                placeholder="e.g. Mango Pickle 500g"
              />
            </FormField>

            <FormField label="Category" required error={errors.categoryId?.message}>
              <Select {...register('categoryId', { validate: rhf.required('Category') })}>
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              label="Short description"
              hint="One line shown on product cards"
              error={errors.shortDescription?.message}
            >
              <Input
                {...register('shortDescription')}
                placeholder="Brief summary for listings"
              />
            </FormField>

            <FormField label="Full description" error={errors.description?.message}>
              <Textarea
                {...register('description')}
                className="min-h-32"
                placeholder="Ingredients, serving size, storage tips…"
              />
            </FormField>
          </FormSection>

          <FormSection
            title="Pricing & catalog"
            description="Price, SKU, status, and search tags."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Unit price (INR)" required error={errors.unitPrice?.message}>
                <Input
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="299"
                  {...register('unitPrice', {
                    validate: (v) => (Number(v) > 0 ? true : 'Enter a valid price'),
                  })}
                />
              </FormField>

              <FormField label="SKU" hint="Auto-generated if left empty">
                <Input {...register('sku')} placeholder="FRG-MANGO-500" />
              </FormField>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Status">
                <Select {...register('status')}>
                  <option value="ACTIVE">Active — visible on menu</option>
                  <option value="DRAFT">Draft — hidden from customers</option>
                  <option value="INACTIVE">Inactive — not orderable</option>
                </Select>
              </FormField>

              <FormField label="Tags" hint="Comma separated">
                <Input {...register('tags')} placeholder="spicy, bestseller, vegan" />
              </FormField>
            </div>
          </FormSection>

          {!isEdit ? (
            <FormSection
              title="Initial inventory"
              description="Starting stock when this product is created."
            >
              <FormField label="Stock quantity">
                <Input
                  type="number"
                  min="0"
                  {...register('initialQuantity')}
                  placeholder="50"
                />
              </FormField>
            </FormSection>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-2 rounded-xl border border-border/80 bg-surface-elevated p-4 lg:hidden">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(ROUTES.ADMIN_PRODUCTS)}
            >
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              isLoading={isSubmitting}
              leftIcon={<Save className="h-4 w-4" />}
            >
              {isEdit ? 'Save changes' : 'Create product'}
            </LoadingButton>
          </div>
        </div>
      </form>
    </AdminPageShell>
  )
}
