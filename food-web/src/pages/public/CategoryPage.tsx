import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { catalogApi } from '@/services/api'
import type { Category, Product } from '@/types'
import { ProductGrid } from '@/components/data-display/ProductGrid'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { Breadcrumb } from '@/components/navigation/Breadcrumb'
import { ROUTES } from '@/constants'
import { useCart, useUI } from '@/context'
import { getUserFriendlyMessage } from '@/utils/apiError'

export function CategoryPage() {
  const { categoryId } = useParams()
  const [category, setCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { addItem } = useCart()
  const { pushToast } = useUI()

  const load = async () => {
    if (!categoryId) return
    setIsLoading(true)
    setError(null)
    try {
      const [cat, list] = await Promise.all([
        catalogApi.getCategory(categoryId),
        catalogApi.getProducts({ categoryId, pageSize: 24 }),
      ])
      setCategory(cat)
      setProducts(list.data)
    } catch (err) {
      setError(getUserFriendlyMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId])

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) return <ErrorState description={error} onRetry={() => void load()} />

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumb
        items={[
          { label: 'Home', to: ROUTES.HOME },
          { label: 'Products', to: ROUTES.PRODUCTS },
          { label: category?.name ?? 'Category' },
        ]}
      />
      <h1 className="font-display text-3xl font-semibold">{category?.name}</h1>
      {category?.description ? (
        <p className="mt-2 text-ink-muted">{category.description}</p>
      ) : null}
      <div className="mt-8">
        {products.length === 0 ? (
          <EmptyState title="No products in this category" />
        ) : (
          <ProductGrid
            products={products}
            onAddToCart={(product) => {
              addItem(product, 1)
              pushToast({ title: 'Added to cart', description: product.name, variant: 'success' })
            }}
          />
        )}
      </div>
    </div>
  )
}
