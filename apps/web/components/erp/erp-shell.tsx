'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Boxes,
  ChevronDown,
  Circle,
  ClipboardList,
  Factory,
  FileText,
  Loader2,
  LogOut,
  Menu,
  Moon,
  PanelRightClose,
  PanelRightOpen,
  Sun,
  X,
  type LucideIcon,
} from 'lucide-react'

import { LiveWorkspace } from '@/components/erp/live/workspace'
import type { LiveCtx } from '@/components/erp/live/ctx'
import { useAuth } from '@/components/providers/auth-provider'
import { canAccessMain, canAccessSub, ERP_NAV, findNavByEntity, NAV_SECTIONS, sectionForMain } from '@/lib/erp-nav'
import type { ErpSubTab } from '@/lib/erp-nav'
import type { RoleKey } from '@/lib/erp/domain/permissions'
import { useErp } from '@/lib/use-erp'

const SECTION_KEY = 'erp-nav-sections'
const COMPACT_KEY = 'erp-sidebar-compact'
const THEME_KEY = 'erp-theme'

const SUB_ICONS: Record<string, LucideIcon> = {
  dashboard: Factory,
  factoryPlanned: ClipboardList,
  factoryActual: ClipboardList,
  factoryExecution: ClipboardList,
  factorySalesToday: FileText,
  factorySalesMonth: FileText,
  factoryOpenOrders: ClipboardList,
  factoryCostPerTon: FileText,
  factoryAvgPrice: FileText,
  factoryMargin: FileText,
  factoryStockValue: Boxes,
  factoryRunningOut: Boxes,
  factoryStagnant: Boxes,
  factoryReserved: Boxes,
  factoryWaste: Factory,
  factoryDeviation: Factory,
  factoryStoppages: Factory,
  material: Boxes,
  materialBatch: Boxes,
  product: Boxes,
  warehouse: Boxes,
  inventoryBalance: Boxes,
  inventoryTransaction: ClipboardList,
  stockTransfer: ClipboardList,
  stockAdjustment: ClipboardList,
  barcode: Circle,
  supplier: FileText,
  purchaseOrder: ClipboardList,
  goodsReceipt: ClipboardList,
  recipe: ClipboardList,
  recipeItem: ClipboardList,
  productionOrder: Factory,
  customer: FileText,
  salesInvoice: FileText,
  withdrawal: ClipboardList,
  salesPayment: FileText,
  account: FileText,
  journalEntry: FileText,
  expense: FileText,
  vatReport: FileText,
  taxSettings: FileText,
  employee: Circle,
  attendance: ClipboardList,
  overtime: ClipboardList,
  payroll: FileText,
  report: FileText,
  notification: Bell,
  auditLog: ClipboardList,
  companySettings: Circle,
  task: ClipboardList,
  approvals: ClipboardList,
  users: Circle,
}

function subIcon(sub: ErpSubTab) {
  return SUB_ICONS[sub.entityKey] ?? Circle
}

function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '؟'
  if (parts.length === 1) return parts[0]!.slice(0, 1)
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`
}

export function ErpShell() {
  const router = useRouter()
  const { user, loading: authLoading, logout, refresh } = useAuth()
  const erp = useErp(Boolean(user))
  const roleKey = (user?.roles[0]?.key ?? 'GM') as RoleKey
  const permissions = erp.state?.rolePermissions[roleKey] ?? user?.permissions ?? []

  const [mobileOpen, setMobileOpen] = useState(false)
  const [expandedMain, setExpandedMain] = useState('dashboard')
  const [activeMainId, setActiveMainId] = useState('dashboard')
  const [activeSubId, setActiveSubId] = useState('overview')
  const [toast, setToast] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)
  const [navReady, setNavReady] = useState(false)
  const [compact, setCompact] = useState(false)
  const [dark, setDark] = useState(false)
  const [themeReady, setThemeReady] = useState(false)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NAV_SECTIONS.map((section) => [section.id, true])),
  )
  const visibleMains = useMemo(
    () => ERP_NAV.filter((main) => canAccessMain(permissions, main)),
    [permissions],
  )

  const activeMain = visibleMains.find((m) => m.id === activeMainId) ?? visibleMains[0]
  const visibleSubs = useMemo(() => {
    if (!activeMain) return []
    return activeMain.subs.filter((sub) => canAccessSub(permissions, sub, activeMain))
  }, [activeMain, permissions])

  const activeSub = visibleSubs.find((s) => s.id === activeSubId) ?? visibleSubs[0]

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [authLoading, user, router])

  useEffect(() => {
    if (!activeMain) return
    if (!visibleMains.some((m) => m.id === activeMainId)) {
      setActiveMainId(visibleMains[0]?.id ?? 'dashboard')
    }
  }, [visibleMains, activeMainId, activeMain])

  useEffect(() => {
    if (!activeMain) return
    if (!visibleSubs.some((s) => s.id === activeSubId)) {
      setActiveSubId(visibleSubs[0]?.id ?? 'overview')
    }
  }, [visibleSubs, activeSubId, activeMain])

  useEffect(() => {
    if (erp.message) setToast(erp.message)
  }, [erp.message])

  useEffect(() => {
    try {
      const storedSections = localStorage.getItem(SECTION_KEY)
      if (storedSections) {
        const parsed = JSON.parse(storedSections) as Record<string, boolean>
        setOpenSections((current) => ({ ...current, ...parsed }))
      }
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
    localStorage.setItem(SECTION_KEY, JSON.stringify(openSections))
  }, [navReady, openSections])

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

  const selectNav = (mainId: string, subId: string) => {
    setActiveMainId(mainId)
    setActiveSubId(subId)
    setExpandedMain(mainId)
    setMobileOpen(false)
  }

  /** Chevron only: open/close submenu without changing the active page. */
  const toggleMain = (mainId: string) => {
    setExpandedMain((current) => (current === mainId ? '' : mainId))
  }

  const toggleSection = (sectionId: string) => {
    setOpenSections((current) => ({ ...current, [sectionId]: current[sectionId] === false }))
  }

  const iconOnly = compact && !mobileOpen

  /** Label click: always expand and open that section (never collapse). */
  const openMain = (mainId: string) => {
    const main = visibleMains.find((item) => item.id === mainId)
    if (!main) return
    const firstSub = main.subs.filter((sub) => canAccessSub(permissions, sub, main))[0]
    if (!firstSub) {
      setExpandedMain(mainId)
      setActiveMainId(mainId)
      return
    }
    // Stay on current sub if already inside this main; otherwise open first sub.
    if (activeMainId === mainId && activeSub) {
      setExpandedMain(mainId)
      return
    }
    selectNav(mainId, firstSub.id)
  }

  const entityKey = activeSub?.entityKey ?? 'dashboard'
  const unread = erp.state?.notifications.filter((item) => !item.read && item.roles.includes(roleKey)).length ?? 0
  const liveCtx: LiveCtx | null = erp.state
    ? {
        state: erp.state,
        permissions,
        pending: erp.pending,
        act: erp.act,
        navigate: (key) => {
          const found = findNavByEntity(key)
          if (found) selectNav(found.main.id, found.sub.id)
        },
        refreshUser: refresh,
      }
      : null

  const renderMain = (main: (typeof visibleMains)[number]) => {
    const Icon = main.icon
    const isExpanded = expandedMain === main.id && !iconOnly
    const isActiveMain = activeMainId === main.id
    const subs = main.subs.filter((sub) => canAccessSub(permissions, sub, main))
    const hasSubs = subs.length > 0
    return (
      <div key={main.id} className="rounded-xl">
        <div
          className={`relative flex items-center rounded-xl transition ${
            isActiveMain ? 'bg-white/12 text-white' : 'text-white/80 hover:bg-white/8 hover:text-white'
          }`}
        >
          {isActiveMain ? <span aria-hidden className="absolute inset-y-2 right-0 w-1 rounded-full bg-[#d6ad61]" /> : null}
          <button
            type="button"
            aria-current={isActiveMain ? 'page' : undefined}
            aria-label={main.label}
            title={main.label}
            onClick={() => openMain(main.id)}
            className="flex min-w-0 flex-1 items-center gap-3 px-3.5 py-3 text-right text-base font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d6ad61]"
          >
            <Icon size={22} aria-hidden strokeWidth={isActiveMain ? 2.4 : 2} />
            <span className={iconOnly ? 'sr-only' : 'truncate'}>{main.label}</span>
          </button>
          {hasSubs && !iconOnly ? (
            <button
              type="button"
              aria-label={isExpanded ? 'طي القائمة' : 'فتح القائمة'}
              aria-expanded={isExpanded}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                toggleMain(main.id)
              }}
              className="ml-1 mr-2 grid size-10 shrink-0 place-items-center rounded-lg text-white/75 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d6ad61]"
            >
              <ChevronDown
                size={20}
                aria-hidden
                className={`transition-transform duration-200 ease-out ${isExpanded ? 'rotate-0' : 'rotate-90'}`}
              />
            </button>
          ) : null}
        </div>
        {hasSubs && !iconOnly ? (
          <div className={`grid transition-[grid-template-rows] duration-200 ease-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
            <div className="min-h-0 overflow-hidden" {...(!isExpanded ? { inert: true } : {})}>
              <div className="mb-2 mr-3 mt-1 space-y-1 border-r border-white/15 pr-2" aria-hidden={!isExpanded}>
                {subs.map((sub) => {
                  const isActiveSub = isActiveMain && activeSubId === sub.id
                  const SubIcon = subIcon(sub)
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      aria-current={isActiveSub ? 'page' : undefined}
                      tabIndex={isExpanded ? 0 : -1}
                      onClick={() => selectNav(main.id, sub.id)}
                      className={`relative flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-right text-[15px] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d6ad61] ${
                        isActiveSub ? 'bg-[#d6ad61] font-bold text-[#123c35]' : 'font-medium text-white/70 hover:bg-white/8 hover:text-white'
                      }`}
                    >
                      {isActiveSub ? <span aria-hidden className="absolute inset-y-2 right-0 w-1 rounded-full bg-[#123c35]" /> : null}
                      <SubIcon size={16} aria-hidden />
                      <span className="truncate">{sub.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  const sectionLabel = sectionForMain(activeMain?.id ?? 'dashboard').label

  return (
    <main dir="rtl" className="erp-app min-h-screen bg-[#f6f8f7] text-[#152925]">
      {mobileOpen ? (
        <button type="button" aria-label="إغلاق" className="fixed inset-0 z-30 bg-[#152925]/40 md:hidden" onClick={() => setMobileOpen(false)} />
      ) : null}
      <aside
        className={`fixed inset-y-0 right-0 z-40 flex w-80 flex-col border-l border-[#dfe7e3] bg-[#123c35] text-white transition-transform duration-300 md:translate-x-0 ${iconOnly ? 'md:w-20' : ''} ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className={`flex h-[92px] items-center gap-3 border-b border-white/10 ${iconOnly ? 'justify-center px-2' : 'px-5'}`}>
          <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#d6ad61] text-[#123c35]">
            <Factory size={26} aria-hidden strokeWidth={2.4} />
          </div>
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

        <nav className="flex-1 space-y-3 overflow-y-auto px-3 py-4" aria-label="أقسام النظام">
          {NAV_SECTIONS.map((section) => {
            const mains = visibleMains.filter((main) => section.mainIds.includes(main.id))
            if (mains.length === 0) return null
            const sectionOpen = openSections[section.id] !== false
            return (
              <div key={section.id} className="border-t border-white/10 pt-3 first:border-t-0 first:pt-0">
                <button
                  type="button"
                  aria-expanded={sectionOpen}
                  aria-controls={`nav-section-${section.id}`}
                  onClick={() => toggleSection(section.id)}
                  className="erp-nav-section flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm font-extrabold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d6ad61]"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span aria-hidden className="h-4 w-1 shrink-0 rounded-full bg-[#d6ad61]" />
                    <span className={iconOnly ? 'sr-only' : 'truncate'}>{section.label}</span>
                  </span>
                  <ChevronDown
                    size={16}
                    aria-hidden
                    className={`shrink-0 text-[#d6ad61] transition ${sectionOpen ? '' : '-rotate-90'} ${iconOnly ? 'hidden' : ''}`}
                  />
                </button>
                {sectionOpen ? (
                  <div id={`nav-section-${section.id}`} className="mt-1 space-y-1">
                    {mains.map((main) => renderMain(main))}
                  </div>
                ) : null}
              </div>
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
            <button
              type="button"
              aria-label="إشعارات"
              className="relative rounded-xl border border-[#dfe7e3] bg-white p-2.5 text-[#71817c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1d7f72]"
              onClick={() => {
                const found = findNavByEntity('notification')
                if (found) selectNav(found.main.id, found.sub.id)
              }}
            >
              <Bell size={22} aria-hidden />
              {unread > 0 ? (
                <span className="absolute -left-1 -top-1 grid min-w-5 place-items-center rounded-full bg-[#ad5e46] px-1 text-[10px] font-bold text-white">
                  {unread}
                </span>
              ) : null}
            </button>
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

        {activeMain && visibleSubs.length > 0 ? (
          <div className="border-b border-[#e1e9e5] bg-white px-5 md:px-8">
            <div className="flex gap-2 overflow-x-auto py-3">
              {visibleSubs.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => selectNav(activeMain.id, sub.id)}
                  aria-current={activeSubId === sub.id ? 'page' : undefined}
                  className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-base font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1d7f72] ${
                    activeSubId === sub.id
                      ? 'bg-[#123c35] text-white'
                      : 'text-[#53655e] hover:bg-[#f5f8f6]'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mx-auto max-w-[1480px] px-5 py-7 md:px-8 lg:px-10">
          {erp.error ? <div className="mb-4 rounded-xl bg-[#fff5f2] px-4 py-3 text-sm font-semibold text-[#ad5e46]">{erp.error}</div> : null}
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
          ) : (
            <LiveWorkspace
              entityKey={entityKey}
              sectionLabel={sectionLabel}
              mainLabel={activeMain?.label ?? ''}
              title={activeSub?.label ?? ''}
              description={activeSub?.description ?? ''}
              ctx={liveCtx}
            />
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
