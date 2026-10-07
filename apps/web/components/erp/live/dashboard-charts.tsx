'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { dashboardAccess } from '@/lib/erp/domain/dashboard'
import { dashboardChartSeries } from '@/lib/erp/domain/dashboard-charts'
import type { factoryStatus } from '@/lib/erp/domain/reports'
import { useLanguage } from '@/lib/i18n/language-provider'
import { translateUiText } from '@/lib/i18n/translations'
import type { LiveCtx } from './ctx'
import { Card } from './bits'

export function DashboardCharts({ ctx, status }: { ctx: LiveCtx; status: ReturnType<typeof factoryStatus> }) {
  const { language } = useLanguage()
  const ui = (text: string) => translateUiText(language, text)
  const [days, setDays] = useState<7 | 30>(7)
  const access = dashboardAccess(ctx.permissions)
  const series = useMemo(() => dashboardChartSeries(ctx.state, ctx.permissions, status.day, days), [ctx.state, ctx.permissions, status.day, days])
  const locale = language === 'ar' ? 'ar-OM' : language === 'hi' ? 'hi-IN' : 'en-GB'
  const number = (value: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value)
  const compact = (value: number) => new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value)
  const date = (day: string) => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${day}T00:00:00Z`))
  const currency = ctx.state.company.currency
  const tooltipStyle = { background: 'var(--erp-card)', border: '1px solid var(--erp-border)', borderRadius: 8, color: 'var(--erp-fg)' }
  const profit = [
    { label: ui('تكلفة الطن'), value: status.profit.costPerTon },
    { label: ui('متوسط سعر البيع'), value: status.profit.avgPricePerTon },
    { label: ui('هامش الربح/طن'), value: status.profit.marginPerTon },
  ]
  const inventory = [
    { label: ui('المواد التي ستنفد'), value: status.inventory.runningOut.length },
    { label: ui('المواد الراكدة'), value: status.inventory.stagnant.length },
    { label: ui('المواد المحجوزة'), value: status.inventory.reserved.length },
  ]
  const frame = (title: string, chart: ReactNode, rows: Array<{ label: string; values: number[] }>, headings: string[], unit: string) => (
    <div>
      <div dir="ltr" role="group" aria-label={`${ui(title)} (${unit})`} className="h-64 w-full min-w-0 sm:h-72">{chart}</div>
      <details className="mt-3 text-xs text-[#6b7280]">
        <summary className="min-h-8 cursor-pointer font-medium">{ui('عرض بيانات الرسم')}</summary>
        <div className="max-w-full overflow-x-auto">
          <table className="mt-2 w-full text-start"><caption className="sr-only">{ui(title)} ({unit})</caption><thead><tr><th scope="col" className="p-2 text-start">{ui('البند')}</th>{headings.map(heading => <th key={heading} scope="col" className="p-2 text-start">{ui(heading)}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.label} className="border-t border-[#e5e7eb]"><th scope="row" className="p-2 text-start font-normal">{row.label}</th>{row.values.map((value, index) => <td key={index} className="p-2">{number(value)}</td>)}</tr>)}</tbody></table>
        </div>
      </details>
    </div>
  )
  if (!access.production && !access.sales && !access.profitability && !access.inventory) return null
  return (
    <section data-testid="dashboard-charts" aria-label={ui('مؤشرات الأداء')} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-semibold">{ui('مؤشرات الأداء')}</h3>
        {access.production || access.sales ? <label className="flex items-center gap-2 text-sm text-[#6b7280]">{ui('الفترة')}<select aria-label={ui('فترة الرسوم البيانية')} value={days} onChange={event => setDays(Number(event.target.value) as 7 | 30)} className="h-10 rounded-lg border border-[#e5e7eb] bg-white px-3 text-[#1f1f1f]"><option value={7}>{ui('آخر 7 أيام')}</option><option value={30}>{ui('آخر 30 يوماً')}</option></select></label> : null}
      </div>
      <div className="erp-dashboard-charts grid min-w-0 gap-4">
        {series.production ? <Card title="الإنتاج خلال الفترة" hint={`${ui('المخطط مقابل الفعلي بالطن')} · ${date(series.production[0]!.day)} — ${date(status.day)}`}>
          {frame('الإنتاج خلال الفترة', <ResponsiveContainer width="100%" height="100%"><BarChart data={series.production} margin={{ top: 12, right: 8, left: 0, bottom: 4 }} accessibilityLayer><CartesianGrid vertical={false} stroke="var(--erp-border)" strokeDasharray="3 3"/><XAxis dataKey="day" tickFormatter={date} tick={{ fontSize: 10, fill: 'var(--erp-muted)' }} minTickGap={24} axisLine={false} tickLine={false}/><YAxis width={42} tickFormatter={compact} tick={{ fontSize: 11, fill: 'var(--erp-muted)' }} axisLine={false} tickLine={false}/><Tooltip contentStyle={tooltipStyle} labelFormatter={value => date(String(value))} formatter={value => `${number(Number(value))} ${ui('طن')}`}/><Legend wrapperStyle={{ fontSize: 12 }}/><Bar dataKey="planned" name={ui('المخطط')} fill="#a99ae8" radius={[4,4,0,0]} isAnimationActive={false}/><Bar dataKey="actual" name={ui('الفعلي')} fill="#1e127c" radius={[4,4,0,0]} isAnimationActive={false}/></BarChart></ResponsiveContainer>, series.production.map(row => ({ label: date(row.day), values: [row.planned, row.actual] })), ['المخطط', 'الفعلي'], ui('طن'))}
        </Card> : null}
        {series.sales ? <Card title="المبيعات خلال الفترة" hint={`${ui('صافي الفواتير المؤكدة قبل الضريبة.')} · ${currency}`}>
          {frame('المبيعات خلال الفترة', <ResponsiveContainer width="100%" height="100%"><LineChart data={series.sales} margin={{ top: 12, right: 12, left: 0, bottom: 4 }} accessibilityLayer><CartesianGrid vertical={false} stroke="var(--erp-border)" strokeDasharray="3 3"/><XAxis dataKey="day" tickFormatter={date} tick={{ fontSize: 10, fill: 'var(--erp-muted)' }} minTickGap={24} axisLine={false} tickLine={false}/><YAxis width={46} tickFormatter={compact} tick={{ fontSize: 11, fill: 'var(--erp-muted)' }} axisLine={false} tickLine={false}/><Tooltip contentStyle={tooltipStyle} labelFormatter={value => date(String(value))} formatter={value => `${number(Number(value))} ${currency}`}/><Line type="linear" dataKey="sales" name={ui('المبيعات')} stroke="#7664d8" strokeWidth={3} dot={days === 7} activeDot={{ r: 5 }} isAnimationActive={false}/></LineChart></ResponsiveContainer>, series.sales.map(row => ({ label: date(row.day), values: [row.sales] })), ['المبيعات'], currency)}
        </Card> : null}
        {access.profitability ? <Card title="التكلفة والربحية" hint={`${ui('تكلفة وسعر البيع وهامش الربح للطن')} · ${date(status.day)} · ${currency}`}>
          {frame('التكلفة والربحية', <ResponsiveContainer width="100%" height="100%"><BarChart data={profit} layout="vertical" margin={{ top: 12, right: 24, left: 0, bottom: 4 }} accessibilityLayer><CartesianGrid horizontal={false} stroke="var(--erp-border)" strokeDasharray="3 3"/><XAxis type="number" tickFormatter={compact} tick={{ fontSize: 11, fill: 'var(--erp-muted)' }} axisLine={false} tickLine={false}/><YAxis type="category" dataKey="label" width={100} tick={{ fontSize: 10, fill: 'var(--erp-muted)' }} axisLine={false} tickLine={false}/><Tooltip contentStyle={tooltipStyle} formatter={value => `${number(Number(value))} ${currency}`}/><ReferenceLine x={0} stroke="var(--erp-muted)"/><Bar dataKey="value" name={ui('القيمة')} fill="#7664d8" radius={4} isAnimationActive={false}/></BarChart></ResponsiveContainer>, profit.map(row => ({ label: row.label, values: [row.value] })), ['القيمة'], currency)}
        </Card> : null}
        {access.inventory ? <Card title="حالة المخزون" hint="عدد المواد في كل حالة؛ قد تظهر المادة في أكثر من حالة.">
          {frame('حالة المخزون', <ResponsiveContainer width="100%" height="100%"><BarChart data={inventory} layout="vertical" margin={{ top: 12, right: 24, left: 0, bottom: 4 }} accessibilityLayer><CartesianGrid horizontal={false} stroke="var(--erp-border)" strokeDasharray="3 3"/><XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--erp-muted)' }} axisLine={false} tickLine={false}/><YAxis type="category" dataKey="label" width={100} tick={{ fontSize: 10, fill: 'var(--erp-muted)' }} axisLine={false} tickLine={false}/><Tooltip contentStyle={tooltipStyle} formatter={value => number(Number(value))}/><Bar dataKey="value" name={ui('عدد المواد')} fill="#d97706" radius={4} isAnimationActive={false}/></BarChart></ResponsiveContainer>, inventory.map(row => ({ label: row.label, values: [row.value] })), ['عدد المواد'], ui('مادة'))}
        </Card> : null}
      </div>
    </section>
  )
}
