import { Card } from '@/components/common/Card'
import { cn } from '@/utils/cn'

export interface TrendPoint {
  label: string
  value: number
}

interface TrendChartProps {
  title: string
  subtitle?: string
  data: TrendPoint[]
  valuePrefix?: string
  tone?: 'brand' | 'success'
  formatValue?: (value: number) => string
}

export function TrendChart({
  title,
  subtitle,
  data,
  valuePrefix = '',
  tone = 'brand',
  formatValue,
}: TrendChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1)
  const format = formatValue ?? ((v: number) => `${valuePrefix}${v}`)

  const points = data.map((d, i) => {
    const x = data.length <= 1 ? 50 : (i / (data.length - 1)) * 100
    const y = 100 - (d.value / max) * 82 - 8
    return { x, y, ...d }
  })

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? 100} 100 L ${points[0]?.x ?? 0} 100 Z`

  const stroke = tone === 'brand' ? '#900000' : '#22C55E'
  const fill = tone === 'brand' ? 'rgba(14,165,233,0.12)' : 'rgba(34,197,94,0.12)'

  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p> : null}
      </div>
      <div className="relative h-44">
        <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible" preserveAspectRatio="none">
          {[25, 50, 75].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="currentColor"
              className="text-border/80"
              strokeWidth="0.3"
            />
          ))}
          <path d={areaPath} fill={fill} />
          <path d={linePath} fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
          {points.map((p) => (
            <circle key={p.label} cx={p.x} cy={p.y} r="1.8" fill={stroke} />
          ))}
        </svg>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center">
        {data.map((d) => (
          <div key={d.label} className="min-w-0">
            <p className="truncate text-[10px] font-medium uppercase tracking-wide text-ink-muted">
              {d.label}
            </p>
            <p className="mt-0.5 text-xs font-semibold tabular-nums text-ink">{format(d.value)}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

interface BarChartItem {
  label: string
  value: number
  sublabel?: string
}

interface HorizontalBarChartProps {
  title: string
  subtitle?: string
  data: BarChartItem[]
  valueFormatter?: (value: number) => string
  tone?: 'brand' | 'success' | 'warning' | 'danger'
}

const barTone: Record<NonNullable<HorizontalBarChartProps['tone']>, string> = {
  brand: 'bg-brand-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
}

export function HorizontalBarChart({
  title,
  subtitle,
  data,
  valueFormatter = (v) => String(v),
  tone = 'brand',
}: HorizontalBarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p> : null}
      </div>
      <div className="space-y-3">
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">No data yet.</p>
        ) : (
          data.map((item) => (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <span className="truncate font-medium text-ink">{item.label}</span>
                <span className="shrink-0 font-semibold tabular-nums text-ink-muted">
                  {valueFormatter(item.value)}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-brand-50">
                <div
                  className={cn('h-full rounded-full transition-all', barTone[tone])}
                  style={{ width: `${Math.max((item.value / max) * 100, item.value > 0 ? 8 : 0)}%` }}
                />
              </div>
              {item.sublabel ? (
                <p className="mt-0.5 text-xs text-ink-muted">{item.sublabel}</p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </Card>
  )
}

export interface DonutSegment {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  title: string
  subtitle?: string
  segments: DonutSegment[]
}

export function DonutChart({ title, subtitle, segments }: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0)

  let cumulative = 0
  const gradientStops = segments
    .map((segment) => {
      const start = (cumulative / Math.max(total, 1)) * 360
      cumulative += segment.value
      const end = (cumulative / Math.max(total, 1)) * 360
      return `${segment.color} ${start}deg ${end}deg`
    })
    .join(', ')

  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p> : null}
      </div>
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <div
          className="relative h-36 w-36 shrink-0 rounded-full"
          style={{
            background: total > 0 ? `conic-gradient(${gradientStops})` : '#E2E8F0',
          }}
        >
          <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-surface-elevated text-center">
            <span className="text-2xl font-bold text-ink">{total}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
              Total
            </span>
          </div>
        </div>
        <div className="w-full flex-1 space-y-2">
          {segments.length === 0 ? (
            <p className="text-sm text-ink-muted">No orders yet.</p>
          ) : (
            segments.map((segment) => (
              <div key={segment.label} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="truncate text-ink">{segment.label}</span>
                </div>
                <span className="font-semibold tabular-nums text-ink-muted">{segment.value}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  )
}
