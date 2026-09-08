import type { Order, OrderStatus, OrderStatusHistoryEntry, PaginatedResponse } from '@/types'
import { apiClient } from './apiClient'

export interface CheckoutAddressPayload {
  label?: string
  recipientName: string
  phone?: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country?: string
}

export interface CreateOrderPayload {
  items: Array<{ productId: string; quantity: number }>
  shippingAddress: CheckoutAddressPayload
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  paymentMethod?: 'COD' | 'UPI' | 'CARD'
  notes?: string
}

export const ordersApi = {
  async list(
    page = 1,
    pageSize = 20,
    status?: OrderStatus,
    mine = false,
  ): Promise<PaginatedResponse<Order>> {
    const { data } = await apiClient.get<PaginatedResponse<Order>>('/orders', {
      params: { page, pageSize, status, mine: mine ? 'true' : undefined },
    })
    return data
  },

  async listMine(page = 1, pageSize = 20): Promise<PaginatedResponse<Order>> {
    return this.list(page, pageSize, undefined, true)
  },

  async getById(orderId: string): Promise<Order> {
    const { data } = await apiClient.get<Order>(`/orders/${orderId}`)
    return data
  },

  async create(payload: CreateOrderPayload): Promise<Order> {
    const { data } = await apiClient.post<Order>('/orders', payload)
    return data
  },

  async checkout(payload: CreateOrderPayload): Promise<{ order: Order; message?: string }> {
    const { data } = await apiClient.post<{ order: Order; message?: string }>('/checkout', payload)
    return data
  },

  async updateStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const { data } = await apiClient.patch<Order>(`/orders/${orderId}/status`, { status })
    return data
  },

  async getHistory(orderId: string): Promise<OrderStatusHistoryEntry[]> {
    const { data } = await apiClient.get<{ data: OrderStatusHistoryEntry[] }>(
      `/orders/${orderId}/history`,
    )
    return data.data
  },
}
