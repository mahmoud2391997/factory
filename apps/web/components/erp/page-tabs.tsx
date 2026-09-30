'use client'

import Link from 'next/link'

import { useLanguage } from '@/lib/i18n/language-provider'
import { translateUiText } from '@/lib/i18n/translations'

export type PageTab = {
  id: string
  href: string
  label: string
}

export function PageTabs({ label, tabs, activeId }: { label: string; tabs: PageTab[]; activeId: string }) {
  const { language } = useLanguage()
  if (tabs.length < 2) return null
  return (
    <div className="mb-6 overflow-x-auto pb-2">
      <div role="tablist" aria-label={translateUiText(language, label)} className="inline-flex w-max items-center gap-1.5 rounded-xl bg-[#f0f2f1] p-1.5">
        {tabs.map((tab) => {
          const active = tab.id === activeId
          return (
            <Link
              key={tab.id}
              href={tab.href}
              role="tab"
              aria-selected={active}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d9488] ${
                active
                  ? 'bg-white text-[#123c35] shadow-sm ring-1 ring-black/5'
                  : 'text-[#6b7280] hover:bg-[#e1e6e4] hover:text-[#123c35]'
              }`}
            >
              {translateUiText(language, tab.label)}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
