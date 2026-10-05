'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import type { ActResult, PublicState } from '@/components/erp/live/ctx'
import { buildSeedState } from '@/lib/erp/domain/seed'
import { setNotificationRead } from '@/lib/erp/notification-list'

function buildFrontendDemoState(): PublicState {
  const seeded = buildSeedState('frontend-demo-hash')
  const { users, ...rest } = seeded
  return {
    ...rest,
    users: users.map(({ passwordHash: _passwordHash, ...user }) => user),
  }
}

type Load = {
  state: PublicState
  storage: 'postgresql' | 'file'
}

type ActionResponse = {
  success?: boolean
  message?: string
  data?: Load & { extra?: Record<string, unknown> | null }
}

async function confirmSessionGone() {
  try {
    const response = await fetch('/api/auth/me', { credentials: 'include' })
    return response.status === 401
  } catch {
    return false
  }
}

function statusMessage(status: number, serverMessage?: string) {
  if (status === 413) return 'حجم الطلب يتجاوز الحد المسموح'
  if (status === 429) return 'عدد الطلبات مرتفع. حاول بعد قليل'
  if (status >= 500) return 'حدث خطأ في الخادم. حاول مرة أخرى'
  return serverMessage || 'تعذر تنفيذ العملية'
}

export function useErp(enabled: boolean = true, frontendDemo = false) {
  const frontendDemoState = useMemo(() => (frontendDemo ? buildFrontendDemoState() : null), [frontendDemo])
  const [data, setData] = useState<Load | null>(() =>
    frontendDemoState ? { state: frontendDemoState, storage: 'file' } : null,
  )
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const reload = useCallback(async (): Promise<boolean> => {
    if (frontendDemo) {
      setData({ state: buildFrontendDemoState(), storage: 'file' })
      setError('')
      return true
    }
    try {
      const response = await fetch('/api/erp', { credentials: 'include' })
      const json = await response.json().catch(() => null) as { success?: boolean; message?: string; data?: Load } | null
      if (!response.ok || !json?.success || !json.data) {
        setError(json?.message || statusMessage(response.status, 'تعذر تحميل بيانات المصنع'))
        return false
      }
      setData(json.data)
      setError('')
      return true
    } catch {
      setError('تعذر الاتصال بالخادم. تحقق من الاتصال وحاول مرة أخرى')
      return false
    }
  }, [frontendDemo])

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      await reload()
      if (!cancelled) setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [enabled, frontendDemo, reload])

  const act = useCallback(
    async (action: string, input?: Record<string, unknown>): Promise<ActResult> => {
      if (frontendDemo) {
        if (action === 'resetDemo') {
          setData({ state: buildFrontendDemoState(), storage: 'file' })
        } else if (action === 'markNotificationRead' && typeof input?.id === 'string') {
          setData((current) => current
            ? {
                ...current,
                state: {
                  ...current.state,
                  notifications: setNotificationRead(current.state.notifications, input.id as string, true),
                },
              }
            : current)
        }
        const messageText = action === 'resetDemo' ? 'تمت إعادة بيانات المصنع التجريبية' : 'تم تنفيذ العملية في الوضع التجريبي'
        setMessage(messageText)
        return { ok: true, message: messageText }
      }
      setPending(true)
      setMessage('')
      const notificationId = action === 'markNotificationRead' && typeof input?.id === 'string' ? input.id : null
      const previousRead = notificationId
        ? data?.state.notifications.find((item) => item.id === notificationId)?.read
        : undefined
      let rollbackOptimisticRead = notificationId !== null && previousRead === false
      if (notificationId && previousRead === false) {
        setData((current) => current
          ? { ...current, state: { ...current.state, notifications: setNotificationRead(current.state.notifications, notificationId, true) } }
          : current)
      }
      try {
        const idempotencyKey =
          typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
        const response = await fetch('/api/erp', {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ action, input: input ?? {}, idempotencyKey }),
        })
        const json = await response.json().catch(() => null) as ActionResponse | null

        if (response.status === 409) {
          const reloaded = await reload()
          if (reloaded) rollbackOptimisticRead = false
          const messageText = 'تغيرت البيانات منذ آخر تحميل. أُعيد تحميلها؛ أعد المحاولة'
          setMessage(messageText)
          return { ok: false, message: messageText }
        }

        if (response.status === 401 || response.redirected) {
          const sessionGone = await confirmSessionGone()
          if (sessionGone && typeof window !== 'undefined') window.location.assign('/login')
          const messageText = sessionGone
            ? 'انتهت الجلسة. جارٍ تحويلك إلى تسجيل الدخول'
            : (json?.message || 'تعذر التحقق من الجلسة. حاول مرة أخرى')
          setMessage(messageText)
          return { ok: false, message: messageText }
        }

        if (!json && response.ok) {
          const messageText = 'استجابة الخادم غير صالحة. حاول مرة أخرى'
          setMessage(messageText)
          return { ok: false, message: messageText }
        }
        if (!response.ok || !json?.success || !json.data) {
          const messageText = statusMessage(response.status, json?.message)
          setMessage(messageText)
          return { ok: false, message: messageText }
        }

        setData({ state: json.data.state, storage: json.data.storage })
        setMessage(json.message || 'تم')
        setError('')
        rollbackOptimisticRead = false
        return { ok: true, message: json.message || 'تم', extra: json.data.extra }
      } catch {
        const messageText = 'تعذر الاتصال بالخادم. تحقق من الاتصال وحاول مرة أخرى'
        setMessage(messageText)
        return { ok: false, message: messageText }
      } finally {
        if (rollbackOptimisticRead && notificationId) {
          setData((current) => current
            ? { ...current, state: { ...current.state, notifications: setNotificationRead(current.state.notifications, notificationId, false) } }
            : current)
        }
        setPending(false)
      }
    },
    [data, frontendDemo, reload],
  )

  return {
    state: data?.state ?? null,
    storage: data?.storage ?? null,
    loading,
    pending,
    message,
    error,
    act,
    reload,
  }
}
