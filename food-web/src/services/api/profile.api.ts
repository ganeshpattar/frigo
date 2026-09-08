import type { CustomerProfile, Address } from '@/types'
import { apiClient } from './apiClient'

export const profileApi = {
  async getProfile(): Promise<CustomerProfile> {
    const { data } = await apiClient.get<CustomerProfile>('/profile')
    return data
  },

  async updateProfile(payload: Partial<CustomerProfile>): Promise<CustomerProfile> {
    const { data } = await apiClient.patch<CustomerProfile>('/profile', payload)
    return data
  },

  async listAddresses(): Promise<Address[]> {
    const { data } = await apiClient.get<Address[]>('/profile/addresses')
    return data
  },
}
