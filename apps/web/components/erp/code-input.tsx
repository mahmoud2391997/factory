'use client'

import type { InputHTMLAttributes } from 'react'
import { useLanguage } from '@/lib/i18n/language-provider'

export function CodeInput({ prefix = 'CODE', onValueChange, className, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  prefix?: string
  onValueChange: (value: string) => void
}) {
  const { language } = useLanguage()
  const label = language === 'ar' ? 'توليد الكود تلقائياً' : language === 'hi' ? 'कोड स्वतः बनाएँ' : 'Auto-generate code'
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <input {...props} dir="ltr" onChange={(event) => onValueChange(event.target.value)} className={`min-w-0 flex-1 ${className ?? 'h-10 rounded-md border border-[#e5e7eb] bg-white px-3 text-sm outline-none focus:border-[#1f1f1f]'}`} />
      <button type="button" disabled={props.disabled || props.readOnly} onClick={() => onValueChange(`${prefix}-${crypto.randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase()}`)} className="min-h-10 rounded-md border border-[#d1d5db] px-3 text-xs font-semibold text-[#271a83] hover:bg-[#eeebfb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1e127c] disabled:opacity-50">
        {label}
      </button>
    </div>
  )
}
