import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type StatTone = 'brand' | 'info' | 'success' | 'danger'

interface StatCardProps {
  label: string
  value: string
  icon?: ReactNode
  tone?: StatTone
}

const cardStyles: Record<StatTone, string> = {
  brand: 'border-brand-100 bg-brand-50',
  info: 'border-brand-100/80 bg-brand-50/70',
  success: 'border-emerald-100 bg-emerald-50',
  danger: 'border-red-100 bg-red-50',
}

const valueStyles: Record<StatTone, string> = {
  brand: 'text-brand-800',
  info: 'text-brand-700',
  success: 'text-emerald-700',
  danger: 'text-red-600',
}

const iconStyles: Record<StatTone, string> = {
  brand: 'text-brand-600',
  info: 'text-brand-500',
  success: 'text-emerald-600',
  danger: 'text-red-500',
}

export function StatCard({ label, value, icon, tone = 'brand' }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border px-5 py-4 shadow-[0_1px_2px_rgb(61_8_8/0.04)]',
        cardStyles[tone],
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-ink-muted">{label}</p>
        {icon ? <span className={cn('shrink-0', iconStyles[tone])}>{icon}</span> : null}
      </div>
      <p className={cn('mt-2 text-3xl font-bold tracking-tight', valueStyles[tone])}>{value}</p>
    </div>
  )
}
