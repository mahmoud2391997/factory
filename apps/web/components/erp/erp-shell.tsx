'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, Factory, Loader2, LogOut, Menu, Moon, PanelRightClose, PanelRightOpen, ScrollText, Sun, X } from 'lucide-react'

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
  const noticesRef = useRef<HTMLDivElement>(null)

  const resolved = resolvePath(pathname)
  const destinations = visibleDestinations(permissions)
  const iconOnly = compact && !mobileOpen

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
  }, [pathname])

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
      <main dir="rtl" className="grid min-h-screen place-items-center bg-[#f6f8f7] text-[#152925]">
        <div className="flex items-center gap-3 text-sm text-[#53655e]">
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
    <main dir="rtl" className="erp-app min-h-screen bg-[#f6f8f7] text-[#152925]">
      {mobileOpen ? (
        <button type="button" aria-label="إغلاق" className="fixed inset-0 z-30 bg-[#152925]/40 md:hidden" onClick={() => setMobileOpen(false)} />
      ) : null}
      <aside
        className={`fixed inset-y-0 right-0 z-40 flex w-80 flex-col border-l border-[#dfe7e3] bg-[#123c35] text-white transition-transform duration-300 md:translate-x-0 ${iconOnly ? 'md:w-20' : ''} ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className={`flex h-[92px] items-center gap-3 border-b border-white/10 ${iconOnly ? 'justify-center px-2' : 'px-5'}`}>
          <Link href="/" aria-label="الرئيسية" className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#d6ad61] text-[#123c35] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#123c35]">
            <Factory size={26} aria-hidden strokeWidth={2.4} />
          </Link>
          <div className={iconOnly ? 'sr-only' : 'min-w-0 flex-1'}>
            <div className="truncate text-xl font-bold tracking-tight">مصنع الخليج للأعلاف</div>
            <div className="truncate text-sm text-white/70">نظام إدارة المصنع (ERP)</div>
          </div>
          <button
            type="button"
            aria-label={compact ? 'توسيع الشريط' : 'طي الشريط'}
            title={compact ? 'توسيع الشريط' : 'طي الشريط'}
            className={`${iconOnly ? 'hidden' : 'hidden md:grid'} shrink-0 rounded-lg p-1.5 text-[#f3e6c4] hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d6ad61]`}
            onClick={() => setCompact((value) => !value)}
          >
            {compact ? <PanelRightOpen size={20} aria-hidden /> : <PanelRightClose size={20} aria-hidden />}
          </button>
          <button
            aria-label="إغلاق"
            className="mr-auto rounded-lg p-1.5 text-white/70 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d6ad61] md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="أقسام النظام">
          {destinations.map((destination) => {
            const Icon = destination.icon
            const active = resolved?.destination?.id === destination.id
            const href = entryHref(destination, permissions)
            return (
              <Link
                key={destination.id}
                href={href}
                aria-current={active ? 'page' : undefined}
                aria-label={destination.label}
                title={destination.label}
                className={`relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-base font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d6ad61] ${
                  active ? 'bg-white/12 text-white' : 'text-white/80 hover:bg-white/8 hover:text-white'
                }`}
              >
                {active ? <span aria-hidden className="absolute inset-y-2 right-0 w-1 rounded-full bg-[#d6ad61]" /> : null}
                <Icon size={22} aria-hidden strokeWidth={active ? 2.4 : 2} />
                <span className={iconOnly ? 'sr-only' : 'truncate'}>{destination.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          {iconOnly ? (
            <button
              type="button"
              aria-label="توسيع الشريط"
              title="توسيع الشريط"
              className="mb-3 hidden w-full place-items-center rounded-xl border border-[#d6ad61]/50 p-2 text-[#f3e6c4] hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d6ad61] md:grid"
              onClick={() => setCompact(false)}
            >
              <PanelRightOpen size={18} aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              aria-label="طي الشريط"
              className="mb-3 hidden w-full items-center justify-center gap-2 rounded-xl border border-[#d6ad61]/50 px-3 py-2 text-sm font-bold text-[#f3e6c4] hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d6ad61] md:flex"
              onClick={() => setCompact(true)}
            >
              <PanelRightClose size={18} aria-hidden />
              طي الشريط
            </button>
          )}
          <div className={`rounded-xl bg-white/8 ${iconOnly ? 'flex flex-col items-center gap-2 p-2' : 'flex items-center gap-3 p-3.5'}`}>
            <div className="grid size-11 place-items-center rounded-full bg-[#d6ad61] text-base font-bold text-[#123c35]">
              {getInitials(user.fullName)}
            </div>
            <div className={iconOnly ? 'sr-only' : 'min-w-0'}>
              <div className="truncate text-base font-semibold">{user.fullName}</div>
              <div className="truncate text-sm text-white/45">{primaryRole}</div>
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
              className={`${iconOnly ? '' : 'mr-auto'} rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d6ad61]`}
            >
              {loggingOut ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <LogOut size={18} aria-hidden />}
            </button>
          </div>
        </div>
      </aside>

      <div className={`erp-content min-h-screen ${iconOnly ? 'md:mr-20' : 'md:mr-80'}`}>
        <header className="sticky top-0 z-30 flex h-[92px] items-center gap-4 border-b border-[#e1e9e5] bg-[#f6f8f7]/95 px-5 backdrop-blur md:px-8">
          <button
            aria-label="فتح القائمة"
            className="rounded-xl border border-[#dfe7e3] bg-white p-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1d7f72] md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={22} aria-hidden />
          </button>
          <div className="hidden text-right sm:block">
            <div className="text-sm text-[#71817c]">نظام تخطيط موارد المصنع</div>
            <h1 className="mt-1 text-3xl font-bold">مرحباً، {firstName}</h1>
          </div>
          <div className="mr-auto flex items-center gap-2">
            {showAudit ? (
              <Link
                href="/settings/audit"
                aria-label="سجل العمليات"
                title="سجل العمليات"
                aria-current={pathname === '/settings/audit' ? 'page' : undefined}
                className="rounded-xl border border-[#dfe7e3] bg-white p-2.5 text-[#71817c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1d7f72]"
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
                  className="relative rounded-xl border border-[#dfe7e3] bg-white p-2.5 text-[#71817c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1d7f72]"
                  onClick={() => setNoticesOpen((open) => !open)}
                >
                  <Bell size={22} aria-hidden />
                  {unread > 0 ? (
                    <span className="absolute -left-1 -top-1 grid min-w-5 place-items-center rounded-full bg-[#ad5e46] px-1 text-[10px] font-bold text-white">
                      {unread}
                    </span>
                  ) : null}
                </button>
                {noticesOpen ? (
                  <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-[min(22rem,80vw)] rounded-2xl border border-[#e1e9e5] bg-white p-3 text-[#152925] shadow-xl">
                    <div className="mb-2 text-sm font-bold">الإشعارات</div>
                    <div className="max-h-80 space-y-2 overflow-y-auto">
                      {notices.length === 0 ? <p className="text-sm text-[#788983]">لا توجد إشعارات</p> : null}
                      {notices.slice(0, 8).map((item) => (
                        <div key={item.id} className="rounded-xl border border-[#edf2ef] p-3">
                          <div className="font-bold">{item.title}</div>
                          <div className="text-sm text-[#788983]">{item.body}</div>
                          {!item.read && liveCtx ? (
                            <button
                              type="button"
                              className="mt-2 text-sm font-bold text-[#1d7f72] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1d7f72]"
                              onClick={() => liveCtx.act('markNotificationRead', { id: item.id })}
                            >
                              تمت القراءة
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                    <Link href="/notifications" className="mt-3 inline-flex text-sm font-bold text-[#1d7f72] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1d7f72]">
                      الإشعارات
                    </Link>
                  </div>
                ) : null}
              </div>
            ) : null}
            <button
              type="button"
              aria-label={dark ? 'الوضع الفاتح' : 'الوضع الداكن'}
              className="rounded-xl border border-[#dfe7e3] bg-white p-2.5 text-[#71817c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1d7f72]"
              onClick={() => setDark((value) => !value)}
            >
              {dark ? <Sun size={22} aria-hidden /> : <Moon size={22} aria-hidden />}
            </button>
            {erp.storage ? (
              <span className="hidden rounded-full bg-white px-3 py-1 text-xs font-bold text-[#53655e] sm:inline">
                {erp.storage === 'postgres' ? 'تخزين سحابي' : 'نسخة محلية'}
                {process.env.NEXT_PUBLIC_APP_ENV === 'staging' ? ' — تجريبي' : ''}
              </span>
            ) : null}
          </div>
        </header>

        <div className="mx-auto max-w-[1480px] px-5 py-7 md:px-8 lg:px-10">
          {erp.error ? <div className="mb-4 rounded-xl bg-[#fff5f2] px-4 py-3 text-sm font-semibold text-[#ad5e46]">{erp.error}</div> : null}
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
                className={`text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1d7f72] ${
                  pathname === '/settings/audit' ? 'text-[#123c35] underline' : 'text-[#1d7f72]'
                }`}
              >
                سجل العمليات
              </Link>
            </div>
          ) : null}
          {erp.loading || !liveCtx ? (
            <div aria-busy="true" aria-live="polite" className="space-y-4">
              <span className="sr-only">جاري تحميل عمليات المصنع...</span>
              <div className="h-8 w-56 animate-pulse rounded-xl bg-[#e1e9e5]" />
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {['a', 'b', 'c'].map((key) => (
                  <div key={key} className="h-28 animate-pulse rounded-2xl bg-[#e1e9e5]" />
                ))}
              </div>
              <div className="h-72 animate-pulse rounded-2xl bg-[#e1e9e5]" />
            </div>
          ) : resolved && allowed && meta ? (
            <LiveWorkspace entityKey={resolved.leaf.entityKey} title={meta.label} description={meta.description} crumbs={crumbs} ctx={liveCtx} />
          ) : (
            <div className="rounded-2xl bg-white p-6 text-sm text-[#53655e]">{resolved ? 'ليست لديك صلاحية لهذه الشاشة' : 'هذه الشاشة غير مربوطة بعد.'}</div>
          )}
        </div>
      </div>

      {toast ? (
        <div role="status" className="fixed bottom-5 left-5 z-50 rounded-xl bg-[#123c35] px-4 py-3 text-xs font-semibold text-white shadow-xl">
          {toast}
          <button type="button" aria-label="إغلاق" className="mr-3 text-white/80 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d6ad61]" onClick={() => setToast('')}>
            ×
          </button>
        </div>
      ) : null}
    </main>
  )
}
