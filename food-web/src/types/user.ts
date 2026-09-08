export interface Address {
  id: string
  label: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
  isDefault: boolean
}

export interface CustomerProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  addresses: Address[]
}
