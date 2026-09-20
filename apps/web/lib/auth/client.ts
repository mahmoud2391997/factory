import type { AuthApiResponse, AuthUser } from '@/lib/auth/types'

async function parseJson<T>(res: Response): Promise<AuthApiResponse<T>> {
  try {
    return (await res.json()) as AuthApiResponse<T>
  } catch {
    return { success: false, message: 'تعذر قراءة استجابة الخادم' }
  }
}

export async function apiLogin(email: string, password: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  })
  return parseJson<{ user: AuthUser }>(res)
}

export async function apiLogout() {
  const res = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  })
  return parseJson<Record<string, never>>(res)
}

export async function apiRefresh() {
  const res = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  })
  return { ok: res.ok, ...(await parseJson<Record<string, never>>(res)) }
}

export async function apiMe() {
  const res = await fetch('/api/auth/me', {
    method: 'GET',
    credentials: 'include',
  })
  return parseJson<{ user: AuthUser }>(res)
}

export async function apiGetWarehouses() {
  const res = await fetch('/api/warehouses', {
    method: 'GET',
    credentials: 'include',
  })
  if (res.status === 401) {
    const refreshed = await apiRefresh()
    if (refreshed.ok) {
      const retry = await fetch('/api/warehouses', { method: 'GET', credentials: 'include' })
      return parseJson<{
        warehouses: Array<{
          id: string
          key: string
          nameAr: string
          isActive: boolean
          locations: Array<{ id: string; code: string; nameAr: string }>
        }>
      }>(retry)
    }
  }
  return parseJson<{
    warehouses: Array<{
      id: string
      key: string
      nameAr: string
      isActive: boolean
      locations: Array<{ id: string; code: string; nameAr: string }>
    }>
  }>(res)
}
