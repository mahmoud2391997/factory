'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

import { MAX_VISIBLE_PAGE_TABS } from '@/lib/nav/config'
import { useLanguage } from '@/lib/i18n/language-provider'
import { translateUiText } from '@/lib/i18n/translations'

export type PageTab = {
  id: string
  href: string
  label: string
}

export function PageTabs({
  label,
  primaryTabs,
  secondaryTabs,
  activePrimaryId,
  activeSecondaryId,
}: {
  label: string
  primaryTabs: PageTab[]
  secondaryTabs: PageTab[]
  activePrimaryId: string
  activeSecondaryId: string
}) {
  const tabs = primaryTabs
  const activeId = activePrimaryId
  const { language } = useLanguage()
  const [moreOpen, setMoreOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!moreOpen) return
    const onPointer = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMoreOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMoreOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [moreOpen])

  if (tabs.length < 2 && secondaryTabs.length < 2) return null
  const hasOverflow = tabs.length > MAX_VISIBLE_PAGE_TABS
  let visibleTabs = hasOverflow ? tabs.slice(0, MAX_VISIBLE_PAGE_TABS - 1) : tabs
  const activeTab = tabs.find((tab) => tab.id === activeId)
  if (hasOverflow && activeTab && !visibleTabs.some((tab) => tab.id === activeId)) {
    visibleTabs = [...visibleTabs.slice(0, -1), activeTab].sort((a, b) => tabs.indexOf(a) - tabs.indexOf(b))
  }
  const overflowTabs = hasOverflow ? tabs.filter((tab) => !visibleTabs.some((visible) => visible.id === tab.id)) : []
  const activeOverflowTab = overflowTabs.find((tab) => tab.id === activeId)

  return (
    <div className="erp-page-tabs sticky top-16 z-20 -mx-5 border-y border-[#e5e7eb] bg-white/95 px-5 py-2 backdrop-blur-sm dark:border-[#3f3f46] dark:bg-[#161b22]/95 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10 motion-reduce:backdrop-blur-none">
      <div className="overflow-x-auto">
        <div role="tablist" aria-label={translateUiText(language, label)} className="inline-flex min-w-max items-center gap-1 rounded-xl bg-[#f3f4f6] p-1 dark:bg-[#27272a]">
          {visibleTabs.map((tab) => {
            const active = tab.id === activeId
            return (
              <Link
                key={tab.id}
                href={tab.href}
                role="tab"
                aria-selected={active}
                aria-current={active ? 'page' : undefined}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d9488] motion-reduce:transition-none ${active ? 'bg-white text-[#134e4a] shadow-sm ring-1 ring-black/5 dark:bg-[#193b37] dark:text-[#ccfbf1]' : 'text-[#4b5563] hover:bg-[#e5e7eb] hover:text-[#134e4a] dark:text-[#d4d4d8] dark:hover:bg-[#3f3f46] dark:hover:text-[#ccfbf1]'}`}
              >
                {translateUiText(language, tab.label)}
              </Link>
            )
          })}
          {hasOverflow ? (
            <div ref={menuRef} className="relative">
              <button ref={triggerRef} type="button" aria-haspopup="menu" aria-expanded={moreOpen} onClick={() => setMoreOpen((open) => !open)} className={`flex min-h-10 items-center gap-1 whitespace-nowrap rounded-lg px-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d9488] ${activeOverflowTab ? 'bg-white text-[#134e4a] dark:bg-[#193b37] dark:text-[#ccfbf1]' : 'text-[#4b5563] hover:bg-[#e5e7eb] dark:text-[#d4d4d8] dark:hover:bg-[#3f3f46]'}`}>
                {activeOverflowTab ? translateUiText(language, activeOverflowTab.label) : translateUiText(language, 'المزيد')}
                <ChevronDown size={15} aria-hidden className={`transition-transform motion-reduce:transition-none ${moreOpen ? 'rotate-180' : ''}`} />
              </button>
              {moreOpen ? (
                <div role="menu" aria-label={translateUiText(language, 'المزيد من الصفحات')} className="absolute end-0 top-[calc(100%+6px)] z-50 max-h-72 min-w-52 overflow-y-auto rounded-xl border border-[#d1d5db] bg-white p-1.5 shadow-xl dark:border-[#3f3f46] dark:bg-[#18181b]">
                  {overflowTabs.map((tab) => (
                    <Link key={tab.id} href={tab.href} role="menuitem" aria-current={tab.id === activeId ? 'page' : undefined} onClick={() => setMoreOpen(false)} className={`flex min-h-11 items-center rounded-lg px-3 text-right text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488] ${tab.id === activeId ? 'bg-[#e9f7f4] text-[#134e4a] dark:bg-[#193b37] dark:text-[#ccfbf1]' : 'text-[#374151] hover:bg-[#f3f4f6] dark:text-[#e4e4e7] dark:hover:bg-[#27272a]'}`}>
                      {translateUiText(language, tab.label)}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      {secondaryTabs.length > 1 ? (
        <div className="mt-2 overflow-x-auto">
          <div role="tablist" aria-label={translateUiText(language, 'صفحات القسم')} className="inline-flex min-w-max items-center gap-1 border-s border-[#d1d5db] ps-3 dark:border-[#3f3f46]">
            {secondaryTabs.map((tab) => {
              const active = tab.id === activeSecondaryId
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  role="tab"
                  aria-selected={active}
                  aria-current={active ? 'page' : undefined}
                  className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d9488] motion-reduce:transition-none ${active ? 'bg-[#e9f7f4] text-[#134e4a] dark:bg-[#193b37] dark:text-[#ccfbf1]' : 'text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#134e4a] dark:text-[#a1a1aa] dark:hover:bg-[#27272a] dark:hover:text-[#ccfbf1]'}`}
                >
                  {translateUiText(language, tab.label)}
                </Link>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
