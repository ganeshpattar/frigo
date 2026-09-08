import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useProducts } from '@/hooks'
import { Input } from '@/components/forms/Input'
import { ProductGrid } from '@/components/data-display/ProductGrid'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { useCart, useUI } from '@/context'
import { debounce } from '@/utils/format'
import type { Product } from '@/types'

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const initial = params.get('q') ?? ''
  const [query, setQuery] = useState(initial)
  const [debounced, setDebounced] = useState(initial)

  const updateDebounced = useMemo(
    () =>
      debounce((value: string) => {
        setDebounced(value)
        setParams(value ? { q: value } : {})
      }, 300),
    [setParams],
  )

  useEffect(() => {
    updateDebounced(query)
  }, [query, updateDebounced])

  const { products, isLoading, error, refresh } = useProducts({
    search: debounced || undefined,
    pageSize: 12,
  })
  const { addItem } = useCart()
  const { pushToast } = useUI()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">Find dishes</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">Search</h1>
      <div className="relative mt-6 max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search pickles, chatni, rotti, holige..."
          className="h-12 rounded-2xl pl-11"
          aria-label="Search products"
        />
      </div>

      <div className="mt-8">
        {error ? <ErrorState description={error} onRetry={refresh} /> : null}
        {!error && !isLoading && products.length === 0 ? (
          <EmptyState
            title={debounced ? 'No matches' : 'Start typing to search'}
            description={
              debounced
                ? `Nothing found for “${debounced}”.`
                : 'Find dishes by name, ingredient, or tag.'
            }
          />
        ) : null}
        {!error && (isLoading || products.length > 0) ? (
          <ProductGrid
            products={products}
            isLoading={isLoading}
            onAddToCart={(product: Product) => {
              addItem(product, 1)
              pushToast({ title: 'Added to cart', description: product.name, variant: 'success' })
            }}
          />
        ) : null}
      </div>
    </div>
  )
}
