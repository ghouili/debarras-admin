import { apiGet, apiPost } from './client'
import type { UserDto, AuthResponse } from '../types/dtos'

export type LoginPayload = {
  email: string
  password: string
}

export type RegisterPayload = {
  firstName: string
  lastName: string
  email: string
  phone?: string
  password: string
}

export type RefreshPayload = {
  refreshToken: string
}

export type ForgotPasswordPayload = {
  email: string
}

export type ResetPasswordPayload = {
  token: string
  password: string
}

export type ChangePasswordPayload = {
  currentPassword: string
  newPassword: string
}

export function getMe() {
  return apiGet<UserDto>('/api/auth/me')
}


export function login(payload: LoginPayload) {
  return apiPost<AuthResponse>('/api/auth/login', payload)
}

export function register(payload: RegisterPayload) {
  return apiPost<AuthResponse>('/api/auth/register', payload)
}

export function refresh(payload: RefreshPayload) {
  return apiPost<AuthResponse>('/api/auth/refresh', payload)
}

export function logout(payload: RefreshPayload) {
  return apiPost<void>('/api/auth/logout', payload)
}

export function forgotPassword(payload: ForgotPasswordPayload) {
  return apiPost<void>('/api/auth/forgot-password', payload)
}

export function resetPassword(payload: ResetPasswordPayload) {
  return apiPost<void>('/api/auth/reset-password', payload)
}

export function changePassword(payload: ChangePasswordPayload) {
  return apiPost<void>('/api/auth/change-password', payload)
}
