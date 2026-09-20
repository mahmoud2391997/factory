import { useEffect, useRef, useState } from 'react'

function canUseBrowserStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function loadJson<T>(key: string): T | undefined {
  if (!canUseBrowserStorage()) return undefined
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return undefined
    return JSON.parse(raw) as T
  } catch {
    return undefined
  }
}

export function saveJson<T>(key: string, value: T) {
  if (!canUseBrowserStorage()) return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore quota and serialization errors for MVP
  }
}

export function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue)
  const hasHydratedRef = useRef(false)

  useEffect(() => {
    const stored = loadJson<T>(key)
    if (stored !== undefined) setValue(stored)
    hasHydratedRef.current = true
  }, [key])

  useEffect(() => {
    if (!hasHydratedRef.current) return
    saveJson(key, value)
  }, [key, value])

  return [value, setValue] as const
}

