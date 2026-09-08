import { motion, useReducedMotion } from 'framer-motion'
import type { Product } from '@/types'
import { ProductCard } from './ProductCard'
import { ProductCardSkeleton } from '@/components/common/Skeleton'
import { staggerFast, viewportOnce } from '@/utils/motion'

interface ProductGridProps {
  products: Product[]
  isLoading?: boolean
  onAddToCart?: (product: Product) => void
  skeletonCount?: number
}

export function ProductGrid({
  products,
  isLoading,
  onAddToCart,
  skeletonCount = 8,
}: ProductGridProps) {
  const reduceMotion = useReducedMotion()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <motion.div
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      initial={reduceMotion ? false : 'hidden'}
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerFast}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
      ))}
    </motion.div>
  )
}
