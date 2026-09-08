import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useProducts, useCategories } from '@/hooks'
import { ProductGrid } from '@/components/data-display/ProductGrid'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Breadcrumb } from '@/components/navigation/Breadcrumb'
import { useCart, useUI } from '@/context'
import type { Product } from '@/types'
import { ROUTES } from '@/constants'
import { cn } from '@/utils/cn'
import { fadeUp, tweenOut } from '@/utils/motion'

export function ProductsPage() {
  const [categoryId, setCategoryId] = useState('')
  const [sort, setSort] = useState<'newest' | 'name' | 'price_asc' | 'price_desc'>('newest')
  const reduceMotion = useReducedMotion()
  const params = useMemo(
    () => ({
      pageSize: 12,
      categoryId: categoryId || undefined,
      sort,
    }),
    [categoryId, sort],
  )
  const { products, isLoading, error, refresh } = useProducts(params)
  const { categories } = useCategories()
  const { addItem } = useCart()
  const { pushToast } = useUI()

  const handleAdd = (product: Product) => {
    addItem(product, 1)
    pushToast({ title: 'Added to cart', description: product.name, variant: 'success' })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <Breadcrumb items={[{ label: 'Home', to: ROUTES.HOME }, { label: 'Menu' }]} />
      <motion.div
        className="mb-8"
        initial={reduceMotion ? false : 'hidden'}
        animate="visible"
        variants={fadeUp}
        transition={tweenOut}
      >
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">Catalog</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">Menu</h1>
        <p className="mt-2 max-w-xl text-ink-muted">
          Filter by Pickles, Chatni, Rotti, or Holige — then add what you need.
        </p>
      </motion.div>

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Categories">
          <button
            type="button"
            onClick={() => setCategoryId('')}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
              !categoryId
                ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30'
                : 'bg-surface-elevated text-ink-muted ring-1 ring-border hover:text-ink',
            )}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryId(c.id)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                categoryId === c.id
                  ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30'
                  : 'bg-surface-elevated text-ink-muted ring-1 ring-border hover:text-ink',
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <span className="whitespace-nowrap">Sort</span>
          <select
            aria-label="Sort products"
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="rounded-xl border border-border bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink focus:border-brand-500 focus:outline-none"
          >
            <option value="newest">Featured</option>
            <option value="name">Name</option>
            <option value="price_asc">Price: Low to high</option>
            <option value="price_desc">Price: High to low</option>
          </select>
        </label>
      </div>

      {error ? <ErrorState description={error} onRetry={refresh} /> : null}
      {!error && !isLoading && products.length === 0 ? (
        <EmptyState title="No products found" description="Try another category or clear filters." />
      ) : null}
      {!error && (isLoading || products.length > 0) ? (
        <ProductGrid products={products} isLoading={isLoading} onAddToCart={handleAdd} />
      ) : null}
    </div>
  )
}
