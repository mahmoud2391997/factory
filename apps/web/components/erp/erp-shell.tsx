'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, ChevronDown, Factory, Loader2, LogOut, Menu, X } from 'lucide-react'

import { LiveWorkspace } from '@/components/erp/live/workspace'
import type { LiveCtx } from '@/components/erp/live/ctx'
import { useAuth } from '@/components/providers/auth-provider'
import { canAccessMain, canAccessSub, ERP_NAV, findNavByEntity } from '@/lib/erp-nav'
import type { RoleKey } from '@/lib/erp/domain/permissions'
import { useErp } from '@/lib/use-erp'

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

  return (
    <main dir="rtl" className="min-h-screen bg-[#f6f8f7] text-[#152925]">
      <aside
        className={`fixed inset-y-0 right-0 z-40 flex w-[320px] flex-col border-l border-[#dfe7e3] bg-[#123c35] text-white transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex h-[92px] items-center gap-3 border-b border-white/10 px-5">
          <div className="grid size-12 place-items-center rounded-xl bg-[#d6ad61] text-[#123c35]">
            <Factory size={26} strokeWidth={2.4} />
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight">مصنع الخليج للأعلاف</div>
            <div className="text-sm text-white/55">نظام إدارة المصنع (ERP)</div>
          </div>
          <button
            aria-label="إغلاق"
            className="mr-auto rounded-lg p-1.5 text-white/70 hover:bg-white/10 lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
          {visibleMains.map((main) => {
            const Icon = main.icon
            const isExpanded = expandedMain === main.id
            const isActiveMain = activeMainId === main.id
            const subs = main.subs.filter((sub) => canAccessSub(permissions, sub, main))
            const hasSubs = subs.length > 0

            return (
              <div key={main.id} className="rounded-xl">
                <div
                  className={`flex items-center rounded-xl transition ${
                    isActiveMain ? 'bg-white/12 text-white' : 'text-white/80 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => openMain(main.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 px-3.5 py-3.5 text-right text-base font-semibold"
                  >
                    <Icon size={22} strokeWidth={isActiveMain ? 2.4 : 2} />
                    <span className="truncate">{main.label}</span>
                  </button>
                  {hasSubs ? (
                    <button
                      type="button"
                      aria-label={isExpanded ? 'طي القائمة' : 'فتح القائمة'}
                      aria-expanded={isExpanded}
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        toggleMain(main.id)
                      }}
                      className="ml-1 mr-2 grid size-10 shrink-0 place-items-center rounded-lg text-white/75 hover:bg-white/10 hover:text-white"
                    >
                      <ChevronDown
                        size={20}
                        className={`transition-transform duration-200 ease-out ${isExpanded ? 'rotate-0' : 'rotate-90'}`}
                      />
                    </button>
                  ) : null}
                </div>

                {hasSubs ? (
                  <div
                    className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                      isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                  >
                    <div className="min-h-0 overflow-hidden" {...(!isExpanded ? { inert: true } : {})}>
                      <div
                        className="mb-2 mr-3 mt-1 space-y-1 border-r border-white/15 pr-2"
                        aria-hidden={!isExpanded}
                      >
                        {subs.map((sub) => {
                          const isActiveSub = isActiveMain && activeSubId === sub.id
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              tabIndex={isExpanded ? 0 : -1}
                              onClick={() => selectNav(main.id, sub.id)}
                              className={`block w-full rounded-lg px-3.5 py-3 text-right text-[15px] transition ${
                                isActiveSub
                                  ? 'bg-[#d6ad61] font-bold text-[#123c35]'
                                  : 'font-medium text-white/70 hover:bg-white/8 hover:text-white'
                              }`}
                            >
                              {sub.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/8 p-3.5">
            <div className="grid size-11 place-items-center rounded-full bg-[#d6ad61] text-base font-bold text-[#123c35]">
              {getInitials(user.fullName)}
            </div>
            <div className="min-w-0">
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
              className="mr-auto rounded-lg p-2 text-white/55 hover:bg-white/10 hover:text-white"
            >
              {loggingOut ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:mr-[320px]">
        <header className="sticky top-0 z-30 flex h-[92px] items-center gap-4 border-b border-[#e1e9e5] bg-[#f6f8f7]/95 px-5 backdrop-blur md:px-8">
          <button
            aria-label="فتح القائمة"
            className="rounded-xl border border-[#dfe7e3] bg-white p-2.5 lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={22} />
          </button>
          <div className="hidden text-right sm:block">
            <div className="text-sm text-[#71817c]">نظام تخطيط موارد المصنع</div>
            <h1 className="mt-1 text-3xl font-bold">مرحباً، {firstName}</h1>
          </div>
          <div className="mr-auto flex items-center gap-2">
            <button
              type="button"
              aria-label="إشعارات"
              className="relative rounded-xl border border-[#dfe7e3] bg-white p-2.5 text-[#71817c]"
              onClick={() => {
                const found = findNavByEntity('notification')
                if (found) selectNav(found.main.id, found.sub.id)
              }}
            >
              <Bell size={22} />
              {unread > 0 ? (
                <span className="absolute -left-1 -top-1 grid min-w-5 place-items-center rounded-full bg-[#ad5e46] px-1 text-[10px] font-bold text-white">
                  {unread}
                </span>
              ) : null}
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
                  className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-base font-semibold transition ${
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
            <div className="flex items-center gap-3 text-sm text-[#53655e]">
              <Loader2 className="animate-spin" size={18} />
              جاري تحميل عمليات المصنع...
            </div>
          ) : (
            <LiveWorkspace
              entityKey={entityKey}
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
          <button className="mr-3 text-white/60 hover:text-white" onClick={() => setToast('')}>
            ×
          </button>
        </div>
      ) : null}
    </main>
  )
}
