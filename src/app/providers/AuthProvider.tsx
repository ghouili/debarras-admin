import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { login as loginRequest, logout as logoutRequest, getMe } from '../../api/auth'
import { setTokens, clearTokens, getRefreshToken } from '../../api/client'
import { AuthContext } from './authContext'
import type { UserDto } from '../../types/dtos'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    getMe()
      .then((data) => {
        if (isMounted) setUser(data)
      })
      .catch(() => {
        if (isMounted) {
          setUser(null)
          clearTokens()
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginRequest({ email, password })
    setTokens(response.accessToken, response.refreshToken, response.expiresAt)
    setUser(response.user)
    return response.user
  }, [])

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      try {
        await logoutRequest({ refreshToken })
      } catch {
        // Ignore logout errors
      }
    }
    clearTokens()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      logout,
    }),
    [user, isLoading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
