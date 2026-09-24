'use client'

import { useMemo, useState } from 'react'

import { PERMISSIONS } from '@/lib/erp/domain/permissions'
import type { RoleKey } from '@/lib/erp/domain/permissions'
import { factoryStatus, itemOnHand, materialStatement, muscatDay, profitAndLoss, stockRows, traceProduct, trialBalance, vatReturn } from '@/lib/erp/domain/reports'
import type { VatTreatment } from '@/lib/erp/domain/types'

import { Badge, Card, DataTable, Field, FormDialog, GhostButton, PrimaryButton, SelectInput, TextInput, toneForStatus } from './bits'
import type { LiveCtx } from './ctx'
import { can, dayFmt, moneyFmt, partyName, pctFmt, qtyFmt, statusLabel, tonsFmt, WAREHOUSE_LABEL } from './format'

const ROLE_OPTIONS: Array<{ value: RoleKey; label: string }> = [
  { value: 'GM', label: 'المدير العام' },
  { value: 'ACCOUNTANT', label: 'المحاسب والموارد البشرية' },
  { value: 'OPERATIONS', label: 'المستودع والإنتاج والمبيعات' },
]

export function OfficeScreens({ entityKey, ctx }: { entityKey: string; ctx: LiveCtx }) {
  if (entityKey === 'account') return <Accounts ctx={ctx} />
  if (entityKey === 'journalEntry') return <Journals ctx={ctx} />
  if (entityKey === 'expense') return <Expenses ctx={ctx} />
  if (entityKey === 'vatReport' || entityKey === 'taxSettings') return <VatScreen ctx={ctx} settings={entityKey === 'taxSettings'} />
  if (entityKey === 'employee') return <Employees ctx={ctx} />
  if (entityKey === 'attendance') return <Attendance ctx={ctx} />
  if (entityKey === 'overtime') return <Overtime ctx={ctx} />
  if (entityKey === 'payroll') return <Payroll ctx={ctx} />
  if (entityKey === 'report') return <Reports ctx={ctx} />
  if (entityKey === 'notification') return <Notifications ctx={ctx} />
  if (entityKey === 'auditLog') return <Audit ctx={ctx} />
  if (entityKey === 'companySettings') return <Settings ctx={ctx} />
  if (entityKey === 'workforce') return <Workforce ctx={ctx} />
  if (entityKey === 'approvals') return <Approvals ctx={ctx} />
  if (entityKey === 'users') return <Users ctx={ctx} />
  return null
}

function Accounts({ ctx }: { ctx: LiveCtx }) {
  const tb = trialBalance(ctx.state)
  return (
    <Card title="دليل الحسابات" hint="الأرصدة تُحسب من القيود الناتجة عن العمليات، وليست إدخالاً يدوياً منفصلاً." extra={<a className="text-sm font-bold text-[#1d7f72]" href="/api/erp/export?kind=trial">تصدير Excel</a>}>
      <DataTable
        columns={['الرمز', 'الحساب', 'النوع', 'الرصيد']}
        rows={tb.rows.map((row) => [row.code, row.nameAr, row.type, moneyFmt(row.balance)])}
      />
    </Card>
  )
}

function Journals({ ctx }: { ctx: LiveCtx }) {
  return (
    <Card title="القيود اليومية" extra={<a className="text-sm font-bold text-[#1d7f72]" href="/api/erp/export?kind=journals">تصدير Excel</a>}>
      <DataTable
        columns={['القيد', 'التاريخ', 'البيان', 'البنود']}
        rows={ctx.state.journals.slice(0, 40).map((entry) => [
          entry.number,
          entry.at.slice(0, 10),
          entry.memo,
          entry.lines.map((line) => `${line.accountCode} مدين ${moneyFmt(line.debit)} / دائن ${moneyFmt(line.credit)}`).join(' — '),
        ])}
      />
    </Card>
  )
}

function Expenses({ ctx }: { ctx: LiveCtx }) {
  const [category, setCategory] = useState('تشغيل')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [vatTreatment, setVatTreatment] = useState<VatTreatment>('STANDARD')
  return (
    <div className="space-y-4">
      <Card
        title="المصروفات"
        hint="يُرحَّل بعد اعتماد المدير: مدين المصروف ومدين ضريبة المدخلات، دائن البنك أو المورد."
        extra={
          <FormDialog title="مصروف جديد" openLabel="مصروف جديد">
            {(close) => (
              <form className="grid gap-3" onSubmit={async (event) => {
                event.preventDefault()
                const result = await ctx.act('createExpense', { category, description, amount: Number(amount), vatTreatment, payFrom: 'BANK' })
                if (result.ok) {
                  setDescription('')
                  setAmount('')
                  close()
                }
              }}>
                <Field label="التصنيف"><TextInput value={category} onChange={(e) => setCategory(e.target.value)} /></Field>
                <Field label="المبلغ غير شامل الضريبة"><TextInput type="number" min="0.001" step="0.001" value={amount} onChange={(e) => setAmount(e.target.value)} required /></Field>
                <Field label="الوصف"><TextInput value={description} onChange={(e) => setDescription(e.target.value)} required /></Field>
                <Field label="الضريبة">
                  <SelectInput value={vatTreatment} onChange={(e) => setVatTreatment(e.target.value as VatTreatment)}>
                    <option value="STANDARD">خاضعة</option>
                    <option value="ZERO">صفرية</option>
                    <option value="EXEMPT">معفاة</option>
                  </SelectInput>
                </Field>
                <PrimaryButton disabled={ctx.pending || !can(ctx.permissions, 'expenses.manage')}>إرسال للاعتماد</PrimaryButton>
              </form>
            )}
          </FormDialog>
        }
      >
        <DataTable
          columns={['الرقم', 'الوصف', 'الصافي', 'الضريبة', 'الحالة', '']}
          rows={ctx.state.expenses.map((expense) => [
            expense.number,
            expense.description,
            moneyFmt(expense.amount),
            moneyFmt(expense.vatAmount),
            <Badge key={expense.id} tone={toneForStatus(expense.status)}>{statusLabel(expense.status)}</Badge>,
            expense.status === 'PENDING_APPROVAL' && can(ctx.permissions, 'expenses.approve') ? (
              <GhostButton key={`${expense.id}-a`} type="button" onClick={() => ctx.act('decideExpense', { id: expense.id, decision: 'POSTED' })}>اعتماد وترحيل</GhostButton>
            ) : '—',
          ])}
        />
      </Card>
    </div>
  )
}

function VatScreen({ ctx, settings }: { ctx: LiveCtx; settings: boolean }) {
  const [month, setMonth] = useState(() => muscatDay(new Date().toISOString()).slice(0, 7))
  const vat = vatReturn(ctx.state, month)
  const [vatRatePct, setVatRatePct] = useState(String(ctx.state.company.vatRatePct))
  const [vatNumber, setVatNumber] = useState(ctx.state.company.vatNumber)
  return (
    <div className="space-y-4">
      <Card title="إقرار ضريبة القيمة المضافة" hint="مخرجات الفواتير المؤكدة مقابل مدخلات الاستلام والمصروفات المرحّلة. راجع المعاملة الضريبية للأعلاف مع المستشار الضريبي؛ النسبة الافتراضية 5%." extra={<a className="text-sm font-bold text-[#1d7f72]" href={`/api/erp/export?kind=vat&month=${month}`}>تصدير Excel</a>}>
        <Field label="الشهر"><TextInput type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></Field>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Metric label="ضريبة المخرجات" value={moneyFmt(vat.outputVat)} />
          <Metric label="ضريبة المدخلات" value={moneyFmt(vat.inputVat)} />
          <Metric label="صافي المستحق" value={moneyFmt(vat.netPayable)} />
        </div>
      </Card>
      {settings ? (
        <Card title="إعدادات الضريبة والشركة">
          <form className="grid gap-3 md:grid-cols-2" onSubmit={async (event) => {
            event.preventDefault()
            await ctx.act('updateCompany', { vatRatePct: Number(vatRatePct), vatNumber })
          }}>
            <Field label="رقم التسجيل الضريبي"><TextInput value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} /></Field>
            <Field label="نسبة الضريبة %"><TextInput type="number" min="0" max="100" step="0.001" value={vatRatePct} onChange={(e) => setVatRatePct(e.target.value)} /></Field>
            <PrimaryButton disabled={ctx.pending || !can(ctx.permissions, 'settings.update')}>حفظ</PrimaryButton>
          </form>
        </Card>
      ) : null}
    </div>
  )
}

function Employees({ ctx }: { ctx: LiveCtx }) {
  const [nameAr, setNameAr] = useState('')
  const [department, setDepartment] = useState('الإنتاج')
  const [jobTitle, setJobTitle] = useState('')
  const [basicSalary, setBasicSalary] = useState('')
  return (
    <div className="space-y-4">
      <Card
        title="الموظفون"
        hint="الحضور اليدوي وملف CSV جاهزان الآن. جهاز البصمة يُربط لاحقاً عبر نفس سجل الحضور دون إعادة بناء النظام."
        extra={
          <FormDialog title="موظف" openLabel="إضافة موظف">
            {(close) => (
              <form className="grid gap-3" onSubmit={async (event) => {
                event.preventDefault()
                const result = await ctx.act('createEmployee', { nameAr, department, jobTitle, basicSalary: Number(basicSalary) })
                if (result.ok) {
                  setNameAr('')
                  setJobTitle('')
                  setBasicSalary('')
                  close()
                }
              }}>
                <Field label="الاسم"><TextInput value={nameAr} onChange={(e) => setNameAr(e.target.value)} required /></Field>
                <Field label="القسم"><TextInput value={department} onChange={(e) => setDepartment(e.target.value)} /></Field>
                <Field label="المسمى"><TextInput value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} /></Field>
                <Field label="الراتب الأساسي"><TextInput type="number" min="0" step="0.001" value={basicSalary} onChange={(e) => setBasicSalary(e.target.value)} required /></Field>
                <PrimaryButton disabled={ctx.pending || !can(ctx.permissions, 'employees.manage')}>حفظ</PrimaryButton>
              </form>
            )}
          </FormDialog>
        }
      >
        <DataTable columns={['الكود', 'الاسم', 'القسم', 'المسمى', 'الراتب']} rows={ctx.state.employees.map((employee) => [employee.code, employee.nameAr, employee.department, employee.jobTitle, typeof employee.basicSalary === 'number' ? moneyFmt(employee.basicSalary) : '—'])} />
      </Card>
    </div>
  )
}

function Attendance({ ctx }: { ctx: LiveCtx }) {
  const [employeeId, setEmployeeId] = useState(ctx.state.employees[0]?.id ?? '')
  const [date, setDate] = useState(() => muscatDay(new Date().toISOString()))
  const [checkIn, setCheckIn] = useState('07:00')
  const [checkOut, setCheckOut] = useState('15:00')
  const [csv, setCsv] = useState(() => `EMP-001,${muscatDay(new Date().toISOString())},07:05,15:10`)
  return (
    <div className="space-y-4">
      <Card
        title="السجل"
        extra={
          <div className="flex flex-wrap items-center gap-2">
            <FormDialog title="تسجيل حضور" openLabel="تسجيل حضور">
              {(close) => (
                <form className="grid gap-3" onSubmit={async (event) => {
                  event.preventDefault()
                  const result = await ctx.act('recordAttendance', { employeeId, date, checkIn, checkOut, source: 'MANUAL' })
                  if (result.ok) close()
                }}>
                  <Field label="الموظف">
                    <SelectInput value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                      {ctx.state.employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.nameAr}</option>)}
                    </SelectInput>
                  </Field>
                  <Field label="التاريخ"><TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
                  <Field label="حضور"><TextInput value={checkIn} onChange={(e) => setCheckIn(e.target.value)} /></Field>
                  <Field label="انصراف"><TextInput value={checkOut} onChange={(e) => setCheckOut(e.target.value)} /></Field>
                  <PrimaryButton disabled={ctx.pending || !can(ctx.permissions, 'attendance.manage')}>حفظ</PrimaryButton>
                </form>
              )}
            </FormDialog>
            <FormDialog title="استيراد CSV" hint="الأعمدة: كود الموظف,التاريخ,الحضور,الانصراف. نفس المسار سيستقبل ملف جهاز البصمة لاحقاً." openLabel="استيراد CSV" wide>
              {(close) => (
                <form className="space-y-3" onSubmit={async (event) => {
                  event.preventDefault()
                  const result = await ctx.act('importAttendance', { csv })
                  if (result.ok) close()
                }}>
                  <textarea className="min-h-24 w-full rounded-xl border border-[#dfe7e3] p-3 text-sm" value={csv} onChange={(e) => setCsv(e.target.value)} />
                  <PrimaryButton disabled={ctx.pending || !can(ctx.permissions, 'attendance.manage')}>استيراد</PrimaryButton>
                </form>
              )}
            </FormDialog>
          </div>
        }
      >
        <DataTable
          columns={['الموظف', 'التاريخ', 'حضور', 'انصراف', 'المصدر']}
          rows={ctx.state.attendance.slice(0, 40).map((row) => [ctx.state.employees.find((employee) => employee.id === row.employeeId)?.nameAr ?? '', row.date, row.checkIn, row.checkOut || '—', statusLabel(row.source)])}
        />
      </Card>
    </div>
  )
}

function hours(checkIn: string, checkOut: string) {
  const [ih, im] = checkIn.split(':').map(Number)
  const [oh, om] = (checkOut || '').split(':').map(Number)
  if (![ih, im, oh, om].every((value) => Number.isFinite(value))) return 0
  return Math.max(0, oh + om / 60 - (ih + im / 60))
}

function Overtime({ ctx }: { ctx: LiveCtx }) {
  const rows = ctx.state.attendance.map((row) => {
    const worked = hours(row.checkIn, row.checkOut)
    return { ...row, worked, overtime: Math.max(0, worked - 8) }
  }).filter((row) => row.overtime > 0)
  return (
    <Card title="الساعات الإضافية" hint="ما زاد عن 8 ساعات في السجل. تُسعَّر في المسير بـ 1.25 من أجر الساعة.">
      <DataTable
        columns={['الموظف', 'التاريخ', 'ساعات العمل', 'الإضافي']}
        rows={rows.map((row) => [ctx.state.employees.find((employee) => employee.id === row.employeeId)?.nameAr ?? '', row.date, row.worked.toFixed(2), row.overtime.toFixed(2)])}
      />
    </Card>
  )
}

function Payroll({ ctx }: { ctx: LiveCtx }) {
  const [month, setMonth] = useState(() => muscatDay(new Date().toISOString()).slice(0, 7))
  const [hoursMap, setHoursMap] = useState<Record<string, string>>({})
  return (
    <div className="space-y-4">
      <Card
        title="المسيرات"
        hint="المحاسب يجهّز المسير، المدير يعتمده، ثم يُصرف من البنك."
        extra={
          <div className="flex flex-wrap items-center gap-3">
            <a className="text-sm font-bold text-[#1d7f72]" href="/api/erp/export?kind=payroll">تصدير Excel</a>
            <FormDialog title="مسير رواتب" openLabel="مسير جديد" wide>
              {(close) => (
                <form className="space-y-3" onSubmit={async (event) => {
                  event.preventDefault()
                  const result = await ctx.act('createPayroll', {
                    month,
                    lines: ctx.state.employees.filter((employee) => employee.active).map((employee) => ({
                      employeeId: employee.id,
                      overtimeHours: Number(hoursMap[employee.id] || 0),
                    })),
                  })
                  if (result.ok) close()
                }}>
                  <Field label="الشهر"><TextInput type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></Field>
                  {ctx.state.employees.map((employee) => (
                    <label key={employee.id} className="flex items-center justify-between gap-3 text-sm">
                      <span>{employee.nameAr}{typeof employee.basicSalary === 'number' ? ` — ${moneyFmt(employee.basicSalary)}` : ''}</span>
                      <input className="h-10 w-28 rounded-xl border border-[#dfe7e3] px-3" type="number" min="0" step="0.5" placeholder="إضافي" value={hoursMap[employee.id] ?? ''} onChange={(e) => setHoursMap((current) => ({ ...current, [employee.id]: e.target.value }))} />
                    </label>
                  ))}
                  <PrimaryButton disabled={ctx.pending || !can(ctx.permissions, 'payroll.manage')}>إرسال للاعتماد</PrimaryButton>
                </form>
              )}
            </FormDialog>
          </div>
        }
      >
        <DataTable
          columns={['الرقم', 'الشهر', 'الصافي', 'الحالة', '']}
          rows={ctx.state.payrolls.map((payroll) => [
            payroll.number,
            payroll.month,
            moneyFmt(payroll.totalNet),
            statusLabel(payroll.status),
            <span key={payroll.id} className="flex gap-2">
              {payroll.status === 'PENDING_APPROVAL' && can(ctx.permissions, 'payroll.approve') ? <GhostButton type="button" onClick={() => ctx.act('decidePayroll', { id: payroll.id, decision: 'APPROVED' })}>اعتماد</GhostButton> : null}
              {payroll.status === 'APPROVED' && can(ctx.permissions, 'payroll.pay') ? <GhostButton type="button" onClick={() => ctx.act('payPayroll', { id: payroll.id })}>صرف</GhostButton> : null}
            </span>,
          ])}
        />
      </Card>
    </div>
  )
}

function Reports({ ctx }: { ctx: LiveCtx }) {
  const tb = trialBalance(ctx.state)
  const pnl = profitAndLoss(ctx.state)
  const stock = stockRows(ctx.state)
  const value = stock.reduce((sum, row) => sum + row.value, 0)
  const [productId, setProductId] = useState(ctx.state.products[0]?.id ?? '')
  const trace = useMemo(() => (productId ? traceProduct(ctx.state, productId) : null), [ctx.state, productId])
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Metric label="قيمة المخزون" value={moneyFmt(value)} />
        <Metric label="الإيرادات" value={moneyFmt(pnl.revenue)} />
        <Metric label="الربح" value={moneyFmt(pnl.profit)} />
      </div>
      <Card title="ميزان المراجعة" hint={tb.balanced ? 'المدين يساوي الدائن.' : 'الميزان غير متوازن — راجع القيود.'} extra={<button type="button" className="text-sm font-bold text-[#1d7f72]" onClick={() => window.print()}>طباعة</button>}>
        <DataTable columns={['الحساب', 'مدين', 'دائن']} rows={tb.rows.filter((row) => row.debit || row.credit).map((row) => [row.nameAr, moneyFmt(row.debit), moneyFmt(row.credit)])} />
      </Card>
      <Card title="تتبع المنتج" hint="من أمر الشراء والاستلام حتى الإنتاج والبيع.">
        <Field label="المنتج">
          <SelectInput value={productId} onChange={(e) => setProductId(e.target.value)}>
            {ctx.state.products.map((product) => <option key={product.id} value={product.id}>{product.nameAr}</option>)}
          </SelectInput>
        </Field>
        {trace?.product ? (
          <div className="mt-4 space-y-2 text-sm leading-7 text-[#30453d]">
            <div>الرصيد الحالي: {qtyFmt(itemOnHand(ctx.state, 'PRODUCT', trace.product.id))} كجم</div>
            <div>الموردون: {[...new Set(trace.purchaseOrders.map((order) => partyName(ctx.state.suppliers, order.supplierId)))].join('، ') || '—'}</div>
            <div>أوامر الشراء: {trace.purchaseOrders.map((order) => `${order.number} — ${partyName(ctx.state.suppliers, order.supplierId)}`).join('، ') || '—'}</div>
            <div>الاستلامات: {trace.receipts.map((receipt) => receipt.number).join('، ') || '—'}</div>
            <div>الإنتاج: {trace.orders.map((order) => `${order.number} (${statusLabel(order.status)}) ناتج ${qtyFmt(order.actualOutputQty)}`).join('، ') || '—'}</div>
            <div>الفواتير: {trace.sales.map((invoice) => `${invoice.number} (${statusLabel(invoice.status)})`).join('، ') || '—'}</div>
          </div>
        ) : null}
      </Card>
    </div>
  )
}

function Notifications({ ctx }: { ctx: LiveCtx }) {
  return (
    <Card title="الإشعارات" hint="نقص المخزون وطلبات الاعتماد تُرسل بالبريد عند ضبط SMTP، وتظهر هنا فوراً.">
      <div className="space-y-3">
        {ctx.state.notifications.length === 0 ? <p className="text-sm text-[#788983]">لا توجد إشعارات</p> : null}
        {ctx.state.notifications.slice(0, 40).map((item) => (
          <div key={item.id} className="flex flex-col gap-2 rounded-xl border border-[#edf2ef] p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-bold">{item.title}</div>
              <div className="text-sm text-[#788983]">{item.body}</div>
              <div className="mt-1 text-xs text-[#97a49f]">{statusLabel(item.kind)} — بريد: {item.emailStatus === 'sent' ? 'أُرسل' : item.emailStatus === 'pending' ? 'بانتظار الإرسال' : 'لم يُضبط البريد'}</div>
            </div>
            {!item.read ? <GhostButton type="button" onClick={() => ctx.act('markNotificationRead', { id: item.id })}>تمت القراءة</GhostButton> : <Badge tone="good">مقروء</Badge>}
          </div>
        ))}
      </div>
    </Card>
  )
}

function Audit({ ctx }: { ctx: LiveCtx }) {
  return (
    <Card title="سجل العمليات">
      <DataTable
        columns={['الوقت', 'المستخدم', 'الإجراء', 'المرجع', 'التفاصيل']}
        rows={ctx.state.auditLogs.slice(0, 60).map((row) => [row.at.slice(0, 16).replace('T', ' '), row.userName, row.action, row.entityId, row.detail])}
      />
    </Card>
  )
}

function Settings({ ctx }: { ctx: LiveCtx }) {
  const company = ctx.state.company
  const [form, setForm] = useState({ ...company })
  return (
    <Card title="إعدادات الشركة" hint="هذه البيانات تُطبع على الفاتورة الضريبية وأمر الشراء.">
      <form className="grid gap-3 md:grid-cols-2" onSubmit={async (event) => {
        event.preventDefault()
        await ctx.act('updateCompany', form)
      }}>
        <Field label="اسم المصنع"><TextInput value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} /></Field>
        <Field label="الاسم الإنجليزي"><TextInput value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} /></Field>
        <Field label="العنوان"><TextInput value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
        <Field label="المدينة"><TextInput value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
        <Field label="الهاتف"><TextInput value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
        <Field label="السجل التجاري"><TextInput value={form.crNumber} onChange={(e) => setForm({ ...form, crNumber: e.target.value })} /></Field>
        <Field label="حد انحراف الإنتاج %"><TextInput type="number" min="0" step="0.01" value={form.varianceThresholdPct} onChange={(e) => setForm({ ...form, varianceThresholdPct: Number(e.target.value) })} /></Field>
        <Field label="بريد التنبيهات"><TextInput value={form.notifyEmail} onChange={(e) => setForm({ ...form, notifyEmail: e.target.value })} /></Field>
        <div className="flex flex-wrap gap-2">
          <PrimaryButton disabled={ctx.pending || !can(ctx.permissions, 'settings.update')}>حفظ</PrimaryButton>
          {can(ctx.permissions, 'settings.update') ? <GhostButton type="button" onClick={() => ctx.act('archiveHistory', { olderThanDays: 90 })}>أرشفة السجلات الأقدم من 90 يوماً</GhostButton> : null}
          {can(ctx.permissions, 'settings.update') ? <GhostButton type="button" onClick={() => ctx.act('resetDemo', {})}>إعادة البيانات التجريبية</GhostButton> : null}
          {can(ctx.permissions, 'settings.read') ? <a className="inline-flex h-10 items-center rounded-xl border border-[#dfe7e3] px-3 text-sm font-semibold" href="/api/erp/backup">تنزيل نسخة احتياطية</a> : null}
        </div>
      </form>
    </Card>
  )
}

function Workforce({ ctx }: { ctx: LiveCtx }) {
  const workforceUrl = process.env.NEXT_PUBLIC_WORKFORCE_URL?.trim() || ''
  return (
    <Card
      title="إدارة الفرق والمهام"
      hint="تم فصل إدارة الفرق والمهام في نظام مستقل خارج الـ ERP."
      extra={
        workforceUrl ? (
          <a className="text-sm font-bold text-[#1d7f72]" href={workforceUrl} target="_blank" rel="noreferrer">
            فتح نظام الفرق والمهام
          </a>
        ) : null
      }
    >
      <div className="space-y-2 text-sm text-[#30453d]">
        <p>إدارة الفرق وتوزيع مهام التشغيل أصبحت خارج الـ ERP.</p>
        {workforceUrl ? (
          <p className="text-[#788983]">
            اضبط المتغير <code className="rounded bg-[#f3f4f6] px-1">NEXT_PUBLIC_WORKFORCE_URL</code> لوضع رابط النظام.
          </p>
        ) : (
          <p className="text-[#dc2626]">
            لا يوجد رابط مضبوط لنظام الفرق والمهام. أضف <code className="rounded bg-[#f3f4f6] px-1">NEXT_PUBLIC_WORKFORCE_URL</code> في البيئة.
          </p>
        )}
      </div>
    </Card>
  )
}

function Approvals({ ctx }: { ctx: LiveCtx }) {
  const pos = ctx.state.purchaseOrders.filter((order) => order.status === 'PENDING_APPROVAL')
  const expenses = ctx.state.expenses.filter((expense) => expense.status === 'PENDING_APPROVAL')
  const payrolls = ctx.state.payrolls.filter((payroll) => payroll.status === 'PENDING_APPROVAL')
  const adjustments = ctx.state.adjustments.filter((adjustment) => adjustment.status === 'PENDING_APPROVAL')
  return (
    <div className="space-y-4">
      <Card title="أوامر شراء">
        {pos.length === 0 ? <p className="text-sm text-[#788983]">لا يوجد</p> : pos.map((order) => (
          <div key={order.id} className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#f3f6f5] py-2">
            <div>{order.number} — {partyName(ctx.state.suppliers, order.supplierId)}</div>
            <span className="flex gap-2">
              <GhostButton type="button" onClick={() => ctx.act('decidePurchaseOrder', { id: order.id, decision: 'APPROVED' })}>اعتماد</GhostButton>
              <GhostButton type="button" onClick={() => ctx.act('decidePurchaseOrder', { id: order.id, decision: 'REJECTED' })}>رفض</GhostButton>
            </span>
          </div>
        ))}
      </Card>
      <Card title="مصروفات">
        {expenses.length === 0 ? <p className="text-sm text-[#788983]">لا يوجد</p> : expenses.map((expense) => (
          <div key={expense.id} className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#f3f6f5] py-2">
            <div>{expense.number} — {expense.description} — {moneyFmt(expense.total)}</div>
            <GhostButton type="button" onClick={() => ctx.act('decideExpense', { id: expense.id, decision: 'POSTED' })}>ترحيل</GhostButton>
          </div>
        ))}
      </Card>
      <Card title="رواتب">
        {payrolls.length === 0 ? <p className="text-sm text-[#788983]">لا يوجد</p> : payrolls.map((payroll) => (
          <div key={payroll.id} className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#f3f6f5] py-2">
            <div>{payroll.month} — {moneyFmt(payroll.totalNet)}</div>
            <GhostButton type="button" onClick={() => ctx.act('decidePayroll', { id: payroll.id, decision: 'APPROVED' })}>اعتماد</GhostButton>
          </div>
        ))}
      </Card>
      <Card title="تعديل مخزون">
        {adjustments.length === 0 ? <p className="text-sm text-[#788983]">لا يوجد</p> : adjustments.map((adjustment) => (
          <div key={adjustment.id} className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#f3f6f5] py-2">
            <div>{adjustment.number} — {adjustment.reason}</div>
            <GhostButton type="button" onClick={() => ctx.act('decideAdjustment', { id: adjustment.id, decision: 'APPROVED' })}>اعتماد</GhostButton>
          </div>
        ))}
      </Card>
    </div>
  )
}

function Users({ ctx }: { ctx: LiveCtx }) {
  const [role, setRole] = useState<RoleKey>('OPERATIONS')
  const [selected, setSelected] = useState<string[]>(ctx.state.rolePermissions.OPERATIONS)
  const [userId, setUserId] = useState(ctx.state.users[0]?.id ?? '')
  const [password, setPassword] = useState('')
  return (
    <div className="space-y-4">
      <Card
        title="المستخدمون"
        extra={
          <div className="flex flex-wrap items-center gap-2">
          {can(ctx.permissions, 'settings.update') ? <GhostButton type="button" onClick={() => ctx.act('resetDemo', {})}>إعادة البيانات التجريبية</GhostButton> : null}
          <FormDialog title="تحديث كلمة المرور" openLabel="تحديث كلمة المرور">
            {(close) => (
              <form className="grid gap-3" onSubmit={async (event) => {
                event.preventDefault()
                const result = await ctx.act('setUserPassword', { userId, password })
                if (result.ok) {
                  setPassword('')
                  close()
                }
              }}>
                <Field label="المستخدم">
                  <SelectInput value={userId} onChange={(e) => setUserId(e.target.value)}>
                    {ctx.state.users.map((user) => <option key={user.id} value={user.id}>{user.fullName}</option>)}
                  </SelectInput>
                </Field>
                <Field label="كلمة مرور جديدة"><TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} /></Field>
                <PrimaryButton disabled={ctx.pending}>حفظ</PrimaryButton>
              </form>
            )}
          </FormDialog>
          </div>
        }
      >
        <DataTable columns={['الاسم', 'البريد', 'الدور', 'الحالة']} rows={ctx.state.users.map((user) => [user.fullName, user.email, ROLE_OPTIONS.find((item) => item.value === user.role)?.label ?? user.role, user.active ? 'نشط' : 'موقوف'])} />
      </Card>
      <Card title="صلاحيات الدور" hint="يمكن تضييق ما يراه كل دور دون إيقاف باقي النظام. لا يُسحب حق إدارة المستخدمين من المدير العام.">
        <form className="space-y-3" onSubmit={async (event) => {
          event.preventDefault()
          const result = await ctx.act('setRolePermissions', { role, permissions: selected })
          if (result.ok) await ctx.refreshUser()
        }}>
          <Field label="الدور">
            <SelectInput value={role} onChange={(e) => {
              const next = e.target.value as RoleKey
              setRole(next)
              setSelected(ctx.state.rolePermissions[next])
            }}>
              {ROLE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </SelectInput>
          </Field>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {PERMISSIONS.map((permission) => (
              <label key={permission} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={selected.includes(permission)} onChange={(e) => {
                  setSelected((current) => e.target.checked ? [...current, permission] : current.filter((item) => item !== permission))
                }} />
                <span>{permission}</span>
              </label>
            ))}
          </div>
          <PrimaryButton disabled={ctx.pending}>حفظ الصلاحيات</PrimaryButton>
        </form>
      </Card>
    </div>
  )
}

function Metric({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string
  hint?: string
  tone?: 'good' | 'warn' | 'bad'
}) {
  const toneClass = tone === 'good' ? 'text-[#0a825d]' : tone === 'warn' ? 'text-[#d97706]' : tone === 'bad' ? 'text-[#dc2626]' : 'text-[#1f1f1f]'
  const barClass = tone === 'good' ? 'bg-[#10b981]' : tone === 'warn' ? 'bg-[#f59e0b]' : tone === 'bad' ? 'bg-[#ef4444]' : 'bg-[#0d9488]'
  return (
    <div className="relative overflow-hidden rounded-[12px] border border-[#e5e7eb] bg-white p-4 ps-5 shadow-sm">
      <span aria-hidden className={`absolute inset-y-3 right-0 w-1.5 rounded-full ${barClass}`} />
      <div className="text-sm font-medium text-[#6b7280]">{label}</div>
      <div className={`mt-2 text-3xl font-bold leading-none tracking-tight ${toneClass}`}>{value}</div>
      {hint ? <div className="mt-2 text-sm text-[#53655e]">{hint}</div> : null}
    </div>
  )
}

function NameList({ rows, empty }: { rows: string[]; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-[#788983]">{empty}</p>
  return (
    <ul className="space-y-1.5 text-sm text-[#30453d]">
      {rows.map((row) => (
        <li key={row}>{row}</li>
      ))}
    </ul>
  )
}

export function DashboardScreen({ ctx }: { ctx: LiveCtx }) {
  const status = useMemo(() => factoryStatus(ctx.state, new Date().toISOString()), [ctx.state])
  const spotlight = useMemo(
    () =>
      ctx.state.materials
        .map((material) => materialStatement(ctx.state, material.id))
        .filter((row): row is NonNullable<ReturnType<typeof materialStatement>> => Boolean(row && row.consumedQty > 0))
        .sort((a, b) => b.consumedQty - a.consumedQty)[0] ?? null,
    [ctx.state],
  )
  const executionTone = status.production.executionPct >= 95 ? 'good' : status.production.executionPct >= 80 ? 'warn' : 'bad'
  const marginTone = status.profit.marginPerTon > 0 ? 'good' : status.profit.marginPerTon < 0 ? 'bad' : undefined
  const pending =
    ctx.state.purchaseOrders.filter((order) => order.status === 'PENDING_APPROVAL').length +
    ctx.state.expenses.filter((expense) => expense.status === 'PENDING_APPROVAL').length +
    ctx.state.payrolls.filter((payroll) => payroll.status === 'PENDING_APPROVAL').length +
    ctx.state.adjustments.filter((adjustment) => adjustment.status === 'PENDING_APPROVAL').length
  const dateLabel = dayFmt(status.day)
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-3xl font-bold">وضع المصنع اليوم</h2>
        <p className="mt-2 text-[#788983]">
          {status.shifted ? `لا يوجد تشغيل بتاريخ اليوم. الأرقام لآخر يوم تشغيل: ${dateLabel}` : dateLabel}
          {' · '}
          {ctx.state.company.nameAr}
        </p>
      </div>

      <Card title="الإنتاج" hint="المخطط مقابل ما خرج فعلياً من خط الإنتاج.">
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="المخطط اليوم" value={tonsFmt(status.production.plannedKg)} />
          <Metric label="الفعلي" value={tonsFmt(status.production.actualKg)} />
          <Metric label="نسبة التنفيذ" value={pctFmt(status.production.executionPct)} tone={status.production.plannedKg > 0 ? executionTone : undefined} />
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e7eeeb]">
          <div
            className={`h-full rounded-full ${executionTone === 'good' ? 'bg-[#1d7f72]' : executionTone === 'warn' ? 'bg-[#d6ad61]' : 'bg-[#ad5e46]'}`}
            style={{ width: `${Math.max(0, Math.min(100, status.production.executionPct))}%` }}
          />
        </div>
      </Card>

      <Card title="المبيعات" hint="صافي الفواتير المؤكدة قبل الضريبة.">
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="مبيعات اليوم" value={moneyFmt(status.sales.today)} hint={status.sales.todayCount ? `${status.sales.todayCount} فاتورة` : 'لا توجد فواتير'} />
          <Metric label="مبيعات الشهر" value={moneyFmt(status.sales.month)} hint={status.sales.monthCount ? `${status.sales.monthCount} فاتورة` : 'لا توجد فواتير'} />
          <Metric label="الطلبات المفتوحة" value={String(status.sales.openCount)} hint={status.sales.openCount ? `المتبقي ${moneyFmt(status.sales.openOutstanding)}` : 'لا توجد طلبات مفتوحة'} />
        </div>
        {status.sales.openOrders.length > 0 ? (
          <div className="mt-4">
            <NameList
              empty=""
              rows={status.sales.openOrders.map((order) => `${order.number} — ${order.customer} — ${statusLabel(order.status)} — ${moneyFmt(order.outstanding)}`)}
            />
          </div>
        ) : null}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="الربحية" hint="متوسط سعر البيع ناقص تكلفة الطن المنتج في هذا اليوم.">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="تكلفة الطن" value={moneyFmt(status.profit.costPerTon)} />
            <Metric label="متوسط سعر البيع" value={moneyFmt(status.profit.avgPricePerTon)} />
            <Metric label="هامش الربح/طن" value={moneyFmt(status.profit.marginPerTon)} tone={marginTone} />
          </div>
        </Card>
        <Card title="المخزون">
          <div className="grid grid-cols-2 gap-3">
            <Metric label="قيمة المخزون" value={moneyFmt(status.inventory.value)} />
            <Metric label="المواد التي ستنفد" value={String(status.inventory.runningOut.length)} tone={status.inventory.runningOut.length ? 'bad' : 'good'} />
            <Metric label="المواد الراكدة" value={String(status.inventory.stagnant.length)} tone={status.inventory.stagnant.length ? 'warn' : 'good'} />
            <Metric label="المواد المحجوزة" value={String(status.inventory.reserved.length)} />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="المواد التي ستنفد" hint="رصيدها عند الحد الأدنى أو دونه.">
          <NameList
            empty="لا توجد مواد قاربت على النفاد"
            rows={status.inventory.runningOut.map((item) => `${item.nameAr} — الرصيد ${qtyFmt(item.onHand)} ${item.unit} — الحد الأدنى ${qtyFmt(item.minQty)} ${item.unit}`)}
          />
        </Card>
        <Card title="المواد الراكدة" hint="بلا حركة صادرة منذ 7 أيام أو أكثر.">
          <NameList
            empty="لا توجد مواد راكدة"
            rows={status.inventory.stagnant.map((item) => `${item.nameAr} — ${qtyFmt(item.onHand)} ${item.unit} — ${item.idleDays} يوم`)}
          />
        </Card>
        <Card title="المواد المحجوزة" hint="مخصصة لأمر إنتاج مفتوح أو موجودة في مستودع التصنيع.">
          <NameList
            empty="لا توجد مواد محجوزة"
            rows={status.inventory.reserved.map((item) => `${item.nameAr} — ${qtyFmt(item.qty)} ${item.unit}`)}
          />
        </Card>
      </div>

      <Card title="الإنتاج" hint="الهدر، الانحراف عن الوصفة، وتوقفات المصنع في يوم التشغيل.">
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="الهدر" value={`${qtyFmt(status.operations.wasteKg)} كجم`} hint={`${pctFmt(status.operations.wastePct)} من الكمية المصروفة`} />
          <Metric
            label="الانحراف عن الوصفة"
            value={status.operations.deviations[0] ? pctFmt(status.operations.deviations[0].diffPct) : pctFmt(0)}
            tone={status.operations.deviations.length ? 'warn' : 'good'}
            hint={status.operations.deviations.length ? `${status.operations.deviations.length} مواد` : 'ضمن الوصفة'}
          />
          <Metric
            label="توقفات المصنع"
            value={status.operations.stoppageMinutes ? `${status.operations.stoppageMinutes} د` : 'لا توجد'}
            tone={status.operations.stoppageMinutes ? 'bad' : 'good'}
            hint={status.operations.stoppages.length ? `${status.operations.stoppages.length} توقف` : 'الخط يعمل'}
          />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <div className="mb-2 text-sm font-semibold text-[#30453d]">الانحراف عن الوصفة</div>
            <NameList
              empty="لا يوجد انحراف عن الوصفة"
              rows={status.operations.deviations.map((line) => `${line.nameAr} — المتوقع ${qtyFmt(line.expectedQty)} والفعلي ${qtyFmt(line.actualQty)} (${pctFmt(line.diffPct)})`)}
            />
            {status.operations.deviations[0]?.reason ? <p className="mt-2 text-sm text-[#788983]">السبب: {status.operations.deviations[0].reason}</p> : null}
          </div>
          <div>
            <div className="mb-2 text-sm font-semibold text-[#30453d]">توقفات المصنع</div>
            <NameList
              empty="لا توجد توقفات مسجّلة"
              rows={status.operations.stoppages.map((item) => `${item.area} — ${item.minutes} دقيقة — ${item.reason}`)}
            />
          </div>
        </div>
      </Card>

      {spotlight ? (
        <Card
          title={`تتبع الخامة — ${spotlight.material.nameAr}`}
          hint="ماذا دخل المخزن، ماذا استُهلك، ماذا تبقّى، وماذا نُتج وبيع."
          extra={<GhostButton type="button" onClick={() => ctx.navigate('materialTrace')}>كل الخامات</GhostButton>}
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Metric label="دخلت المخزن" value={`${qtyFmt(spotlight.receivedQty)} ${spotlight.material.unit}`} />
            <Metric label="استُخدمت في التصنيع" value={`${qtyFmt(spotlight.consumedQty)} ${spotlight.material.unit}`} />
            <Metric label="المتبقي الآن" value={`${qtyFmt(spotlight.onHand)} ${spotlight.material.unit}`} tone={spotlight.belowMin ? 'bad' : 'good'} />
            <Metric label="المنتج المصنّع" value={tonsFmt(spotlight.outputKg)} hint={spotlight.lines.map((line) => line.productName).join('، ') || 'لا يوجد'} />
            <Metric label="بيع / سحب" value={`${qtyFmt(spotlight.soldQty)} / ${qtyFmt(spotlight.withdrawnQty)} كجم`} />
            <Metric
              label="توافق الوصفة"
              value={spotlight.aligned ? 'متوافق' : pctFmt(spotlight.gapPct)}
              tone={spotlight.aligned ? 'good' : 'warn'}
              hint={spotlight.wasteQty > 0 ? `فاقد ${qtyFmt(spotlight.wasteQty)} ${spotlight.material.unit}` : 'بلا فاقد'}
            />
          </div>
          {spotlight.reasons[0] || spotlight.stoppages[0] ? (
            <p className="mt-3 text-sm text-[#53655e]">
              سبب الفرق أو التأخير:{' '}
              {[...spotlight.reasons, ...spotlight.stoppages.map((item) => `${item.area} — ${item.reason}`)].join(' — ')}
            </p>
          ) : null}
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="اعتمادات معلّقة">
          <Metric label="بانتظار اعتماد المدير العام" value={String(pending)} tone={pending ? 'warn' : 'good'} />
        </Card>
        <Card title="آخر الحركات">
          <DataTable
            columns={['النوع', 'الصنف', 'الكمية']}
            rows={ctx.state.ledger.slice(0, 6).map((row) => [statusLabel(row.type), row.batchNo, qtyFmt(row.qty)])}
          />
        </Card>
      </div>
    </div>
  )
}
