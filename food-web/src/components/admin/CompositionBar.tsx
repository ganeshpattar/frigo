import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { Card } from '@/components/common/Card'

export interface CompositionItem {
  icon: ReactNode
  label: string
  tone?: 'brand' | 'accent' | 'success'
}

interface CompositionBarProps {
  title: string
  items: CompositionItem[]
}

const pillStyles: Record<NonNullable<CompositionItem['tone']>, string> = {
  brand: 'border-brand-100 bg-brand-50 text-brand-700',
  accent: 'border-brand-200 bg-brand-100/60 text-brand-800',
  success: 'border-emerald-100 bg-emerald-50 text-emerald-700',
}

export function CompositionBar({ title, items }: CompositionBarProps) {
  return (
    <Card padding={false} className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{title}</p>
        <div className="flex flex-wrap items-center gap-2">
          {items.map((item) => (
            <span
              key={item.label}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium',
                pillStyles[item.tone ?? 'brand'],
              )}
            >
              {item.icon}
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </Card>
  )
}
