'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import type { ActResult, PublicState } from '@/components/erp/live/ctx'
import { buildSeedState } from '@/lib/erp/domain/seed'

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

export function useErp(enabled: boolean = true, frontendDemo = false) {
  const frontendDemoState = useMemo(() => (frontendDemo ? buildFrontendDemoState() : null), [frontendDemo])
  const [data, setData] = useState<Load | null>(() =>
    frontendDemoState ? { state: frontendDemoState, storage: 'file' } : null,
  )
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    if (frontendDemo) {
      setData({ state: buildFrontendDemoState(), storage: 'file' })
      setError('')
      return
    }
    const response = await fetch('/api/erp', { credentials: 'include' })
    const json = (await response.json()) as { success: boolean; message?: string; data?: Load }
    if (!response.ok || !json.success || !json.data) {
      setError(json.message || 'تعذر تحميل بيانات المصنع')
      return
    }
    setData(json.data)
    setError('')
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
        if (action === 'resetDemo') setData({ state: buildFrontendDemoState(), storage: 'file' })
        const messageText = action === 'resetDemo' ? 'تمت إعادة بيانات المصنع التجريبية' : 'تم تنفيذ العملية في الوضع التجريبي'
        setMessage(messageText)
        return { ok: true, message: messageText }
      }
      setPending(true)
      setMessage('')
      try {
        const idempotencyKey =
          typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
        const response = await fetch('/api/erp', {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ action, input: input ?? {}, idempotencyKey }),
        })
        const json = (await response.json()) as {
          success: boolean
          message?: string
          data?: Load & { extra?: Record<string, unknown> | null }
        }
        if (!response.ok || !json.success || !json.data) {
          const messageText = json.message || 'تعذر تنفيذ العملية'
          setMessage(messageText)
          return { ok: false, message: messageText }
        }
        setData({ state: json.data.state, storage: json.data.storage })
        setMessage(json.message || 'تم')
        setError('')
        return { ok: true, message: json.message || 'تم', extra: json.data.extra }
      } finally {
        setPending(false)
      }
    },
    [],
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
