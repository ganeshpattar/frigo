import { motion, useReducedMotion } from 'framer-motion'
import type { PriceSummary } from '@/types'
import { formatCurrency } from '@/utils/format'
import { PriceDisplay } from './PriceDisplay'
import { springSoft } from '@/utils/motion'
import { cn } from '@/utils/cn'

interface PriceSummaryProps {
  summary: PriceSummary
  animated?: boolean
  className?: string
}

function SummaryRow({
  label,
  amount,
  currency,
  tone = 'muted',
  animated,
}: {
  label: string
  amount: number
  currency: string
  tone?: 'muted' | 'success' | 'total'
  animated?: boolean
}) {
  const reduceMotion = useReducedMotion()
  const isTotal = tone === 'total'

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3',
        isTotal ? 'pt-1 text-base font-bold text-ink' : 'text-sm',
        tone === 'muted' && 'text-ink-muted',
        tone === 'success' && 'text-success',
      )}
    >
      <span>{label}</span>
      <motion.span
        key={`${label}-${amount}`}
        initial={animated && !reduceMotion ? { y: 6, opacity: 0 } : false}
        animate={{ y: 0, opacity: 1 }}
        transition={springSoft}
        className="tabular-nums"
      >
        {tone === 'success' ? (
          <span>-{formatCurrency(amount, currency)}</span>
        ) : (
          <PriceDisplay amount={amount} currency={currency} size={isTotal ? 'md' : 'sm'} />
        )}
      </motion.span>
    </div>
  )
}

export function PriceSummaryView({ summary, animated = false, className }: PriceSummaryProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <SummaryRow
        label="Subtotal"
        amount={summary.subtotal}
        currency={summary.currency}
        animated={animated}
      />
      {summary.discount > 0 ? (
        <SummaryRow
          label="Discount"
          amount={summary.discount}
          currency={summary.currency}
          tone="success"
          animated={animated}
        />
      ) : null}
      <SummaryRow label="Tax" amount={summary.tax} currency={summary.currency} animated={animated} />
      <SummaryRow
        label="Delivery"
        amount={summary.deliveryFee}
        currency={summary.currency}
        animated={animated}
      />
      <div className="border-t border-border/80 pt-3">
        <SummaryRow
          label="Total"
          amount={summary.total}
          currency={summary.currency}
          tone="total"
          animated={animated}
        />
      </div>
      {summary.isEstimated ? (
        <p className="text-xs leading-relaxed text-ink-muted">
          Estimated totals. Final pricing is confirmed at checkout by the server.
        </p>
      ) : null}
      {summary.subtotal > 0 && summary.subtotal < 500 ? (
        <div className="rounded-xl bg-brand-50 px-3 py-2 text-xs font-medium text-brand-800 ring-1 ring-brand-100 dark:bg-brand-900/30 dark:text-brand-100 dark:ring-brand-800">
          Add {formatCurrency(500 - summary.subtotal, summary.currency)} more for free delivery.
        </div>
      ) : null}
      {summary.subtotal >= 500 ? (
        <div className="rounded-xl bg-success/10 px-3 py-2 text-xs font-medium text-success ring-1 ring-success/20">
          You unlocked free delivery on this order.
        </div>
      ) : null}
    </div>
  )
}
