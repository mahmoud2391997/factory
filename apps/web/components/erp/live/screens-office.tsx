'use client'

import { useMemo, useState } from 'react'

import { canSeeEntity } from '@/lib/erp-routes'
import { PERMISSIONS, ROLE_LABELS } from '@/lib/erp/domain/permissions'
import type { RoleKey } from '@/lib/erp/domain/permissions'
import { COST_LABEL } from '@/lib/erp/domain/costing'
import { dashboardAccess, dashboardAlerts } from '@/lib/erp/domain/dashboard'
import { factoryStatus, itemOnHand, materialStatement, muscatDay, obligationForecast, profitAndLoss, stockRows, traceCustomer, traceLot, trialBalance, unmatchedBankTransactions, utilitiesPerTon, vatReturn } from '@/lib/erp/domain/reports'
import type { CompanyDocument, VatTreatment } from '@/lib/erp/domain/types'
import { LocalizedContent } from '@/lib/i18n/localized-content'
import { useLanguage } from '@/lib/i18n/language-provider'
import { translateUiText } from '@/lib/i18n/translations'

import { Badge, Card, DataTable, ExportLinks, Field, FormDialog, GhostButton, PrimaryButton, SelectInput, TextInput, toneForStatus } from './bits'
import type { LiveCtx } from './ctx'
import { can, dayFmt, moneyFmt, partyName, pctFmt, qtyFmt, statusLabel, tonsFmt, WAREHOUSE_LABEL } from './format'

const ROLE_OPTIONS: Array<{ value: RoleKey; label: string }> = (Object.entries(ROLE_LABELS) as Array<[RoleKey, string]>).map(
  ([value, label]) => ({ value, label }),
)

export function OfficeScreens({ entityKey, ctx }: { entityKey: string; ctx: LiveCtx }) {
  if (entityKey === 'fleet' || entityKey === 'fleetFuel' || entityKey === 'fleetTrips') return <FleetScreens ctx={ctx} mode={entityKey} />
  if (entityKey === 'account') return <Accounts ctx={ctx} />
  if (entityKey === 'journalEntry') return <Journals ctx={ctx} />
  if (entityKey === 'expense') return <Expenses ctx={ctx} />
  if (entityKey === 'vatReport' || entityKey === 'taxSettings') return <VatScreen ctx={ctx} settings={entityKey === 'taxSettings'} />
  if (entityKey === 'utilitiesReading' || entityKey === 'financialOps') return <Utilities ctx={ctx} />
  if (entityKey === 'bankTransaction') return <BankTransactions ctx={ctx} />
  if (entityKey === 'obligation') return <Obligations ctx={ctx} />
  if (entityKey === 'documents') return <Documents ctx={ctx} />
  if (entityKey === 'employee') return <Employees ctx={ctx} />
  if (entityKey === 'attendance') return <Attendance ctx={ctx} />
  if (entityKey === 'overtime') return <Overtime ctx={ctx} />
  if (entityKey === 'payroll') return <Payroll ctx={ctx} />
  if (entityKey === 'report' || entityKey === 'accountingReports') return <Reports ctx={ctx} />
  if (entityKey === 'notification') return <Notifications ctx={ctx} />
  if (entityKey === 'auditLog') return <Audit ctx={ctx} />
  if (entityKey === 'companySettings') return <Settings ctx={ctx} />
  if (entityKey === 'approvals') return <Approvals ctx={ctx} />
  if (entityKey === 'users') return <Users ctx={ctx} />
  return null
}

function Accounts({ ctx }: { ctx: LiveCtx }) {
  const tb = trialBalance(ctx.state)
  return (
    <Card title="دليل الحسابات" hint="الأرصدة تُحسب من القيود الناتجة عن العمليات، وليست إدخالاً يدوياً منفصلاً." extra={<ExportLinks href="/api/erp/export?kind=trial" />}>
      <DataTable columns={['الرمز', 'الحساب', 'النوع', 'الرصيد']} rows={tb.rows.map((row) => [row.code, row.nameAr, row.type, moneyFmt(row.balance)])} />
    </Card>
  )
}

function FleetScreens({ ctx, mode }: { ctx: LiveCtx; mode: string }) {
  const [vehicleId, setVehicleId] = useState(ctx.state.vehicles[0]?.id ?? '')
  const [code, setCode] = useState('')
  const [plateNo, setPlateNo] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [type, setType] = useState('شاحنة')
  const [liters, setLiters] = useState('')
  const [fuelCost, setFuelCost] = useState('')
  const [odometer, setOdometer] = useState('')
  const [destination, setDestination] = useState('')
  const [km, setKm] = useState('')
  const [loadKg, setLoadKg] = useState('')
  const [tripFuel, setTripFuel] = useState('')
  const [serviceKind, setServiceKind] = useState<'PERIODIC' | 'TIRES' | 'OIL' | 'PARTS' | 'REPAIR'>('PERIODIC')
  const [serviceDate, setServiceDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [serviceDescription, setServiceDescription] = useState('')
  const [serviceCost, setServiceCost] = useState('')
  const [serviceOdometer, setServiceOdometer] = useState('')
  const [nextDueDate, setNextDueDate] = useState('')
  const [nextDueKm, setNextDueKm] = useState('')
  const [serviceSupplierId, setServiceSupplierId] = useState('')
  const [driverId, setDriverId] = useState(ctx.state.employees[0]?.id ?? '')
  const [tripInvoiceId, setTripInvoiceId] = useState(ctx.state.invoices.find((invoice) => invoice.status !== 'DRAFT')?.id ?? '')
  const selectedVehicle = ctx.state.vehicles.find((vehicle) => vehicle.id === vehicleId)

  if (mode === 'fleetFuel') return (
    <Card title="سجل الوقود" hint="كل تعبئة مرتبطة بالمركبة والعداد والسائق لتظهر كلفة الكيلومتر والانحراف.">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="المركبة"><SelectInput value={vehicleId} onChange={(event) => setVehicleId(event.target.value)}>{ctx.state.vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.nameAr} — {vehicle.plateNo}</option>)}</SelectInput></Field>
        <Field label="اللترات"><TextInput type="number" min="0.001" step="0.001" value={liters} onChange={(event) => setLiters(event.target.value)} /></Field>
        <Field label="التكلفة"><TextInput type="number" min="0" step="0.001" value={fuelCost} onChange={(event) => setFuelCost(event.target.value)} /></Field>
        <Field label="العداد"><TextInput type="number" min={selectedVehicle?.currentOdometer ?? 0} value={odometer} onChange={(event) => setOdometer(event.target.value)} /></Field>
      </div>
      <PrimaryButton className="mt-3" disabled={ctx.pending || !vehicleId} onClick={async () => { const result = await ctx.act('addFuelLog', { vehicleId, date: new Date().toISOString().slice(0, 10), liters: Number(liters), cost: Number(fuelCost), odometer: Number(odometer), driverId }); if (result.ok) { setLiters(''); setFuelCost(''); setOdometer('') } }}>تسجيل التعبئة</PrimaryButton>
      <DataTable columns={['التاريخ', 'المركبة', 'اللترات', 'التكلفة', 'العداد']} rows={ctx.state.fuelLogs.map((log) => [log.date.slice(0, 10), ctx.state.vehicles.find((vehicle) => vehicle.id === log.vehicleId)?.nameAr ?? '—', String(log.liters), moneyFmt(log.cost), String(log.odometer)])} />
    </Card>
  )

  if (mode === 'fleetTrips') return (
    <Card title="رحلات التوزيع" hint="تُحسب التكلفة من الوقود والمسافة والسائق. رحلة الفاتورة يمكن توزيع تكلفتها على دفعاتها حسب الكمية ثم إرسالها للمحاسبة للاعتماد.">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="المركبة"><SelectInput value={vehicleId} onChange={(event) => setVehicleId(event.target.value)}>{ctx.state.vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.nameAr}</option>)}</SelectInput></Field>
        <Field label="السائق"><SelectInput value={driverId} onChange={(event) => setDriverId(event.target.value)}>{ctx.state.employees.filter((employee) => employee.active).map((employee) => <option key={employee.id} value={employee.id}>{employee.nameAr}</option>)}</SelectInput></Field>
        <Field label="فاتورة التوصيل"><SelectInput value={tripInvoiceId} onChange={(event) => setTripInvoiceId(event.target.value)}><option value="">بدون ربط بفاتورة</option>{ctx.state.invoices.filter((invoice) => invoice.status !== 'DRAFT').map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.number} — {partyName(ctx.state.customers, invoice.customerId)}</option>)}</SelectInput></Field>
        <Field label="الوجهة"><TextInput value={destination} onChange={(event) => setDestination(event.target.value)} /></Field>
        <Field label="الكيلومترات"><TextInput type="number" min="0.1" value={km} onChange={(event) => setKm(event.target.value)} /></Field>
        <Field label="حمولة كجم"><TextInput type="number" min="0" value={loadKg} onChange={(event) => setLoadKg(event.target.value)} /></Field>
        <Field label="وقود الرحلة"><TextInput type="number" min="0.001" value={tripFuel} onChange={(event) => setTripFuel(event.target.value)} /></Field>
      </div>
      <PrimaryButton className="mt-3" disabled={ctx.pending || !vehicleId || !driverId || !destination} onClick={async () => { const result = await ctx.act('createTrip', { vehicleId, driverId, date: new Date().toISOString().slice(0, 10), destination, km: Number(km), loadKg: Number(loadKg), fuelLiters: Number(tripFuel), invoiceId: tripInvoiceId || undefined }); if (result.ok) { setDestination(''); setKm(''); setLoadKg(''); setTripFuel('') } }}>حفظ الرحلة</PrimaryButton>
      <DataTable columns={['التاريخ', 'المركبة', 'الوجهة', 'الفاتورة', 'كم', 'الحمولة', 'التكلفة', 'توزيع التكلفة']} rows={ctx.state.trips.map((trip) => {
        const allocation = ctx.state.tripCostAllocations.filter((item) => item.tripId === trip.id).at(-1)
        const allocationLabel = allocation
          ? `${statusLabel(allocation.status)}: ${allocation.allocations.map((line) => `${line.lotNo} ${qtyFmt(line.quantityKg)} كجم / ${moneyFmt(line.amount)}`).join('، ')}`
          : 'غير موزعة'
        const controls = allocation?.status === 'PENDING_APPROVAL'
          ? can(ctx.permissions, 'accounting.manage') ? <TripCostAllocationReview ctx={ctx} allocationId={allocation.id} /> : <Badge tone="warn">بانتظار اعتماد المحاسبة</Badge>
          : allocation?.status === 'APPROVED'
            ? <Badge tone="good">معتمد</Badge>
            : allocation?.status === 'REJECTED'
              ? <Badge tone="bad">مرفوض</Badge>
              : trip.invoiceId && can(ctx.permissions, 'fleet.manage')
                ? <GhostButton type="button" disabled={ctx.pending} onClick={() => ctx.act('requestTripCostAllocation', { tripId: trip.id })}>توزيع حسب الفاتورة</GhostButton>
                : '—'
        return [
          trip.date.slice(0, 10),
          ctx.state.vehicles.find((vehicle) => vehicle.id === trip.vehicleId)?.nameAr ?? '—',
          trip.destination,
          ctx.state.invoices.find((invoice) => invoice.id === trip.invoiceId)?.number ?? '—',
          String(trip.km),
          String(trip.loadKg),
          moneyFmt(trip.cost),
          <div key={trip.id} className="grid gap-1"><span>{allocationLabel}</span>{controls}</div>,
        ]
      })} />
    </Card>
  )

  return (
    <div className="flex flex-col gap-4">
      <Card title="المركبات" hint="ملف المركبة والعدادات ومواعيد الوثائق. تربط الوثائق من شاشة وثائق الشركة.">
        {can(ctx.permissions, 'fleet.manage') ? <FormDialog title="مركبة جديدة" openLabel="إضافة مركبة">
          {(close) => <form className="grid gap-3" onSubmit={async (event) => { event.preventDefault(); const result = await ctx.act('createVehicle', { code, plateNo, type, nameAr, kmPerLiter: selectedVehicle?.kmPerLiter }); if (result.ok) { setCode(''); setPlateNo(''); setNameAr(''); close() } }}><Field label="الرمز"><TextInput value={code} onChange={(event) => setCode(event.target.value)} required /></Field><Field label="رقم اللوحة"><TextInput value={plateNo} onChange={(event) => setPlateNo(event.target.value)} required /></Field><Field label="النوع"><TextInput value={type} onChange={(event) => setType(event.target.value)} required /></Field><Field label="الاسم"><TextInput value={nameAr} onChange={(event) => setNameAr(event.target.value)} required /></Field><PrimaryButton disabled={ctx.pending}>حفظ</PrimaryButton></form>}
        </FormDialog> : null}
        <DataTable columns={['الرمز', 'المركبة', 'اللوحة', 'العداد', 'الكفاءة', 'الحال��']} rows={ctx.state.vehicles.map((vehicle) => [vehicle.code, vehicle.nameAr, vehicle.plateNo, String(vehicle.currentOdometer), vehicle.kmPerLiter ? `${vehicle.kmPerLiter} كم/ل` : '—', vehicle.active ? 'نشطة' : 'متوقفة'])} />
      </Card>
      <Card
        title="خدمات الأسطول"
        extra={can(ctx.permissions, 'fleet.manage') || can(ctx.permissions, 'fleet.service.manage') ? (
          <FormDialog title="تسجيل صيانة مركبة" openLabel="إضافة صيانة">
            {(close) => <form className="grid gap-3 md:grid-cols-2" onSubmit={async (event) => {
              event.preventDefault()
              const result = await ctx.act('addVehicleService', {
                vehicleId, date: serviceDate, kind: serviceKind, description: serviceDescription,
                cost: Number(serviceCost), odometer: Number(serviceOdometer),
                nextDueDate: nextDueDate || undefined, nextDueKm: nextDueKm ? Number(nextDueKm) : undefined,
                supplierId: serviceSupplierId || undefined,
              })
              if (result.ok) {
                setServiceDescription(''); setServiceCost(''); setServiceOdometer('')
                setNextDueDate(''); setNextDueKm(''); setServiceSupplierId(''); close()
              }
            }}>
              <Field label="المركبة"><SelectInput value={vehicleId} onChange={(event) => setVehicleId(event.target.value)}>{ctx.state.vehicles.filter((vehicle) => vehicle.active).map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.nameAr} — {vehicle.plateNo}</option>)}</SelectInput></Field>
              <Field label="نوع الخدمة"><SelectInput value={serviceKind} onChange={(event) => setServiceKind(event.target.value as typeof serviceKind)}><option value="PERIODIC">دورية</option><option value="TIRES">إطارات</option><option value="OIL">زيوت</option><option value="PARTS">قطع</option><option value="REPAIR">إصلاح</option></SelectInput></Field>
              <Field label="التاريخ"><TextInput type="date" value={serviceDate} onChange={(event) => setServiceDate(event.target.value)} required /></Field>
              <Field label="الوصف"><TextInput value={serviceDescription} onChange={(event) => setServiceDescription(event.target.value)} required /></Field>
              <Field label="التكلفة"><TextInput type="number" min="0" step="0.001" value={serviceCost} onChange={(event) => setServiceCost(event.target.value)} required /></Field>
              <Field label="قراءة العداد"><TextInput type="number" min="0" step="1" value={serviceOdometer} onChange={(event) => setServiceOdometer(event.target.value)} required /></Field>
              <Field label="موعد الصيانة التالية"><TextInput type="date" value={nextDueDate} onChange={(event) => setNextDueDate(event.target.value)} /></Field>
              <Field label="العداد عند الصيانة التالية"><TextInput type="number" min="0" step="1" value={nextDueKm} onChange={(event) => setNextDueKm(event.target.value)} /></Field>
              <Field label="المورد"><SelectInput value={serviceSupplierId} onChange={(event) => setServiceSupplierId(event.target.value)}><option value="">بدون</option>{ctx.state.suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.nameAr}</option>)}</SelectInput></Field>
              <div className="flex items-end"><PrimaryButton disabled={ctx.pending || !vehicleId}>حفظ</PrimaryButton></div>
            </form>}
          </FormDialog>
        ) : null}
      >
        <DataTable columns={['التاريخ', 'المركبة', 'الخدمة', 'التكلفة', 'العداد', 'موعد الخدمة التالية']} rows={ctx.state.vehicleServices.map((service) => [service.date.slice(0, 10), ctx.state.vehicles.find((vehicle) => vehicle.id === service.vehicleId)?.nameAr ?? '—', service.description, moneyFmt(service.cost), String(service.odometer), service.nextDueDate ?? (service.nextDueKm ? `${service.nextDueKm} كم` : '—')])} />
      </Card>
    </div>
  )
}

function TripCostAllocationReview({ ctx, allocationId }: { ctx: LiveCtx; allocationId: string }) {
  const [reason, setReason] = useState('')
  return <div className="flex flex-wrap gap-1">
    <GhostButton type="button" disabled={ctx.pending} onClick={() => ctx.act('decideTripCostAllocation', { id: allocationId, decision: 'APPROVED' })}>اعتماد</GhostButton>
    <FormDialog title="رفض توزيع تكلفة الرحلة" openLabel="رفض">
      {(close) => <form className="grid gap-3" onSubmit={async (event) => {
        event.preventDefault()
        const result = await ctx.act('decideTripCostAllocation', { id: allocationId, decision: 'REJECTED', reason })
        if (result.ok) { setReason(''); close() }
      }}>
        <Field label="سبب الرفض"><TextInput value={reason} onChange={(event) => setReason(event.target.value)} required minLength={2} /></Field>
        <PrimaryButton disabled={ctx.pending || reason.trim().length < 2}>تأكيد الرفض</PrimaryButton>
      </form>}
    </FormDialog>
  </div>
}

function Documents({ ctx }: { ctx: LiveCtx }) {
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<CompanyDocument['kind']>('LICENSE')
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [expiryDate, setExpiryDate] = useState('')
  const [cost, setCost] = useState('')
  const [notes, setNotes] = useState('')
  const [renewalOwnerId, setRenewalOwnerId] = useState('')
  const [entityType, setEntityType] = useState<NonNullable<CompanyDocument['entityType']>>('COMPANY')
  const [entityId, setEntityId] = useState('')
  const today = new Date().toISOString().slice(0, 10)
  const sorted = [...ctx.state.companyDocuments].sort((a, b) => (a.expiryDate ?? '9999').localeCompare(b.expiryDate ?? '9999'))
  const linkedEntities = entityType === 'VEHICLE'
    ? ctx.state.vehicles.map((item) => ({ id: item.id, name: `${item.nameAr} — ${item.plateNo}` }))
    : entityType === 'EMPLOYEE'
      ? ctx.state.employees.map((item) => ({ id: item.id, name: item.nameAr }))
      : entityType === 'SUPPLIER'
        ? ctx.state.suppliers.map((item) => ({ id: item.id, name: item.nameAr }))
        : entityType === 'CUSTOMER'
          ? ctx.state.customers.map((item) => ({ id: item.id, name: item.nameAr }))
          : entityType === 'MACHINE'
            ? ctx.state.machines.map((item) => ({ id: item.id, name: item.nameAr }))
            : []
  const status = (expiry?: string) => {
    if (!expiry) return 'بلا انتهاء'
    if (expiry < today) return 'منتهية'
    const days = Math.ceil((Date.parse(expiry) - Date.parse(today)) / 86400000)
    if (days <= 7) return `عاجلة — ${days} يوم`
    if (days <= 30) return `تنتهي خلال ${days} يوم`
    if (days <= 60) return `تنتهي خلال ${days} يوم`
    if (days <= 90) return `تنتهي خلال ${days} يوم`
    return 'سارية'
  }
  return (
    <div className="space-y-4">
      <Card title="الوثائق والتصاريح" hint="سجل موحد للوثائق حسب الجهة وتاريخ الانتهاء؛ تنبيهات التجديد تصدر قبل 90 و60 و30 و7 أيام." extra={<ExportLinks href="/api/erp/export?kind=documents" />}>
        {can(ctx.permissions, 'documents.manage') ? (
          <FormDialog title="وثيقة جديدة" openLabel="إضافة وثيقة">
            {(close) => <form className="grid gap-3 md:grid-cols-2" onSubmit={async (event) => {
              event.preventDefault()
              const result = await ctx.act('createCompanyDocument', {
                title,
                kind,
                entityType,
                entityId: entityType === 'COMPANY' ? undefined : entityId,
                issueDate,
                expiryDate: expiryDate || undefined,
                cost: cost ? Number(cost) : undefined,
                renewalOwnerId: renewalOwnerId || undefined,
                notes,
              })
              if (result.ok) {
                setTitle('')
                setExpiryDate('')
                setCost('')
                setNotes('')
                setEntityId('')
                close()
              }
            }}>
              <Field label="العنوان"><TextInput value={title} onChange={(event) => setTitle(event.target.value)} required /></Field>
              <Field label="النوع"><SelectInput value={kind} onChange={(event) => setKind(event.target.value as CompanyDocument['kind'])}><option value="LICENSE">ترخيص</option><option value="OWNERSHIP">ملكية</option><option value="INSURANCE">تأمين</option><option value="CONTRACT">عقد</option><option value="LEASE">إيجار</option><option value="GOV_PERMIT">تصريح حكومي</option><option value="CERTIFICATE">شهادة</option><option value="INSPECTION">فحص دوري</option><option value="OTHER">أخرى</option></SelectInput></Field>
              <Field label="الجهة"><SelectInput value={entityType} onChange={(event) => { setEntityType(event.target.value as NonNullable<CompanyDocument['entityType']>); setEntityId('') }}><option value="COMPANY">الشركة</option><option value="VEHICLE">مركبة</option><option value="EMPLOYEE">موظف</option><option value="SUPPLIER">مورد</option><option value="CUSTOMER">عميل</option><option value="MACHINE">ماكينة</option></SelectInput></Field>
              {entityType !== 'COMPANY' ? <Field label="العنصر"><SelectInput value={entityId} onChange={(event) => setEntityId(event.target.value)} required><option value="">اختر</option>{linkedEntities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectInput></Field> : null}
              <Field label="تاريخ الإصدار"><TextInput type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} required /></Field>
              <Field label="تاريخ الانتهاء"><TextInput type="date" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} /></Field>
              <Field label="التكلفة"><TextInput type="number" min="0" step="0.001" value={cost} onChange={(event) => setCost(event.target.value)} /></Field>
              <Field label="مسؤول التجديد"><SelectInput value={renewalOwnerId} onChange={(event) => setRenewalOwnerId(event.target.value)}><option value="">غير محدد</option>{ctx.state.users.map((user) => <option key={user.id} value={user.id}>{user.fullName}</option>)}{ctx.state.employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.nameAr}</option>)}</SelectInput></Field>
              <Field label="ملاحظات"><TextInput value={notes} onChange={(event) => setNotes(event.target.value)} /></Field>
              <div className="flex items-end"><PrimaryButton disabled={ctx.pending}>حفظ</PrimaryButton></div>
            </form>}
          </FormDialog>
        ) : null}
        <DataTable columns={['الوثيقة', 'الجهة', 'النوع', 'الإصدار', 'الانتهاء', 'الحالة', 'المرفقات', 'التجديد']} rows={sorted.map((document) => [
          document.title,
          documentEntityName(ctx, document),
          document.kind,
          document.issueDate,
          document.expiryDate ?? '—',
          status(document.expiryDate),
          <div key={`${document.id}-files`} className="flex flex-col gap-1">
            {(document.attachments ?? []).map((attachment) => <a key={attachment.id} className="text-[#1d7f72] underline" href={`/api/erp/documents/attachments/${attachment.id}`} target="_blank" rel="noreferrer">{attachment.fileName} — إصدار {attachment.issueDate}</a>)}
            {document.attachmentId ? <span className="text-xs text-[#7c8c86]">مرفق قديم</span> : null}
          </div>,
          <div key={`${document.id}-actions`} className="flex flex-wrap gap-1">
            {can(ctx.permissions, 'documents.manage') ? <DocumentActions key={document.id} ctx={ctx} document={document} /> : null}
            {(document.renewalHistory ?? []).length ? <span className="text-xs text-[#52635d]">سجل تجديد: {document.renewalHistory!.length}</span> : null}
          </div>,
        ])} />
        {sorted.some((document) => document.renewalHistory?.length) ? (
          <details className="mt-4 rounded-xl border border-[#e1e8e4] p-3">
            <summary className="cursor-pointer font-bold">سجل التجديدات السابقة</summary>
            <DataTable columns={['الوثيقة', 'تاريخ الإصدار السابق', 'تاريخ الانتهاء السابق', 'التكلفة', 'تاريخ التجديد', 'مرفقات الإصدار']} rows={sorted.flatMap((document) => (document.renewalHistory ?? []).map((renewal) => [
              document.title,
              renewal.issueDate,
              renewal.expiryDate ?? '—',
              renewal.cost === undefined ? '—' : moneyFmt(renewal.cost),
              renewal.renewedAt.slice(0, 10),
              <div key={`${document.id}-${renewal.renewedAt}`} className="flex flex-col gap-1">{(document.attachments ?? []).filter((attachment) => renewal.attachmentIds.includes(attachment.id)).map((attachment) => <a key={attachment.id} className="text-[#1d7f72] underline" href={`/api/erp/documents/attachments/${attachment.id}`} target="_blank" rel="noreferrer">{attachment.fileName}</a>)}</div>,
            ]))} />
          </details>
        ) : null}
      </Card>
    </div>
  )
}

function documentEntityName(ctx: LiveCtx, document: CompanyDocument) {
  if (!document.entityType || document.entityType === 'COMPANY') return ctx.state.company.nameAr
  if (document.entityType === 'VEHICLE') return ctx.state.vehicles.find((item) => item.id === document.entityId)?.plateNo ?? 'مركبة محذوفة'
  if (document.entityType === 'EMPLOYEE') return ctx.state.employees.find((item) => item.id === document.entityId)?.nameAr ?? 'موظف محذوف'
  if (document.entityType === 'SUPPLIER') return ctx.state.suppliers.find((item) => item.id === document.entityId)?.nameAr ?? 'مورد محذوف'
  if (document.entityType === 'CUSTOMER') return ctx.state.customers.find((item) => item.id === document.entityId)?.nameAr ?? 'عميل محذوف'
  return ctx.state.machines.find((item) => item.id === document.entityId)?.nameAr ?? 'ماكينة محذوفة'
}

function DocumentActions({ ctx, document }: { ctx: LiveCtx; document: CompanyDocument }) {
  const [issueDate, setIssueDate] = useState(document.issueDate)
  const [expiryDate, setExpiryDate] = useState(document.expiryDate ?? '')
  const [cost, setCost] = useState(document.cost === undefined ? '' : String(document.cost))
  const [notes, setNotes] = useState(document.notes ?? '')
  const [uploadError, setUploadError] = useState('')
  const [uploading, setUploading] = useState(false)

  return <>
    <FormDialog title={`تجديد ${document.title}`} openLabel="تجديد">
      {(close) => <form className="grid gap-3 md:grid-cols-2" onSubmit={async (event) => {
        event.preventDefault()
        const result = await ctx.act('renewCompanyDocument', {
          id: document.id,
          issueDate,
          expiryDate: expiryDate || undefined,
          cost: cost ? Number(cost) : undefined,
          notes,
        })
        if (result.ok) {
          await ctx.refreshUser()
          close()
        }
      }}>
        <Field label="تاريخ الإصدار الجديد"><TextInput type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} required /></Field>
        <Field label="تاريخ الانتهاء الجديد"><TextInput type="date" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} /></Field>
        <Field label="تكلفة التجديد"><TextInput type="number" min="0" step="0.001" value={cost} onChange={(event) => setCost(event.target.value)} /></Field>
        <Field label="ملاحظات"><TextInput value={notes} onChange={(event) => setNotes(event.target.value)} /></Field>
        <div className="flex items-end"><PrimaryButton disabled={ctx.pending}>حفظ التجديد</PrimaryButton></div>
      </form>}
    </FormDialog>
    <FormDialog title={`إرفاق ملف — ${document.title}`} openLabel="رفع ملف">
      {(close) => <form className="grid gap-3" onSubmit={async (event) => {
        event.preventDefault()
        const form = event.currentTarget
        const file = new FormData(form).get('file')
        if (!(file instanceof File)) return
        setUploading(true)
        setUploadError('')
        try {
          const response = await fetch(`/api/erp/documents/${document.id}/attachments`, { method: 'POST', body: new FormData(form) })
          const payload = await response.json() as { success?: boolean; message?: string }
          if (!response.ok || !payload.success) {
            setUploadError(payload.message || 'تعذر رفع الملف')
            return
          }
          await ctx.refreshUser()
          form.reset()
          close()
        } catch {
          setUploadError('تعذر الاتصال بالخادم لرفع الملف')
        } finally {
          setUploading(false)
        }
      }}>
        <Field label="PDF أو صورة PNG/JPEG — حتى 10 ميغابايت"><TextInput name="file" type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" required /></Field>
        {uploadError ? <p role="alert" className="text-sm text-red-700">{uploadError}</p> : null}
        <PrimaryButton disabled={uploading}>{uploading ? 'جارٍ الرفع…' : 'رفع المرفق'}</PrimaryButton>
      </form>}
    </FormDialog>
  </>
}

function Journals({ ctx }: { ctx: LiveCtx }) {
  return (
    <Card title="القيود اليومية" extra={<ExportLinks href="/api/erp/export?kind=journals" />}>
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
      <Card title="إقرار ضريبة القيمة المضافة" hint="مخرجات الفواتير المؤكدة مقابل مدخلات الاستلام والمصروفات المرحّلة. راجع المعاملة الضريبية للأعلاف مع المستشار الضريبي؛ النسبة الافتراضية 5%." extra={can(ctx.permissions, 'accounting.read') || can(ctx.permissions, 'accounting.manage') ? <ExportLinks href={`/api/erp/export?kind=vat&month=${month}`} /> : null}>
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

function Utilities({ ctx }: { ctx: LiveCtx }) {
  const [utility, setUtility] = useState<'ELECTRICITY' | 'WATER' | 'GAS'>('ELECTRICITY')
  const [readingDate, setReadingDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [previousReading, setPreviousReading] = useState('')
  const [currentReading, setCurrentReading] = useState('')
  const [cost, setCost] = useState('')
  const [productionTon, setProductionTon] = useState('')
  const [notes, setNotes] = useState('')
  return (
    <div className="space-y-4">
      <Card
        title="استهلاك المرافق"
        extra={
          can(ctx.permissions, 'utilities.manage') ? (
            <FormDialog title="قراءة مرافق جديدة" openLabel="إضافة قراءة">
              {(close) => (
                <form className="grid gap-3 md:grid-cols-2" onSubmit={async (event) => {
                  event.preventDefault()
                  const result = await ctx.act('recordUtilitiesReading', {
                    utility,
                    readingDate,
                    previousReading: Number(previousReading),
                    currentReading: Number(currentReading),
                    cost: Number(cost),
                    productionTon: Number(productionTon),
                    notes,
                  })
                  if (result.ok) {
                    setPreviousReading('')
                    setCurrentReading('')
                    setCost('')
                    setProductionTon('')
                    setNotes('')
                    close()
                  }
                }}>
                  <Field label="المرافق">
                    <SelectInput value={utility} onChange={(e) => setUtility(e.target.value as 'ELECTRICITY' | 'WATER' | 'GAS')}>
                      <option value="ELECTRICITY">كهرباء</option>
                      <option value="WATER">ماء</option>
                      <option value="GAS">غاز</option>
                    </SelectInput>
                  </Field>
                  <Field label="تاريخ القراءة"><TextInput type="date" value={readingDate} onChange={(e) => setReadingDate(e.target.value)} required /></Field>
                  <Field label="القراءة السابقة"><TextInput type="number" min="0" step="0.001" value={previousReading} onChange={(e) => setPreviousReading(e.target.value)} required /></Field>
                  <Field label="القراءة الحالية"><TextInput type="number" min="0" step="0.001" value={currentReading} onChange={(e) => setCurrentReading(e.target.value)} required /></Field>
                  <Field label="التكلفة"><TextInput type="number" min="0" step="0.001" value={cost} onChange={(e) => setCost(e.target.value)} required /></Field>
                  <Field label="الإنتاج (طن)"><TextInput type="number" min="0" step="0.001" value={productionTon} onChange={(e) => setProductionTon(e.target.value)} required /></Field>
                  <Field label="ملاحظات"><TextInput value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
                  <div className="flex items-end"><PrimaryButton disabled={ctx.pending}>حفظ</PrimaryButton></div>
                </form>
              )}
            </FormDialog>
          ) : null
        }
      >
        <DataTable
          columns={['المرافق', 'تاريخ القراءة', 'الاستهلاك', 'التكلفة', 'التكلفة/طن']}
          rows={(ctx.state.utilitiesReadings ?? []).map((item) => [
            statusLabel(item.utility),
            item.readingDate.slice(0, 10),
            qtyFmt(item.consumption),
            moneyFmt(item.cost),
            moneyFmt(item.costPerTon),
          ])}
        />
        <h4 className="mb-2 mt-5 font-semibold">مقارنة ال��ستهلاك الشهري لكل طن</h4>
        <DataTable columns={['الشهر', 'المرافق', 'الاستهلاك', 'طن الإنتاج', 'التكلفة/طن', 'مقارنة']} rows={utilitiesPerTon(ctx.state).map((item) => {
          const previous = utilitiesPerTon(ctx.state).filter((row) => row.utility === item.utility && row.month < item.month).sort((a, b) => b.month.localeCompare(a.month))[0]
          const previousReading = previous && ctx.state.utilitiesReadings.find((row) => row.id === previous.readingId)
          const currentReading = ctx.state.utilitiesReadings.find((row) => row.id === item.readingId)
          const rise = previousReading && currentReading ? (currentReading.consumption - previousReading.consumption) / Math.max(previousReading.consumption, 0.001) : 0
          return [item.month, statusLabel(item.utility), qtyFmt(item.consumption), qtyFmt(item.productionTon), moneyFmt(item.costPerTon), rise > 0.2 ? <Badge key={item.readingId} tone="bad">ارتفاع {pctFmt(rise * 100)}</Badge> : previous ? 'ضمن النطاق' : 'لا توجد مقارنة']
        })} />
      </Card>
    </div>
  )
}

function BankTransactions({ ctx }: { ctx: LiveCtx }) {
  const [bankAccount, setBankAccount] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'CREDIT' | 'DEBIT'>('CREDIT')
  const [description, setDescription] = useState('')
  const [reference, setReference] = useState('')
  return (
    <div className="space-y-4">
      <Card
        title="معاملات البنك"
        hint="يمكن استيراد المعاملة بعد تنزيل كشف البنك؛ تُطابق التحويلات المعروفة تلقائياً وتبقى غير المعروفة في طابور المراجعة."
        extra={can(ctx.permissions, 'bank.manage') ? (
          <FormDialog title="تسجيل معاملة بنكية" openLabel="إضافة معاملة">
            {(close) => <form className="grid gap-3 md:grid-cols-2" onSubmit={async (event) => {
              event.preventDefault()
              const result = await ctx.act('recordBankTransaction', { bankAccount, transactionId, date, amount: Number(amount), type, description, reference: reference || undefined })
              if (result.ok) { setTransactionId(''); setAmount(''); setDescription(''); setReference(''); close() }
            }}>
              <Field label="الحساب البنكي"><TextInput value={bankAccount} onChange={(event) => setBankAccount(event.target.value)} required /></Field>
              <Field label="رقم المعاملة"><TextInput value={transactionId} onChange={(event) => setTransactionId(event.target.value)} required /></Field>
              <Field label="التاريخ"><TextInput type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></Field>
              <Field label="المبلغ"><TextInput type="number" min="0.001" step="0.001" value={amount} onChange={(event) => setAmount(event.target.value)} required /></Field>
              <Field label="النوع"><SelectInput value={type} onChange={(event) => setType(event.target.value as typeof type)}><option value="CREDIT">وارد</option><option value="DEBIT">صادر</option></SelectInput></Field>
              <Field label="الوصف"><TextInput value={description} onChange={(event) => setDescription(event.target.value)} required /></Field>
              <Field label="المرجع"><TextInput value={reference} onChange={(event) => setReference(event.target.value)} /></Field>
              <div className="flex items-end"><PrimaryButton disabled={ctx.pending}>تسجيل</PrimaryButton></div>
            </form>}
          </FormDialog>
        ) : null}
      >
        <h4 className="mb-2 font-semibold">المعاملات غير المطابقة — مراجعة المحاسب</h4>
        <DataTable
          columns={['التاريخ', 'المعرف', 'المبلغ', 'النوع', 'الوصف', 'الحالة', 'مطابقة يدوية']}
          rows={unmatchedBankTransactions(ctx.state).map((item) => [
            item.date.slice(0, 10), item.transactionId, moneyFmt(item.amount), statusLabel(item.type), item.description,
            statusLabel(item.status),
            can(ctx.permissions, 'bank.manage') ? <BankMatchAction key={item.id} ctx={ctx} transactionId={item.transactionId} /> : '—',
          ])}
        />
      </Card>
      <Card title="سجل التدقيق البنكي">
        <DataTable
          columns={['التاريخ', 'المعرف', 'الحساب', 'المبلغ', 'الحالة', 'تمت المطابقة بواسطة', 'وقت المطابقة']}
          rows={(ctx.state.bankTransactions ?? []).map((item) => [
            item.date.slice(0, 10),
            item.transactionId,
            item.bankAccount,
            moneyFmt(item.amount),
            statusLabel(item.status),
            item.matchedBy ?? '—',
            item.matchedAt?.slice(0, 16).replace('T', ' ') ?? '—',
          ])}
        />
      </Card>
    </div>
  )
}

function Obligations({ ctx }: { ctx: LiveCtx }) {
  const [beneficiary, setBeneficiary] = useState('')
  const [description, setDescription] = useState('')
  const [kind, setKind] = useState<'LOAN' | 'INSTALLMENT' | 'RENT' | 'OTHER'>('LOAN')
  const [total, setTotal] = useState('')
  const [installmentAmount, setInstallmentAmount] = useState('')
  const [firstDueDate, setFirstDueDate] = useState('')
  const [frequency, setFrequency] = useState<'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'ONE_TIME'>('MONTHLY')
  const [numberOfInstallments, setNumberOfInstallments] = useState('')
  return (
    <div className="space-y-4">
      <Card
        title="الالتزامات المالية"
        extra={
          can(ctx.permissions, 'obligations.manage') ? (
            <FormDialog title="التزام مالي جديد" openLabel="إضافة التزام">
              {(close) => (
                <form className="grid gap-3 md:grid-cols-2" onSubmit={async (event) => {
                  event.preventDefault()
                  const result = await ctx.act('createObligation', {
                    beneficiary,
                    description,
                    kind,
                    total: Number(total),
                    installmentAmount: Number(installmentAmount),
                    firstDueDate,
                    frequency,
                    numberOfInstallments: numberOfInstallments ? Number(numberOfInstallments) : undefined,
                  })
                  if (result.ok) {
                    setBeneficiary('')
                    setDescription('')
                    setTotal('')
                    setInstallmentAmount('')
                    setFirstDueDate('')
                    setNumberOfInstallments('')
                    close()
                  }
                }}>
                  <Field label="المستفيد"><TextInput value={beneficiary} onChange={(e) => setBeneficiary(e.target.value)} required /></Field>
                  <Field label="الوصف"><TextInput value={description} onChange={(e) => setDescription(e.target.value)} required /></Field>
                  <Field label="النوع">
                    <SelectInput value={kind} onChange={(e) => setKind(e.target.value as 'LOAN' | 'INSTALLMENT' | 'RENT' | 'OTHER')}>
                      <option value="LOAN">قرض</option>
                      <option value="INSTALLMENT">قسط</option>
                      <option value="RENT">إيجار</option>
                      <option value="OTHER">أخرى</option>
                    </SelectInput>
                  </Field>
                  <Field label="المبلغ الإجمالي"><TextInput type="number" min="0" step="0.001" value={total} onChange={(e) => setTotal(e.target.value)} required /></Field>
                  <Field label="قيمة القسط"><TextInput type="number" min="0" step="0.001" value={installmentAmount} onChange={(e) => setInstallmentAmount(e.target.value)} required /></Field>
                  <Field label="تاريخ أول استحقاق"><TextInput type="date" value={firstDueDate} onChange={(e) => setFirstDueDate(e.target.value)} required /></Field>
                  <Field label="التكرار">
                    <SelectInput value={frequency} onChange={(e) => setFrequency(e.target.value as 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'ONE_TIME')}>
                      <option value="MONTHLY">شهري</option>
                      <option value="QUARTERLY">ربع سنوي</option>
                      <option value="YEARLY">سنوي</option>
                      <option value="ONE_TIME">مرة واحدة</option>
                    </SelectInput>
                  </Field>
                  <Field label="عدد الأقساط"><TextInput type="number" min="1" step="1" value={numberOfInstallments} onChange={(e) => setNumberOfInstallments(e.target.value)} /></Field>
                  <div className="flex items-end"><PrimaryButton disabled={ctx.pending}>حفظ</PrimaryButton></div>
                </form>
              )}
            </FormDialog>
          ) : null
        }
      >
        <DataTable
          columns={['المستفيد', 'الوصف', 'النوع', 'المبلغ الإجمالي', 'الحالة', 'الإجراء']}
          rows={(ctx.state.obligations ?? []).map((item) => [
            item.beneficiary,
            item.description,
            statusLabel(item.kind),
            moneyFmt(item.total),
            statusLabel(item.status),
            item.status === 'PENDING_APPROVAL' && can(ctx.permissions, 'approvals.decide') ? (
              <span key={item.id} className="flex gap-2">
                <GhostButton type="button" disabled={ctx.pending} onClick={() => ctx.act('decideObligation', { id: item.id, decision: 'APPROVED' })}>اعتماد</GhostButton>
                <GhostButton type="button" disabled={ctx.pending} onClick={() => ctx.act('decideObligation', { id: item.id, decision: 'REJECTED' })}>إلغاء</GhostButton>
              </span>
            ) : '—',
          ])}
        />
      </Card>
      {(ctx.state.obligations ?? []).map((obligation) => {
        const lines = (ctx.state.obligationScheduleLines ?? []).filter((line) => line.obligationId === obligation.id).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        if (lines.length === 0) return null
        return <Card key={obligation.id} title={`جدول الأقساط — ${obligation.beneficiary}`} hint={obligation.description}>
          <DataTable columns={['الاستحقاق', 'قيمة القسط', 'المدفوع', 'المتبقي', 'الحالة', 'الدفع']} rows={lines.map((line) => [
            line.dueDate, moneyFmt(line.amount), moneyFmt(line.paidAmount), moneyFmt(Math.max(0, line.amount - line.paidAmount)), statusLabel(line.status),
            obligation.status === 'ACTIVE' && can(ctx.permissions, 'obligations.pay') && line.status !== 'PAID'
              ? <ObligationInstallmentPayment key={line.id} ctx={ctx} scheduleLineId={line.id} remaining={Math.max(0, line.amount - line.paidAmount)} />
              : '—',
          ])} />
        </Card>
      })}
      <Card title="توقع الالتزامات — 12 شهراً">
        <DataTable columns={['الشهر', 'عدد الأقساط', 'المبلغ المتوقع']} rows={obligationForecast(ctx.state, new Date().toISOString().slice(0, 7), 12).map((item) => [item.month, String(item.installments), moneyFmt(item.amount)])} />
      </Card>
    </div>
  )
}

function ObligationInstallmentPayment({ ctx, scheduleLineId, remaining }: { ctx: LiveCtx; scheduleLineId: string; remaining: number }) {
  const [amount, setAmount] = useState(String(remaining))
  const [method, setMethod] = useState('تحويل بنكي')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [reference, setReference] = useState('')
  return <FormDialog title="دفع قسط" openLabel="دفع">
    {(close) => <form className="grid gap-3" onSubmit={async (event) => {
      event.preventDefault()
      const result = await ctx.act('payObligationInstallment', { scheduleLineId, amount: Number(amount), method, date, reference: reference || undefined })
      if (result.ok) close()
    }}>
      <p className="text-sm">المتبقي: {moneyFmt(remaining)}</p>
      <Field label="مبلغ الدفعة"><TextInput type="number" min="0.001" max={remaining} step="0.001" value={amount} onChange={(event) => setAmount(event.target.value)} required /></Field>
      <Field label="تاريخ الدفع"><TextInput type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></Field>
      <Field label="طريقة الدفع"><TextInput value={method} onChange={(event) => setMethod(event.target.value)} required /></Field>
      <Field label="المرجع"><TextInput value={reference} onChange={(event) => setReference(event.target.value)} /></Field>
      <PrimaryButton disabled={ctx.pending}>تسجيل الدفعة</PrimaryButton>
    </form>}
  </FormDialog>
}

function BankMatchAction({ ctx, transactionId }: { ctx: LiveCtx; transactionId: string }) {
  const [type, setType] = useState<'INVOICE' | 'SUPPLIER' | 'EXPENSE'>('INVOICE')
  const [targetId, setTargetId] = useState('')
  const targets = type === 'INVOICE'
    ? ctx.state.invoices.map((item) => ({ id: item.id, name: `${item.number} — ${partyName(ctx.state.customers, item.customerId)}` }))
    : type === 'SUPPLIER'
      ? ctx.state.suppliers.map((item) => ({ id: item.id, name: item.nameAr }))
      : ctx.state.expenses.map((item) => ({ id: item.id, name: item.description }))
  return <FormDialog title={`مطابقة ${transactionId}`} openLabel="مطابقة">
    {(close) => <form className="grid gap-3" onSubmit={async (event) => {
      event.preventDefault()
      const result = await ctx.act('matchBankTransaction', { transactionId, matchTo: { type, id: targetId } })
      if (result.ok) close()
    }}>
      <Field label="نوع السجل"><SelectInput value={type} onChange={(event) => { setType(event.target.value as typeof type); setTargetId('') }}><option value="INVOICE">فاتورة عميل</option><option value="SUPPLIER">مورد</option><option value="EXPENSE">مصروف</option></SelectInput></Field>
      <Field label="السجل"><SelectInput value={targetId} onChange={(event) => setTargetId(event.target.value)}><option value="">اختر</option>{targets.map((target) => <option key={target.id} value={target.id}>{target.name}</option>)}</SelectInput></Field>
      <PrimaryButton disabled={ctx.pending || !targetId}>مطابقة</PrimaryButton>
    </form>}
  </FormDialog>
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
        <DataTable columns={['الكود', 'الاسم', 'القسم', 'المسمى', 'الراتب', 'إجراء']} rows={ctx.state.employees.map((employee) => [employee.code, employee.nameAr, employee.department, employee.jobTitle, typeof employee.basicSalary === 'number' ? moneyFmt(employee.basicSalary) : '—', can(ctx.permissions, 'employees.manage') ? <FormDialog key={`${employee.id}-edit`} title="تحديث الموظف" openLabel="تعديل">{(close) => <EmployeeEditor ctx={ctx} employee={employee} onSaved={close} />}</FormDialog> : '—'])} />
      </Card>
    </div>
  )
}

function EmployeeEditor({ ctx, employee, onSaved }: { ctx: LiveCtx; employee: (typeof ctx.state.employees)[number]; onSaved?: () => void }) {
  const [form, setForm] = useState({
    nameAr: employee.nameAr,
    department: employee.department,
    jobTitle: employee.jobTitle,
    basicSalary: String(employee.basicSalary ?? 0),
    active: employee.active,
    idExpiryDate: employee.idExpiryDate ?? '',
    residenceExpiryDate: employee.residenceExpiryDate ?? '',
    contractExpiryDate: employee.contractExpiryDate ?? '',
  })
  return <form className="grid gap-3" onSubmit={async (event) => {
    event.preventDefault()
    const result = await ctx.act('updateEmployee', {
      id: employee.id,
      nameAr: form.nameAr,
      department: form.department,
      jobTitle: form.jobTitle,
      basicSalary: Number(form.basicSalary),
      active: form.active,
      idExpiryDate: form.idExpiryDate || undefined,
      residenceExpiryDate: form.residenceExpiryDate || undefined,
      contractExpiryDate: form.contractExpiryDate || undefined,
    })
    if (result.ok) onSaved?.()
  }}>
    <Field label="الاسم"><TextInput value={form.nameAr} onChange={(event) => setForm({ ...form, nameAr: event.target.value })} required /></Field>
    <Field label="القسم"><TextInput value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} /></Field>
    <Field label="المسمى"><TextInput value={form.jobTitle} onChange={(event) => setForm({ ...form, jobTitle: event.target.value })} /></Field>
    <Field label="الراتب الأساسي"><TextInput type="number" min="0" step="0.001" value={form.basicSalary} onChange={(event) => setForm({ ...form, basicSalary: event.target.value })} required /></Field>
    <Field label="انتهاء البطاقة"><TextInput type="date" value={form.idExpiryDate} onChange={(event) => setForm({ ...form, idExpiryDate: event.target.value })} /></Field>
    <Field label="انتهاء الإقامة"><TextInput type="date" value={form.residenceExpiryDate} onChange={(event) => setForm({ ...form, residenceExpiryDate: event.target.value })} /></Field>
    <Field label="انتهاء العقد"><TextInput type="date" value={form.contractExpiryDate} onChange={(event) => setForm({ ...form, contractExpiryDate: event.target.value })} /></Field>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> موظف نشط</label>
    <PrimaryButton disabled={ctx.pending || !can(ctx.permissions, 'employees.manage')}>حفظ التحديث</PrimaryButton>
  </form>
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
            <ExportLinks href="/api/erp/export?kind=payroll" />
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
  const [lotNo, setLotNo] = useState(ctx.state.lots[0]?.lotNo ?? '')
  const [customerId, setCustomerId] = useState(ctx.state.customers[0]?.id ?? '')
  const trace = useMemo(() => (lotNo ? traceLot(ctx.state, lotNo) : null), [ctx.state, lotNo])
  const customerTrace = useMemo(() => (customerId ? traceCustomer(ctx.state, customerId) : null), [ctx.state, customerId])
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Metric label="قيمة المخزون" value={moneyFmt(value)} />
        <Metric label="الإيرادات" value={moneyFmt(pnl.revenue)} />
        <Metric label="الربح" value={moneyFmt(pnl.profit)} />
      </div>
      <div className="flex justify-end">
        <ExportLinks href="/api/erp/export?kind=pnl" />
      </div>
      <Card title="ميزان ا��مراجعة" hint={tb.balanced ? 'المدين يساوي الدائن.' : 'الميزان غير متوازن — راجع القيود.'} extra={<button type="button" className="text-sm font-bold text-[#1d7f72]" onClick={() => window.print()}>طباعة</button>}>
        <DataTable columns={['الحساب', 'مدين', 'دائن']} rows={tb.rows.filter((row) => row.debit || row.credit).map((row) => [row.nameAr, moneyFmt(row.debit), moneyFmt(row.credit)])} />
      </Card>
      <Card title="تتبع الدفعة" hint="من الدفعة إلى خامات الموردين ثم إلى العملاء.">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="الدفعة">
            <SelectInput value={lotNo} onChange={(e) => setLotNo(e.target.value)}>
              {(ctx.state.lots ?? []).map((lot) => <option key={lot.id} value={lot.lotNo}>{lot.lotNo}</option>)}
            </SelectInput>
          </Field>
          <Field label="العميل">
            <SelectInput value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              {ctx.state.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.nameAr}</option>)}
            </SelectInput>
          </Field>
        </div>
        {trace?.lot ? (
          <div className="mt-4 space-y-2 text-sm leading-7 text-[#30453d]">
            <div>المنتج: {trace.product?.nameAr ?? '—'} — المشغّل: {trace.operator?.nameAr ?? '—'}</div>
            <div>الكمية المنتجة: {trace.lot.actualOutputKg} كجم — الفارق: {trace.lot.varianceKg} كجم ({trace.lot.variancePct}%)</div>
            <div>الموردون: {trace.suppliers.map((item) => item.nameAr).join('، ') || '—'}</div>
            <div>الخام: {trace.rawBatches.map((item) => `${item.materialName} ${item.sourceBatchNo}`).join('، ') || '—'}</div>
            <div>العملاء: {trace.customers.map((item) => item.nameAr).join('، ') || '—'}</div>
          </div>
        ) : <p className="mt-3 text-sm text-[#788983]">لا توجد دفعة بهذا الرقم</p>}
        {customerTrace ? (
          <p className="mt-3 text-sm text-[#53655e]">دفعات العميل: {customerTrace.lots.map((lot) => lot.lotNo).join('، ') || 'لا توجد'}</p>
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
  const [form, setForm] = useState({
    ...company,
    bagUnitCost: company.bagUnitCost ?? 0,
    costApprovalThreshold: company.costApprovalThreshold ?? 0,
    packagingMaterialId: company.packagingMaterialId ?? '',
    costRates: {
      ELECTRICITY: company.costRates?.ELECTRICITY ?? 0,
      GAS: company.costRates?.GAS ?? 0,
      LABOR: company.costRates?.LABOR ?? 0,
      TRANSPORT: company.costRates?.TRANSPORT ?? 0,
      MAINTENANCE: company.costRates?.MAINTENANCE ?? 0,
      OVERHEAD: company.costRates?.OVERHEAD ?? 0,
    },
  })
  return (
    <Card title="إعدادات الشركة" hint="هذه البيانات تُطبع على الفاتورة الضريبية وأمر الشراء.">
      <form className="grid gap-3 md:grid-cols-2" onSubmit={async (event) => {
        event.preventDefault()
        await ctx.act('updateCompany', { ...form, packagingMaterialId: form.packagingMaterialId || undefined })
      }}>
        <Field label="اسم المصنع"><TextInput value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} /></Field>
        <Field label="الاسم الإنجليزي"><TextInput value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} /></Field>
        <Field label="العنوان"><TextInput value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
        <Field label="المدينة"><TextInput value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
        <Field label="الهاتف"><TextInput value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
        <Field label="السجل التجاري"><TextInput value={form.crNumber} onChange={(e) => setForm({ ...form, crNumber: e.target.value })} /></Field>
        <Field label="حد انحراف الإنتاج %"><TextInput type="number" min="0" step="0.01" value={form.varianceThresholdPct} onChange={(e) => setForm({ ...form, varianceThresholdPct: Number(e.target.value) })} /></Field>
        <Field label="حد اعتماد التكلفة اليدوية (ر.ع.)"><TextInput type="number" min="0" step="0.001" value={form.costApprovalThreshold} onChange={(e) => setForm({ ...form, costApprovalThreshold: Number(e.target.value) })} /></Field>
        <Field label="تكلفة الكيس (ر.ع.)"><TextInput type="number" min="0" step="0.001" value={form.bagUnitCost} onChange={(e) => setForm({ ...form, bagUnitCost: Number(e.target.value) })} /></Field>
        <Field label="مادة التعبئة">
          <SelectInput value={form.packagingMaterialId} onChange={(e) => setForm({ ...form, packagingMaterialId: e.target.value })}>
            <option value="">استخدم تكلفة الكيس</option>
            {ctx.state.materials.map((item) => <option key={item.id} value={item.id}>{item.nameAr}</option>)}
          </SelectInput>
        </Field>
        {([
          ['ELECTRICITY', 'كهرباء / طن'],
          ['GAS', 'غاز / طن'],
          ['LABOR', 'أجور / طن'],
          ['TRANSPORT', 'نقل / طن'],
          ['MAINTENANCE', 'صيانة / طن'],
          ['OVERHEAD', 'مصاريف عامة / طن'],
        ] as const).map(([key, label]) => (
          <Field key={key} label={label}>
            <TextInput type="number" min="0" step="0.001" value={form.costRates[key]} onChange={(e) => setForm({ ...form, costRates: { ...form.costRates, [key]: Number(e.target.value) } })} />
          </Field>
        ))}
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input type="checkbox" checked={Boolean(form.requireQcBeforeUse)} onChange={(e) => setForm({ ...form, requireQcBeforeUse: e.target.checked })} />
          <span>يتطلب فحص الجودة قبل تحويل الخام للتصنيع أو بيع المنتج</span>
        </label>
        <Field label="بريد التنبيهات"><TextInput value={form.notifyEmail} onChange={(e) => setForm({ ...form, notifyEmail: e.target.value })} /></Field>
        <div className="flex flex-wrap gap-2">
          <PrimaryButton disabled={ctx.pending || !can(ctx.permissions, 'settings.update')}>حفظ</PrimaryButton>
          {can(ctx.permissions, 'settings.update') ? <GhostButton type="button" onClick={() => ctx.act('archiveHistory', { olderThanDays: 90 })}>أرشفة السجلات الأقدم من 90 يوماً</GhostButton> : null}
          {can(ctx.permissions, 'settings.read') ? <a className="inline-flex h-10 items-center rounded-xl border border-[#dfe7e3] px-3 text-sm font-semibold" href="/api/erp/backup">تنزيل نسخة احتياطية</a> : null}
        </div>
      </form>
    </Card>
  )
}

function Approvals({ ctx }: { ctx: LiveCtx }) {
  const pendingCosts = (ctx.state.lots ?? []).flatMap((lot) =>
    (lot.pendingCostLines ?? []).map((line) => ({ lot, line })),
  )
  const pos = ctx.state.purchaseOrders.filter((order) => order.status === 'PENDING_APPROVAL')
  const expenses = ctx.state.expenses.filter((expense) => expense.status === 'PENDING_APPROVAL')
  const payrolls = ctx.state.payrolls.filter((payroll) => payroll.status === 'PENDING_APPROVAL')
  const adjustments = ctx.state.adjustments.filter((adjustment) => adjustment.status === 'PENDING_APPROVAL')
  return (
    <div className="space-y-4">
      <Card title="تكلفة إنتاج">
        {pendingCosts.length === 0 ? <p className="text-sm text-[#788983]">لا يوجد</p> : pendingCosts.map(({ lot, line }) => (
          <div key={line.id} className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#f3f6f5] py-2">
            <div>{lot.lotNo} — {COST_LABEL[line.type]} — {moneyFmt(line.amount)} <Badge tone="warn">بانتظار الاعتماد</Badge></div>
            {can(ctx.permissions, 'production.cost.approve') ? (
              <span className="flex gap-2">
                <GhostButton type="button" onClick={() => ctx.act('decideProductionCost', { lotId: lot.id, lineId: line.id, decision: 'APPROVED' })}>اعتماد</GhostButton>
                <GhostButton type="button" onClick={() => ctx.act('decideProductionCost', { lotId: lot.id, lineId: line.id, decision: 'REJECTED' })}>رفض</GhostButton>
              </span>
            ) : null}
          </div>
        ))}
      </Card>
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
  const [newUser, setNewUser] = useState({ fullName: '', email: '', role: 'OPERATIONS' as RoleKey, password: '' })
  return (
  <div className="space-y-4">
  <Card
  title="المستخدمون"
  extra={
  <div className="flex flex-wrap items-center gap-2">
  {can(ctx.permissions, 'users.manage') ? <FormDialog title="إضافة مستخدم" openLabel="إضافة مستخدم">
  {(close) => <form className="grid gap-3" onSubmit={async (event) => {
    event.preventDefault()
    const result = await ctx.act('createUser', { fullName: newUser.fullName, email: newUser.email, role: newUser.role, password: newUser.password })
    if (result.ok) { setNewUser({ fullName: '', email: '', role: 'OPERATIONS', password: '' }); close() }
  }}>
    <Field label="الاسم الكامل"><TextInput value={newUser.fullName} onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })} required /></Field>
    <Field label="البريد الإلكتروني"><TextInput type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required /></Field>
    <Field label="الدور"><SelectInput value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value as RoleKey })}>{ROLE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</SelectInput></Field>
    <Field label="كلمة المرور"><TextInput type="password" minLength={8} value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required /></Field>
    <PrimaryButton disabled={ctx.pending}>إضافة المستخدم</PrimaryButton>
  </form>}
  </FormDialog> : null}
          <FormDialog title="تحديث كلمة المرور" openLabel="تحديث كلمة ال��رور">
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
      <Card title="صلاحيات الدور" hint="يمكن تضييق ما يراه كل دور دون إيقاف باقي النظام. لا يُ��حب حق إدارة المستخدمين من المدير العام.">
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
  const { language } = useLanguage()
  return (
    <div className="relative overflow-hidden rounded-[12px] border border-[#e5e7eb] bg-white p-4 ps-5 shadow-sm">
      <span aria-hidden className={`absolute inset-y-3 right-0 w-1.5 rounded-full ${barClass}`} />
      <div className="text-sm font-medium text-[#6b7280]">{translateUiText(language, label)}</div>
      <div className={`mt-2 text-3xl font-bold leading-none tracking-tight ${toneClass}`}>{translateUiText(language, value)}</div>
      {hint ? <div className="mt-2 text-sm text-[#53655e]">{translateUiText(language, hint)}</div> : null}
    </div>
  )
}

function NameList({ rows, empty }: { rows: string[]; empty: string }) {
  const { language } = useLanguage()
  if (rows.length === 0) return <p className="text-sm text-[#788983]">{translateUiText(language, empty)}</p>
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
  const access = dashboardAccess(ctx.permissions)
  const alerts = useMemo(() => dashboardAlerts(ctx.state, new Date().toISOString()), [ctx.state])
  const spotlight = useMemo(
    () => access.inventory
      ? ctx.state.materials
          .map((material) => materialStatement(ctx.state, material.id))
          .filter((row): row is NonNullable<ReturnType<typeof materialStatement>> => Boolean(row && row.consumedQty > 0))
          .sort((a, b) => b.consumedQty - a.consumedQty)[0] ?? null
      : null,
    [access.inventory, ctx.state],
  )
  const executionTone = status.production.executionPct >= 95 ? 'good' : status.production.executionPct >= 80 ? 'warn' : 'bad'
  const marginTone = status.profit.marginPerTon > 0 ? 'good' : status.profit.marginPerTon < 0 ? 'bad' : undefined
  const canViewApprovals = ctx.permissions.includes('approvals.decide')
  const pending =
    canViewApprovals
      ? ctx.state.purchaseOrders.filter((order) => order.status === 'PENDING_APPROVAL').length +
        ctx.state.expenses.filter((expense) => expense.status === 'PENDING_APPROVAL').length +
        ctx.state.payrolls.filter((payroll) => payroll.status === 'PENDING_APPROVAL').length +
        ctx.state.adjustments.filter((adjustment) => adjustment.status === 'PENDING_APPROVAL').length
      : 0
  const dateLabel = dayFmt(status.day)
  return (
    <LocalizedContent>
    <div className="space-y-5">
      <div>
        <h2 className="text-3xl font-bold">وضع المصنع اليوم</h2>
        <p className="mt-2 text-[#788983]">
          {status.shifted ? `لا يوجد تشغيل بتاريخ اليوم. الأرقام لآخر يوم تشغيل: ${dateLabel}` : dateLabel}
          {' · '}
          {ctx.state.company.nameAr}
        </p>
      </div>

      {access.production ? <Card title="الإنتاج" hint="المخطط مقابل ما خرج فعلياً من خط الإنتاج.">
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
      </Card> : null}

      {access.sales ? <Card title="المبيعات" hint="صافي الفواتير المؤكدة قبل الضريبة.">
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
      </Card> : null}

      {access.profitability || access.inventory ? <div className="grid gap-4 lg:grid-cols-2">
        {access.profitability ? <Card title="الربحية" hint="متوسط سعر البيع ناقص تكلفة الطن المنتج في هذا اليوم.">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="تكلفة الطن" value={moneyFmt(status.profit.costPerTon)} />
            <Metric label="متوسط سعر البيع" value={moneyFmt(status.profit.avgPricePerTon)} />
            <Metric label="هامش الربح/طن" value={moneyFmt(status.profit.marginPerTon)} tone={marginTone} />
          </div>
        </Card> : null}
        {access.inventory ? <Card title="المخزون">
          <div className="grid grid-cols-2 gap-3">
            {access.profitability ? <Metric label="قيمة المخزون" value={moneyFmt(status.inventory.value)} /> : null}
            <Metric label="المواد التي ستنفد" value={String(status.inventory.runningOut.length)} tone={status.inventory.runningOut.length ? 'bad' : 'good'} />
            <Metric label="المواد الراكدة" value={String(status.inventory.stagnant.length)} tone={status.inventory.stagnant.length ? 'warn' : 'good'} />
            <Metric label="المواد المحجوزة" value={String(status.inventory.reserved.length)} />
          </div>
        </Card> : null}
      </div> : null}

      {access.inventory ? <div className="grid gap-4 lg:grid-cols-3">
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
      </div> : null}

      {access.fleet || access.obligations || access.documents || access.maintenance ? (
        <Card title="مركز المالك" hint={`تنبيهات متابعة حسب صلاحياتك — ${dayFmt(alerts.today)}.`}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {access.fleet ? <Metric label="السيارات النشطة" value={String(ctx.state.vehicles.filter((vehicle) => vehicle.active).length)} hint={`${alerts.vehicleServices.length} موعد صيانة قريب`} tone={alerts.vehicleServices.some((item) => item.overdue) ? 'bad' : undefined} /> : null}
            {access.obligations ? <Metric label="أقساط خلال 90 يوم" value={String(alerts.obligations.length)} tone={alerts.obligations.some((item) => (item.daysLeft ?? 0) < 0) ? 'bad' : alerts.obligations.length ? 'warn' : 'good'} /> : null}
            {access.documents ? <Metric label="وثائق خلال 90 يوم" value={String(alerts.documents.length)} tone={alerts.documents.some((item) => item.daysLeft != null && item.daysLeft < 0) ? 'bad' : alerts.documents.length ? 'warn' : 'good'} /> : null}
            {access.maintenance ? <Metric label="صيانة ماكينات مستحقة" value={String(alerts.machineMaintenance.length)} tone={alerts.machineMaintenance.some((item) => item.overdue) ? 'bad' : alerts.machineMaintenance.length ? 'warn' : 'good'} /> : null}
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {access.obligations ? <NameList
              empty="لا توجد التزامات مستحقة خلال 90 يوماً"
              rows={alerts.obligations.map((item) => `استحقاق ${item.dueDate} — ${item.beneficiary} — ${moneyFmt(item.outstanding)} — ${(item.daysLeft ?? 0) < 0 ? `متأخر ${Math.abs(item.daysLeft ?? 0)} يوم` : `بعد ${item.daysLeft ?? 0} يوم`}`)}
            /> : null}
            {access.documents ? <NameList
              empty="لا ��وجد وثائق قريبة الانتهاء"
              rows={alerts.documents.map((item) => `${item.title} — ${item.dueDate} — ${(item.daysLeft ?? 0) < 0 ? `منتهية منذ ${Math.abs(item.daysLeft ?? 0)} يوم` : `بعد ${item.daysLeft ?? 0} يوم`}`)}
            /> : null}
            {access.fleet ? <NameList
              empty="لا توجد صيانة سيارات قريبة"
              rows={alerts.vehicleServices.map((item) => `${item.vehicle} (${item.plateNo}) — ${item.kind}${item.dueDate ? ` — ${item.dueDate}` : ''}${item.kmLeft != null ? ` — ${item.kmLeft < 0 ? `متأخرة ${Math.abs(item.kmLeft)} كم` : `متبقي ${item.kmLeft} كم`}` : ''}`)}
            /> : null}
            {access.maintenance ? <NameList
              empty="لا توجد صيانة ماكينات مستحقة"
              rows={alerts.machineMaintenance.map((item) => `${item.machine} — ${item.description}${item.hoursDue ? ' — مستحقة حسب ساعات التشغيل' : ` — ${(item.daysLeft ?? 0) < 0 ? `متأخرة ${Math.abs(item.daysLeft ?? 0)} يوم` : `بعد ${item.daysLeft ?? 0} يوم`}`}`)}
            /> : null}
          </div>
        </Card>
      ) : null}

      {access.production ? <Card title="الإنتاج" hint="الهدر، الانحراف عن الوصفة، وتوقفات المصنع في يوم التشغيل.">
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
      </Card> : null}

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

      {access.quality ? (
        <Card title="الجودة" hint="المرفوض والمعلّق بانتظار إجراء، ونسبة القبول خلال شهر التشغيل." extra={<GhostButton type="button" onClick={() => ctx.navigate('qualitySample')}>العينات</GhostButton>}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Metric label="بانتظار إجراء" value={String(status.qc.awaiting.length)} tone={status.qc.awaiting.length ? 'bad' : 'good'} />
            <Metric label="نسبة القبول الشهرية" value={status.qc.monthPassRate == null ? '—' : pctFmt(status.qc.monthPassRate)} hint={status.qc.monthSamples ? `${status.qc.monthSamples} عينة` : 'لا عينات'} />
          </div>
          <div className="mt-3">
            <NameList empty="لا توجد نتائج مرفوضة أو معلّقة" rows={status.qc.awaiting.map((item) => `${item.label} — ${statusLabel(item.result)}`)} />
          </div>
        </Card>
      ) : null}

      {access.profitability ? (
        <Card title="تكلفة الطن هذا الشهر" hint="متوسط موزون بكل بنود التكلفة." extra={canSeeEntity(ctx.permissions, 'factoryCostPerTon') ? <GhostButton type="button" onClick={() => ctx.navigate('factoryCostPerTon')}>التفاصيل</GhostButton> : undefined}>
          <Metric label="متوسط تكلفة الطن" value={moneyFmt(status.cost.avgCostPerTon)} />
          <div className="mt-3">
            <NameList empty="لا إنتاج هذا الشهر" rows={status.cost.breakdown.map((line) => `${line.label} — ${moneyFmt(line.amount)} (${pctFmt(line.pct)})`)} />
          </div>
        </Card>
      ) : null}

      {access.profitability ? (
        <Card title="أقل الدفعات هامشاً" extra={canSeeEntity(ctx.permissions, 'productionLot') ? <GhostButton type="button" onClick={() => ctx.navigate('productionLot')}>الدفعات</GhostButton> : undefined}>
          {status.lowestMarginLots.length === 0 ? <p className="text-sm text-[#788983]">لا مبيعات مرتبطة بدفعة بعد</p> : (
            <ul className="space-y-1.5 text-sm text-[#30453d]">
              {status.lowestMarginLots.map((lot) => (
                <li key={lot.lotNo} className={lot.marginPerTon < 0 ? 'font-bold text-[#dc2626]' : undefined}>
                  {lot.lotNo} — {lot.productName} — {moneyFmt(lot.marginPerTon)} / طن ({pctFmt(lot.marginPct)})
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}

      {access.sales ? (
        <Card title="التحصيلات" extra={<GhostButton type="button" onClick={() => ctx.navigate('salesPayment')}>التحصيلات</GhostButton>}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Metric label="تحصيل اليوم" value={moneyFmt(status.collections.today)} />
            <Metric label="تحصيل الشهر" value={moneyFmt(status.collections.month)} />
          </div>
        </Card>
      ) : null}

      {access.sales ? (
        <Card title="أعمار الذمم" hint="المتبقي على الفواتير غير المسددة." extra={<GhostButton type="button" onClick={() => ctx.navigate('factoryOpenOrders')}>الفواتير المفتوحة</GhostButton>}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="0–30 يوماً" value={moneyFmt(status.aging.d0_30)} />
            <Metric label="31–60 يوماً" value={moneyFmt(status.aging.d31_60)} tone={status.aging.d31_60 > 0 ? 'warn' : undefined} />
            <Metric label="61 يوماً فأكثر" value={moneyFmt(status.aging.d61)} tone={status.aging.d61 > 0 ? 'bad' : undefined} />
          </div>
        </Card>
      ) : null}

      {canViewApprovals || ctx.permissions.includes('inventory.ledger.read') ? <div className="grid gap-4 lg:grid-cols-2">
        {canViewApprovals ? <Card title="اعتمادات معلّقة">
          <Metric label="بانتظار اعتماد المدير العام" value={String(pending)} tone={pending ? 'warn' : 'good'} />
        </Card> : null}
        {ctx.permissions.includes('inventory.ledger.read') ? <Card title="آخر الحركات">
          <DataTable
            columns={['النوع', 'الصنف', 'الكمية']}
            rows={ctx.state.ledger.slice(0, 6).map((row) => [statusLabel(row.type), row.batchNo, qtyFmt(row.qty)])}
          />
        </Card> : null}
      </div> : null}
    </div>
    </LocalizedContent>
  )
}
