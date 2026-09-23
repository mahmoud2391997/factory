'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { apiLogin, apiLogout, apiMe } from '@/lib/auth/client'
import { canAccessNav } from '@/lib/auth/nav-permissions'
import type { AuthUser } from '@/lib/auth/types'

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  error: string
  login: (email: string, password: string) => Promise<{ ok: boolean; message: string; mustChangePassword?: boolean }>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  hasPermission: (permission: string | string[]) => boolean
  canAccessModule: (label: string) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    const result = await apiMe()
    if (result.success && result.data?.user) {
      setUser(result.data.user)
      setError('')
    } else {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    if (loading || !user?.mustChangePassword) return
    if (window.location.pathname.startsWith('/account/password')) return
    window.location.assign('/account/password')
  }, [loading, user])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const result = await apiMe()
      if (cancelled) return
      if (result.success && result.data?.user) {
        setUser(result.data.user)
      } else {
        setUser(null)
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setError('')
    const result = await apiLogin(email, password)
    if (result.success && result.data?.user) {
      setUser(result.data.user)
      return {
        ok: true,
        message: result.message ?? 'تم تسجيل الدخول بنجاح',
        mustChangePassword: Boolean(result.data.user.mustChangePassword),
      }
    }
    const message = result.message ?? 'بيانات الدخول غير صحيحة'
    setError(message)
    setUser(null)
    return { ok: false, message }
  }, [])

  const logout = useCallback(async () => {
    await apiLogout()
    setUser(null)
  }, [])

  const hasPermission = useCallback(
    (permission: string | string[]) => {
      if (!user) return false
      const needed = Array.isArray(permission) ? permission : [permission]
      return needed.some((key) => user.permissions.includes(key))
    },
    [user],
  )

  const canAccessModule = useCallback(
    (label: string) => {
      if (!user) return false
      return canAccessNav(user.permissions, label)
    },
    [user],
  )

  const value = useMemo(
    () => ({ user, loading, error, login, logout, refresh, hasPermission, canAccessModule }),
    [user, loading, error, login, logout, refresh, hasPermission, canAccessModule],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
