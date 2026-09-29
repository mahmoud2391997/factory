'use client'

import { useMemo, useState } from 'react'

import { supplierQuality } from '@/lib/erp/domain/reports'
import type { QcResult } from '@/lib/erp/domain/types'

import { Card, DataTable, Field, GhostButton, PrimaryButton, SelectInput, TextInput } from './bits'
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
          <TextInput type="number" min="0" max="100" step="0.001" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
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
  const [type, setType] = useState<'RAW_MATERIAL' | 'FINISHED_PRODUCT'>('RAW_MATERIAL')
  const [batchNo, setBatchNo] = useState('')
  const [moisture, setMoisture] = useState('')
  const [protein, setProtein] = useState('')
  const [ash, setAsh] = useState('')
  const [energy, setEnergy] = useState('')
  const [fat, setFat] = useState('')
  const [fiber, setFiber] = useState('')
  const [calcium, setCalcium] = useState('')
  const [phosphorus, setPhosphorus] = useState('')
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
              moisturePct: num(moisture),
              proteinPct: num(protein),
              ashPct: num(ash),
              energy: num(energy),
              fatPct: num(fat),
              fiberPct: num(fiber),
              calciumPct: num(calcium),
              phosphorusPct: num(phosphorus),
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
              setNotes('')
              setOverride('')
              setReason('')
            }
          }}>
            <Field label="النوع">
              <SelectInput value={type} onChange={(e) => setType(e.target.value as 'RAW_MATERIAL' | 'FINISHED_PRODUCT')}>
                <option value="RAW_MATERIAL">خام</option>
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
          columns={['الوقت', 'النوع', 'المرجع', 'رطوبة', 'بروتين', 'رماد', 'طاقة', 'دهون', 'ألياف', 'كالسيوم', 'فوسفور', 'النتيجة', '']}
          rows={rows.map((sample) => [
            sample.sampledAt.slice(0, 16).replace('T', ' '),
            statusLabel(sample.type),
            sample.lotNo || `${ctx.state.materials.find((item) => item.id === sample.materialId)?.nameAr ?? ''} ${sample.batchNo ?? ''}`,
            sample.moisturePct != null ? qtyFmt(sample.moisturePct) : '—',
            sample.proteinPct != null ? qtyFmt(sample.proteinPct) : '—',
            sample.ashPct != null ? qtyFmt(sample.ashPct) : '—',
            sample.energy != null ? qtyFmt(sample.energy) : '—',
            sample.fatPct != null ? qtyFmt(sample.fatPct) : '—',
            sample.fiberPct != null ? qtyFmt(sample.fiberPct) : '—',
            sample.calciumPct != null ? qtyFmt(sample.calciumPct) : '—',
            sample.phosphorusPct != null ? qtyFmt(sample.phosphorusPct) : '—',
            statusLabel(sample.result),
            can(ctx.permissions, 'qc.manage') ? (
              <ResultButtons key={sample.id} ctx={ctx} sampleId={sample.id} />
            ) : '—',
          ])}
        />
      </Card>
    </div>
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
          <div className="mt-4 grid gap-3 sm:grid-cols-4 text-sm">
            <div>العينات: {summary.samples}</div>
            <div>نسبة القبول: {summary.passRate == null ? '—' : pctFmt(summary.passRate)}</div>
            <div>متوسط الرطوبة: {summary.avgMoisture == null ? '—' : pctFmt(summary.avgMoisture)}</div>
            <div>متوسط البروتين: {summary.avgProtein == null ? '—' : pctFmt(summary.avgProtein)}</div>
          </div>
        ) : null}
      </Card>
    </div>
  )
}
