import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ShoppingBag } from 'lucide-react'
import { ROUTES } from '@/constants'
import { useProduct } from '@/hooks'
import { useCart, useUI } from '@/context'
import { Breadcrumb } from '@/components/navigation/Breadcrumb'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorState } from '@/components/common/ErrorState'
import { ProductImage } from '@/components/data-display/ProductImage'
import { PriceDisplay } from '@/components/data-display/PriceDisplay'
import { QuantitySelector } from '@/components/data-display/QuantitySelector'
import { fadeUp, staggerContainer, tweenOut } from '@/utils/motion'

export function ProductDetailPage() {
  const { productId } = useParams()
  const { product, isLoading, error, refresh } = useProduct(productId)
  const [quantity, setQuantity] = useState(1)
  const { addItem } = useCart()
  const { pushToast } = useUI()
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !product) {
    return <ErrorState description={error ?? 'Product not found.'} onRetry={refresh} />
  }

  const image = product.images.find((i) => i.isPrimary) ?? product.images[0]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <Breadcrumb
        items={[
          { label: 'Home', to: ROUTES.HOME },
          { label: 'Menu', to: ROUTES.PRODUCTS },
          { label: product.name },
        ]}
      />
      <motion.div
        className="grid gap-8 lg:grid-cols-2 lg:gap-12"
        initial={reduceMotion ? false : 'hidden'}
        animate="visible"
        variants={staggerContainer}
      >
        <motion.div
          variants={fadeUp}
          transition={tweenOut}
          className="overflow-hidden rounded-[2rem] border border-border/80 bg-surface-elevated shadow-[0_24px_60px_-36px_rgb(14_165_233/0.45)]"
        >
          <ProductImage src={image?.url} alt={image?.altText ?? product.name} aspect="square" />
        </motion.div>
        <motion.div variants={fadeUp} transition={tweenOut} className="flex flex-col justify-center">
          {product.categoryName ? (
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">
              {product.categoryName}
            </p>
          ) : null}
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {product.name}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <PriceDisplay amount={product.unitPrice} currency={product.currency} size="lg" />
            {product.isAvailable ? (
              <Badge variant="success">Available</Badge>
            ) : (
              <Badge variant="warning">Sold out</Badge>
            )}
          </div>
          <p className="mt-6 text-base leading-relaxed text-ink-muted">{product.description}</p>
          {product.tags?.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          ) : null}
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <QuantitySelector value={quantity} onChange={setQuantity} />
            <Button
              size="lg"
              disabled={!product.isAvailable}
              leftIcon={<ShoppingBag className="h-4 w-4" />}
              onClick={() => {
                addItem(product, quantity)
                pushToast({
                  title: 'Added to cart',
                  description: `${quantity} × ${product.name}`,
                  variant: 'success',
                })
              }}
            >
              Add to cart
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate(ROUTES.CART)}>
              Go to cart
            </Button>
          </div>
          <p className="mt-5 text-xs text-ink-muted">
            Browsing prices are estimates. Final totals are calculated securely at checkout.
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
