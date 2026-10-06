'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

import { MAX_VISIBLE_PAGE_TABS } from '@/lib/nav/config'
import { buildPageTabsModel, type PageTabOption } from '@/lib/nav/page-tabs-model'
import { useLanguage } from '@/lib/i18n/language-provider'
import { translateUiText } from '@/lib/i18n/translations'

export type PageTab = PageTabOption

type MenuPosition = { top: number; left: number; width: number; maxHeight: number }

export function PageTabs({
  label,
  primaryTabs,
  secondaryTabs,
  activePrimaryId,
  activeSecondaryId,
  layout = 'tabs',
}: {
  label: string
  primaryTabs: PageTab[]
  secondaryTabs: PageTab[]
  activePrimaryId: string
  activeSecondaryId: string
  layout?: 'tabs' | 'sidebar'
}) {
  const { language } = useLanguage()
  const router = useRouter()
  const [moreOpen, setMoreOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null)
  const menuId = useId()
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuItemRefs = useRef<Array<HTMLAnchorElement | null>>([])
  const model = buildPageTabsModel(primaryTabs, activePrimaryId, MAX_VISIBLE_PAGE_TABS)
  const { groups, visible: visibleTabs, overflow: overflowTabs } = model
  const activeOverflowTab = overflowTabs.find((tab) => tab.id === activePrimaryId)
  const menuGroups = groups
    .map((group) => ({ ...group, tabs: group.tabs.filter((tab) => overflowTabs.some((item) => item.id === tab.id)) }))
    .filter((group) => group.tabs.length > 0)

  useEffect(() => {
    if (!moreOpen) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (!menuRef.current?.contains(target) && !triggerRef.current?.contains(target)) setMoreOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMoreOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [moreOpen])

  useLayoutEffect(() => {
    if (!moreOpen || !triggerRef.current) return
    const updatePosition = () => {
      const trigger = triggerRef.current
      if (!trigger) return
      const rect = trigger.getBoundingClientRect()
      const margin = 8
      const width = Math.min(Math.max(rect.width, 208), Math.max(1, window.innerWidth - margin * 2))
      const maxHeight = Math.max(120, Math.min(288, window.innerHeight - margin * 2))
      const left = Math.min(Math.max(margin, rect.right - width), window.innerWidth - width - margin)
      const top = Math.max(margin, Math.min(rect.bottom + 6, window.innerHeight - maxHeight - margin))
      setMenuPosition({ top, left, width, maxHeight })
    }
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [moreOpen])

  useEffect(() => {
    if (!moreOpen) return
    menuItemRefs.current[0]?.focus()
  }, [moreOpen])

  if (primaryTabs.length < 2 && secondaryTabs.length < 2) return null

  const select = (tabs: PageTab[], activeId: string, selectLabel: string) => (
    <label className="block min-w-0 w-full">
      <span className="sr-only">{translateUiText(language, selectLabel)}</span>
      <select
        aria-label={translateUiText(language, selectLabel)}
        value={tabs.some((tab) => tab.id === activeId) ? activeId : ''}
        onChange={(event) => {
          const selected = tabs.find((tab) => tab.id === event.target.value)
          if (selected) router.push(selected.href)
        }}
        className="min-h-11 w-full min-w-0 rounded-lg border border-[#d1d5db] bg-white px-3 text-sm font-medium text-[#271a83] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1e127c] dark:border-[#3f3f46] dark:bg-[#18181b] dark:text-[#e0dbfa]"
      >
        {tabs.map((tab) => <option key={tab.id} value={tab.id}>{translateUiText(language, tab.label)}</option>)}
      </select>
    </label>
  )

  const desktopLink = (tab: PageTab, activeId: string) => {
    const active = tab.id === activeId
    return (
      <Link
        key={tab.id}
        href={tab.href}
        aria-current={active ? 'page' : undefined}
        title={translateUiText(language, tab.label)}
        className={`flex min-h-10 min-w-0 flex-1 items-center justify-center rounded-lg px-2 py-2 text-center text-sm font-semibold leading-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e127c] ${active ? 'bg-white text-[#271a83] shadow-sm ring-1 ring-black/5 dark:bg-[#29234b] dark:text-[#e0dbfa]' : 'text-[#4b5563] hover:bg-[#e5e7eb] hover:text-[#271a83] dark:text-[#d4d4d8] dark:hover:bg-[#3f3f46] dark:hover:text-[#e0dbfa]'}`}
      >
        <span className="min-w-0 break-words">{translateUiText(language, tab.label)}</span>
      </Link>
    )
  }

  const onMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const items = menuItemRefs.current.filter((item): item is HTMLAnchorElement => Boolean(item))
    if (!items.length) return
    const current = items.indexOf(document.activeElement as HTMLAnchorElement)
    const next = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? items.length - 1
        : event.key === 'ArrowDown'
          ? (current + 1 + items.length) % items.length
          : (current - 1 + items.length) % items.length
    items[next]?.focus()
  }

  const sidebarContent = (
    <nav aria-label={translateUiText(language, label)} className="hidden min-w-0 lg:block">
      <div className="space-y-4">
        {groups.map((group) => (
          <section key={group.id} aria-label={group.label ? translateUiText(language, group.label) : undefined}>
            {groups.length > 1 && group.label ? <h3 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-[#6b7280] dark:text-[#a1a1aa]">{translateUiText(language, group.label)}</h3> : null}
            <ul className="space-y-1">
              {group.tabs.map((tab) => (
                <li key={tab.id}>
                  <Link
                    href={tab.href}
                    aria-current={tab.id === activePrimaryId ? 'page' : undefined}
                    className={`flex min-h-10 min-w-0 items-center rounded-lg px-3 py-2 text-sm font-medium leading-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1e127c] ${tab.id === activePrimaryId ? 'bg-[#eeebfb] text-[#271a83] dark:bg-[#29234b] dark:text-[#e0dbfa]' : 'text-[#4b5563] hover:bg-[#f3f4f6] dark:text-[#d4d4d8] dark:hover:bg-[#27272a]'}`}
                  >
                    <span className="min-w-0 break-words">{translateUiText(language, tab.label)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {secondaryTabs.length > 1 ? (
          <section aria-label={translateUiText(language, 'صفحات القسم')}>
            <h3 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-[#6b7280] dark:text-[#a1a1aa]">{translateUiText(language, 'صفحات القسم')}</h3>
            <ul className="space-y-1">
              {secondaryTabs.map((tab) => (
                <li key={tab.id}><Link href={tab.href} aria-current={tab.id === activeSecondaryId ? 'page' : undefined} className="flex min-h-10 items-center rounded-lg px-3 py-2 text-sm text-[#4b5563] hover:bg-[#f3f4f6] dark:text-[#d4d4d8] dark:hover:bg-[#27272a]">{translateUiText(language, tab.label)}</Link></li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </nav>
  )

  let menuItemIndex = 0
  const menu = moreOpen && menuPosition && typeof document !== 'undefined'
    ? createPortal(
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={translateUiText(language, 'المزيد من الصفحات')}
          onKeyDown={onMenuKeyDown}
          style={{ position: 'fixed', top: menuPosition.top, left: menuPosition.left, width: menuPosition.width, maxHeight: menuPosition.maxHeight, zIndex: 9999 }}
          className="z-[9999] min-w-0 overscroll-contain overflow-y-auto rounded-xl border border-[#d1d5db] bg-white p-1.5 shadow-2xl dark:border-[#3f3f46] dark:bg-[#18181b]"
        >
          {menuGroups.map((group) => (
            <div key={group.id}>
              {menuGroups.length > 1 && group.label ? <div role="presentation" className="px-3 pb-1 pt-2 text-xs font-semibold text-[#6b7280] dark:text-[#a1a1aa]">{translateUiText(language, group.label)}</div> : null}
              {group.tabs.map((tab) => {
                const nextIndex = menuItemIndex++
                return (
                  <Link
                    key={tab.id}
                    ref={(element) => { menuItemRefs.current[nextIndex] = element }}
                    href={tab.href}
                    role="menuitem"
                    aria-current={tab.id === activePrimaryId ? 'page' : undefined}
                    onClick={() => setMoreOpen(false)}
                    className={`flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-medium leading-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1e127c] ${tab.id === activePrimaryId ? 'bg-[#eeebfb] text-[#271a83] dark:bg-[#29234b] dark:text-[#e0dbfa]' : 'text-[#374151] hover:bg-[#f3f4f6] dark:text-[#e4e4e7] dark:hover:bg-[#27272a]'}`}
                  >
                    <span className="break-words">{translateUiText(language, tab.label)}</span>
                  </Link>
                )
              })}
            </div>
          ))}
        </div>,
        document.body,
      )
    : null

  if (layout === 'sidebar') {
    return (
      <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <div className="space-y-2 lg:hidden">
          {select(primaryTabs, activePrimaryId, label)}
          {secondaryTabs.length > 1 ? select(secondaryTabs, activeSecondaryId, 'صفحات القسم') : null}
        </div>
        {sidebarContent}
      </aside>
    )
  }

  return (
    <div className="erp-page-tabs min-w-0 max-w-full border-y border-[#e5e7eb] bg-white/95 py-2 backdrop-blur-sm dark:border-[#3f3f46] dark:bg-[#161b22]/95 motion-reduce:backdrop-blur-none">
      <div className="space-y-2 md:hidden">
        {select(primaryTabs, activePrimaryId, label)}
        {secondaryTabs.length > 1 ? select(secondaryTabs, activeSecondaryId, 'صفحات القسم') : null}
      </div>
      <nav aria-label={translateUiText(language, label)} className="hidden min-w-0 md:block">
        <div className="flex min-w-0 flex-nowrap items-stretch gap-1 rounded-xl bg-[#f3f4f6] p-1 dark:bg-[#27272a]">
          {visibleTabs.map((tab) => desktopLink(tab, activePrimaryId))}
          {overflowTabs.length ? (
            <div className="shrink-0">
              <button
                ref={triggerRef}
                type="button"
                aria-haspopup="menu"
                aria-controls={menuId}
                aria-expanded={moreOpen}
                onClick={() => setMoreOpen((open) => !open)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown' && !moreOpen) {
                    event.preventDefault()
                    setMoreOpen(true)
                  }
                }}
                className="flex min-h-10 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-[#4b5563] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1e127c] dark:text-[#d4d4d8]"
              >
                {activeOverflowTab ? translateUiText(language, activeOverflowTab.label) : translateUiText(language, 'المزيد')}
                <ChevronDown size={15} aria-hidden className={`transition-transform motion-reduce:transition-none ${moreOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
          ) : null}
        </div>
        {secondaryTabs.length > 1 ? (
          <div className="mt-2 flex min-w-0 flex-nowrap items-stretch gap-1">
            {secondaryTabs.map((tab) => desktopLink(tab, activeSecondaryId))}
          </div>
        ) : null}
      </nav>
      {menu}
    </div>
  )
}
