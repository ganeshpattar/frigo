import { apiClient } from './apiClient'

export interface PaymentSummary {
  id: string
  orderId: string
  amount: number
  currency: string
  status: string
  createdAt: string
}

export const paymentsApi = {
  async list(): Promise<PaymentSummary[]> {
    const { data } = await apiClient.get<PaymentSummary[]>('/payments')
    return data
  },
}
