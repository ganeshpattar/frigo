import { apiClient } from './apiClient'
import type { Order } from '@/types'

export interface TrendDay {
  date: string
  label: string
  orders: number
  sales?: number
}

export interface StatusCount {
  status: string
  count: number
}

export interface TopProduct {
  productName: string
  quantity: number
  revenue: number
}

export interface InventoryHealth {
  inStock: number
  lowStock: number
  outOfStock: number
}

export interface LowStockProduct {
  productId: string
  productName: string
  imageUrl: string | null
  available: number
  reserved: number
}

export interface AdminDashboardStats {
  ordersCount: number
  usersCount: number
  productsCount: number
  inventorySkuInStock: number
  grossSalesToday: number
  activeProductsCount: number
  charts: {
    salesTrend: TrendDay[]
    ordersByStatus: StatusCount[]
    topProducts: TopProduct[]
    inventoryHealth: InventoryHealth
  }
}

export interface ManagerDashboardStats {
  openOrdersCount: number
  preparingCount: number
  lowStockCount: number
  customersCount: number
  recentOrders: Order[]
  charts: {
    ordersByStatus: StatusCount[]
    ordersTrend: Array<{ date: string; label: string; orders: number }>
    lowStockProducts: LowStockProduct[]
  }
}

export const dashboardApi = {
  async getStats(): Promise<AdminDashboardStats> {
    const { data } = await apiClient.get<AdminDashboardStats>('/admin/dashboard')
    return data
  },

  async getManagerStats(): Promise<ManagerDashboardStats> {
    const { data } = await apiClient.get<ManagerDashboardStats>('/manager/dashboard')
    return data
  },
}
