import { apiClient } from './apiClient'

export interface RolePermission {
  code: string
  name: string
}

export interface AdminRole {
  id: string
  code: string
  name: string
  description: string | null
  isActive: boolean
  userCount: number
  permissionCount: number
  permissions?: RolePermission[]
  createdAt?: string
  updatedAt?: string
}

export const rolesApi = {
  async list(): Promise<{ data: AdminRole[]; totalItems: number }> {
    const { data } = await apiClient.get<{ data: AdminRole[]; totalItems: number }>('/roles')
    return data
  },

  async getById(roleId: string): Promise<AdminRole> {
    const { data } = await apiClient.get<AdminRole>(`/roles/${roleId}`)
    return data
  },

  async setActive(roleId: string, active: boolean): Promise<AdminRole> {
    const { data } = await apiClient.patch<AdminRole>(`/roles/${roleId}/status`, { active })
    return data
  },

  async update(
    roleId: string,
    payload: { name?: string; description?: string | null },
  ): Promise<AdminRole> {
    const { data } = await apiClient.patch<AdminRole>(`/roles/${roleId}`, payload)
    return data
  },
}
