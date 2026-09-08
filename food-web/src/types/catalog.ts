export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
export type CategoryStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED'

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  imageUrl?: string
  status: CategoryStatus
  productCount?: number
}

export interface ProductImage {
  id: string
  url: string
  altText?: string
  isPrimary: boolean
  sortOrder: number
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  shortDescription?: string
  categoryId: string
  categoryName?: string
  status: ProductStatus
  /** Server-authoritative unit price — display only */
  unitPrice: number
  currency: string
  images: ProductImage[]
  isAvailable: boolean
  tags?: string[]
  sku?: string | null
}

export interface ProductListParams {
  page?: number
  pageSize?: number
  categoryId?: string
  search?: string
  sort?: 'name' | 'price_asc' | 'price_desc' | 'newest'
}
