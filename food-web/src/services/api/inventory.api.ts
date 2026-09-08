import { apiClient } from './apiClient'

export interface InventoryItem {
  productId: string
  productName: string
  sku?: string | null
  imageUrl?: string | null
  quantityOnHand: number
  reserved: number
  available: number
}

export type StockTransactionType =
  | 'INITIAL'
  | 'ORDER'
  | 'ADJUSTMENT'
  | 'MANUAL_SET'
  | 'RESERVE'
  | 'FULFILL'
  | 'RELEASE'

export interface StockTransaction {
  id: string
  productId: string
  type: StockTransactionType
  quantityChange: number
  quantityBefore: number
  quantityAfter: number
  orderId: string | null
  orderNumber: string | null
  referenceNote: string | null
  createdByUserId: string | null
  createdAt: string
}

export const inventoryApi = {
  async list(): Promise<InventoryItem[]> {
    const { data } = await apiClient.get<InventoryItem[]>('/inventory')
    return data
  },

  async getTransactions(
    productId: string,
    page = 1,
    pageSize = 50,
  ): Promise<{
    data: StockTransaction[]
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }> {
    const { data } = await apiClient.get<{
      data: StockTransaction[]
      page: number
      pageSize: number
      totalItems: number
      totalPages: number
    }>(`/inventory/${productId}/transactions`, {
      params: { page, pageSize },
    })
    return data
  },

  async setAvailable(productId: string, availableQuantity: number): Promise<InventoryItem> {
    const { data } = await apiClient.patch<InventoryItem>(`/inventory/${productId}`, {
      availableQuantity,
    })
    return data
  },

  async adjust(productId: string, adjustment: number): Promise<InventoryItem> {
    const { data } = await apiClient.patch<InventoryItem>(`/inventory/${productId}`, {
      adjustment,
    })
    return data
  },
}
