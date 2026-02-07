export type UserRole = 'ADMIN' | 'MANAGER' | 'AGENT'

export type UserDto = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: UserRole
  isActive: boolean
  isEmailVerified: boolean
  createdAt: string
  updatedAt: string
}

export type ContactStatus = 'nouveau' | 'en_cours' | 'fermee'

export type ContactDto = {
  id: string
  source: string
  name: string
  email: string
  phone: string
  postalCode?: string
  message: string
  consent: boolean
  status: ContactStatus
  createdAt: string
  updatedAt: string
}

export type DevisStatus = 'nouveau' | 'traite' | 'gagne' | 'perdu'

export type DevisDto = {
  id: string
  source: string
  service: string
  postalCode?: string
  city?: string
  timing?: string
  localType?: string
  propertyType?: string
  rooms?: number
  volume?: number
  volumeEstimate?: string
  floor?: number
  elevator?: boolean
  truckAccess?: boolean
  surfaceArea?: number
  message?: string
  fullName: string
  email: string
  phone: string
  consent: boolean
  status: DevisStatus
  createdAt: string
  updatedAt: string
}

// Keep old type for backwards compatibility during migration
export type QuoteRequestStatus = DevisStatus
export type QuoteRequestDto = DevisDto

export type DashboardStats = {
  contacts: {
    total: number
    byStatus: Record<ContactStatus, number>
  }
  devis: {
    total: number
    byStatus: Record<DevisStatus, number>
  }
}

export type ListResponse<T> = {
  items: T[]
  page: number
  limit: number
  total?: number
}

export type AuthResponse = {
  user: UserDto
  accessToken: string
  refreshToken: string
  expiresAt: string
}
