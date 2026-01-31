import { apiDelete, apiGet, apiPost, apiPatch } from './client'
import type { DevisDto, ListResponse } from '../types/dtos'

export type CreateDevisPayload = {
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
  status?: DevisDto['status']
}

export type UpdateDevisPayload = {
  source?: string
  service?: string
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
  fullName?: string
  email?: string
  phone?: string
  consent?: boolean
  status?: DevisDto['status']
}

export type ListDevisParams = {
  page?: number
  limit?: number
  status?: DevisDto['status']
  search?: string
  startDate?: string
  endDate?: string
}

export function listDevis(params?: ListDevisParams) {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set('page', params.page.toString())
  if (params?.limit) searchParams.set('limit', params.limit.toString())
  if (params?.status) searchParams.set('status', params.status)
  if (params?.search) searchParams.set('search', params.search)
  if (params?.startDate) searchParams.set('startDate', params.startDate)
  if (params?.endDate) searchParams.set('endDate', params.endDate)
  
  const query = searchParams.toString()
  return apiGet<ListResponse<DevisDto>>(`/api/devis${query ? `?${query}` : ''}`)
}

export function getDevis(id: string) {
  return apiGet<DevisDto>(`/api/devis/${id}`)
}

export function createDevis(payload: CreateDevisPayload) {
  return apiPost<DevisDto>('/api/devis', payload)
}

export function updateDevis(id: string, payload: UpdateDevisPayload) {
  return apiPatch<DevisDto>(`/api/devis/${id}`, payload)
}

export function deleteDevis(id: string) {
  return apiDelete<void>(`/api/devis/${id}`)
}

// Backwards compatibility exports
export type QuoteRequestPayload = CreateDevisPayload
export type UpdateQuoteRequestPayload = UpdateDevisPayload
export type ListQuoteRequestsParams = ListDevisParams
export const listQuoteRequests = listDevis
export const getQuoteRequest = getDevis
export const createQuoteRequest = createDevis
export const updateQuoteRequest = updateDevis
export const deleteQuoteRequest = deleteDevis
