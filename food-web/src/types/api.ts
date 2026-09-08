export interface PaginatedResponse<T> {
  data: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface ApiErrorBody {
  message?: string
  code?: string
  errors?: Record<string, string[]>
  requestId?: string
}
