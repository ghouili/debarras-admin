import { apiDelete, apiGet, apiPost, apiPatch } from './client'
import type { ContactDto, ListResponse } from '../types/dtos'

export type CreateContactPayload = {
  source: string
  name: string
  email: string
  phone: string
  postalCode?: string
  message: string
  consent: boolean
  status?: ContactDto['status']
}

export type UpdateContactPayload = {
  source?: string
  name?: string
  email?: string
  phone?: string
  postalCode?: string
  message?: string
  consent?: boolean
  status?: ContactDto['status']
}

export type ListContactsParams = {
  page?: number
  limit?: number
  status?: ContactDto['status']
  search?: string
  startDate?: string
  endDate?: string
}

export function listContacts(params?: ListContactsParams) {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set('page', params.page.toString())
  if (params?.limit) searchParams.set('limit', params.limit.toString())
  if (params?.status) searchParams.set('status', params.status)
  if (params?.search) searchParams.set('search', params.search)
  if (params?.startDate) searchParams.set('startDate', params.startDate)
  if (params?.endDate) searchParams.set('endDate', params.endDate)
  
  const query = searchParams.toString()
  return apiGet<ListResponse<ContactDto>>(`/api/contacts${query ? `?${query}` : ''}`)
}

export function getContact(id: string) {
  return apiGet<ContactDto>(`/api/contacts/${id}`)
}

export function createContact(payload: CreateContactPayload) {
  return apiPost<ContactDto>('/api/contacts', payload)
}

export function updateContact(id: string, payload: UpdateContactPayload) {
  return apiPatch<ContactDto>(`/api/contacts/${id}`, payload)
}

export function deleteContact(id: string) {
  return apiDelete<void>(`/api/contacts/${id}`)
}
