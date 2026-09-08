export interface CartItem {
  id: string
  productId: string
  productName: string
  productImageUrl?: string
  /** Display unit price from catalog; checkout recalculates server-side */
  unitPrice: number
  currency: string
  quantity: number
}

export interface Cart {
  id: string
  guestSessionId?: string
  userId?: string
  status: 'ACTIVE' | 'CHECKOUT' | 'CONVERTED' | 'ABANDONED'
  items: CartItem[]
  updatedAt: string
}

export interface PriceSummary {
  subtotal: number
  discount: number
  tax: number
  deliveryFee: number
  total: number
  currency: string
  /** True when totals are estimated locally; false when server-authoritative */
  isEstimated: boolean
}
