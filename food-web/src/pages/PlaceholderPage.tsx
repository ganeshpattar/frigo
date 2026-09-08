import { Card } from '@/components/common/Card'

interface PlaceholderPageProps {
  title: string
  description?: string
}

export function PlaceholderPage({
  title,
  description = 'This screen is scaffolded for routing and will be connected to the API Gateway next.',
}: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Card>
        <h1 className="font-display text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-ink-muted">{description}</p>
      </Card>
    </div>
  )
}
