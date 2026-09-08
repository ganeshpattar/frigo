import type { Cart, CartItem } from '@/types'
import { appConfig } from '@/app/config/env'
import { apiClient } from './apiClient'
import { delay } from '@/mocks/data'

/**
 * Cart Service API — guest and authenticated carts.
 * Local guest cart is managed in CartContext; these endpoints are for gateway sync.
 */
export const cartApi = {
  async getCart(): Promise<Cart> {
    if (appConfig.useMocks) {
      await delay()
      throw new Error('Use local cart in mock mode')
    }
    const { data } = await apiClient.get<Cart>('/cart')
    return data
  },

  async mergeGuestCart(guestSessionId: string, items: CartItem[]): Promise<Cart> {
    if (appConfig.useMocks) {
      await delay(300)
      return {
        id: `cart_merged_${crypto.randomUUID()}`,
        status: 'ACTIVE',
        items,
        updatedAt: new Date().toISOString(),
        guestSessionId,
      }
    }
    const { data } = await apiClient.post<Cart>('/cart/merge', { guestSessionId, items })
    return data
  },

  async addItem(productId: string, quantity: number): Promise<Cart> {
    const { data } = await apiClient.post<Cart>('/cart/items', { productId, quantity })
    return data
  },

  async updateItem(itemId: string, quantity: number): Promise<Cart> {
    const { data } = await apiClient.patch<Cart>(`/cart/items/${itemId}`, { quantity })
    return data
  },

  async removeItem(itemId: string): Promise<Cart> {
    const { data } = await apiClient.delete<Cart>(`/cart/items/${itemId}`)
    return data
  },
}
