import { apiGet } from './client'
import type { DashboardStats } from '../types/dtos'

export function getDashboardStats() {
  return apiGet<DashboardStats>('/api/dashboard')
}
