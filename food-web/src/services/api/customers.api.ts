import type { PaginatedResponse } from '@/types'
import { apiClient } from './apiClient'

export interface AdminCustomer {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  status: string
  accountStatus: string
  isActive: boolean
  createdAt: string
}

export const customersApi = {
  async list(page = 1, pageSize = 20): Promise<PaginatedResponse<AdminCustomer>> {
    const { data } = await apiClient.get<PaginatedResponse<AdminCustomer>>('/admin-customers', {
      params: { page, pageSize },
    })
    return data
  },

  async setActive(customerId: string, active: boolean): Promise<AdminCustomer> {
    // Reuses users status endpoint; map response fields
    const { data } = await apiClient.patch<{
      id: string
      email: string
      firstName: string
      lastName: string
      status: string
      accountStatus: string
      isActive: boolean
      createdAt: string
    }>(`/users/${customerId}/status`, { active })
    return {
      id: data.id,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: '',
      status: data.status,
      accountStatus: data.accountStatus,
      isActive: data.isActive,
      createdAt: data.createdAt,
    }
  },
}
