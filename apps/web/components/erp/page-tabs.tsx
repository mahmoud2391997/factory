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
      <div role="tablist" aria-label={label} className="flex w-max min-w-full gap-2 border-b border-[#e1e9e5]">
        {tabs.map((tab) => {
          const active = tab.id === activeId
          return (
            <Link
              key={tab.id}
              href={tab.href}
              role="tab"
              aria-selected={active}
              className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-base font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d7f72] ${
                active ? 'border-[#123c35] text-[#123c35]' : 'border-transparent text-[#53655e] hover:text-[#123c35]'
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
