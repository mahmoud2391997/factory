'use client'

import { useLanguage, getSupportedLanguages, type Language } from './language-provider'

export function LanguageSelect() {
  const { language, setLanguage, t } = useLanguage()
  return <label className="flex items-center justify-end gap-2 text-xs text-slate-500">
    {t('language')}
    <select aria-label={t('language')} value={language} onChange={e=>setLanguage(e.target.value as Language)} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-slate-700">
      {getSupportedLanguages().map(lang=><option key={lang.code} value={lang.code}>{lang.name}</option>)}
    </select>
  </label>
}
