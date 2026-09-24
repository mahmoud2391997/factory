'use client'

import { useCallback, useEffect, useState } from 'react'

import type { ActResult, PublicState } from '@/components/erp/live/ctx'

type Load = {
  state: PublicState
  storage: 'postgres' | 'file'
}

export function useErp(enabled: boolean) {
  const [data, setData] = useState<Load | null>(null)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    const response = await fetch('/api/erp', { credentials: 'include' })
    const json = (await response.json()) as { success: boolean; message?: string; data?: Load }
    if (!response.ok || !json.success || !json.data) {
      setError(json.message || 'تعذر تحميل بيانات المصنع')
      return
    }
    setData(json.data)
    setError('')
  }, [])

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
  }, [enabled, reload])

  const act = useCallback(
    async (action: string, input?: Record<string, unknown>): Promise<ActResult> => {
      setPending(true)
      setMessage('')
      try {
        const response = await fetch('/api/erp', {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ action, input: input ?? {} }),
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
