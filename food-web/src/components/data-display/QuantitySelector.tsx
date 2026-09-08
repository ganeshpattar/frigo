import { motion, useReducedMotion } from 'framer-motion'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/utils/cn'
import { springSoft } from '@/utils/motion'

interface QuantitySelectorProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  className?: string
}

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  className,
}: QuantitySelectorProps) {
  const reduceMotion = useReducedMotion()

  return (
    <div
      className={cn(
        'inline-flex items-center overflow-hidden rounded-full border border-border bg-surface-elevated shadow-sm',
        className,
      )}
      role="group"
      aria-label="Quantity"
    >
      <motion.button
        type="button"
        aria-label="Decrease quantity"
        whileTap={reduceMotion ? undefined : { scale: 0.88 }}
        transition={springSoft}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="inline-flex h-9 w-9 items-center justify-center text-ink transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-brand-900/30"
      >
        <Minus className="h-4 w-4" />
      </motion.button>
      <motion.span
        key={value}
        initial={reduceMotion ? false : { scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={springSoft}
        className="min-w-8 text-center text-sm font-bold tabular-nums text-ink"
        aria-live="polite"
      >
        {value}
      </motion.span>
      <motion.button
        type="button"
        aria-label="Increase quantity"
        whileTap={reduceMotion ? undefined : { scale: 0.88 }}
        transition={springSoft}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="inline-flex h-9 w-9 items-center justify-center text-ink transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-brand-900/30"
      >
        <Plus className="h-4 w-4" />
      </motion.button>
    </div>
  )
}
