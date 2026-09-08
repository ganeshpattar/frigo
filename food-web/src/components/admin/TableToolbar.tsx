import type { ReactNode } from 'react'
import { Search } from 'lucide-react'
import { Card } from '@/components/common/Card'
import { Input } from '@/components/forms/Input'
import { Select } from '@/components/forms/Select'

export interface TableFilter {
  id: string
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}

interface TableToolbarProps {
  searchValue?: string
  onSearchChange?: (value: string) => void
  onSearchSubmit?: () => void
  searchPlaceholder?: string
  filters?: TableFilter[]
  children?: ReactNode
}

export function TableToolbar({
  searchValue = '',
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder = 'Search…',
  filters = [],
  children,
}: TableToolbarProps) {
  return (
    <Card padding={false} className="overflow-hidden">
      <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
        <form
          className="relative min-w-0 flex-1"
          onSubmit={(e) => {
            e.preventDefault()
            onSearchSubmit?.()
          }}
        >
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
            aria-hidden
          />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
          />
        </form>
        {filters.length ? (
          <div className="flex flex-wrap items-center gap-2">
            {filters.map((filter) => (
              <Select
                key={filter.id}
                aria-label={filter.label}
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className="min-w-[10rem]"
              >
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            ))}
          </div>
        ) : null}
        {children}
      </div>
    </Card>
  )
}
