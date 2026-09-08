import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { Card } from '@/components/common/Card'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export interface DataTableColumn<T> {
  key: string
  header: string
  className?: string
  headerClassName?: string
  render: (row: T, index: number) => ReactNode
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  rowKey: (row: T) => string
  loading?: boolean
  emptyMessage?: string
  showIndex?: boolean
  indexOffset?: number
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  loading = false,
  emptyMessage = 'No records found.',
  showIndex = false,
  indexOffset = 0,
}: DataTableProps<T>) {
  const colCount = columns.length + (showIndex ? 1 : 0)

  return (
    <Card padding={false} className="overflow-hidden">
      {loading ? (
        <div className="flex justify-center py-14">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-elevated">
              <tr>
                {showIndex ? (
                  <th className="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    #
                  </th>
                ) : null}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted',
                      col.headerClassName,
                    )}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 bg-surface-elevated">
              {data.map((row, index) => (
                <tr
                  key={rowKey(row)}
                  className="transition-colors hover:bg-brand-50/30 dark:hover:bg-brand-900/15"
                >
                  {showIndex ? (
                    <td className="whitespace-nowrap px-5 py-3.5 text-ink-muted">
                      {indexOffset + index + 1}
                    </td>
                  ) : null}
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-5 py-3.5 align-middle', col.className)}>
                      {col.render(row, index)}
                    </td>
                  ))}
                </tr>
              ))}
              {!data.length ? (
                <tr>
                  <td colSpan={colCount} className="px-5 py-12 text-center text-ink-muted">
                    {emptyMessage}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
