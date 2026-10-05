'use client'

import { useMemo, useState } from 'react'

import { supplierQuality } from '@/lib/erp/domain/reports'
import { calculateLotNutrition, compareNutrition } from '@/lib/erp/domain/nutrition'
import type { QcResult, QualitySample } from '@/lib/erp/domain/types'
import { useLanguage } from '@/lib/i18n/language-provider'
import { attachmentTooLargeMessage, getAttachmentUploadLimits } from '@/server/erp/attachment-policy'

import { Card, DataTable, Field, FormDialog, GhostButton, PrimaryButton, RowActions, SelectInput, TextInput } from './bits'
import type { LiveCtx } from './ctx'
import { can, pctFmt, qtyFmt, statusLabel } from './format'

const RESULTS: QcResult[] = ['PENDING', 'PASSED', 'FAILED', 'HOLD']

function LimitsForm({ ctx, itemType, itemId }: { ctx: LiveCtx; itemType: 'MATERIAL' | 'PRODUCT'; itemId: string }) {
  const source = itemType === 'MATERIAL' ? ctx.state.materials.find((item) => item.id === itemId) : ctx.state.products.find((item) => item.id === itemId)
  const limits = source?.qcLimits ?? {}
  const [form, setForm] = useState({
    minMoisture: limits.minMoisture?.toString() ?? '',
    maxMoisture: limits.maxMoisture?.toString() ?? '',
    minProtein: limits.minProtein?.toString() ?? '',
    maxProtein: limits.maxProtein?.toString() ?? '',
    minAsh: limits.minAsh?.toString() ?? '',
    maxAsh: limits.maxAsh?.toString() ?? '',
    minEnergy: limits.minEnergy?.toString() ?? '',
    maxEnergy: limits.maxEnergy?.toString() ?? '',
    minFat: limits.minFat?.toString() ?? '',
    maxFat: limits.maxFat?.toString() ?? '',
    minFiber: limits.minFiber?.toString() ?? '',
    maxFiber: limits.maxFiber?.toString() ?? '',
    minCalcium: limits.minCalcium?.toString() ?? '',
    maxCalcium: limits.maxCalcium?.toString() ?? '',
    minPhosphorus: limits.minPhosphorus?.toString() ?? '',
    maxPhosphorus: limits.maxPhosphorus?.toString() ?? '',
  })
  const num = (value: string) => (value.trim() === '' ? undefined : Number(value))
  return (
    <form className="grid gap-3 md:grid-cols-3" onSubmit={async (event) => {
      event.preventDefault()
      await ctx.act('setQcLimits', {
        itemType,
        itemId,
        limits: {
          minMoisture: num(form.minMoisture),
          maxMoisture: num(form.maxMoisture),
          minProtein: num(form.minProtein),
          maxProtein: num(form.maxProtein),
          minAsh: num(form.minAsh),
          maxAsh: num(form.maxAsh),
          minEnergy: num(form.minEnergy),
          maxEnergy: num(form.maxEnergy),
          minFat: num(form.minFat),
          maxFat: num(form.maxFat),
          minFiber: num(form.minFiber),
          maxFiber: num(form.maxFiber),
          minCalcium: num(form.minCalcium),
          maxCalcium: num(form.maxCalcium),
          minPhosphorus: num(form.minPhosphorus),
          maxPhosphorus: num(form.maxPhosphorus),
        },
      })
    }}>
      {([
        ['minMoisture', 'أدنى رطوبة %'],
        ['maxMoisture', 'أعلى رطوبة %'],
        ['minProtein', 'أدنى بروتين %'],
        ['maxProtein', 'أعلى بروتين %'],
        ['minAsh', 'أدنى رماد %'],
        ['maxAsh', 'أعلى رماد %'],
        ['minEnergy', 'أدنى طاقة'],
        ['maxEnergy', 'أعلى طاقة'],
        ['minFat', 'أدنى دهون %'],
        ['maxFat', 'أعلى دهون %'],
        ['minFiber', 'أدنى ألياف %'],
        ['maxFiber', 'أعلى ألياف %'],
        ['minCalcium', 'أدنى كالسيوم %'],
        ['maxCalcium', 'أعلى كالسيوم %'],
        ['minPhosphorus', 'أدنى فوسفور %'],
        ['maxPhosphorus', 'أعلى فوسفور %'],
      ] as const).map(([key, label]) => (
        <Field key={key} label={label}>
          <TextInput type="number" min="0" max={key.endsWith('Energy') ? '10000' : '100'} step="0.001" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
        </Field>
      ))}
      <div className="flex items-end">
        <PrimaryButton disabled={ctx.pending || !can(ctx.permissions, 'qc.limits')}>حفظ الحدود</PrimaryButton>
      </div>
    </form>
  )
}

export function QcLimitsEditor({ ctx, itemType }: { ctx: LiveCtx; itemType: 'MATERIAL' | 'PRODUCT' }) {
  const items = itemType === 'MATERIAL' ? ctx.state.materials : ctx.state.products
  const [itemId, setItemId] = useState(items[0]?.id ?? '')
  if (!can(ctx.permissions, 'qc.read') && !can(ctx.permissions, 'qc.limits')) return null
  const active = items.some((item) => item.id === itemId) ? itemId : (items[0]?.id ?? '')
  return (
    <Card title="حدود الجودة" hint="النتيجة المقترحة تُحسب من هذه الحدود. تغييرها يحتاج صلاحية qc.limits.">
      <Field label={itemType === 'MATERIAL' ? 'المادة' : 'المنتج'}>
        <SelectInput value={active} onChange={(e) => setItemId(e.target.value)}>
          {items.map((item) => <option key={item.id} value={item.id}>{item.nameAr}</option>)}
        </SelectInput>
      </Field>
      {active ? <div className="mt-3"><LimitsForm key={active} ctx={ctx} itemType={itemType} itemId={active} /></div> : null}
    </Card>
  )
}

export function QualityScreens({ entityKey, ctx }: { entityKey: string; ctx: LiveCtx }) {
  if (entityKey === 'qualitySample') return <Samples ctx={ctx} />
  if (entityKey === 'supplierQuality') return <SupplierQuality ctx={ctx} />
  return null
}

function Samples({ ctx }: { ctx: LiveCtx }) {
  const [supplierId, setSupplierId] = useState('')
  const [materialId, setMaterialId] = useState('')
  const [lotNo, setLotNo] = useState('')
  const [result, setResult] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [type, setType] = useState<'RAW_MATERIAL' | 'FINISHED_PRODUCT' | 'IN_PROCESS'>('RAW_MATERIAL')
  const [batchNo, setBatchNo] = useState('')
  const [productionOrderId, setProductionOrderId] = useState(ctx.state.productionOrders.find((order) => order.status === 'RELEASED')?.id ?? '')
  const [moisture, setMoisture] = useState('')
  const [protein, setProtein] = useState('')
  const [ash, setAsh] = useState('')
  const [energy, setEnergy] = useState('')
  const [fat, setFat] = useState('')
  const [fiber, setFiber] = useState('')
  const [calcium, setCalcium] = useState('')
  const [phosphorus, setPhosphorus] = useState('')
  const [labName, setLabName] = useState('')
  const [testMethod, setTestMethod] = useState('')
  const [notes, setNotes] = useState('')
  const [override, setOverride] = useState('')
  const [reason, setReason] = useState('')
  const rows = useMemo(() => (ctx.state.qualitySamples ?? []).filter((sample) => {
    if (supplierId && sample.supplierId !== supplierId) return false
    if (materialId && sample.materialId !== materialId) return false
    if (lotNo && sample.lotNo !== lotNo) return false
    if (result && sample.result !== result) return false
    const day = sample.sampledAt.slice(0, 10)
    if (from && day < from) return false
    if (to && day > to) return false
    return true
  }), [ctx.state.qualitySamples, supplierId, materialId, lotNo, result, from, to])
  return (
    <div className="space-y-4">
      <Card title="تسجيل عينة" hint="النتيجة تُقترح من الحدود. تجاوزها يحتاج سبباً، وفك الرفض أو الحجز يحتاج صلاحية خاصة.">
        {can(ctx.permissions, 'qc.manage') ? (
          <form className="grid gap-3 md:grid-cols-3" onSubmit={async (event) => {
            event.preventDefault()
            const num = (value: string) => (value.trim() === '' ? undefined : Number(value))
            const saved = await ctx.act('createQualitySample', {
              type,
              materialId: type === 'RAW_MATERIAL' ? materialId || undefined : undefined,
              batchNo: type === 'RAW_MATERIAL' ? batchNo : undefined,
              supplierId: type === 'RAW_MATERIAL' ? supplierId || undefined : undefined,
              lotNo: type === 'FINISHED_PRODUCT' ? lotNo : undefined,
              productionOrderId: type === 'IN_PROCESS' ? productionOrderId || undefined : undefined,
              moisturePct: num(moisture),
              proteinPct: num(protein),
              ashPct: num(ash),
              energy: num(energy),
              fatPct: num(fat),
              fiberPct: num(fiber),
              calciumPct: num(calcium),
              phosphorusPct: num(phosphorus),
              labName,
              testMethod,
              notes,
              result: override ? (override as 'PASSED' | 'FAILED' | 'HOLD') : undefined,
              reason,
            })
            if (saved.ok) {
              setMoisture('')
              setProtein('')
              setAsh('')
              setEnergy('')
              setFat('')
              setFiber('')
              setCalcium('')
              setPhosphorus('')
              setLabName('')
              setTestMethod('')
              setNotes('')
              setOverride('')
              setReason('')
            }
          }}>
            <Field label="النوع">
              <SelectInput value={type} onChange={(e) => setType(e.target.value as 'RAW_MATERIAL' | 'FINISHED_PRODUCT')}>
                <option value="RAW_MATERIAL">خام</option>
                <option value="IN_PROCESS">أثناء الإنتاج</option>
                <option value="FINISHED_PRODUCT">منتج نهائي</option>
              </SelectInput>
            </Field>
            {type === 'RAW_MATERIAL' ? (
              <>
                <Field label="المادة">
                  <SelectInput value={materialId} onChange={(e) => setMaterialId(e.target.value)}>
                    <option value="">اختر</option>
                    {ctx.state.materials.map((item) => <option key={item.id} value={item.id}>{item.nameAr}</option>)}
                  </SelectInput>
                </Field>
                <Field label="دفعة الخام"><TextInput value={batchNo} onChange={(e) => setBatchNo(e.target.value)} required /></Field>
                <Field label="المورد">
                  <SelectInput value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                    <option value="">بدون</option>
                    {ctx.state.suppliers.map((item) => <option key={item.id} value={item.id}>{item.nameAr}</option>)}
                  </SelectInput>
                </Field>
              </>
            ) : type === 'IN_PROCESS' ? (
              <Field label="أمر الإنتاج">
                <SelectInput value={productionOrderId} onChange={(e) => setProductionOrderId(e.target.value)} required>
                  {ctx.state.productionOrders.filter((order) => order.status === 'RELEASED').map((order) => <option key={order.id} value={order.id}>{order.number}</option>)}
                </SelectInput>
              </Field>
            ) : (
              <Field label="دفعة الإنتاج">
                <SelectInput value={lotNo} onChange={(e) => setLotNo(e.target.value)}>
                  {(ctx.state.lots ?? []).map((lot) => <option key={lot.id} value={lot.lotNo}>{lot.lotNo}</option>)}
                </SelectInput>
              </Field>
            )}
            <Field label="رطوبة %"><TextInput type="number" min="0" max="100" step="0.001" value={moisture} onChange={(e) => setMoisture(e.target.value)} /></Field>
            <Field label="بروتين %"><TextInput type="number" min="0" max="100" step="0.001" value={protein} onChange={(e) => setProtein(e.target.value)} /></Field>
            <Field label="رماد %"><TextInput type="number" min="0" max="100" step="0.001" value={ash} onChange={(e) => setAsh(e.target.value)} /></Field>
            <Field label="طاقة"><TextInput type="number" min="0" step="0.001" value={energy} onChange={(e) => setEnergy(e.target.value)} /></Field>
            <Field label="دهون %"><TextInput type="number" min="0" max="100" step="0.001" value={fat} onChange={(e) => setFat(e.target.value)} /></Field>
            <Field label="ألياف %"><TextInput type="number" min="0" max="100" step="0.001" value={fiber} onChange={(e) => setFiber(e.target.value)} /></Field>
            <Field label="كالسيوم %"><TextInput type="number" min="0" max="100" step="0.001" value={calcium} onChange={(e) => setCalcium(e.target.value)} /></Field>
            <Field label="فوسفور %"><TextInput type="number" min="0" max="100" step="0.001" value={phosphorus} onChange={(e) => setPhosphorus(e.target.value)} /></Field>
            <Field label="المختبر"><TextInput maxLength={120} value={labName} onChange={(e) => setLabName(e.target.value)} /></Field>
            <Field label="طريقة الفحص"><TextInput maxLength={120} value={testMethod} onChange={(e) => setTestMethod(e.target.value)} /></Field>
            <Field label="ملاحظات"><TextInput value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
            <Field label="تجاوز النتيجة المقترحة">
              <SelectInput value={override} onChange={(e) => setOverride(e.target.value)}>
                <option value="">استخدم الاقتراح</option>
                <option value="PASSED">مقبول</option>
                <option value="FAILED">مرفوض</option>
                <option value="HOLD">معلّق</option>
              </SelectInput>
            </Field>
            <Field label="سبب التجاوز"><TextInput value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
            <div className="flex items-end"><PrimaryButton disabled={ctx.pending}>حفظ العينة</PrimaryButton></div>
          </form>
        ) : <p className="text-sm text-[#788983]">التسجيل يحتاج صلاحية qc.manage.</p>}
      </Card>
      <Card title="عينات الجودة">
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <Field label="المورد">
            <SelectInput value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <option value="">الكل</option>
              {ctx.state.suppliers.map((item) => <option key={item.id} value={item.id}>{item.nameAr}</option>)}
            </SelectInput>
          </Field>
          <Field label="المادة">
            <SelectInput value={materialId} onChange={(e) => setMaterialId(e.target.value)}>
              <option value="">الكل</option>
              {ctx.state.materials.map((item) => <option key={item.id} value={item.id}>{item.nameAr}</option>)}
            </SelectInput>
          </Field>
          <Field label="الدفعة">
            <SelectInput value={lotNo} onChange={(e) => setLotNo(e.target.value)}>
              <option value="">الكل</option>
              {(ctx.state.lots ?? []).map((lot) => <option key={lot.id} value={lot.lotNo}>{lot.lotNo}</option>)}
            </SelectInput>
          </Field>
          <Field label="النتيجة">
            <SelectInput value={result} onChange={(e) => setResult(e.target.value)}>
              <option value="">الكل</option>
              {RESULTS.map((item) => <option key={item} value={item}>{statusLabel(item)}</option>)}
            </SelectInput>
          </Field>
          <Field label="من"><TextInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
          <Field label="إلى"><TextInput type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
        </div>
        <DataTable
          columns={['الوقت', 'نوع العينة', 'المرجع', 'المختبر/الطريقة', 'الفاحص', 'رطوبة', 'بروتين', 'رماد', 'طاقة', 'دهون', 'ألياف', 'كالسيوم', 'فوسفور', 'النتيجة', 'التقرير', '']}
          rows={rows.map((sample) => [
            sample.sampledAt.slice(0, 16).replace('T', ' '),
            qualitySampleTypeLabel(sample.type),
            sample.type === 'FINISHED_PRODUCT'
              ? sample.lotNo
              : sample.type === 'IN_PROCESS'
                ? ctx.state.productionOrders.find((order) => order.id === sample.productionOrderId)?.number ?? sample.productionOrderId
                : `${ctx.state.materials.find((item) => item.id === sample.materialId)?.nameAr ?? ''} ${sample.batchNo ?? ''}`,
            [sample.labName, sample.testMethod].filter(Boolean).join(' / ') || '—',
            ctx.state.users.find((user) => user.id === sample.sampledBy)?.fullName ?? sample.sampledBy,
            sample.moisturePct != null ? qtyFmt(sample.moisturePct) : '—',
            sample.proteinPct != null ? qtyFmt(sample.proteinPct) : '—',
            sample.ashPct != null ? qtyFmt(sample.ashPct) : '—',
            sample.energy != null ? qtyFmt(sample.energy) : '—',
            sample.fatPct != null ? qtyFmt(sample.fatPct) : '—',
            sample.fiberPct != null ? qtyFmt(sample.fiberPct) : '—',
            sample.calciumPct != null ? qtyFmt(sample.calciumPct) : '—',
            sample.phosphorusPct != null ? qtyFmt(sample.phosphorusPct) : '—',
            statusLabel(sample.result),
            <QualitySampleAttachments key={`${sample.id}-attachments`} ctx={ctx} sample={sample} />,
            can(ctx.permissions, 'qc.manage') ? (
              <ResultButtons key={sample.id} ctx={ctx} sampleId={sample.id} />
            ) : '—',
          ])}
          rowActions={(_, index) => {
            const sample = rows[index]
            if (!sample) return null
            return (
              <RowActions
                canEdit={false}
                canDelete={can(ctx.permissions, 'qc.manage')}
                onDelete={async () => {
                  await ctx.act('deleteQualitySample', { id: sample.id })
                }}
                deletePrompt="هل أنت متأكد من حذف هذه العينة؟"
              />
            )
          }}
        />
      </Card>
      {rows.find((sample) => sample.type === 'FINISHED_PRODUCT') ? (
        <NutritionalComparisonPanel
          ctx={ctx}
          sample={[...rows].filter((item) => item.type === 'FINISHED_PRODUCT').sort((a, b) => b.sampledAt.localeCompare(a.sampledAt))[0]!}
        />
      ) : null}
    </div>
  )
}

function qualitySampleTypeLabel(type: QualitySample['type']) {
  if (type === 'RAW_MATERIAL') return 'خام'
  if (type === 'IN_PROCESS') return 'أثناء الإنتاج'
  return 'منتج نهائي'
}

function QualitySampleAttachments({ ctx, sample }: { ctx: LiveCtx; sample: QualitySample }) {
  const { language } = useLanguage()
  const isVercelBuild = process.env.NEXT_PUBLIC_APP_ENV === 'vercel'
  const maxAttachmentBytes = getAttachmentUploadLimits(isVercelBuild).maxFileBytes
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [validationError, setValidationError] = useState('')
  const sampleRef = sample.type === 'FINISHED_PRODUCT'
    ? sample.lotNo
    : sample.type === 'IN_PROCESS'
      ? sample.productionOrderId
      : `${sample.batchNo ?? ''}`
  return (
    <div className="flex flex-col gap-1">
      {(sample.attachments ?? []).map((attachment) => (
        <a key={attachment.id} className="text-[#1d7f72] underline" href={`/api/erp/quality-samples/attachments/${attachment.id}`} target="_blank" rel="noreferrer">
          {attachment.fileName}
        </a>
      ))}
      {can(ctx.permissions, 'qc.manage') ? (
        <FormDialog title={`إرفاق ملف — عينة المختبر ${sampleRef}`} openLabel="رفع ملف">
          {(close) => <form className="grid gap-3" onSubmit={async (event) => {
            event.preventDefault()
            const form = event.currentTarget
            const formData = new FormData(form)
            const file = formData.get('file')
            setValidationError('')
            setUploadError('')
            if (!(file instanceof File) || file.size === 0) {
              setValidationError('الملف مطلوب')
              return
            }
            if (file.size > maxAttachmentBytes) {
              setValidationError(attachmentTooLargeMessage(language, isVercelBuild))
              return
            }
            const ext = file.name.split('.').pop()?.toLocaleLowerCase()
            const okType =
              file.type === 'application/pdf' ||
              file.type === 'image/png' ||
              file.type === 'image/jpeg' ||
              ext === 'pdf' ||
              ext === 'png' ||
              ext === 'jpg' ||
              ext === 'jpeg'
            if (!okType) {
              setValidationError('نوع الملف غير مدعوم')
              return
            }
            setUploading(true)
            try {
              const response = await fetch(`/api/erp/quality-samples/${sample.id}/attachments`, {
                method: 'POST',
                body: formData,
                headers: { 'x-erp-language': language },
              })
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
            <Field label="إرفاق ملف"><TextInput name="file" type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" /></Field>
            <p className="text-xs text-[#7c8c86]">{attachmentTooLargeMessage(language, isVercelBuild)}</p>
            {validationError ? <p role="alert" className="text-sm text-red-700">{validationError}</p> : null}
            {uploadError ? <p role="alert" className="text-sm text-red-700">{uploadError}</p> : null}
            <PrimaryButton disabled={uploading}>{uploading ? 'جارٍ الرفع…' : 'رفع المرفق'}</PrimaryButton>
          </form>}
        </FormDialog>
      ) : null}
    </div>
  )
}

function NutritionalComparisonPanel({ ctx, sample }: { ctx: LiveCtx; sample: QualitySample }) {
  const lot = ctx.state.lots.find((item) => item.lotNo === sample.lotNo)
  if (!lot) return null
  const product = ctx.state.products.find((item) => item.id === lot.productId)
  const calculation = calculateLotNutrition(ctx.state, lot)
  const comparison = compareNutrition(calculation.profile, sample, product?.qcLimits)
  return (
    <Card title={`التحليل الغذائي — ${lot.lotNo}`} hint="مقارنة قيم الخامات المحسوبة بقراءة المختبر ومواصفة المنتج.">
      {calculation.missingMaterials.length ? (
        <p className="mb-3 text-sm text-amber-800">تحليل بعض الخامات غير متوفر؛ تغطية كل عنصر موضحة أدناه: {calculation.missingMaterials.join('، ')}</p>
      ) : null}
      <DataTable columns={['العنصر', 'المحسوب من الدفعة', 'المختبر', 'المواصفة', 'الفرق %', 'تغطية التحليل', 'المطابقة']} rows={comparison.map((item) => [
        `${item.parameter} (${item.unit})`,
        qtyFmt(item.calculated),
        item.lab === undefined ? '—' : qtyFmt(item.lab),
        item.specMin === undefined && item.specMax === undefined ? '—' : `${item.specMin ?? '—'} – ${item.specMax ?? '—'}`,
        item.variance === undefined ? '—' : pctFmt(item.variance),
        calculation.coveragePct[item.key] === undefined ? '—' : pctFmt(calculation.coveragePct[item.key]!),
        item.lab === undefined ? 'لا توجد قراءة' : item.inSpec ? 'مطابق' : 'خارج المواصفة',
      ])} />
    </Card>
  )
}

function ResultButtons({ ctx, sampleId }: { ctx: LiveCtx; sampleId: string }) {
  const [reason, setReason] = useState('')
  return (
    <span className="flex flex-wrap items-center gap-2">
      <input className="h-9 w-28 rounded-xl border border-[#dfe7e3] px-2 text-sm" placeholder="السبب" value={reason} onChange={(e) => setReason(e.target.value)} />
      {(['PASSED', 'FAILED', 'HOLD'] as const).map((next) => (
        <GhostButton key={next} type="button" onClick={() => ctx.act('updateQualityResult', { sampleId, result: next, reason })}>{statusLabel(next)}</GhostButton>
      ))}
    </span>
  )
}

function SupplierQuality({ ctx }: { ctx: LiveCtx }) {
  const [supplierId, setSupplierId] = useState(ctx.state.suppliers[0]?.id ?? '')
  const summary = supplierId ? supplierQuality(ctx.state, supplierId) : null
  return (
    <div className="space-y-4">
      <Card title="جودة المورد">
        <Field label="المورد">
          <SelectInput value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            {ctx.state.suppliers.map((item) => <option key={item.id} value={item.id}>{item.nameAr}</option>)}
          </SelectInput>
        </Field>
        {summary ? (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-4 text-sm">
              <div>العينات: {summary.samples}</div>
              <div>نسبة القبول: {summary.passRate == null ? '—' : pctFmt(summary.passRate)}</div>
              <div>متوسط الرطوبة: {summary.avgMoisture == null ? '—' : pctFmt(summary.avgMoisture)}</div>
              <div>متوسط البروتين: {summary.avgProtein == null ? '—' : pctFmt(summary.avgProtein)}</div>
            </div>
            <h3 className="mt-5 font-bold">اتجاه جودة المورد شهرياً</h3>
            <DataTable columns={['الشهر', 'العينات', 'المفحوص', 'نسبة القبول', 'مرفوض/معلّق', 'متوسط الرطوبة', 'متوسط البروتين']} rows={summary.monthlyTrend.map((month) => [
              month.month,
              String(month.samples),
              String(month.decided),
              month.passRate == null ? '—' : pctFmt(month.passRate),
              String(month.rejected),
              month.avgMoisture == null ? '—' : pctFmt(month.avgMoisture),
              month.avgProtein == null ? '—' : pctFmt(month.avgProtein),
            ])} />
          </>
        ) : null}
      </Card>
    </div>
  )
}
