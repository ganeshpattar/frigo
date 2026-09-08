export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'FAILED'

export interface OrderItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface Order {
  id: string
  orderNumber: string
  status: OrderStatus
  items: OrderItem[]
  subtotal: number
  tax: number
  deliveryFee: number
  discount: number
  total: number
  currency: string
  createdAt: string
  updatedAt: string
  userId?: string
  customerEmail?: string
  customerName?: string
  customerPhone?: string
  paymentMethod?: string
  shippingAddress?: Record<string, unknown> | null
  notes?: string | null
}

export interface OrderTimelineEvent {
  status: OrderStatus
  label: string
  timestamp?: string
  completed: boolean
}

export interface OrderStatusHistoryEntry {
  id: string
  orderId: string
  fromStatus: OrderStatus | null
  toStatus: OrderStatus
  changedByUserId: string | null
  changedAt: string
}
