import type { Cart, CartItem } from '@/types'
import { appConfig } from '@/app/config/env'
import { apiClient } from './apiClient'
import { delay } from '@/mocks/data'

/**
 * Cart is client-side (localStorage) until a dedicated cart service exists.
 * Merge after login keeps the guest cart locally — no backend /cart routes yet.
 */
const useLocalCart = true

export const cartApi = {
  async getCart(): Promise<Cart> {
    if (appConfig.useMocks || useLocalCart) {
      await delay()
      throw new Error('Use local cart — server cart is not available')
    }
    const { data } = await apiClient.get<Cart>('/cart')
    return data
  },

  async mergeGuestCart(guestSessionId: string, items: CartItem[]): Promise<Cart> {
    // Always local: gateway has no /cart/merge (would 404 on Render)
    await delay(50)
    return {
      id: `cart_merged_${crypto.randomUUID()}`,
      status: 'ACTIVE',
      items,
      updatedAt: new Date().toISOString(),
      guestSessionId,
    }
  },

  async addItem(productId: string, quantity: number): Promise<Cart> {
    if (useLocalCart) {
      throw new Error('Use local cart — server cart is not available')
    }
    const { data } = await apiClient.post<Cart>('/cart/items', { productId, quantity })
    return data
  },

  async updateItem(itemId: string, quantity: number): Promise<Cart> {
    if (useLocalCart) {
      throw new Error('Use local cart — server cart is not available')
    }
    const { data } = await apiClient.patch<Cart>(`/cart/items/${itemId}`, { quantity })
    return data
  },

  async removeItem(itemId: string): Promise<Cart> {
    if (useLocalCart) {
      throw new Error('Use local cart — server cart is not available')
    }
    const { data } = await apiClient.delete<Cart>(`/cart/items/${itemId}`)
    return data
  },
}
