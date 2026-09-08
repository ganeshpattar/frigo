import type { Category, Product, ProductListParams, PaginatedResponse, ProductStatus } from '@/types'
import { apiClient } from './apiClient'

export interface CreateProductPayload {
  name: string
  categoryId: string
  description?: string
  shortDescription?: string
  unitPrice: number
  currency?: string
  status?: ProductStatus
  imageUrl?: string
  tags?: string[]
  sku?: string
  initialQuantity?: number
}

export type UpdateProductPayload = Partial<
  Omit<CreateProductPayload, 'initialQuantity'> & { isAvailable?: boolean }
>

export interface AdminCategory extends Category {
  sortOrder?: number
  isActive?: boolean
}

export interface CreateCategoryPayload {
  name: string
  slug?: string
  description?: string
  imageUrl?: string
  status?: 'ACTIVE' | 'INACTIVE'
  sortOrder?: number
}

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>

export const catalogApi = {
  async getCategories(): Promise<Category[]> {
    const { data } = await apiClient.get<Category[]>('/categories')
    return data
  },

  async listAdminCategories(): Promise<{ data: AdminCategory[]; totalItems: number }> {
    const { data } = await apiClient.get<{ data: AdminCategory[]; totalItems: number }>(
      '/categories/manage',
    )
    return data
  },

  async createCategory(payload: CreateCategoryPayload): Promise<AdminCategory> {
    const { data } = await apiClient.post<AdminCategory>('/categories', payload)
    return data
  },

  async updateCategory(categoryId: string, payload: UpdateCategoryPayload): Promise<AdminCategory> {
    const { data } = await apiClient.patch<AdminCategory>(`/categories/${categoryId}`, payload)
    return data
  },

  async setCategoryActive(categoryId: string, active: boolean): Promise<AdminCategory> {
    const { data } = await apiClient.patch<AdminCategory>(`/categories/${categoryId}/status`, {
      active,
    })
    return data
  },

  async deleteCategory(categoryId: string): Promise<void> {
    await apiClient.delete(`/categories/${categoryId}`)
  },

  async getCategory(categoryId: string): Promise<Category> {
    const { data } = await apiClient.get<Category>(`/categories/${categoryId}`)
    return data
  },

  async getProducts(params: ProductListParams = {}): Promise<PaginatedResponse<Product>> {
    const { data } = await apiClient.get<PaginatedResponse<Product>>('/products', { params })
    return data
  },

  async getProduct(productId: string): Promise<Product> {
    const { data } = await apiClient.get<Product>(`/products/${productId}`)
    return data
  },

  async search(query: string, page = 1): Promise<PaginatedResponse<Product>> {
    return this.getProducts({ search: query, page })
  },

  async createProduct(payload: CreateProductPayload): Promise<Product> {
    const { data } = await apiClient.post<Product>('/products', payload)
    return data
  },

  async updateProduct(productId: string, payload: UpdateProductPayload): Promise<Product> {
    const { data } = await apiClient.patch<Product>(`/products/${productId}`, payload)
    return data
  },

  async deleteProduct(productId: string): Promise<void> {
    await apiClient.delete(`/products/${productId}`)
  },
}
