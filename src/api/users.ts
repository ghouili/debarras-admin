import { apiDelete, apiGet, apiPost, apiPatch } from './client'
import type { UserDto, ListResponse } from '../types/dtos'

export type CreateUserPayload = {
  firstName: string
  lastName: string
  email: string
  phone?: string
  role?: UserDto['role']
  password: string
}

export type UpdateUserPayload = {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  role?: UserDto['role']
  isActive?: boolean
}

export function listUsers() {
  return apiGet<ListResponse<UserDto>>('/api/users')
}

export function getUser(id: string) {
  return apiGet<UserDto>(`/api/users/${id}`)
}

export function createUser(payload: CreateUserPayload) {
  return apiPost<UserDto>('/api/users', payload)
}

export function updateUser(id: string, payload: UpdateUserPayload) {
  return apiPatch<UserDto>(`/api/users/${id}`, payload)
}

export function deleteUser(id: string) {
  return apiDelete<void>(`/api/users/${id}`)
}
