import { createContext, useContext } from 'react'
import type { UserDto } from '../../types/dtos'

export type AuthContextValue = {
  user: UserDto | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<UserDto>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
