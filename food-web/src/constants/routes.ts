export const ROUTES = {
  HOME: '/',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:productId',
  CATEGORY: '/categories/:categoryId',
  SEARCH: '/search',
  CART: '/cart',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  CHECKOUT: '/checkout',
  ORDERS: '/orders',
  ORDER_DETAIL: '/orders/:orderId',
  PROFILE: '/profile',
  PROFILE_ADDRESSES: '/profile/addresses',
  MANAGER: '/manager',
  MANAGER_ORDERS: '/manager/orders',
  MANAGER_ORDER_DETAIL: '/manager/orders/:orderId',
  MANAGER_CUSTOMERS: '/manager/customers',
  MANAGER_INVENTORY: '/manager/inventory',
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_ROLES: '/admin/roles',
  ADMIN_CUSTOMERS: '/admin/customers',
  ADMIN_CATEGORIES: '/admin/categories',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_PRODUCT_NEW: '/admin/products/new',
  ADMIN_PRODUCT_EDIT: '/admin/products/:id/edit',
  ADMIN_PRICING: '/admin/pricing',
  ADMIN_INVENTORY: '/admin/inventory',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_ORDER_DETAIL: '/admin/orders/:orderId',
  ADMIN_PAYMENTS: '/admin/payments',
  ADMIN_NOTIFICATIONS: '/admin/notifications',
  ADMIN_AUDIT: '/admin/audit',
} as const

export function productPath(productId: string): string {
  return `/products/${productId}`
}

export function categoryPath(categoryId: string): string {
  return `/categories/${categoryId}`
}

export function orderPath(orderId: string): string {
  return `/orders/${orderId}`
}

export function managerOrderPath(orderId: string): string {
  return `/manager/orders/${orderId}`
}
