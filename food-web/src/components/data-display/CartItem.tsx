import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import type { CartItem as CartItemType } from '@/types'
import { productPath } from '@/constants/routes'
import { IconButton } from '@/components/common/IconButton'
import { ProductImage } from './ProductImage'
import { PriceDisplay } from './PriceDisplay'
import { QuantitySelector } from './QuantitySelector'
import { springSoft } from '@/utils/motion'

interface CartItemProps {
  item: CartItemType
  index?: number
  onQuantityChange: (itemId: string, quantity: number) => void
  onRemove: (itemId: string) => void
}

export function CartItemRow({ item, index = 0, onQuantityChange, onRemove }: CartItemProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.li
      layout
      initial={reduceMotion ? false : { opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, x: 24, height: 0, marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ ...springSoft, delay: index * 0.04 }}
      className="list-none overflow-hidden"
    >
      <div className="group flex gap-3 rounded-2xl p-3 transition-colors hover:bg-brand-50/60 sm:gap-4 sm:p-4 dark:hover:bg-brand-900/20">
        <Link
          to={productPath(item.productId)}
          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl ring-1 ring-border/80 sm:h-24 sm:w-24"
        >
          <ProductImage
            src={item.productImageUrl}
            alt={item.productName}
            aspect="fill"
            className="absolute inset-0"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                to={productPath(item.productId)}
                className="font-display text-base font-semibold text-ink transition-colors hover:text-brand-600"
              >
                {item.productName}
              </Link>
              <PriceDisplay
                amount={item.unitPrice}
                currency={item.currency}
                size="sm"
                className="mt-0.5 text-ink-muted"
              />
            </div>
            <IconButton
              label={`Remove ${item.productName}`}
              className="text-ink-muted hover:bg-danger/10 hover:text-danger"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={() => onRemove(item.id)}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <QuantitySelector
              value={item.quantity}
              onChange={(qty) => onQuantityChange(item.id, qty)}
              min={1}
            />
            <motion.div
              key={`${item.id}-${item.quantity}`}
              initial={reduceMotion ? false : { scale: 0.92, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={springSoft}
            >
              <PriceDisplay
                amount={item.unitPrice * item.quantity}
                currency={item.currency}
                size="md"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.li>
  )
}
