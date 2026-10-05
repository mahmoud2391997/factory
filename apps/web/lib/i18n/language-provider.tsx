'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { getSupportedLanguages, t as translate, type Language, type TranslationKey } from './translations'

const STORAGE_KEY = 'erp-language'

export const RTL_LANGUAGES: Language[] = ['ar']

export function directionFor(language: Language): 'rtl' | 'ltr' {
  return RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr'
}

type LanguageContextValue = {
  language: Language
  dir: 'rtl' | 'ltr'
  ready: boolean
  setLanguage: (language: Language) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function isLanguage(value: string | null): value is Language {
  return value === 'ar' || value === 'en' || value === 'hi'
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ar')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let initial: Language = 'ar'
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (isLanguage(stored)) initial = stored
    } catch {
      /* keep default */
    }
    setLanguageState(initial)
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    const dir = directionFor(language)
    document.documentElement.lang = language
    document.documentElement.dir = dir
    try {
      localStorage.setItem(STORAGE_KEY, language)
    } catch {
      /* ignore */
    }
  }, [ready, language])

  const setLanguage = useCallback((next: Language) => {
    // Formatters read this preference during render, so update it before React renders.
    try { localStorage.setItem(STORAGE_KEY, next) } catch { /* keep in-memory preference */ }
    document.documentElement.lang = next
    document.documentElement.dir = directionFor(next)
    setLanguageState(next)
  }, [])
  const t = useCallback((key: TranslationKey) => translate(language, key), [language])

  const value = useMemo<LanguageContextValue>(
    () => ({ language, dir: directionFor(language), ready, setLanguage, t }),
    [language, ready, setLanguage, t],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}

export { getSupportedLanguages }
export type { Language }
