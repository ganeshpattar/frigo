import type { PaginatedResponse, RoleCode } from '@/types'
import { apiClient } from './apiClient'

export interface AdminUser {
  id: string
  email: string
  firstName: string
  lastName: string
  roles: RoleCode[]
  status: string
  accountStatus: string
  createdAt: string
  isActive?: boolean
}

export const usersApi = {
  async list(page = 1, pageSize = 20): Promise<PaginatedResponse<AdminUser>> {
    const { data } = await apiClient.get<PaginatedResponse<AdminUser>>('/users', {
      params: { page, pageSize },
    })
    return data
  },

  async setActive(userId: string, active: boolean): Promise<AdminUser> {
    const { data } = await apiClient.patch<AdminUser>(`/users/${userId}/status`, { active })
    return data
  },
}
