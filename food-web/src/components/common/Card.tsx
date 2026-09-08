import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: boolean
}

export function Card({ children, className, padding = true, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border/80 bg-surface-elevated shadow-[0_1px_2px_rgb(11_37_69/0.06)]',
        padding && 'p-5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
