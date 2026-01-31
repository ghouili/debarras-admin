export type ApiErrorPayload = {
  message?: string
  fieldErrors?: Record<string, string>
  errors?: Record<string, string>
}

export class ApiError extends Error {
  status: number
  fieldErrors?: Record<string, string>

  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

// Token storage
const TOKEN_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  EXPIRES_AT: 'expiresAt',
}

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN)
}

export function getExpiresAt(): string | null {
  return localStorage.getItem(TOKEN_KEYS.EXPIRES_AT)
}

export function setTokens(accessToken: string, refreshToken: string, expiresAt: string) {
  localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken)
  localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken)
  localStorage.setItem(TOKEN_KEYS.EXPIRES_AT, expiresAt)
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN)
  localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN)
  localStorage.removeItem(TOKEN_KEYS.EXPIRES_AT)
}

async function parseError(res: Response) {
  let payload: ApiErrorPayload | undefined
  const contentType = res.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    try {
      payload = await res.json()
    } catch {
      payload = undefined
    }
  }

  const message = payload?.message || res.statusText || 'Request failed'
  const fieldErrors = payload?.fieldErrors || payload?.errors
  return new ApiError(message, res.status, fieldErrors)
}

export async function apiFetch<T>(path: string, options: RequestInit = {}) {
  const url = `${API_BASE}${path}`
  const headers = new Headers(options.headers)

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  // Add Authorization header if token exists
  const accessToken = getAccessToken()
  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const res = await fetch(url, {
    credentials: 'include',
    ...options,
    headers,
  })

  if (!res.ok) {
    throw await parseError(res)
  }

  if (res.status === 204) {
    return undefined as T
  }

  const contentType = res.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    return (await res.json()) as T
  }

  return undefined as T
}

export function apiGet<T>(path: string) {
  return apiFetch<T>(path)
}

export function apiPost<T>(path: string, data?: unknown) {
  return apiFetch<T>(path, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

export function apiPut<T>(path: string, data?: unknown) {
  return apiFetch<T>(path, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  })
}

export function apiPatch<T>(path: string, data?: unknown) {
  return apiFetch<T>(path, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  })
}

export function apiDelete<T>(path: string) {
  return apiFetch<T>(path, { method: 'DELETE' })
}
