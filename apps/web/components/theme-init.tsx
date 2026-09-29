'use client'

import { useEffect } from 'react'

export function ThemeInit() {
  useEffect(() => {
    try {
      const t = localStorage.getItem('erp-theme')
      const d = t === 'dark' || (t !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      const root = document.documentElement
      root.classList.toggle('dark', d)
      root.classList.toggle('light', !d)
    } catch {
      /* ignore */
    }
  }, [])
  return null
}
