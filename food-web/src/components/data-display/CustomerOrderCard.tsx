import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronDown,
  MapPin,
  CreditCard,
  Package,
  ShoppingBag,
  StickyNote,
} from 'lucide-react'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { OrderStatusBadge } from '@/components/data-display/OrderStatusBadge'
import { OrderProgressBar, getOrderStatusMessage } from '@/components/data-display/OrderProgressBar'
import { PriceSummaryView } from '@/components/data-display/PriceSummary'
import { ROUTES } from '@/constants'
import type { Order } from '@/types'
import { cn } from '@/utils/cn'
import { formatDateTime, formatInr } from '@/utils/format'

function formatPaymentMethod(method?: string) {
  if (!method) return 'Cash on delivery'
  if (method === 'COD') return 'Cash on delivery'
  if (method === 'UPI') return 'UPI'
  if (method === 'CARD') return 'Card'
  return method
}

function formatShippingAddress(address: Record<string, unknown> | null | undefined) {
  if (!address) return null
  const line1 = String(address.line1 ?? '')
  const line2 = address.line2 ? String(address.line2) : ''
  const city = String(address.city ?? '')
  const state = String(address.state ?? '')
  const postalCode = String(address.postalCode ?? '')
  const recipient = address.recipientName ? String(address.recipientName) : null
  const parts = [line1, line2, [city, state, postalCode].filter(Boolean).join(' ')].filter(Boolean)
  if (!parts.length) return null
  return { recipient, text: parts.join(', ') }
}

function itemCount(order: Order) {
  return order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0
}

interface CustomerOrderCardProps {
  order: Order
  defaultExpanded?: boolean
  expanded?: boolean
  layout?: 'stacked' | 'wide'
  onExpandedChange?: (expanded: boolean) => void
}

export function CustomerOrderCard({
  order,
  defaultExpanded = false,
  expanded: expandedProp,
  layout = 'stacked',
  onExpandedChange,
}: CustomerOrderCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded)
  const isControlled = expandedProp !== undefined
  const expanded = isControlled ? expandedProp : internalExpanded
  const items = order.items ?? []
  const totalItems = itemCount(order)
  const address = formatShippingAddress(order.shippingAddress)
  const isTerminal = order.status === 'DELIVERED' || order.status === 'CANCELLED' || order.status === 'FAILED'
  const isWide = layout === 'wide'

  const toggleExpanded = () => {
    const next = !expanded
    if (!isControlled) setInternalExpanded(next)
    onExpandedChange?.(next)
  }

  const previewCount = expanded ? items.length : isWide ? 3 : 2

  return (
    <Card
      padding={false}
      className={cn(
        'h-full overflow-hidden border-border/80 transition-shadow hover:shadow-md',
        !isTerminal && 'ring-1 ring-brand-100/60',
        expanded && 'shadow-md',
      )}
    >
      <div className="border-b border-border/60 bg-gradient-to-r from-brand-50/80 via-surface-elevated to-surface-elevated px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-base font-semibold tracking-tight text-ink sm:text-lg">
                {order.orderNumber}
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-medium text-ink-muted ring-1 ring-border/60">
                <Package className="h-3 w-3" />
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-muted sm:text-sm">{formatDateTime(order.createdAt)}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <p className="mt-3 text-xs text-ink-muted sm:text-sm">{getOrderStatusMessage(order.status)}</p>

        <div className="mt-4">
          <OrderProgressBar status={order.status} compact={!expanded} />
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6">
        <div
          className={cn(
            !expanded && isWide && 'xl:grid xl:grid-cols-[minmax(0,1fr)_220px] xl:items-start xl:gap-6',
          )}
        >
          <div className="min-w-0">
            <div
              className={cn(
                'space-y-2',
                expanded && items.length > 1 && (isWide ? 'md:grid md:grid-cols-2 md:gap-3 md:space-y-0' : 'space-y-2'),
              )}
            >
              {items.slice(0, previewCount).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl bg-canvas/80 px-3 py-2.5 ring-1 ring-border/50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-100 sm:h-11 sm:w-11">
                    <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{item.productName}</p>
                    <p className="text-xs text-ink-muted">
                      {item.quantity} × {formatInr(item.unitPrice, order.currency)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                    {formatInr(item.lineTotal, order.currency)}
                  </p>
                </div>
              ))}
            </div>

            {!expanded && items.length > previewCount ? (
              <p className="mt-2 text-center text-xs font-medium text-brand-600">
                +{items.length - previewCount} more {items.length - previewCount === 1 ? 'item' : 'items'}
              </p>
            ) : null}
          </div>

          <div
            className={cn(
              'mt-4 flex flex-col gap-3 border-t border-border/60 pt-4',
              !expanded && isWide && 'xl:mt-0 xl:border-t-0 xl:border-l xl:border-border/60 xl:pl-6 xl:pt-0',
            )}
          >
            <div className={cn(!expanded && isWide && 'xl:text-right')}>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Order total</p>
              <p className="font-display text-xl font-semibold tabular-nums text-ink sm:text-2xl">
                {formatInr(order.total, order.currency)}
              </p>
            </div>
            <div
              className={cn(
                'flex flex-col gap-2 sm:flex-row sm:flex-wrap',
                !expanded && isWide && 'xl:flex-col',
              )}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleExpanded}
                className="w-full sm:w-auto"
                rightIcon={
                  <ChevronDown
                    className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')}
                  />
                }
              >
                {expanded ? 'Less detail' : 'View details'}
              </Button>
              {order.status === 'DELIVERED' ? (
                <Link
                  to={ROUTES.PRODUCTS}
                  className={cn('w-full sm:w-auto', !expanded && isWide && 'xl:w-full')}
                >
                  <Button variant="secondary" size="sm" className="w-full">
                    Order again
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        {expanded ? (
          <div className="mt-5 space-y-4 border-t border-border/60 pt-5">
            <div
              className={cn(
                'grid grid-cols-1 gap-4',
                isWide && 'md:grid-cols-2',
              )}
            >
              {address ? (
                <div className="min-w-0 rounded-xl bg-canvas/80 p-4 ring-1 ring-border/50">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
                    <MapPin className="h-4 w-4 shrink-0 text-brand-600" />
                    Delivery address
                  </div>
                  {address.recipient ? (
                    <p className="text-sm font-medium text-ink">{address.recipient}</p>
                  ) : null}
                  <p className="mt-1 break-words text-sm leading-relaxed text-ink-muted">{address.text}</p>
                </div>
              ) : null}

              <div className="min-w-0 rounded-xl bg-canvas/80 p-4 ring-1 ring-border/50">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
                  <CreditCard className="h-4 w-4 shrink-0 text-brand-600" />
                  Payment
                </div>
                <p className="text-sm text-ink-muted">{formatPaymentMethod(order.paymentMethod)}</p>
              </div>
            </div>

            <div className="min-w-0 rounded-xl bg-canvas/80 p-4 ring-1 ring-border/50">
              <p className="mb-3 text-sm font-semibold text-ink">Price breakdown</p>
              <PriceSummaryView
                summary={{
                  subtotal: order.subtotal,
                  tax: order.tax,
                  deliveryFee: order.deliveryFee,
                  discount: order.discount,
                  total: order.total,
                  currency: order.currency || 'INR',
                  isEstimated: false,
                }}
              />
            </div>

            {order.notes ? (
              <div className="min-w-0 rounded-xl bg-amber-50/80 p-4 ring-1 ring-amber-100">
                <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-amber-900">
                  <StickyNote className="h-4 w-4 shrink-0" />
                  Order notes
                </div>
                <p className="break-words text-sm text-amber-900/90">{order.notes}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  )
}
