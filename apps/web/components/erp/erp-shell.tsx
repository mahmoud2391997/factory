'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  ChevronDown,
  Factory,
  Loader2,
  LogOut,
  Menu,
  ShoppingCart,
  Warehouse,
  X,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useAuth } from '@/components/providers/auth-provider'
import { EntityPage, type EntityRecord } from '@/components/erp/entity-page'
import { canAccessMain, canAccessSub, ERP_NAV } from '@/lib/erp-nav'
import { getEntitySchema } from '@/lib/erp-schema'
import { productionData, stockData } from '@/lib/factory'
import { useLocalStorageState } from '@/lib/storage'

function formatOMR(value: number) {
  return new Intl.NumberFormat('ar-OM', {
    style: 'currency',
    currency: 'OMR',
    maximumFractionDigits: 0,
  }).format(value)
}

function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '؟'
  if (parts.length === 1) return parts[0]!.slice(0, 1)
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`
}

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

function seedRecords(entityKey: string): EntityRecord[] {
  const schema = getEntitySchema(entityKey)
  if (!schema?.seed?.length) return []
  return schema.seed.map((values, index) => ({
    id: `${schema.docPrefix}-${String(index + 1).padStart(3, '0')}`,
    createdAt: Date.now() - index * 60_000,
    values,
  }))
}

export function ErpShell() {
  const router = useRouter()
  const { user, loading: authLoading, logout } = useAuth()
  const permissions = user?.permissions ?? []

  const [mobileOpen, setMobileOpen] = useState(false)
  const [expandedMain, setExpandedMain] = useState('')
  const [activeMainId, setActiveMainId] = useState('dashboard')
  const [activeSubId, setActiveSubId] = useState('overview')
  const [toast, setToast] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)
  const [period, setPeriod] = useState('هذا الأسبوع')

  const [entityStore, setEntityStore] = useLocalStorageState<Record<string, EntityRecord[]>>(
    'factory:v2:entities',
    {},
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

  // Seed empty entities once
  useEffect(() => {
    setEntityStore((current) => {
      let changed = false
      const next = { ...current }
      for (const main of ERP_NAV) {
        for (const sub of main.subs) {
          if (sub.entityKey === 'dashboard') continue
          if (!next[sub.entityKey] || next[sub.entityKey]!.length === 0) {
            const seeded = seedRecords(sub.entityKey)
            if (seeded.length > 0) {
              next[sub.entityKey] = seeded
              changed = true
            }
          }
        }
      }
      return changed ? next : current
    })
  }, [setEntityStore])

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

  const toggleMain = (mainId: string) => {
    setExpandedMain((current) => (current === mainId ? '' : mainId))
  }

  const openMain = (mainId: string) => {
    const main = visibleMains.find((item) => item.id === mainId)
    if (!main) return
    const firstSub = main.subs.filter((sub) => canAccessSub(permissions, sub, main))[0]
    if (!firstSub) {
      toggleMain(mainId)
      return
    }
    // If already on this main and expanded, collapse. Otherwise expand + open first page.
    if (activeMainId === mainId && expandedMain === mainId) {
      setExpandedMain('')
      return
    }
    selectNav(mainId, firstSub.id)
  }

  const entityKey = activeSub?.entityKey ?? 'dashboard'
  const schema = entityKey === 'dashboard' ? undefined : getEntitySchema(entityKey)
  const records = entityStore[entityKey] ?? []

  const handleCreate = (values: Record<string, unknown>) => {
    if (!schema) return
    const row: EntityRecord = {
      id: makeId(schema.docPrefix),
      createdAt: Date.now(),
      values,
    }
    setEntityStore((current) => ({
      ...current,
      [entityKey]: [row, ...(current[entityKey] ?? [])],
    }))
    setToast('تم حفظ السجل وفق حقول الـ Schema')
  }

  const handleUpdate = (id: string, values: Record<string, unknown>) => {
    setEntityStore((current) => ({
      ...current,
      [entityKey]: (current[entityKey] ?? []).map((row) => (row.id === id ? { ...row, values } : row)),
    }))
    setToast('تم تحديث السجل')
  }

  const handleDelete = (id: string) => {
    setEntityStore((current) => ({
      ...current,
      [entityKey]: (current[entityKey] ?? []).filter((row) => row.id !== id),
    }))
    setToast('تم حذف السجل')
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#f6f8f7] text-[#152925]">
      <aside
        className={`fixed inset-y-0 right-0 z-40 flex w-[300px] flex-col border-l border-[#dfe7e3] bg-[#123c35] text-white transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex h-[88px] items-center gap-3 border-b border-white/10 px-5">
          <div className="grid size-11 place-items-center rounded-xl bg-[#d6ad61] text-[#123c35]">
            <Factory size={24} strokeWidth={2.4} />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight">مزارع الخليج</div>
            <div className="text-xs text-white/55">نظام ERP للمصنع</div>
          </div>
          <button
            aria-label="إغلاق"
            className="mr-auto rounded-lg p-1 text-white/70 hover:bg-white/10 lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
          {visibleMains.map((main) => {
            const Icon = main.icon
            const isExpanded = expandedMain === main.id
            const isActiveMain = activeMainId === main.id
            const subs = main.subs.filter((sub) => canAccessSub(permissions, sub, main))
            const hasSubs = main.id !== 'dashboard' && subs.length > 0

            return (
              <div key={main.id} className="rounded-xl">
                <div
                  className={`flex items-center rounded-xl transition ${
                    isActiveMain ? 'bg-white/12 text-white' : 'text-white/75 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => openMain(main.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-right text-[15px] font-semibold"
                  >
                    <Icon size={20} strokeWidth={isActiveMain ? 2.4 : 2} />
                    <span className="truncate">{main.label}</span>
                  </button>
                  {hasSubs ? (
                    <button
                      type="button"
                      aria-label={isExpanded ? 'طي القائمة' : 'فتح القائمة'}
                      aria-expanded={isExpanded}
                      onClick={(event) => {
                        event.stopPropagation()
                        toggleMain(main.id)
                      }}
                      className="ml-1 mr-2 grid size-9 place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
                    >
                      <ChevronDown
                        size={18}
                        className={`transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
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
                    <div className="overflow-hidden">
                      <div className="mb-2 mr-3 mt-1 space-y-1 border-r border-white/15 pr-2">
                        {subs.map((sub) => {
                          const isActiveSub = isActiveMain && activeSubId === sub.id
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => selectNav(main.id, sub.id)}
                              className={`block w-full rounded-lg px-3 py-2.5 text-right text-[14px] transition ${
                                isActiveSub
                                  ? 'bg-[#d6ad61] font-bold text-[#123c35]'
                                  : 'font-medium text-white/65 hover:bg-white/8 hover:text-white'
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
          <div className="flex items-center gap-3 rounded-xl bg-white/8 p-3">
            <div className="grid size-10 place-items-center rounded-full bg-[#d6ad61] text-sm font-bold text-[#123c35]">
              {getInitials(user.fullName)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{user.fullName}</div>
              <div className="truncate text-xs text-white/45">{primaryRole}</div>
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
              className="mr-auto rounded-lg p-1.5 text-white/55 hover:bg-white/10 hover:text-white"
            >
              {loggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:mr-[300px]">
        <header className="sticky top-0 z-30 flex h-[88px] items-center gap-4 border-b border-[#e1e9e5] bg-[#f6f8f7]/95 px-5 backdrop-blur md:px-8">
          <button
            aria-label="فتح القائمة"
            className="rounded-xl border border-[#dfe7e3] bg-white p-2.5 lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={22} />
          </button>
          <div className="hidden text-right sm:block">
            <div className="text-xs text-[#71817c]">نظام تخطيط موارد المصنع</div>
            <h1 className="mt-1 text-2xl font-bold">مرحباً، {firstName}</h1>
          </div>
          <div className="mr-auto flex items-center gap-2">
            <button aria-label="إشعارات" className="relative rounded-xl border border-[#dfe7e3] bg-white p-2.5 text-[#71817c]">
              <Bell size={20} />
            </button>
          </div>
        </header>

        {activeMain && activeMain.id !== 'dashboard' && visibleSubs.length > 0 ? (
          <div className="border-b border-[#e1e9e5] bg-white px-5 md:px-8">
            <div className="flex gap-1.5 overflow-x-auto py-2.5">
              {visibleSubs.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => selectNav(activeMain.id, sub.id)}
                  className={`whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
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
          {entityKey === 'dashboard' ? (
            <DashboardView period={period} setPeriod={setPeriod} />
          ) : schema ? (
            <EntityPage
              schema={schema}
              records={records}
              onCreate={handleCreate}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              mainLabel={activeMain?.label ?? ''}
            />
          ) : (
            <div className="rounded-2xl border border-[#e1e9e5] bg-white p-8 text-sm text-[#53655e]">
              لا يوجد مخطط لهذه الصفحة بعد.
            </div>
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

function DashboardView({
  period,
  setPeriod,
}: {
  period: string
  setPeriod: (value: string) => void
}) {
  return (
    <>
      <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-[#7c8c86]">
            <span>الرئيسية</span>
            <span>/</span>
            <span className="text-[#1d7f72]">لوحة التحكم</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">نظرة عامة على المصنع</h2>
          <p className="mt-1 text-sm text-[#788983]">المواد الخام → التصنيع → المخزون → المبيعات → الحسابات → التقارير</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-xl border border-[#dfe7e3] bg-white px-3.5 py-2.5 text-xs font-medium text-[#53655e] shadow-sm">
            <CalendarDays size={15} /> هذا الأسبوع
          </button>
        </div>
      </div>

      <div className="mb-7 grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
        <MetricCard label="قيمة المخزون" value={formatOMR(184620)} detail="المستودعات الثلاثة" icon={Warehouse} />
        <MetricCard label="إنتاج اليوم" value="١٢,٥٠٠ كجم" detail="أمر PR-1048" icon={Factory} />
        <MetricCard label="مبيعات الشهر" value={formatOMR(42680)} detail="٣٨ فاتورة" icon={ShoppingCart} />
        <MetricCard label="تنبيهات" value="٣" detail="تحتاج متابعة" icon={AlertTriangle} danger />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.65fr_1fr]">
        <section className="rounded-2xl border border-[#e1e9e5] bg-white p-5 shadow-[0_4px_22px_rgba(31,65,53,0.04)]">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h3 className="font-bold">الإنتاج والمبيعات</h3>
              <p className="mt-1 text-xs text-[#899892]">متابعة الأداء الأسبوعي</p>
            </div>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="rounded-lg border border-[#e1e9e5] bg-[#fafcfb] px-3 py-2 text-xs text-[#53655e]"
            >
              <option>هذا الأسبوع</option>
              <option>هذا الشهر</option>
            </select>
          </div>
          <div className="h-[235px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={productionData} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#edf2ef" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9aa9a3', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9aa9a3', fontSize: 11 }} />
                <Tooltip contentStyle={{ border: '1px solid #e1e9e5', borderRadius: 10, fontSize: 11, direction: 'rtl' }} />
                <Area type="monotone" dataKey="production" stroke="#1d7f72" strokeWidth={2.5} fill="#1d7f7222" />
                <Area type="monotone" dataKey="sales" stroke="#d6ad61" strokeWidth={2.5} fill="#d6ad6122" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="rounded-2xl border border-[#e1e9e5] bg-white p-5 shadow-[0_4px_22px_rgba(31,65,53,0.04)]">
          <h3 className="font-bold">توزيع المخزون</h3>
          <p className="mt-1 text-xs text-[#899892]">حسب المواد الخام</p>
          <div className="relative h-[190px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stockData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={56} outerRadius={82} paddingAngle={4} strokeWidth={0}>
                  {stockData.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ border: '1px solid #e1e9e5', borderRadius: 10, fontSize: 11, direction: 'rtl' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </>
  )
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  danger,
}: {
  label: string
  value: string
  detail: string
  icon: typeof Warehouse
  danger?: boolean
}) {
  return (
    <div className="rounded-2xl border border-[#e1e9e5] bg-white p-4 shadow-[0_4px_22px_rgba(31,65,53,0.04)]">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-[#71817c]">{label}</span>
        <div className={`grid size-8 place-items-center rounded-lg ${danger ? 'bg-[#fff5f2] text-[#ad5e46]' : 'bg-[#eef6f3] text-[#1d7f72]'}`}>
          <Icon size={16} />
        </div>
      </div>
      <div className="text-xl font-bold">{value}</div>
      <div className="mt-1 text-[11px] text-[#899892]">{detail}</div>
    </div>
  )
}
