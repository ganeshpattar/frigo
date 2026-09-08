import { apiClient } from './apiClient'

export interface NotificationItem {
  id: string
  title: string
  body: string
  channel: string
  status: string
  createdAt: string
}

export const notificationsApi = {
  async list(): Promise<NotificationItem[]> {
    const { data } = await apiClient.get<NotificationItem[]>('/notifications')
    return data
  },
}
