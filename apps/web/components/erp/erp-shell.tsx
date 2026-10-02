'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, ChevronDown, ChevronsDownUp, ChevronsUpDown, Factory, Loader2, LogOut, Menu, Moon, PanelRightClose, PanelRightOpen, ScrollText, Search, Sun, X } from 'lucide-react'

import { LiveWorkspace } from '@/components/erp/live/workspace'
import type { LiveCtx } from '@/components/erp/live/ctx'
import { PageTabs } from '@/components/erp/page-tabs'
import { useAuth } from '@/components/providers/auth-provider'
import {
  breadcrumbs,
  canSeeEntity,
  hrefForEntity,
  leafMeta,
  pageTabs,
  resolvePath,
} from '@/lib/erp-routes'
import { DEFAULT_ROLE_PERMISSIONS } from '@/lib/erp/domain/permissions'
import type { RoleKey } from '@/lib/erp/domain/permissions'
import { canAccessMain, canAccessSub, ERP_NAV, NAV_SECTIONS, sectionForMain } from '@/lib/erp-nav'
import { destinationLabel, getSupportedLanguages, translateUiText } from '@/lib/i18n/translations'
import type { Language } from '@/lib/i18n/translations'
import { directionFor, useLanguage } from '@/lib/i18n/language-provider'
import { useErp } from '@/lib/use-erp'

const COMPACT_KEY = 'erp-sidebar-compact'
const THEME_KEY = 'erp-theme'
const NAV_OPEN_KEY = 'erp-sidebar-open-groups'

function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '؟'
  if (parts.length === 1) return parts[0]!.slice(0, 1)
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`
}

export function ErpShell() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading: authLoading, logout, refresh } = useAuth()
  const erp = useErp(Boolean(user))
  const { language, setLanguage, t } = useLanguage()
  const uiLabel = (value: string) => translateUiText(language, value)
  const roleKey = (user?.roles[0]?.key ?? 'GM') as RoleKey
  const permissions = roleKey === 'GM' ? DEFAULT_ROLE_PERMISSIONS.GM : (erp.state?.rolePermissions[roleKey] ?? user?.permissions ?? [])

  const [mobileOpen, setMobileOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)
  const [navReady, setNavReady] = useState(false)
  const [compact, setCompact] = useState(false)
  const [dark, setDark] = useState(false)
  const [themeReady, setThemeReady] = useState(false)
  const [noticesOpen, setNoticesOpen] = useState(false)
  const [expandedNav, setExpandedNav] = useState<Record<string, boolean>>({})
  const [navSearch, setNavSearch] = useState('')
  const noticesRef = useRef<HTMLDivElement>(null)

  const resolved = resolvePath(pathname)
  const mainTabs = ERP_NAV.filter((main) => canAccessMain(permissions, main) && main.subs.some((sub) => canAccessSub(permissions, sub, main)))
  const currentMain = resolved ? mainTabs.find((main) => main.subs.some((sub) => sub.entityKey === resolved.leaf.entityKey && canAccessSub(permissions, sub, main))) : undefined
  const query = navSearch.trim().toLocaleLowerCase('ar')
  const sectionEntries = NAV_SECTIONS.map((section) => ({
    section,
    mains: mainTabs.filter((main) => section.mainIds.includes(main.id)).map((main) => {
      const accessibleSubs = main.subs.filter((sub) => canAccessSub(permissions, sub, main) && hrefForEntity(sub.entityKey))
      const mainMatches = !query || main.label.toLocaleLowerCase('ar').includes(query)
      const subs = accessibleSubs.filter((sub) => mainMatches || !query || sub.label.toLocaleLowerCase('ar').includes(query))
      return { main, subs, href: hrefForEntity(subs[0]?.entityKey ?? accessibleSubs[0]?.entityKey ?? '') }
    }).filter((entry) => entry.subs.length > 0),
  })).filter((entry) => entry.mains.length > 0)
  const destLabel = (destination: { id: string; label: string }) => destinationLabel(language, destination.id, destination.label)
  const iconOnly = compact && !mobileOpen
  const sectionKey = (id: string) => `s:${id}`
  const mainKey = (id: string) => `m:${id}`
  const sectionOpen = (id: string) => query !== '' || (expandedNav[sectionKey(id)] ?? true)
  const mainOpen = (id: string) => query !== '' || (expandedNav[mainKey(id)] ?? currentMain?.id === id)
  const toggleSection = (id: string) => setExpandedNav((current) => ({ ...current, [sectionKey(id)]: !(current[sectionKey(id)] ?? true) }))
  const toggleMain = (id: string) => setExpandedNav((current) => ({ ...current, [mainKey(id)]: !(current[mainKey(id)] ?? currentMain?.id === id) }))
  const setAllNavExpanded = (expanded: boolean) => {
    const next: Record<string, boolean> = {}
    NAV_SECTIONS.forEach((section) => { next[sectionKey(section.id)] = expanded })
    mainTabs.forEach((main) => { next[mainKey(main.id)] = expanded })
    setExpandedNav(next)
  }

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [authLoading, user, router])

  useEffect(() => {
    if (erp.message) setToast(erp.message)
  }, [erp.message])

  useEffect(() => {
    try {
      const storedCompact = localStorage.getItem(COMPACT_KEY)
      if (storedCompact === '1' || storedCompact === '0') setCompact(storedCompact === '1')
      const storedNav = localStorage.getItem(NAV_OPEN_KEY)
      if (storedNav) setExpandedNav(JSON.parse(storedNav) as Record<string, boolean>)
      else if (window.matchMedia('(min-width: 768px) and (max-width: 1023px)').matches) setCompact(true)
    } catch {
      /* keep defaults */
    }
    const storedTheme = localStorage.getItem(THEME_KEY)
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const useDark = storedTheme === 'dark' || (storedTheme !== 'light' && prefersDark)
    setDark(useDark)
    document.documentElement.classList.toggle('dark', useDark)
    document.documentElement.classList.toggle('light', !useDark)
    setThemeReady(true)
    setNavReady(true)
  }, [])

  useEffect(() => {
    if (!navReady) return
    localStorage.setItem(COMPACT_KEY, compact ? '1' : '0')
  }, [navReady, compact])

  useEffect(() => {
    if (!navReady) return
    localStorage.setItem(NAV_OPEN_KEY, JSON.stringify(expandedNav))
  }, [navReady, expandedNav])

  useEffect(() => {
    if (!themeReady) return
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.classList.toggle('light', !dark)
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light')
  }, [themeReady, dark])

  useEffect(() => {
    setMobileOpen(false)
    setNoticesOpen(false)
    const current = resolvePath(pathname)
    if (!current) return
    const activeMain = ERP_NAV.find((main) => main.subs.some((sub) => sub.entityKey === current.leaf.entityKey && canAccessSub(permissions, sub, main)))
    if (!activeMain) return
    const section = sectionForMain(activeMain.id)
    setExpandedNav((previous) => ({ ...previous, [sectionKey(section.id)]: true, [mainKey(activeMain.id)]: true }))
  }, [pathname, permissions.join('|')])

  useEffect(() => {
    if (!noticesOpen) return
    const onPointer = (event: MouseEvent) => {
      if (!noticesRef.current?.contains(event.target as Node)) setNoticesOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [noticesOpen])

  if (authLoading || !user) {
    return (
      <main dir={directionFor(language)} className="grid min-h-screen place-items-center bg-[#f9fafb] text-[#1f1f1f]">
        <div className="flex items-center gap-3 text-sm text-[#6b7280]">
          <Loader2 className="animate-spin" size={18} />
          {uiLabel('جاري التحقق من الجلسة...')}
        </div>
      </main>
    )
  }

  const primaryRole = uiLabel(user.roles[0]?.nameAr ?? 'مستخدم')
  const firstName = user.fullName.trim().split(/\s+/)[0] ?? user.fullName
  const notices = erp.state?.notifications.filter((item) => item.roles.includes(roleKey)) ?? []
  const unread = notices.filter((item) => !item.read).length
  const showNotices = canSeeEntity(permissions, 'notification')
  const showAudit = canSeeEntity(permissions, 'auditLog')
  const allowed = resolved ? canSeeEntity(permissions, resolved.leaf.entityKey) : false
  const rawMeta = resolved ? leafMeta(resolved.leaf.entityKey) : null
  const meta = rawMeta ? { label: uiLabel(rawMeta.label), description: uiLabel(rawMeta.description) } : null
  const tabs = resolved && allowed ? pageTabs(resolved, permissions) : null
  const crumbs = resolved && allowed
    ? breadcrumbs(resolved, permissions).map((crumb) => ({ ...crumb, label: uiLabel(crumb.label) }))
    : []

  const liveCtx: LiveCtx | null = erp.state
    ? {
        state: erp.state,
        permissions,
        pending: erp.pending,
        act: erp.act,
        navigate: (key) => {
          const href = hrefForEntity(key)
          if (href) router.push(href)
        },
        refreshUser: refresh,
      }
    : null

  return (
    <main dir={directionFor(language)} className={`erp-app min-h-screen bg-[#f9fafb] text-[#1f1f1f] md:p-[15px] ${iconOnly ? 'erp-app-compact' : ''}`}>
      {mobileOpen ? (
        <button type="button" aria-label={uiLabel('إغلاق')} className="fixed inset-0 z-30 bg-[#1f1f1f]/40 md:hidden" onClick={() => setMobileOpen(false)} />
      ) : null}
      <aside
        className={`erp-sidebar fixed z-40 flex w-72 flex-col overflow-hidden bg-[#f9fafb] text-[#1f1f1f] transition-[width,transform] duration-300 md:inset-y-[15px] md:right-[15px] md:translate-x-0 ${iconOnly ? 'md:w-20' : ''} ${mobileOpen ? 'inset-y-0 right-0 translate-x-0 bg-white shadow-xl' : 'inset-y-0 right-0 translate-x-full'}`}
      >
        <div className={`flex h-16 items-center gap-2 border-b border-[#e5e7eb] ${iconOnly ? 'justify-center px-2' : 'px-4'}`}>
          <Link href="/" aria-label={uiLabel('الرئيسية')} className="erp-mark grid size-8 shrink-0 place-items-center rounded-lg bg-[#1f1f1f] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488]">
            <Factory size={16} aria-hidden strokeWidth={2.4} />
          </Link>
          <div className={iconOnly ? 'sr-only' : 'min-w-0 flex-1'}>
            <div className="truncate text-[22px] font-semibold leading-none">مصنع الخليج للأعلاف</div>
          </div>
          <button
            type="button"
            aria-label={uiLabel(compact ? 'توسيع الشريط' : 'طي الشريط')}
            title={uiLabel(compact ? 'توسيع الشريط' : 'طي الشريط')}
            className={`${iconOnly ? 'hidden' : 'hidden md:grid'} shrink-0 rounded-[10px] p-1.5 text-[#525252] hover:bg-neutral-200/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488]`}
            onClick={() => setCompact((value) => !value)}
          >
            {compact ? <PanelRightOpen size={18} aria-hidden /> : <PanelRightClose size={18} aria-hidden />}
          </button>
          <button
            aria-label={uiLabel('إغلاق')}
            className="mr-auto rounded-lg p-1.5 text-[#525252] hover:bg-neutral-200/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488] md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X size={22} />
          </button>
        </div>

        <nav className="erp-sidebar-nav flex-1 space-y-2 overflow-y-auto px-3 py-4" aria-label={uiLabel('أقسام النظام')}>
          {!iconOnly ? (
            <div className="mb-2 flex items-center justify-between gap-2 px-2">
              <div className="text-[11px] font-semibold tracking-[0.12em] text-[#9ca3af]">{uiLabel('مساحة العمل')}</div>
              <div className="flex items-center gap-1">
                <button type="button" aria-label={uiLabel('طي الكل')} title={uiLabel('طي الكل')} className="grid size-7 place-items-center rounded-md text-[#737373] hover:bg-white" onClick={() => setAllNavExpanded(false)}><ChevronsDownUp size={15} aria-hidden /></button>
                <button type="button" aria-label={uiLabel('فتح الكل')} title={uiLabel('فتح الكل')} className="grid size-7 place-items-center rounded-md text-[#737373] hover:bg-white" onClick={() => setAllNavExpanded(true)}><ChevronsUpDown size={15} aria-hidden /></button>
              </div>
            </div>
          ) : null}
          {!iconOnly ? (
            <label className="mb-3 flex h-10 items-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-3 text-[#737373] focus-within:border-[#0d9488]">
              <Search size={16} aria-hidden />
              <input value={navSearch} onChange={(event) => setNavSearch(event.target.value)} placeholder={uiLabel('ابحث في القوائم')} aria-label={uiLabel('ابحث في القوائم')} className="min-w-0 flex-1 bg-transparent text-right text-sm text-[#1f1f1f] outline-none placeholder:text-[#9ca3af]" />
              {navSearch ? <button type="button" aria-label={uiLabel('مسح البحث')} onClick={() => setNavSearch('')} className="text-xs text-[#6b7280]">×</button> : null}
            </label>
          ) : null}
          {sectionEntries.map(({ section, mains }) => (
            <section key={section.id} className="space-y-1">
              {!iconOnly ? (
                <button type="button" aria-expanded={sectionOpen(section.id)} onClick={() => toggleSection(section.id)} className="flex h-8 w-full items-center justify-between px-2 text-right text-[11px] font-semibold tracking-wide text-[#9ca3af] hover:text-[#155e55]">
                  <span>{uiLabel(section.label)}</span><ChevronDown size={14} aria-hidden className={`transition-transform ${sectionOpen(section.id) ? 'rotate-180' : ''}`} />
                </button>
              ) : null}
              {sectionOpen(section.id) ? mains.map(({ main, subs, href }) => {
                const Icon = main.icon
                const active = currentMain?.id === main.id
                return (
                  <div key={main.id} className="rounded-xl">
                    <div className="flex items-center gap-1">
                      <Link href={href ?? '/'} aria-current={active ? 'page' : undefined} aria-label={uiLabel(main.label)} title={uiLabel(main.label)} className={`erp-nav-item relative flex h-10 min-w-0 flex-1 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-200 group focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488] ${active ? 'erp-nav-item-active border border-[#bde5df] bg-[#e9f7f4] text-[#155e55] shadow-sm' : 'text-[#525252] hover:bg-white hover:text-[#155e55] hover:shadow-sm'}`}>
                        <Icon size={17} aria-hidden strokeWidth={active ? 2.2 : 2} className="shrink-0 transition-transform duration-300 group-hover:scale-110" />
                        <span className={iconOnly ? 'sr-only' : 'truncate'}>{uiLabel(main.label)}</span>
                      </Link>
                      {!iconOnly ? <button type="button" aria-label={`${uiLabel(mainOpen(main.id) ? 'طي' : 'فتح')} ${uiLabel(main.label)}`} aria-expanded={mainOpen(main.id)} title={uiLabel(main.label)} onClick={() => toggleMain(main.id)} className="grid size-8 shrink-0 place-items-center rounded-lg text-[#6b7280] hover:bg-white hover:text-[#155e55]"><ChevronDown size={15} aria-hidden className={`transition-transform ${mainOpen(main.id) ? 'rotate-180' : ''}`} /></button> : null}
                    </div>
                    {!iconOnly && mainOpen(main.id) ? <div className="mr-4 mt-1 space-y-1 border-r border-[#d7e4e2] py-1 pr-2">
                      {subs.map((sub) => {
                        const href = hrefForEntity(sub.entityKey) ?? '/'
                        const current = resolved?.leaf.entityKey === sub.entityKey && pathname === href
                        return <Link key={sub.id} href={href} aria-current={current ? 'page' : undefined} title={uiLabel(sub.label)} className={`flex min-h-9 w-full items-center rounded-lg px-3 py-1.5 text-right text-[13px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488] ${current ? 'bg-neutral-200/70 text-[#171717]' : 'text-[#525252] hover:bg-neutral-200/50'}`}><span className="truncate">{uiLabel(sub.label)}</span></Link>
                      })}
                    </div> : null}
                  </div>
                )
              }) : mains.map(({ main, href }) => {
                const Icon = main.icon
                return <Link key={main.id} href={href ?? '/'} aria-label={uiLabel(main.label)} title={uiLabel(main.label)} className="grid h-10 place-items-center rounded-xl text-[#525252] hover:bg-white hover:text-[#155e55]"><Icon size={18} aria-hidden /></Link>
              })}
            </section>
          ))}
          {sectionEntries.length === 0 && !iconOnly ? <p className="px-3 py-6 text-center text-sm text-[#737373]">{uiLabel('لا توجد نتائج')}</p> : null}
        </nav>

        <div className="erp-sidebar-footer mt-auto border-t border-[#e5e7eb] bg-white/60 p-3">
          {iconOnly ? (
            <button
              type="button"
              aria-label={uiLabel('توسيع الشريط')}
              title={uiLabel('توسيع الشريط')}
              className="mb-3 hidden w-full place-items-center rounded-lg border border-[#d1d5db] bg-white p-2 text-[#525252] shadow-sm hover:bg-neutral-200/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488] md:grid"
              onClick={() => setCompact(false)}
            >
              <PanelRightOpen size={18} aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              aria-label={uiLabel('طي الشريط')}
              className="mb-3 hidden w-full items-center justify-center gap-2 rounded-lg border border-[#d1d5db] bg-white px-3 py-2 text-sm font-medium text-[#525252] shadow-sm hover:bg-neutral-200/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488] md:flex"
              onClick={() => setCompact(true)}
            >
              <PanelRightClose size={18} aria-hidden />
              {uiLabel('طي الشريط')}
            </button>
          )}
          <div className={` ${iconOnly ? 'flex flex-col items-center gap-2 p-2' : 'flex items-center gap-3 px-1 py-2'}`}>
            <div className="erp-mark grid size-8 place-items-center rounded-full bg-[#1f1f1f] text-sm font-medium text-white">
              {getInitials(user.fullName)}
            </div>
            <div className={iconOnly ? 'sr-only' : 'min-w-0'}>
              <div className="truncate text-sm font-medium">{user.fullName}</div>
              <div className="truncate text-[13px] text-[#6b7280]">{primaryRole}</div>
              <div className="truncate text-[12px] text-[#9ca3af]">{user.email}</div>
              <div className="mt-1 truncate text-[10px] text-[#9ca3af]" dir="ltr">Build {process.env.NEXT_PUBLIC_GIT_COMMIT_SHA ?? 'local'} · {process.env.NEXT_PUBLIC_BUILD_DATE ?? 'development'}</div>
            </div>
            <button
              type="button"
              aria-label={uiLabel('تسجيل الخروج')}
              disabled={loggingOut}
              onClick={async () => {
                setLoggingOut(true)
                await logout()
                router.replace('/login')
              }}
              className={`${iconOnly ? '' : 'mr-auto'} grid size-9 place-items-center rounded-lg text-[#525252] hover:bg-neutral-200/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488]`}
            >
              {loggingOut ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <LogOut size={18} aria-hidden />}
            </button>
          </div>
        </div>
      </aside>

      <div className={`erp-content min-h-screen overflow-auto bg-white md:min-h-[calc(100vh-30px)] md:rounded-[15px] md:border md:border-[#e5e7eb] ${iconOnly ? 'md:mr-[6.5rem]' : 'md:mr-[19.5rem]'}`}>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-[#e5e7eb] bg-white px-5 md:px-8">
          <button
            aria-label={uiLabel('فتح القائمة')}
            className="rounded-lg border border-[#e5e7eb] bg-white p-2.5 text-[#525252] hover:bg-neutral-200/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488] md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={22} aria-hidden />
          </button>
          <div className="hidden text-right sm:block">
            <div className="text-[13px] text-[#6b7280]">{primaryRole} · {user.email}</div>
            <h1 className="text-2xl font-semibold leading-tight">{uiLabel('مرحباً،')} {firstName}</h1>
          </div>
          <div className="mr-auto flex items-center gap-2">
            {showAudit ? (
              <Link
                href="/settings/audit"
                aria-label={uiLabel('سجل العمليات')}
                title={uiLabel('سجل العمليات')}
                aria-current={pathname === '/settings/audit' ? 'page' : undefined}
                className="rounded-lg border border-[#e5e7eb] bg-white p-2.5 text-[#525252] hover:bg-neutral-200/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488]"
              >
                <ScrollText size={22} aria-hidden />
              </Link>
            ) : null}
            {showNotices ? (
              <div className="relative" ref={noticesRef}>
                <button
                  type="button"
                  aria-label={uiLabel('إشعارات')}
                  aria-expanded={noticesOpen}
                  className="relative rounded-lg border border-[#e5e7eb] bg-white p-2.5 text-[#525252] hover:bg-neutral-200/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488]"
                  onClick={() => setNoticesOpen((open) => !open)}
                >
                  <Bell size={22} aria-hidden />
                  {unread > 0 ? (
                    <span className="absolute -left-1 -top-1 grid min-w-5 place-items-center rounded-full bg-[#ef4444] px-1 text-[10px] font-medium text-white">
                      {unread}
                    </span>
                  ) : null}
                </button>
                {noticesOpen ? (
                  <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-[min(22rem,80vw)] rounded-xl border border-[#e5e7eb] bg-white p-3 text-[#1f1f1f] shadow-sm">
                    <div className="mb-2 text-sm font-bold">{uiLabel('الإشعارات')}</div>
                    <div className="max-h-80 space-y-2 overflow-y-auto">
                      {notices.length === 0 ? <p className="text-sm text-[#6b7280]">{uiLabel('لا توجد إشعارات')}</p> : null}
                      {notices.slice(0, 8).map((item) => (
                        <div key={item.id} className="rounded-lg border border-[#e5e7eb] p-3">
                          <Link
                            href="/notifications"
                            onClick={() => setNoticesOpen(false)}
                            className="block rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488]"
                          >
                            <div className="font-medium">{uiLabel(item.title)}</div>
                            <div className="text-sm text-[#6b7280]">{uiLabel(item.body)}</div>
                          </Link>
                          {!item.read && liveCtx ? (
                            <button
                              type="button"
                              className="mt-2 text-sm font-medium text-[#0d9488] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488]"
                              onClick={() => liveCtx.act('markNotificationRead', { id: item.id })}
                            >
                              {uiLabel('تمت القراءة')}
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                    <Link href="/notifications" className="mt-3 inline-flex text-sm font-medium text-[#0d9488] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488]">
                      {uiLabel('الإشعارات')}
                    </Link>
                  </div>
                ) : null}
              </div>
            ) : null}
            <button
              type="button"
              aria-label={uiLabel(dark ? 'الوضع الفاتح' : 'الوضع الداكن')}
              className="rounded-lg border border-[#e5e7eb] bg-white p-2.5 text-[#525252] hover:bg-neutral-200/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488]"
              onClick={() => setDark((value) => !value)}
            >
              {dark ? <Sun size={22} aria-hidden /> : <Moon size={22} aria-hidden />}
            </button>
            <label className="relative">
              <span className="sr-only">{t('language')}</span>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as Language)}
                aria-label={t('language')}
                title={t('language')}
                className="h-[42px] rounded-lg border border-[#e5e7eb] bg-white px-2.5 text-sm font-medium text-[#525252] hover:bg-neutral-200/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488]"
              >
                {getSupportedLanguages().map((item) => (
                  <option key={item.code} value={item.code}>{item.name}</option>
                ))}
              </select>
            </label>
            {erp.storage ? (
              <span className="hidden rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-3 py-1 text-xs font-medium text-[#6b7280] sm:inline">
                {uiLabel(erp.storage === 'postgresql' ? 'تخزين سحابي' : 'نسخة محلية')}
                {process.env.NEXT_PUBLIC_APP_ENV === 'staging' ? ` — ${uiLabel('تجريبي')}` : ''}
              </span>
            ) : null}
          </div>
        </header>

        <div className="mx-auto max-w-[1480px] px-5 py-7 md:px-8 lg:px-10">
          {erp.error ? <div className="mb-4 rounded-lg border border-[#fecaca] bg-[#fee2e2] px-4 py-3 text-sm font-medium text-[#dc2626]">{uiLabel(erp.error)}</div> : null}
          {tabs ? (
            <>
              <PageTabs label="أقسام الصفحة" tabs={tabs.primary} activeId={tabs.activePrimary} />
              <PageTabs label="تفاصيل الصفحة" tabs={tabs.secondary} activeId={tabs.activeSecondary} />
            </>
          ) : null}
          {resolved?.destination?.id === 'settings' && showAudit ? (
            <div className="mb-4">
              <Link
                href="/settings/audit"
                aria-current={pathname === '/settings/audit' ? 'page' : undefined}
                className={`text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488] ${
                  pathname === '/settings/audit' ? 'text-[#1f1f1f] underline' : 'text-[#0d9488]'
                }`}
              >
                {uiLabel('سجل العمليات')}
              </Link>
            </div>
          ) : null}
          {erp.loading || !liveCtx ? (
            <div aria-busy="true" aria-live="polite" className="space-y-4">
              <span className="sr-only">{uiLabel('جاري تحميل عمليات المصنع...')}</span>
              <div className="h-8 w-56 animate-pulse rounded-lg bg-[#f3f4f6]" />
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {['a', 'b', 'c'].map((key) => (
                  <div key={key} className="h-28 animate-pulse rounded-[12px] bg-[#f3f4f6]" />
                ))}
              </div>
              <div className="h-72 animate-pulse rounded-[12px] bg-[#f3f4f6]" />
            </div>
          ) : resolved && allowed && meta ? (
            <LiveWorkspace entityKey={resolved.leaf.entityKey} title={meta.label} description={meta.description} crumbs={crumbs} ctx={liveCtx} />
          ) : (
            <div className="rounded-[12px] border border-[#e5e7eb] bg-white p-6 text-sm text-[#6b7280]">{uiLabel(resolved ? 'ليست لديك صلاحية لهذه الشاشة' : 'هذه الشاشة غير مربوطة بعد.')}</div>
          )}
        </div>
      </div>

      {toast ? (
        <div role="status" className="fixed bottom-5 left-5 z-50 rounded-lg bg-[#1f1f1f] px-4 py-3 text-xs font-medium text-white shadow-sm">
          {toast}
          <button type="button" aria-label={uiLabel('إغلاق')} className="mr-3 text-white/80 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white" onClick={() => setToast('')}>
            ×
          </button>
        </div>
      ) : null}
    </main>
  )
}
