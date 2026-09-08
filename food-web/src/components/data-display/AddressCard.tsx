import type { Address } from '@/types'
import { Badge } from '@/components/common/Badge'
import { Card } from '@/components/common/Card'

interface AddressCardProps {
  address: Address
}

export function AddressCard({ address }: AddressCardProps) {
  return (
    <Card className="relative">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-ink">{address.label}</p>
        {address.isDefault ? <Badge variant="brand">Default</Badge> : null}
      </div>
      <p className="mt-2 text-sm text-ink-muted">
        {address.line1}
        {address.line2 ? `, ${address.line2}` : ''}
        <br />
        {address.city}, {address.state} {address.postalCode}
        <br />
        {address.country}
      </p>
    </Card>
  )
}
