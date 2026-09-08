import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ShoppingBag } from 'lucide-react'
import type { Product } from '@/types'
import { productPath } from '@/constants/routes'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { ProductImage } from './ProductImage'
import { PriceDisplay } from './PriceDisplay'
import { fadeUp, springSoft } from '@/utils/motion'
import { cn } from '@/utils/cn'

interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product) => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const image = product.images.find((i) => i.isPrimary) ?? product.images[0]
  const reduceMotion = useReducedMotion()

  return (
    <motion.article
      variants={fadeUp}
      whileHover={reduceMotion ? undefined : { y: -6 }}
      transition={springSoft}
      className={cn(
        'group flex flex-col overflow-hidden rounded-[1.5rem] border border-border/80',
        'bg-surface-elevated shadow-[0_1px_0_rgb(11_37_69/0.04)]',
        'transition-[border-color,box-shadow] duration-300',
        'hover:border-brand-200 hover:shadow-[0_18px_40px_-24px_rgb(14_165_233/0.55)]',
      )}
    >
      <Link to={productPath(product.id)} className="relative block overflow-hidden">
        <ProductImage src={image?.url} alt={image?.altText ?? product.name} />
        {!product.isAvailable ? (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/45">
            <Badge variant="warning">Sold out</Badge>
          </div>
        ) : product.tags?.includes('popular') ? (
          <span className="absolute left-3 top-3 rounded-full bg-brand-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
            Popular
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
        {product.categoryName ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">
            {product.categoryName}
          </p>
        ) : null}
        <Link
          to={productPath(product.id)}
          className="font-display text-base font-semibold text-ink transition-colors hover:text-brand-600"
        >
          {product.name}
        </Link>
        <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-ink-muted">
          {product.shortDescription ?? product.description}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <PriceDisplay amount={product.unitPrice} currency={product.currency} />
          <Button
            size="sm"
            disabled={!product.isAvailable}
            leftIcon={<ShoppingBag className="h-4 w-4" aria-hidden />}
            onClick={() => onAddToCart?.(product)}
            aria-label={`Add ${product.name} to cart`}
          >
            Add
          </Button>
        </div>
      </div>
    </motion.article>
  )
}
