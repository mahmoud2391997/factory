'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, ChevronDown, ChevronUp, ChevronsDownUp, ChevronsUpDown, Factory, Loader2, LogOut, Menu, Moon, PanelRightClose, PanelRightOpen, ScrollText, Sun, X } from 'lucide-react'

import { LiveWorkspace } from '@/components/erp/live/workspace'
import type { LiveCtx } from '@/components/erp/live/ctx'
import { PageTabs } from '@/components/erp/page-tabs'
import { useAuth } from '@/components/providers/auth-provider'
import {
  breadcrumbs,
  canSeeEntity,
  entryHref,
  hrefForEntity,
  leafMeta,
  pageTabs,
  resolvePath,
  sidebarNodes,
  visibleDestinations,
} from '@/lib/erp-routes'
import type { RoleKey } from '@/lib/erp/domain/permissions'
import { useErp } from '@/lib/use-erp'

const COMPACT_KEY = 'erp-sidebar-compact'
const THEME_KEY = 'erp-theme'

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
  const roleKey = (user?.roles[0]?.key ?? 'GM') as RoleKey
  const permissions = erp.state?.rolePermissions[roleKey] ?? user?.permissions ?? []

  const [mobileOpen, setMobileOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)
  const [navReady, setNavReady] = useState(false)
  const [compact, setCompact] = useState(false)
  const [dark, setDark] = useState(false)
  const [themeReady, setThemeReady] = useState(false)
  const [noticesOpen, setNoticesOpen] = useState(false)
  const [expandedNav, setExpandedNav] = useState<Record<string, boolean>>({})
  const noticesRef = useRef<HTMLDivElement>(null)

  const resolved = resolvePath(pathname)
  const destinations = visibleDestinations(permissions)
  const iconOnly = compact && !mobileOpen
  const destinationKey = (id: string) => `d:${id}`
  const groupKey = (destinationId: string, groupId: string) => `g:${destinationId}:${groupId}`
  const destinationOpen = (id: string) => expandedNav[destinationKey(id)] ?? id === resolved?.destination?.id
  const groupOpen = (destinationId: string, groupId: string) =>
    expandedNav[groupKey(destinationId, groupId)] ?? (destinationId === resolved?.destination?.id && groupId === resolved?.group?.id)
  const toggleDestination = (id: string) =>
    setExpandedNav((current) => {
      const willOpen = !(current[destinationKey(id)] ?? id === resolved?.destination?.id)
      const next = { ...current }
      destinations.forEach((destination) => {
        next[destinationKey(destination.id)] = false
      })
      next[destinationKey(id)] = willOpen
      return next
    })
  const toggleGroup = (destinationId: string, groupId: string) =>
    setExpandedNav((current) => {
      const willOpen = !(current[groupKey(destinationId, groupId)] ?? (destinationId === resolved?.destination?.id && groupId === resolved?.group?.id))
      const next = { ...current }
      const destination = destinations.find((item) => item.id === destinationId)
      destination &&
        sidebarNodes(destination, permissions).forEach((node) => {
          next[groupKey(destinationId, node.id)] = false
        })
      next[destinationKey(destinationId)] = true
      next[groupKey(destinationId, groupId)] = willOpen
      return next
    })
  const setAllNavExpanded = (expanded: boolean) => {
    const next: Record<string, boolean> = {}
    destinations.forEach((destination) => {
      next[destinationKey(destination.id)] = expanded
      sidebarNodes(destination, permissions).forEach((node) => {
        next[groupKey(destination.id, node.id)] = expanded
      })
    })
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
    if (!themeReady) return
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.classList.toggle('light', !dark)
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light')
  }, [themeReady, dark])

  useEffect(() => {
    setMobileOpen(false)
    setNoticesOpen(false)
    const current = resolvePath(pathname)
    if (!current?.destination) return
    const next: Record<string, boolean> = {}
    visibleDestinations(permissions).forEach((destination) => {
      const activeDestination = destination.id === current.destination?.id
      next[`d:${destination.id}`] = activeDestination
      sidebarNodes(destination, permissions).forEach((node) => {
        next[`g:${destination.id}:${node.id}`] = activeDestination && (node.id === current.group?.id || node.href === pathname)
      })
    })
    setExpandedNav(next)
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
      <main dir="rtl" className="grid min-h-screen place-items-center bg-[#f9fafb] text-[#1f1f1f]">
        <div className="flex items-center gap-3 text-sm text-[#6b7280]">
          <Loader2 className="animate-spin" size={18} />
          جاري التحقق من الجلسة...
        </div>
      </main>
    )
  }

  const primaryRole = user.roles[0]?.nameAr ?? 'مستخدم'
  const firstName = user.fullName.trim().split(/\s+/)[0] ?? user.fullName
  const notices = erp.state?.notifications.filter((item) => item.roles.includes(roleKey)) ?? []
  const unread = notices.filter((item) => !item.read).length
  const showNotices = canSeeEntity(permissions, 'notification')
  const showAudit = canSeeEntity(permissions, 'auditLog')
  const allowed = resolved ? canSeeEntity(permissions, resolved.leaf.entityKey) : false
  const meta = resolved ? leafMeta(resolved.leaf.entityKey) : null
  const tabs = resolved && allowed ? pageTabs(resolved, permissions) : null
  const crumbs = resolved && allowed ? breadcrumbs(resolved, permissions) : []

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
    <main dir="rtl" className="erp-app min-h-screen bg-[#f9fafb] text-[#1f1f1f] md:p-[15px]">
      {mobileOpen ? (
        <button type="button" aria-label="إغلاق" className="fixed inset-0 z-30 bg-[#1f1f1f]/40 md:hidden" onClick={() => setMobileOpen(false)} />
      ) : null}
      <aside
        className={`erp-sidebar fixed z-40 flex w-72 flex-col overflow-hidden bg-[#f9fafb] text-[#1f1f1f] transition-[width,transform] duration-300 md:inset-y-[15px] md:right-[15px] md:translate-x-0 ${iconOnly ? 'md:w-20' : ''} ${mobileOpen ? 'inset-y-0 right-0 translate-x-0 bg-white shadow-xl' : 'inset-y-0 right-0 translate-x-full'}`}
      >
        <div className={`flex h-16 items-center gap-2 border-b border-[#e5e7eb] ${iconOnly ? 'justify-center px-2' : 'px-4'}`}>
          <Link href="/" aria-label="الرئيسية" className="erp-mark grid size-8 shrink-0 place-items-center rounded-lg bg-[#1f1f1f] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488]">
            <Factory size={16} aria-hidden strokeWidth={2.4} />
          </Link>
          <div className={iconOnly ? 'sr-only' : 'min-w-0 flex-1'}>
            <div className="truncate text-[22px] font-semibold leading-none">مصنع الخليج للأعلاف</div>
          </div>
          <button
            type="button"
            aria-label={compact ? 'توسيع الشريط' : 'طي الشريط'}
            title={compact ? 'توسيع الشريط' : 'طي الشريط'}
            className={`${iconOnly ? 'hidden' : 'hidden md:grid'} shrink-0 rounded-[10px] p-1.5 text-[#525252] hover:bg-neutral-200/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488]`}
            onClick={() => setCompact((value) => !value)}
          >
            {compact ? <PanelRightOpen size={18} aria-hidden /> : <PanelRightClose size={18} aria-hidden />}
          </button>
          <button
            aria-label="إغلاق"
            className="mr-auto rounded-lg p-1.5 text-[#525252] hover:bg-neutral-200/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488] md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X size={22} />
          </button>
        </div>

        <nav className="erp-sidebar-nav flex-1 space-y-1 overflow-y-auto px-3 py-5" aria-label="أقسام النظام">
          {!iconOnly ? (
            <div className="mb-3 flex items-center justify-between gap-2 px-3">
              <div className="text-[11px] font-semibold tracking-[0.12em] text-[#9ca3af]">مساحة العمل</div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="طي الكل"
                  title="طي الكل"
                  className="grid size-7 place-items-center rounded-md text-[#737373] hover:bg-white hover:text-[#155e55] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488]"
                  onClick={() => setAllNavExpanded(false)}
                >
                  <ChevronsDownUp size={15} aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label="فتح الكل"
                  title="فتح الكل"
                  className="grid size-7 place-items-center rounded-md text-[#737373] hover:bg-white hover:text-[#155e55] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488]"
                  onClick={() => setAllNavExpanded(true)}
                >
                  <ChevronsUpDown size={15} aria-hidden />
                </button>
              </div>
            </div>
          ) : null}
          {destinations.map((destination) => {
            const Icon = destination.icon
            const active = resolved?.destination?.id === destination.id
            const href = entryHref(destination, permissions)
            const nodes = sidebarNodes(destination, permissions)
            return (
              <div key={destination.id}>
                <div className="flex items-center gap-1">
                  <Link
                    href={href}
                    aria-current={active && pathname === href ? 'page' : undefined}
                    aria-label={destination.label}
                    title={destination.label}
                    className={`erp-nav-item relative flex h-11 min-w-0 flex-1 items-center gap-3 rounded-xl px-4 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d9488] ${
                      active
                        ? 'erp-nav-item-active border border-[#bde5df] bg-[#e9f7f4] text-[#155e55] shadow-sm'
                        : 'text-[#525252] hover:bg-white hover:text-[#155e55] hover:shadow-sm'
                    }`}
                  >
                    <Icon size={18} aria-hidden strokeWidth={active ? 2.2 : 2} />
                    <span className={iconOnly ? 'sr-only' : 'truncate'}>{destination.label}</span>
                  </Link>
                  {!iconOnly && nodes.length > 0 ? (
                    <button type="button" aria-label={`${destinationOpen(destination.id) ? 'طي' : 'فتح'} ${destination.label}`} aria-expanded={destinationOpen(destination.id)} title={`${destinationOpen(destination.id) ? 'طي' : 'فتح'} ${destination.label}`} onClick={() => toggleDestination(destination.id)} className="grid size-9 shrink-0 place-items-center rounded-lg text-[#6b7280] hover:bg-white hover:text-[#155e55] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488]">
                      {destinationOpen(destination.id) ? <ChevronUp size={17} aria-hidden /> : <ChevronDown size={17} aria-hidden />}
                    </button>
                  ) : null}
                </div>
                {!iconOnly && nodes.length > 0 && destinationOpen(destination.id) ? (
                  <div className="mb-2 mr-4 mt-1 space-y-1 border-r border-[#d7e4e2] pr-2">
                    {nodes.map((node) => {
                      const childCurrent = node.children.some((child) => child.href === pathname)
                      const nodeCurrent = pathname === node.href && !childCurrent
                      return (
                        <div key={node.id}>
                          <div className="flex items-center gap-1">
                            <Link
                              href={node.href}
                              aria-current={nodeCurrent ? 'page' : undefined}
                              title={node.label}
                              className={`flex h-10 min-w-0 flex-1 items-center rounded-lg px-3 text-right text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d9488] ${
                                nodeCurrent ? 'bg-neutral-200/70 text-[#171717]' : childCurrent ? 'bg-white text-[#171717]' : 'text-[#525252] hover:bg-neutral-200/50'
                              }`}
                            >
                              <span className="truncate">{node.label}</span>
                            </Link>
                            {node.children.length > 0 ? (
                              <button type="button" aria-label={`${groupOpen(destination.id, node.id) ? 'طي' : 'فتح'} ${node.label}`} aria-expanded={groupOpen(destination.id, node.id)} title={`${groupOpen(destination.id, node.id) ? 'طي' : 'فتح'} ${node.label}`} onClick={() => toggleGroup(destination.id, node.id)} className="grid size-8 shrink-0 place-items-center rounded-lg text-[#737373] hover:bg-white hover:text-[#155e55] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488]">
                                {groupOpen(destination.id, node.id) ? <ChevronUp size={15} aria-hidden /> : <ChevronDown size={15} aria-hidden />}
                              </button>
                            ) : null}
                          </div>
                          {node.children.length > 0 && groupOpen(destination.id, node.id) ? (
                            <div className="mb-1 mr-3 mt-1 space-y-1 border-r border-[#d7e4e2] pr-2">
                              {node.children.map((child) => {
                                const current = pathname === child.href
                                return (
                                  <Link
                                    key={child.id}
                                    href={child.href}
                                    aria-current={current ? 'page' : undefined}
                                    title={child.label}
                                    className={`flex h-10 w-full items-center rounded-lg px-3 text-right text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d9488] ${
                                      current ? 'bg-neutral-200/70 font-medium text-[#171717]' : 'text-[#525252] hover:bg-neutral-200/50'
                                    }`}
                                  >
                                    <span className="truncate">{child.label}</span>
                                  </Link>
                                )
                              })}
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            )
          })}
        </nav>

        <div className="erp-sidebar-footer mt-auto border-t border-[#e5e7eb] bg-white/60 p-3">
          {iconOnly ? (
            <button
              type="button"
              aria-label="توسيع الشريط"
              title="توسيع الشريط"
              className="mb-3 hidden w-full place-items-center rounded-lg border border-[#d1d5db] bg-white p-2 text-[#525252] shadow-sm hover:bg-neutral-200/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488] md:grid"
              onClick={() => setCompact(false)}
            >
              <PanelRightOpen size={18} aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              aria-label="طي الشريط"
              className="mb-3 hidden w-full items-center justify-center gap-2 rounded-lg border border-[#d1d5db] bg-white px-3 py-2 text-sm font-medium text-[#525252] shadow-sm hover:bg-neutral-200/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488] md:flex"
              onClick={() => setCompact(true)}
            >
              <PanelRightClose size={18} aria-hidden />
              طي الشريط
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
            </div>
            <button
              type="button"
              aria-label="تسجيل الخروج"
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
            aria-label="فتح القائمة"
            className="rounded-lg border border-[#e5e7eb] bg-white p-2.5 text-[#525252] hover:bg-neutral-200/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488] md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={22} aria-hidden />
          </button>
          <div className="hidden text-right sm:block">
            <div className="text-[13px] text-[#6b7280]">{primaryRole} · {user.email}</div>
            <h1 className="text-2xl font-semibold leading-tight">مرحباً، {firstName}</h1>
          </div>
          <div className="mr-auto flex items-center gap-2">
            {showAudit ? (
              <Link
                href="/settings/audit"
                aria-label="سجل العمليات"
                title="سجل العمليات"
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
                  aria-label="إشعارات"
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
                    <div className="mb-2 text-sm font-bold">الإشعارات</div>
                    <div className="max-h-80 space-y-2 overflow-y-auto">
                      {notices.length === 0 ? <p className="text-sm text-[#6b7280]">لا توجد إشعارات</p> : null}
                      {notices.slice(0, 8).map((item) => (
                        <div key={item.id} className="rounded-lg border border-[#e5e7eb] p-3">
                          <div className="font-medium">{item.title}</div>
                          <div className="text-sm text-[#6b7280]">{item.body}</div>
                          {!item.read && liveCtx ? (
                            <button
                              type="button"
                              className="mt-2 text-sm font-medium text-[#0d9488] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488]"
                              onClick={() => liveCtx.act('markNotificationRead', { id: item.id })}
                            >
                              تمت القراءة
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                    <Link href="/notifications" className="mt-3 inline-flex text-sm font-medium text-[#0d9488] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488]">
                      الإشعارات
                    </Link>
                  </div>
                ) : null}
              </div>
            ) : null}
            <button
              type="button"
              aria-label={dark ? 'الوضع الفاتح' : 'الوضع الداكن'}
              className="rounded-lg border border-[#e5e7eb] bg-white p-2.5 text-[#525252] hover:bg-neutral-200/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488]"
              onClick={() => setDark((value) => !value)}
            >
              {dark ? <Sun size={22} aria-hidden /> : <Moon size={22} aria-hidden />}
            </button>
            {erp.storage ? (
              <span className="hidden rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-3 py-1 text-xs font-medium text-[#6b7280] sm:inline">
                {erp.storage === 'postgres' ? 'تخزين سحابي' : 'نسخة محلية'}
                {process.env.NEXT_PUBLIC_APP_ENV === 'staging' ? ' — تجريبي' : ''}
              </span>
            ) : null}
          </div>
        </header>

        <div className="mx-auto max-w-[1480px] px-5 py-7 md:px-8 lg:px-10">
          {erp.error ? <div className="mb-4 rounded-lg border border-[#fecaca] bg-[#fee2e2] px-4 py-3 text-sm font-medium text-[#dc2626]">{erp.error}</div> : null}
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
                سجل العمليات
              </Link>
            </div>
          ) : null}
          {erp.loading || !liveCtx ? (
            <div aria-busy="true" aria-live="polite" className="space-y-4">
              <span className="sr-only">جاري تحميل عمليات المصنع...</span>
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
            <div className="rounded-[12px] border border-[#e5e7eb] bg-white p-6 text-sm text-[#6b7280]">{resolved ? 'ليست لديك صلاحية لهذه الشاشة' : 'هذه الشاشة غير مربوطة بعد.'}</div>
          )}
        </div>
      </div>

      {toast ? (
        <div role="status" className="fixed bottom-5 left-5 z-50 rounded-lg bg-[#1f1f1f] px-4 py-3 text-xs font-medium text-white shadow-sm">
          {toast}
          <button type="button" aria-label="إغلاق" className="mr-3 text-white/80 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white" onClick={() => setToast('')}>
            ×
          </button>
        </div>
      ) : null}
    </main>
  )
}
