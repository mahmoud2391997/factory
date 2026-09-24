'use client'

import Link from 'next/link'

export type PageTab = {
  id: string
  href: string
  label: string
}

export function PageTabs({ label, tabs, activeId }: { label: string; tabs: PageTab[]; activeId: string }) {
  if (tabs.length < 2) return null
  return (
    <div className="mb-4 overflow-x-auto">
      <div role="tablist" aria-label={label} className="flex w-max min-w-full gap-2 border-b border-[#e5e7eb]">
        {tabs.map((tab) => {
          const active = tab.id === activeId
          return (
            <Link
              key={tab.id}
              href={tab.href}
              role="tab"
              aria-selected={active}
              className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-base font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d9488] ${
                active ? 'border-[#1f1f1f] text-[#1f1f1f]' : 'border-transparent text-[#6b7280] hover:text-[#1f1f1f]'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
