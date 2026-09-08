import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import type { Cart, CartItem, PriceSummary, Product } from '@/types'
import { STORAGE_KEYS } from '@/constants'
import { storage } from '@/services/storage'
import { createId, isProductUuid } from '@/utils/format'
import { cartApi } from '@/services/api'
import { useAuth } from './AuthContext'

type CartAction =
  | { type: 'HYDRATE'; cart: Cart }
  | { type: 'ADD'; product: Product; quantity: number }
  | { type: 'UPDATE_QTY'; itemId: string; quantity: number }
  | { type: 'REMOVE'; itemId: string }
  | { type: 'CLEAR' }
  | { type: 'SET_USER'; userId: string }

function ensureGuestSessionId(): string {
  const existing = storage.get(STORAGE_KEYS.GUEST_SESSION_ID)
  if (existing) return existing
  const id = createId('guest')
  storage.set(STORAGE_KEYS.GUEST_SESSION_ID, id)
  return id
}

function emptyCart(): Cart {
  return {
    id: createId('cart'),
    guestSessionId: ensureGuestSessionId(),
    status: 'ACTIVE',
    items: [],
    updatedAt: new Date().toISOString(),
  }
}

function persist(cart: Cart) {
  storage.setJson(STORAGE_KEYS.GUEST_CART, cart)
}

function sanitizeCart(cart: Cart): Cart {
  const items = (cart.items ?? []).filter((item) => isProductUuid(item.productId))
  if (items.length === (cart.items?.length ?? 0)) return cart
  const next = { ...cart, items, updatedAt: new Date().toISOString() }
  persist(next)
  return next
}

function loadCart(): Cart {
  const saved = storage.getJson<Cart>(STORAGE_KEYS.GUEST_CART)
  if (saved?.items) return sanitizeCart(saved)
  return emptyCart()
}

function primaryImage(product: Product): string | undefined {
  return product.images.find((i) => i.isPrimary)?.url ?? product.images[0]?.url
}

function cartReducer(state: Cart, action: CartAction): Cart {
  switch (action.type) {
    case 'HYDRATE':
      return action.cart
    case 'ADD': {
      const existing = state.items.find((i) => i.productId === action.product.id)
      let items: CartItem[]
      if (existing) {
        items = state.items.map((i) =>
          i.productId === action.product.id
            ? { ...i, quantity: Math.min(99, i.quantity + action.quantity) }
            : i,
        )
      } else {
        const item: CartItem = {
          id: createId('item'),
          productId: action.product.id,
          productName: action.product.name,
          productImageUrl: primaryImage(action.product),
          unitPrice: action.product.unitPrice,
          currency: action.product.currency,
          quantity: action.quantity,
        }
        items = [...state.items, item]
      }
      const next = { ...state, items, updatedAt: new Date().toISOString() }
      persist(next)
      return next
    }
    case 'UPDATE_QTY': {
      const items = state.items
        .map((i) => (i.id === action.itemId ? { ...i, quantity: action.quantity } : i))
        .filter((i) => i.quantity > 0)
      const next = { ...state, items, updatedAt: new Date().toISOString() }
      persist(next)
      return next
    }
    case 'REMOVE': {
      const next = {
        ...state,
        items: state.items.filter((i) => i.id !== action.itemId),
        updatedAt: new Date().toISOString(),
      }
      persist(next)
      return next
    }
    case 'CLEAR': {
      const next = { ...state, items: [], updatedAt: new Date().toISOString() }
      persist(next)
      return next
    }
    case 'SET_USER': {
      const next = {
        ...state,
        userId: action.userId,
        guestSessionId: undefined,
        updatedAt: new Date().toISOString(),
      }
      persist(next)
      return next
    }
    default:
      return state
  }
}

/** Local estimate only — checkout must use server-authoritative totals */
export function estimatePriceSummary(items: CartItem[]): PriceSummary {
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
  const deliveryFee = items.length === 0 ? 0 : subtotal >= 500 ? 0 : 40
  const tax = Math.round(subtotal * 0.05)
  const total = Math.round(subtotal + tax + deliveryFee)
  return {
    subtotal,
    discount: 0,
    tax,
    deliveryFee,
    total,
    currency: items[0]?.currency ?? 'INR',
    isEstimated: true,
  }
}

interface CartContextValue {
  cart: Cart
  itemCount: number
  priceSummary: PriceSummary
  addItem: (product: Product, quantity?: number) => void
  updateQuantity: (itemId: string, quantity: number) => void
  removeItem: (itemId: string) => void
  clearCart: () => void
  mergeGuestCartAfterAuth: () => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [cart, dispatch] = useReducer(cartReducer, undefined, loadCart)

  useEffect(() => {
    if (isAuthenticated && user) {
      void (async () => {
        try {
          await cartApi.mergeGuestCart(cart.guestSessionId ?? ensureGuestSessionId(), cart.items)
        } catch {
          // Gateway may be unavailable; keep local cart
        }
        dispatch({ type: 'SET_USER', userId: user.id })
      })()
    }
    // Only merge when auth flips to authenticated
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id])

  const addItem = useCallback((product: Product, quantity = 1) => {
    if (!isProductUuid(product.id)) {
      console.warn('[cart] Refusing non-UUID product id', product.id)
      return
    }
    dispatch({ type: 'ADD', product, quantity })
  }, [])

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QTY', itemId, quantity })
  }, [])

  const removeItem = useCallback((itemId: string) => {
    dispatch({ type: 'REMOVE', itemId })
  }, [])

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR' })
  }, [])

  const mergeGuestCartAfterAuth = useCallback(async () => {
    if (!user) return
    try {
      await cartApi.mergeGuestCart(cart.guestSessionId ?? ensureGuestSessionId(), cart.items)
    } catch {
      // keep local
    }
    dispatch({ type: 'SET_USER', userId: user.id })
  }, [user, cart.guestSessionId, cart.items])

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      itemCount: cart.items.reduce((n, i) => n + i.quantity, 0),
      priceSummary: estimatePriceSummary(cart.items),
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      mergeGuestCartAfterAuth,
    }),
    [cart, addItem, updateQuantity, removeItem, clearCart, mergeGuestCartAfterAuth],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
