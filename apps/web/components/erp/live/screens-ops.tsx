'use client'

import { useState } from 'react'

import { materialPriceAnalysis, materialStatement, stockRows, traceSupplierBatch } from '@/lib/erp/domain/reports'
import type { ItemType, VatTreatment, WarehouseKey } from '@/lib/erp/domain/types'

import { Badge, Card, DataTable, Dialog, Field, FormDialog, GhostButton, PrimaryButton, SelectInput, TextInput, toneForStatus } from './bits'
import { QcLimitsEditor } from './screens-qc'
import type { LiveCtx } from './ctx'
import { can, itemName, materialName, moneyFmt, partyName, pctFmt, productName, qtyFmt, statusLabel, WAREHOUSE_LABEL } from './format'

function InlineError({ message }: { message: string }) {
  if (!message) return null
  return <p role="alert" className="rounded-xl border border-[#fecaca] bg-[#fee2e2] px-3 py-2 text-sm font-medium text-[#dc2626]">{message}</p>
}

function useLines<T>(blank: T) {
  const [lines, setLines] = useState<T[]>([{ ...blank }])
  return {
    lines,
    setLines,
    update(index: number, patch: Partial<T>) {
      setLines((current) => current.map((line, lineIndex) => (lineIndex === index ? { ...line, ...patch } : line)))
    },
    add() {
      setLines((current) => [...current, { ...blank }])
    },
    reset() {
      setLines([{ ...blank }])
    },
  }
}

export function InventoryScreens({ entityKey, ctx }: { entityKey: string; ctx: LiveCtx }) {
  if (entityKey === 'inventoryReports') return <ReportEntry ctx={ctx} section="inventory" />
  if (entityKey === 'material') return <Materials ctx={ctx} />
  if (entityKey === 'product') return <Products ctx={ctx} />
  if (entityKey === 'inventoryExtensions') return <InventoryExtensions ctx={ctx} />
  if (entityKey === 'warehouse') return <Warehouses ctx={ctx} />
  if (entityKey === 'stockTransfer') return <Transfer ctx={ctx} />
  if (entityKey === 'stockAdjustment') return <Adjustment ctx={ctx} />
  if (entityKey === 'barcode') return <BarcodeStation ctx={ctx} />
  if (entityKey === 'materialBatch' || entityKey === 'inventoryBalance') return <Balances ctx={ctx} materialsOnly={entityKey === 'materialBatch'} />
  if (entityKey === 'inventoryTransaction') return <Ledger ctx={ctx} />
  if (entityKey === 'materialTrace') return <MaterialTrace ctx={ctx} />
  if (entityKey === 'materialPriceAnalysis') return <MaterialPriceAnalysisScreen ctx={ctx} />
  return null
}

function Answer({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-[#f3f6f5] py-2 last:border-0">
      <div className="text-sm text-[#6b7280]">{label}</div>
      <div className="mt-1 font-semibold text-[#1f1f1f]">{value}</div>
    </div>
  )
}

function busiestMaterialId(ctx: LiveCtx) {
  return (
    ctx.state.materials
      .map((material) => materialStatement(ctx.state, material.id))
      .filter((row): row is NonNullable<ReturnType<typeof materialStatement>> => Boolean(row))
      .sort((a, b) => b.consumedQty - a.consumedQty)[0]?.material.id ?? ctx.state.materials[0]?.id ?? ''
  )
}

function MaterialTrace({ ctx }: { ctx: LiveCtx }) {
  const [materialId, setMaterialId] = useState(() => busiestMaterialId(ctx))
  const batches = [...new Set(ctx.state.balances.filter((row) => row.itemType === 'MATERIAL' && row.itemId === materialId).map((row) => row.batchNo))]
  const [batchNo, setBatchNo] = useState(batches[0] ?? '')
  const activeBatch = batches.includes(batchNo) ? batchNo : (batches[0] ?? '')
  const supplierTrace = activeBatch ? traceSupplierBatch(ctx.state, materialId, activeBatch) : null
  const statement = materialStatement(ctx.state, materialId)
  const productLabel = statement?.lines.map((line) => `${line.productName} ${qtyFmt(line.outputQty)} كجم`).join('، ')
  return (
    <div className="space-y-4">
      <Card title="اختر الخامة" hint="نفس الأسئلة على أي مادة: ماذا دخل، ماذا استُهلك، ماذا تبقّى، وماذا نُتج وبيع، وهل يوجد فرق ولماذا.">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="الخامة">
            <SelectInput value={materialId} onChange={(e) => { setMaterialId(e.target.value); setBatchNo('') }}>
              {ctx.state.materials.map((material) => (
                <option key={material.id} value={material.id}>{material.nameAr}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="دفعة الخام">
            <SelectInput value={activeBatch} onChange={(e) => setBatchNo(e.target.value)}>
              {batches.map((batch) => <option key={batch} value={batch}>{batch}</option>)}
            </SelectInput>
          </Field>
        </div>
        {supplierTrace && supplierTrace.lots.length > 0 ? (
          <div className="mt-4">
            <p className="mb-2 text-sm text-[#53655e]">
              المورد: {supplierTrace.suppliers.map((item) => item.nameAr).join('، ') || '—'} — الدفعات المتأثرة: {supplierTrace.lots.map((lot) => lot.lotNo).join('، ')}
            </p>
            <DataTable
              columns={['الدفعة', 'المنتج', 'العملاء']}
              rows={supplierTrace.lots.map((lot) => [
                lot.lotNo,
                productName(ctx.state, lot.productId),
                lot.deliveries.map((delivery) => ctx.state.customers.find((item) => item.id === delivery.customerId)?.nameAr ?? 'سحب').join('، ') || '—',
              ])}
            />
          </div>
        ) : null}
      </Card>
      {statement ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title={statement.material.nameAr}>
            <Answer label="كمية الخام التي دخلت المخزن" value={`${qtyFmt(statement.receivedQty)} ${statement.material.unit}`} />
            <Answer label="الكمية المستخدمة في التصنيع" value={`${qtyFmt(statement.consumedQty)} ${statement.material.unit}`} />
            <Answer label="الكمية المتبقية" value={`${qtyFmt(statement.onHand)} ${statement.material.unit}`} />
            <Answer label="عدد المنتجات التي تم تصنيعها" value={statement.productCount ? `${statement.productCount} أمر — ${productLabel}` : 'لا يوجد إنتاج مكتمل'} />
            <Answer label="الكمية التي تم سحبها أو بيعها" value={`بيع ${qtyFmt(statement.soldQty)} كجم — سحب ${qtyFmt(statement.withdrawnQty)} كجم`} />
            <Answer
              label="الكمية الموجودة حالياً"
              value={
                statement.warehouses.length
                  ? statement.warehouses.map((row) => `${WAREHOUSE_LABEL[row.warehouse] ?? row.warehouse}: ${qtyFmt(row.qty)}`).join(' · ')
                  : 'لا يوجد رصيد'
              }
            />
            <Answer
              label="هل الإنتاج متوافق مع كمية المواد الخام المستخدمة؟"
              value={statement.lines.length === 0 ? 'لا يوجد إنتاج مكتمل للمقارنة' : statement.aligned ? 'نعم، المصروف يطابق الوصفة للناتج الفعلي' : `لا، الفرق ${pctFmt(statement.gapPct)} عن الوصفة`}
            />
            <Answer
              label="هل هناك عجز أو فاقد؟"
              value={[
                statement.wasteQty > 0 ? `فاقد ${qtyFmt(statement.wasteQty)} ${statement.material.unit}` : 'لا يوجد فاقد مسجّل',
                statement.shortfallKg > 0 ? `عجز عن المخطط ${qtyFmt(statement.shortfallKg)} كجم` : 'لا يوجد عجز عن المخطط',
                statement.belowMin ? 'الرصيد عند الحد الأدنى أو دونه' : '',
              ].filter(Boolean).join(' — ')}
            />
            <Answer
              label="سبب وجود فرق أو تأخير"
              value={[...statement.reasons, ...statement.stoppages.map((item) => `${item.area}: ${item.reason} (${item.minutes} د)`)].join(' — ') || 'لا يوجد فرق يستدعي سبباً'}
            />
          </Card>
          <Card title="أوامر الإنتاج التي استهلكت الخامة">
            <DataTable
              columns={['الأمر', 'المنتج', 'المتوقع', 'المصروف', 'الهدر', 'الناتج']}
              rows={statement.lines.map((line) => [
                line.number,
                line.productName,
                qtyFmt(line.expectedQty),
                qtyFmt(line.actualQty),
                qtyFmt(line.wasteQty),
                qtyFmt(line.outputQty),
              ])}
            />
            <p className="mt-3 text-sm text-[#53655e]">
              {statement.balanceMatches
                ? 'رصيد الخامة يساوي ما دخل المخزن ناقص ما استُهلك في التصنيع.'
                : 'يوجد فرق بين الدخول والاستهلاك والرصيد الحالي. راجع التعديلات والتحويلات.'}
              {statement.productOnHand > 0 ? ` رصيد المنتج النهائي المرتبط: ${qtyFmt(statement.productOnHand)} كجم.` : ''}
            </p>
          </Card>
        </div>
      ) : null}
    </div>
  )
}

function Materials({ ctx }: { ctx: LiveCtx }) {
  const [code, setCode] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [category, setCategory] = useState('حبوب')
  const [minQty, setMinQty] = useState('1000')
  const [vatTreatment, setVatTreatment] = useState<VatTreatment>('ZERO')
  return (
    <div className="space-y-4">
    <Card
      title="المواد الخام"
      extra={
        can(ctx.permissions, 'inventory.read') ? (
          <FormDialog title="مادة خام جديدة" hint="الحد الأدنى يُطلق تنبيه نقص المخزون بالبريد عند توفر SMTP." openLabel="إضافة مادة">
            {(close) => (
              <form
                className="grid gap-3 md:grid-cols-2"
                onSubmit={async (event) => {
                  event.preventDefault()
                  const result = await ctx.act('createMaterial', { code, nameAr, category, minQty: Number(minQty), vatTreatment, unit: 'كجم' })
                  if (result.ok) {
                    setCode('')
                    setNameAr('')
                    close()
                  }
                }}
              >
                <Field label="الكود"><TextInput value={code} onChange={(e) => setCode(e.target.value)} required /></Field>
                <Field label="الاسم"><TextInput value={nameAr} onChange={(e) => setNameAr(e.target.value)} required /></Field>
                <Field label="التصنيف"><TextInput value={category} onChange={(e) => setCategory(e.target.value)} /></Field>
                <Field label="الحد الأدنى (كجم)"><TextInput type="number" min="0" step="0.001" value={minQty} onChange={(e) => setMinQty(e.target.value)} /></Field>
                <Field label="الضريبة">
                  <SelectInput value={vatTreatment} onChange={(e) => setVatTreatment(e.target.value as VatTreatment)}>
                    <option value="ZERO">صفرية</option>
                    <option value="STANDARD">خاضعة</option>
                    <option value="EXEMPT">معفاة</option>
                  </SelectInput>
                </Field>
                <div className="flex items-end"><PrimaryButton disabled={ctx.pending}>حفظ</PrimaryButton></div>
              </form>
            )}
          </FormDialog>
        ) : null
      }
    >
      <DataTable
        columns={['الكود', 'الاسم', 'التصنيف', 'الحد الأدنى', 'الضريبة', 'الباركود']}
        rows={ctx.state.materials.map((item) => [item.code, item.nameAr, item.category, qtyFmt(item.minQty), statusLabel(item.vatTreatment), item.barcode])}
      />
    </Card>
    <QcLimitsEditor ctx={ctx} itemType="MATERIAL" />
    </div>
  )
}

function Products({ ctx }: { ctx: LiveCtx }) {
  const [code, setCode] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [salePrice, setSalePrice] = useState('0.180')
  return (
    <div className="space-y-4">
    <Card
      title="المنتجات"
      extra={
        <div className="flex flex-wrap items-center gap-3">
          <a className="text-sm font-bold text-[#1d7f72]" href="/print/labels" target="_blank">طباعة ملصقات الباركود</a>
          <FormDialog title="منتج نهائي" hint="سعر البيع للكيلوغرام بالريال العُماني، غير شامل الضريبة." openLabel="إضافة منتج">
            {(close) => (
              <form
                className="grid gap-3 md:grid-cols-2"
                onSubmit={async (event) => {
                  event.preventDefault()
                  const result = await ctx.act('createProduct', { code, nameAr, salePrice: Number(salePrice), vatTreatment: 'STANDARD', unit: 'كجم', bagKg: 50 })
                  if (result.ok) {
                    setCode('')
                    setNameAr('')
                    close()
                  }
                }}
              >
                <Field label="الكود"><TextInput value={code} onChange={(e) => setCode(e.target.value)} required /></Field>
                <Field label="الاسم"><TextInput value={nameAr} onChange={(e) => setNameAr(e.target.value)} required /></Field>
                <Field label="سعر البيع / كجم"><TextInput type="number" min="0" step="0.001" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} /></Field>
                <div className="flex items-end"><PrimaryButton disabled={ctx.pending}>حفظ</PrimaryButton></div>
              </form>
            )}
          </FormDialog>
        </div>
      }
    >
      <DataTable
        columns={['الكود', 'الاسم', 'السعر', 'الضريبة', 'كيس']}
        rows={ctx.state.products.map((item) => [item.code, item.nameAr, moneyFmt(item.salePrice), statusLabel(item.vatTreatment), `${item.bagKg} كجم`])}
      />
    </Card>
    <QcLimitsEditor ctx={ctx} itemType="PRODUCT" />
    </div>
  )
}

function Warehouses({ ctx }: { ctx: LiveCtx }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {ctx.state.warehouses.map((warehouse) => {
        const rows = ctx.state.balances.filter((row) => row.warehouse === warehouse.key && row.qty > 0)
        const value = rows.reduce((sum, row) => sum + row.qty * row.unitCost, 0)
        return (
          <Card key={warehouse.key} title={warehouse.nameAr} hint={`${rows.length} دفعة`}>
            <div className="text-2xl font-bold">{moneyFmt(value)}</div>
            <p className="mt-2 text-sm text-[#788983]">قيمة المخزون في هذا المستودع</p>
          </Card>
        )
      })}
    </div>
  )
}

function Balances({ ctx, materialsOnly }: { ctx: LiveCtx; materialsOnly: boolean }) {
  const rows = stockRows(ctx.state).filter((row) => (materialsOnly ? row.itemType === 'MATERIAL' : true))
  return (
    <Card title={materialsOnly ? 'دفعات المواد' : 'أرصدة المخزون'} extra={<a className="text-sm font-bold text-[#1d7f72]" href="/api/erp/export?kind=stock">تصدير Excel</a>}>
      <DataTable
        columns={['المستودع', 'الصنف', 'الدفعة', 'الكمية', 'التكلفة', 'القيمة', 'الصلاحية']}
        rows={rows.map((row) => [WAREHOUSE_LABEL[row.warehouse], row.nameAr, row.batchNo, qtyFmt(row.qty), moneyFmt(row.unitCost), moneyFmt(row.value), row.expiryDate ?? '—'])}
      />
    </Card>
  )
}

function Ledger({ ctx }: { ctx: LiveCtx }) {
  return (
    <Card title="دفتر حركات المخزون" hint="لا يتغيّر رصيد بدون حركة مسجّلة — كل إضافة أو صرف يظهر هنا مع الرصيد قبل وبعد.">
      <DataTable
        columns={['الوقت', 'النوع', 'المستودع', 'الصنف', 'الدفعة', 'الكمية', 'قبل', 'بعد']}
        rows={ctx.state.ledger.slice(0, 80).map((row) => [
          row.at.slice(0, 16).replace('T', ' '),
          statusLabel(row.type),
          WAREHOUSE_LABEL[row.warehouse],
          itemName(ctx.state, row.itemType, row.itemId),
          row.batchNo,
          qtyFmt(row.qty),
          qtyFmt(row.prevQty),
          qtyFmt(row.newQty),
        ])}
      />
    </Card>
  )
}

function Transfer({ ctx }: { ctx: LiveCtx }) {
  const [from, setFrom] = useState<WarehouseKey>('WH_RAW')
  const [to, setTo] = useState<WarehouseKey>('WH_MFG')
  const [itemId, setItemId] = useState(ctx.state.materials[0]?.id ?? '')
  const [batchNo, setBatchNo] = useState('')
  const [amount, setAmount] = useState('')
  const [formError, setFormError] = useState('')
  const batches = ctx.state.balances.filter((row) => row.itemId === itemId && row.warehouse === from && row.qty > 0)
  return (
    <Card
      title="آخر التحويلات"
      hint="المواد تُصرف للتصنيع من مستودع المواد الخام إلى مستودع التصنيع قبل إكمال أمر الإنتاج."
      extra={
        <FormDialog title="تحويل بين المستودعات" openLabel="تحويل جديد" wide>
          {(close) => (
            <form
              className="grid gap-3 md:grid-cols-2"
              onSubmit={async (event) => {
                event.preventDefault()
                const result = await ctx.act('transferStock', {
                  from,
                  to,
                  lines: [{ itemType: 'MATERIAL' as ItemType, itemId, batchNo, qty: Number(amount) }],
                })
                if (result.ok) {
                  setAmount('')
                  setBatchNo('')
                  setFormError('')
                  close()
                } else setFormError(result.message)
              }}
            >
              <Field label="من">
                <SelectInput value={from} onChange={(e) => setFrom(e.target.value as WarehouseKey)}>
                  {ctx.state.warehouses.map((warehouse) => <option key={warehouse.key} value={warehouse.key}>{warehouse.nameAr}</option>)}
                </SelectInput>
              </Field>
              <Field label="إلى">
                <SelectInput value={to} onChange={(e) => setTo(e.target.value as WarehouseKey)}>
                  {ctx.state.warehouses.map((warehouse) => <option key={warehouse.key} value={warehouse.key}>{warehouse.nameAr}</option>)}
                </SelectInput>
              </Field>
              <Field label="المادة">
                <SelectInput value={itemId} onChange={(e) => setItemId(e.target.value)}>
                  {ctx.state.materials.map((item) => <option key={item.id} value={item.id}>{item.nameAr}</option>)}
                </SelectInput>
              </Field>
              <Field label="الدفعة">
                <SelectInput value={batchNo} onChange={(e) => setBatchNo(e.target.value)} required>
                  <option value="">اختر الدفعة</option>
                  {batches.map((row) => <option key={row.id} value={row.batchNo}>{row.batchNo} — {qtyFmt(row.qty)}</option>)}
                </SelectInput>
              </Field>
              <Field label="الكمية"><TextInput type="number" min="0.001" step="0.001" value={amount} onChange={(e) => setAmount(e.target.value)} required /></Field>
              <div className="md:col-span-2"><InlineError message={formError} /></div>
              <div className="flex items-end"><PrimaryButton disabled={ctx.pending || !can(ctx.permissions, 'inventory.transfer.create')}>تحويل</PrimaryButton></div>
            </form>
          )}
        </FormDialog>
      }
    >
      <DataTable
        columns={['الرقم', 'من', 'إلى', 'التاريخ']}
        rows={ctx.state.transfers.slice(0, 20).map((row) => [row.number, WAREHOUSE_LABEL[row.from], WAREHOUSE_LABEL[row.to], row.at.slice(0, 10)])}
      />
    </Card>
  )
}

function Adjustment({ ctx }: { ctx: LiveCtx }) {
  const [warehouse, setWarehouse] = useState<WarehouseKey>('WH_RAW')
  const [itemId, setItemId] = useState(ctx.state.materials[0]?.id ?? '')
  const [batchNo, setBatchNo] = useState('')
  const [qtyDelta, setQtyDelta] = useState('')
  const [reason, setReason] = useState('')
  return (
    <div className="space-y-4">
      <Card
        title="طلبات التعديل"
        hint="لا يُنفَّذ التعديل إلا بعد اعتماد المدير العام، مع سبب مكتوب."
        extra={
          <FormDialog title="طلب تعديل مخزون" openLabel="طلب تعديل" wide>
            {(close) => (
              <form
                className="grid gap-3 md:grid-cols-2"
                onSubmit={async (event) => {
                  event.preventDefault()
                  const result = await ctx.act('requestAdjustment', { warehouse, itemType: 'MATERIAL', itemId, batchNo, qtyDelta: Number(qtyDelta), reason })
                  if (result.ok) {
                    setReason('')
                    setQtyDelta('')
                    setBatchNo('')
                    close()
                  }
                }}
              >
                <Field label="المستودع">
                  <SelectInput value={warehouse} onChange={(e) => setWarehouse(e.target.value as WarehouseKey)}>
                    {ctx.state.warehouses.map((item) => <option key={item.key} value={item.key}>{item.nameAr}</option>)}
                  </SelectInput>
                </Field>
                <Field label="المادة">
                  <SelectInput value={itemId} onChange={(e) => setItemId(e.target.value)}>
                    {ctx.state.materials.map((item) => <option key={item.id} value={item.id}>{item.nameAr}</option>)}
                  </SelectInput>
                </Field>
                <Field label="الدفعة"><TextInput value={batchNo} onChange={(e) => setBatchNo(e.target.value)} required /></Field>
                <Field label="الفرق (+/-)"><TextInput type="number" step="0.001" value={qtyDelta} onChange={(e) => setQtyDelta(e.target.value)} required /></Field>
                <Field label="السبب"><TextInput value={reason} onChange={(e) => setReason(e.target.value)} required /></Field>
                <div className="flex items-end"><PrimaryButton disabled={ctx.pending}>إرسال للاعتماد</PrimaryButton></div>
              </form>
            )}
          </FormDialog>
        }
      >
        <DataTable
          columns={['الرقم', 'السبب', 'الفرق', 'الحالة', '']}
          rows={ctx.state.adjustments.map((row) => [
            row.number,
            row.reason,
            qtyFmt(row.qtyDelta),
            <Badge key={row.id} tone={toneForStatus(row.status)}>{statusLabel(row.status)}</Badge>,
            row.status === 'PENDING_APPROVAL' && can(ctx.permissions, 'approvals.decide') ? (
              <span key={`${row.id}-a`} className="flex gap-2">
                <GhostButton type="button" onClick={() => ctx.act('decideAdjustment', { id: row.id, decision: 'APPROVED' })}>اعتماد</GhostButton>
                <GhostButton type="button" onClick={() => ctx.act('decideAdjustment', { id: row.id, decision: 'REJECTED' })}>رفض</GhostButton>
              </span>
            ) : '—',
          ])}
        />
      </Card>
    </div>
  )
}

function BarcodeStation({ ctx }: { ctx: LiveCtx }) {
  const [code, setCode] = useState('')
  const [found, setFound] = useState<string>('')
  return (
    <Card title="محطة الباركود" hint="قارئ USB يعمل كلوحة مفاتيح: وجّه المؤشر هنا وامسح. Enter يُنهي القراءة.">
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={async (event) => {
          event.preventDefault()
          const result = await ctx.act('scanBarcode', { code })
          setFound(result.ok ? result.message : result.message)
        }}
      >
        <TextInput autoFocus value={code} onChange={(e) => setCode(e.target.value)} placeholder="امسح أو اكتب RM-CORN" />
        <PrimaryButton disabled={ctx.pending}>بحث</PrimaryButton>
      </form>
      {found ? <p className="mt-4 text-lg font-bold">{found}</p> : null}
      <p className="mt-4 text-sm text-[#788983]">لطباعة الملصق استخدم طابعة الباركود أو أي طابعة ورق من صفحة الملصقات.</p>
      <a className="mt-3 inline-flex text-sm font-bold text-[#1d7f72]" href="/print/labels" target="_blank" rel="noreferrer">فتح ملصقات الطباعة</a>
    </Card>
  )
}

function SpareParts({ ctx }: { ctx: LiveCtx }) {
  const [code, setCode] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [minStock, setMinStock] = useState('')
  const [supplierId, setSupplierId] = useState('')
  return (
    <div className="space-y-4">
      <Card
        title="قطع الغيار"
        extra={
          can(ctx.permissions, 'spareparts.manage') ? (
            <FormDialog title="قطعة غيار جديدة" openLabel="إضافة قطعة غيار">
              {(close) => (
                <form
                  className="grid gap-3 md:grid-cols-2"
                  onSubmit={async (event) => {
                    event.preventDefault()
                    const result = await ctx.act('createSparePart', {
                      code,
                      nameAr,
                      description,
                      quantity: Number(quantity),
                      unitCost: Number(unitCost),
                      minStock: Number(minStock),
                      supplierId: supplierId || undefined,
                    })
                    if (result.ok) {
                      setCode('')
                      setNameAr('')
                      setDescription('')
                      setQuantity('')
                      setUnitCost('')
                      setMinStock('')
                      setSupplierId('')
                      close()
                    }
                  }}
                >
                  <Field label="الكود"><TextInput value={code} onChange={(e) => setCode(e.target.value)} required /></Field>
                  <Field label="الاسم"><TextInput value={nameAr} onChange={(e) => setNameAr(e.target.value)} required /></Field>
                  <Field label="الوصف"><TextInput value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
                  <Field label="الكمية"><TextInput type="number" min="0" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required /></Field>
                  <Field label="تكلفة الوحدة"><TextInput type="number" min="0" step="0.001" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} required /></Field>
                  <Field label="الحد الأدنى"><TextInput type="number" min="0" step="1" value={minStock} onChange={(e) => setMinStock(e.target.value)} required /></Field>
                  <Field label="المورد">
                    <SelectInput value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                      <option value="">بدون</option>
                      {ctx.state.suppliers.map((item) => <option key={item.id} value={item.id}>{item.nameAr}</option>)}
                    </SelectInput>
                  </Field>
                  <div className="flex items-end"><PrimaryButton disabled={ctx.pending}>حفظ</PrimaryButton></div>
                </form>
              )}
            </FormDialog>
          ) : null
        }
      >
        <DataTable
          columns={['الكود', 'الاسم', 'الوصف', 'الكمية', 'تكلفة الوحدة', 'الحد الأدنى', 'الحالة']}
          rows={(ctx.state.spareParts ?? []).map((item) => [
            item.code,
            item.nameAr,
            item.description || '—',
            qtyFmt(item.quantity),
            moneyFmt(item.unitCost),
            qtyFmt(item.minStock),
            item.active ? 'نشط' : 'موقوف',
          ])}
        />
      </Card>
    </div>
  )
}

function PackagingMaterials({ ctx }: { ctx: LiveCtx }) {
  const [code, setCode] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [category, setCategory] = useState<'BAG' | 'THREAD' | 'INK' | 'PAPER' | 'LABEL' | 'OTHER'>('BAG')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('قطعة')
  const [unitCost, setUnitCost] = useState('')
  const [minStock, setMinStock] = useState('')
  const [expectedPerTon, setExpectedPerTon] = useState('')
  const [supplierId, setSupplierId] = useState('')
  return (
    <div className="space-y-4">
      <Card
        title="مواد التعبئة"
        extra={
          can(ctx.permissions, 'packaging.manage') ? (
            <FormDialog title="مادة تعبئة جديدة" openLabel="إضافة مادة تعبئة">
              {(close) => (
                <form
                  className="grid gap-3 md:grid-cols-2"
                  onSubmit={async (event) => {
                    event.preventDefault()
                    const result = await ctx.act('createPackagingMaterial', {
                      code,
                      nameAr,
                      category,
                      quantity: Number(quantity),
                      unit,
                      unitCost: Number(unitCost),
                      minStock: Number(minStock),
                      supplierId: supplierId || undefined,
                      expectedPerTon: expectedPerTon === '' ? undefined : Number(expectedPerTon),
                    })
                    if (result.ok) {
                      setCode('')
                      setNameAr('')
                      setQuantity('')
                      setUnitCost('')
                      setMinStock('')
                      setExpectedPerTon('')
                      setSupplierId('')
                      close()
                    }
                  }}
                >
                  <Field label="الكود"><TextInput value={code} onChange={(e) => setCode(e.target.value)} required /></Field>
                  <Field label="الاسم"><TextInput value={nameAr} onChange={(e) => setNameAr(e.target.value)} required /></Field>
                  <Field label="التصنيف">
                    <SelectInput value={category} onChange={(e) => setCategory(e.target.value as 'BAG' | 'THREAD' | 'INK' | 'PAPER' | 'LABEL' | 'OTHER')}>
                      <option value="BAG">أكياس</option>
                      <option value="THREAD">خيوط</option>
                      <option value="INK">حبر</option>
                      <option value="PAPER">ورق</option>
                      <option value="LABEL">ملصقات</option>
                      <option value="OTHER">أخرى</option>
                    </SelectInput>
                  </Field>
                  <Field label="الكمية"><TextInput type="number" min="0" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required /></Field>
                  <Field label="الوحدة"><TextInput value={unit} onChange={(e) => setUnit(e.target.value)} required /></Field>
                  <Field label="تكلفة الوحدة"><TextInput type="number" min="0" step="0.001" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} required /></Field>
                  <Field label="الحد الأدنى"><TextInput type="number" min="0" step="1" value={minStock} onChange={(e) => setMinStock(e.target.value)} required /></Field>
                  <Field label="الاستهلاك المتوقع لكل طن (اختياري)">
                    <TextInput type="number" min="0" step="0.001" value={expectedPerTon} onChange={(e) => setExpectedPerTon(e.target.value)} />
                  </Field>
                  <Field label="المورد">
                    <SelectInput value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                      <option value="">بدون</option>
                      {ctx.state.suppliers.map((item) => <option key={item.id} value={item.id}>{item.nameAr}</option>)}
                    </SelectInput>
                  </Field>
                  <div className="flex items-end"><PrimaryButton disabled={ctx.pending}>حفظ</PrimaryButton></div>
                </form>
              )}
            </FormDialog>
          ) : null
        }
      >
        <DataTable
          columns={['الكود', 'الاسم', 'التصنيف', 'الكمية', 'الوحدة', 'تكلفة الوحدة', 'الحد الأدنى', 'الحالة']}
          rows={(ctx.state.packagingMaterials ?? []).map((item) => [
            item.code,
            item.nameAr,
            statusLabel(item.category),
            qtyFmt(item.quantity),
            item.unit,
            moneyFmt(item.unitCost),
            qtyFmt(item.minStock),
            item.active ? 'نشط' : 'موقوف',
          ])}
        />
      </Card>
    </div>
  )
}

function InventoryExtensions({ ctx }: { ctx: LiveCtx }) {
  const [activeTab, setActiveTab] = useState<'spareParts' | 'packaging'>('spareParts')
  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-[#e5e7eb] pb-2">
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'spareParts' ? 'text-[#1d7f72] border-b-2 border-[#1d7f72]' : 'text-[#6b7280]'}`}
          onClick={() => setActiveTab('spareParts')}
        >
          قطع الغيار
        </button>
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'packaging' ? 'text-[#1d7f72] border-b-2 border-[#1d7f72]' : 'text-[#6b7280]'}`}
          onClick={() => setActiveTab('packaging')}
        >
          مواد التعبئة
        </button>
      </div>
      {activeTab === 'spareParts' ? <SpareParts ctx={ctx} /> : <PackagingMaterials ctx={ctx} />}
    </div>
  )
}

export function PurchasingScreens({ entityKey, ctx }: { entityKey: string; ctx: LiveCtx }) {
  if (entityKey === 'supplier') return <Suppliers ctx={ctx} />
  if (entityKey === 'purchaseOrder') return <PurchaseOrders ctx={ctx} />
  if (entityKey === 'goodsReceipt') return <Receipts ctx={ctx} />
  if (entityKey === 'supplierRelations') return <SupplierRelations entityKey={entityKey} ctx={ctx} />
  return null
}

function Suppliers({ ctx }: { ctx: LiveCtx }) {
  const [nameAr, setNameAr] = useState('')
  const [vatNumber, setVatNumber] = useState('')
  const [phone, setPhone] = useState('')
  return (
    <Card
      title="الموردون"
      extra={
        can(ctx.permissions, 'purchasing.po.create') ? (
          <FormDialog title="مورد جديد" openLabel="إضافة مورد">
            {(close) => (
              <form className="grid gap-3" onSubmit={async (event) => {
                event.preventDefault()
                const result = await ctx.act('createSupplier', { nameAr, vatNumber, phone })
                if (result.ok) {
                  setNameAr('')
                  setVatNumber('')
                  setPhone('')
                  close()
                }
              }}>
                <Field label="الاسم"><TextInput value={nameAr} onChange={(e) => setNameAr(e.target.value)} required /></Field>
                <Field label="الرقم الضريبي"><TextInput value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} /></Field>
                <Field label="الهاتف"><TextInput value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
                <PrimaryButton disabled={ctx.pending}>حفظ</PrimaryButton>
              </form>
            )}
          </FormDialog>
        ) : null
      }
    >
      <DataTable columns={['الكود', 'الاسم', 'الرقم الضريبي', 'الهاتف']} rows={ctx.state.suppliers.map((item) => [item.code, item.nameAr, item.vatNumber || '—', item.phone || '—'])} />
    </Card>
  )
}

function PurchaseOrders({ ctx }: { ctx: LiveCtx }) {
  const editor = useLines({ materialId: ctx.state.materials[0]?.id ?? '', qty: '', unitCost: '' })
  const [supplierId, setSupplierId] = useState(ctx.state.suppliers[0]?.id ?? '')
  const [notes, setNotes] = useState('')
  return (
    <div className="space-y-4">
      <Card
        title="أوامر الشراء"
        hint="يصل للمدير العام للاعتماد قبل أن يُسمح بالاستلام."
        extra={
          can(ctx.permissions, 'purchasing.po.create') ? (
            <FormDialog title="أمر شراء جديد" openLabel="أمر شراء" wide>
              {(close) => (
                <form className="space-y-3" onSubmit={async (event) => {
                  event.preventDefault()
                  const result = await ctx.act('createPurchaseOrder', {
                    supplierId,
                    notes,
                    lines: editor.lines.map((line) => ({ materialId: line.materialId, qty: Number(line.qty), unitCost: Number(line.unitCost) })),
                  })
                  if (result.ok) {
                    editor.reset()
                    setNotes('')
                    close()
                  }
                }}>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="المورد">
                      <SelectInput value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                        {ctx.state.suppliers.map((item) => <option key={item.id} value={item.id}>{item.nameAr}</option>)}
                      </SelectInput>
                    </Field>
                    <Field label="ملاحظات"><TextInput value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
                  </div>
                  {editor.lines.map((line, index) => (
                    <div key={index} className="grid gap-3 md:grid-cols-3">
                      <SelectInput value={line.materialId} onChange={(e) => editor.update(index, { materialId: e.target.value })}>
                        {ctx.state.materials.map((item) => <option key={item.id} value={item.id}>{item.nameAr}</option>)}
                      </SelectInput>
                      <TextInput type="number" min="0.001" step="0.001" placeholder="الكمية" value={line.qty} onChange={(e) => editor.update(index, { qty: e.target.value })} required />
                      <TextInput type="number" min="0" step="0.001" placeholder="سعر الوحدة" value={line.unitCost} onChange={(e) => editor.update(index, { unitCost: e.target.value })} required />
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <GhostButton type="button" onClick={editor.add}>بند آخر</GhostButton>
                    <PrimaryButton disabled={ctx.pending}>إرسال للاعتماد</PrimaryButton>
                  </div>
                </form>
              )}
            </FormDialog>
          ) : null
        }
      >
        <DataTable
          columns={['الرقم', 'المورد', 'الحالة', '']}
          rows={ctx.state.purchaseOrders.map((order) => [
            order.number,
            partyName(ctx.state.suppliers, order.supplierId),
            <Badge key={order.id} tone={toneForStatus(order.status)}>{statusLabel(order.status)}</Badge>,
            <span key={`${order.id}-p`} className="flex flex-wrap gap-2">
              <a className="text-sm font-bold text-[#1d7f72]" href={`/print/po/${order.id}`} target="_blank" rel="noreferrer">طباعة</a>
              {order.status === 'PENDING_APPROVAL' && can(ctx.permissions, 'purchasing.po.approve') ? (
                <GhostButton type="button" onClick={() => ctx.act('decidePurchaseOrder', { id: order.id, decision: 'APPROVED' })}>اعتماد</GhostButton>
              ) : null}
            </span>,
          ])}
        />
      </Card>
    </div>
  )
}

function Receipts({ ctx }: { ctx: LiveCtx }) {
  const open = ctx.state.purchaseOrders.filter((order) => order.status === 'APPROVED' || order.status === 'PARTIALLY_RECEIVED')
  const [purchaseOrderId, setPurchaseOrderId] = useState(open[0]?.id ?? '')
  const order = open.find((item) => item.id === purchaseOrderId)
  const [draft, setDraft] = useState<Record<string, { qty: string; batchNo: string; expiryDate: string }>>({})
  const [formError, setFormError] = useState('')
  return (
    <div className="space-y-4">
      <Card
        title="سندات الاستلام"
        hint="لا يمكن استلام كمية أكبر من أمر الشراء المعتمد."
        extra={
          <FormDialog title="استلام إلى مستودع المواد الخام" openLabel="تسجيل استلام" wide>
            {(close) => (
              <form className="space-y-3" onSubmit={async (event) => {
                event.preventDefault()
                if (!order) return
                const lines = order.lines
                  .filter((line) => line.receivedQty < line.qty)
                  .map((line) => {
                    const row = draft[line.materialId]
                    return {
                      materialId: line.materialId,
                      qty: Number(row?.qty || 0),
                      batchNo: row?.batchNo || '',
                      expiryDate: row?.expiryDate || null,
                    }
                  })
                  .filter((line) => line.qty > 0)
                const result = await ctx.act('receiveGoods', { purchaseOrderId, lines })
                if (result.ok) {
                  setDraft({})
                  setFormError('')
                  close()
                } else setFormError(result.message)
              }}>
                <Field label="أمر الشراء">
                  <SelectInput value={purchaseOrderId} onChange={(e) => setPurchaseOrderId(e.target.value)}>
                    {open.length === 0 ? <option value="">لا يوجد أمر معتمد بانتظار الاستلام</option> : null}
                    {open.map((item) => <option key={item.id} value={item.id}>{item.number}</option>)}
                  </SelectInput>
                </Field>
                {order?.lines.filter((line) => line.receivedQty < line.qty).map((line) => (
                  <div key={line.materialId} className="grid gap-2 md:grid-cols-2">
                    <div className="text-sm font-semibold md:col-span-2">{materialName(ctx.state, line.materialId)} — متبقي {qtyFmt(line.qty - line.receivedQty)}</div>
                    <TextInput type="number" min="0" step="0.001" placeholder="الكمية المستلمة" value={draft[line.materialId]?.qty ?? ''} onChange={(e) => setDraft((current) => ({ ...current, [line.materialId]: { qty: e.target.value, batchNo: current[line.materialId]?.batchNo ?? '', expiryDate: current[line.materialId]?.expiryDate ?? '' } }))} />
                    <TextInput placeholder="رقم الدفعة" value={draft[line.materialId]?.batchNo ?? ''} onChange={(e) => setDraft((current) => ({ ...current, [line.materialId]: { qty: current[line.materialId]?.qty ?? '', batchNo: e.target.value, expiryDate: current[line.materialId]?.expiryDate ?? '' } }))} />
                    <TextInput type="date" value={draft[line.materialId]?.expiryDate ?? ''} onChange={(e) => setDraft((current) => ({ ...current, [line.materialId]: { qty: current[line.materialId]?.qty ?? '', batchNo: current[line.materialId]?.batchNo ?? '', expiryDate: e.target.value } }))} />
                  </div>
                ))}
                <InlineError message={formError} />
                <PrimaryButton disabled={ctx.pending || !can(ctx.permissions, 'purchasing.gr.create') || !order}>تسجيل الاستلام</PrimaryButton>
              </form>
            )}
          </FormDialog>
        }
      >
        <DataTable columns={['السند', 'أمر الشراء', 'التاريخ']} rows={ctx.state.goodsReceipts.map((row) => [row.number, ctx.state.purchaseOrders.find((order) => order.id === row.purchaseOrderId)?.number ?? '', row.at.slice(0, 10)])} />
      </Card>
    </div>
  )
}

function SupplierTemplates({ ctx }: { ctx: LiveCtx }) {
  const [nameAr, setNameAr] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [kind, setKind] = useState<'QUOTE_REQUEST' | 'INQUIRY' | 'ORDER' | 'OTHER'>('QUOTE_REQUEST')
  return (
    <div className="space-y-4">
      <Card
        title="قوالب التواصل"
        extra={
          can(ctx.permissions, 'suppliers.communicate') ? (
            <FormDialog title="قالب جديد" openLabel="إضافة قالب">
              {(close) => (
                <form className="grid gap-3" onSubmit={async (event) => {
                  event.preventDefault()
                  const result = await ctx.act('createSupplierTemplate', { nameAr, subject, body, kind })
                  if (result.ok) {
                    setNameAr('')
                    setSubject('')
                    setBody('')
                    close()
                  }
                }}>
                  <Field label="الاسم"><TextInput value={nameAr} onChange={(e) => setNameAr(e.target.value)} required /></Field>
                  <Field label="النوع">
                    <SelectInput value={kind} onChange={(e) => setKind(e.target.value as 'QUOTE_REQUEST' | 'INQUIRY' | 'ORDER' | 'OTHER')}>
                      <option value="QUOTE_REQUEST">طلب عرض سعر</option>
                      <option value="INQUIRY">استفسار</option>
                      <option value="ORDER">أمر</option>
                      <option value="OTHER">أخرى</option>
                    </SelectInput>
                  </Field>
                  <Field label="الموضوع"><TextInput value={subject} onChange={(e) => setSubject(e.target.value)} required /></Field>
                  <Field label="المحتوى"><textarea className="min-h-24 w-full rounded-xl border border-[#dfe7e3] p-3 text-sm" value={body} onChange={(e) => setBody(e.target.value)} required /></Field>
                  <PrimaryButton disabled={ctx.pending}>حفظ</PrimaryButton>
                </form>
              )}
            </FormDialog>
          ) : null
        }
      >
        <DataTable
          columns={['الاسم', 'النوع', 'الموضوع', 'الحالة']}
          rows={(ctx.state.supplierTemplates ?? []).map((item) => [
            item.nameAr,
            statusLabel(item.kind),
            item.subject,
            item.active ? 'نشط' : 'موقوف',
          ])}
        />
      </Card>
    </div>
  )
}

function SupplierCommunications({ ctx }: { ctx: LiveCtx }) {
  const [supplierId, setSupplierId] = useState(ctx.state.suppliers[0]?.id ?? '')
  const [templateId, setTemplateId] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [channel, setChannel] = useState<'EMAIL' | 'WHATSAPP' | 'OTHER'>('EMAIL')
  return (
    <div className="space-y-4">
      <Card
        title="تواصل الموردين"
        extra={
          can(ctx.permissions, 'suppliers.communicate') ? (
            <FormDialog title="رسالة جديدة" openLabel="إرسال رسالة">
              {(close) => (
                <form className="grid gap-3" onSubmit={async (event) => {
                  event.preventDefault()
                  const result = await ctx.act('createSupplierCommunication', {
                    supplierId,
                    templateId: templateId || undefined,
                    subject,
                    body,
                    channel,
                  })
                  if (result.ok) {
                    setSubject('')
                    setBody('')
                    setTemplateId('')
                    close()
                  }
                }}>
                  <Field label="المورد">
                    <SelectInput value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                      {ctx.state.suppliers.map((item) => <option key={item.id} value={item.id}>{item.nameAr}</option>)}
                    </SelectInput>
                  </Field>
                  <Field label="القالب">
                    <SelectInput value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                      <option value="">بدون قالب</option>
                      {(ctx.state.supplierTemplates ?? []).map((item) => <option key={item.id} value={item.id}>{item.nameAr}</option>)}
                    </SelectInput>
                  </Field>
                  <Field label="الموضوع"><TextInput value={subject} onChange={(e) => setSubject(e.target.value)} required /></Field>
                  <Field label="المحتوى"><textarea className="min-h-24 w-full rounded-xl border border-[#dfe7e3] p-3 text-sm" value={body} onChange={(e) => setBody(e.target.value)} required /></Field>
                  <Field label="القناة">
                    <SelectInput value={channel} onChange={(e) => setChannel(e.target.value as 'EMAIL' | 'WHATSAPP' | 'OTHER')}>
                      <option value="EMAIL">بريد إلكتروني</option>
                      <option value="WHATSAPP">واتساب</option>
                      <option value="OTHER">أخرى</option>
                    </SelectInput>
                  </Field>
                  <PrimaryButton disabled={ctx.pending}>إرسال</PrimaryButton>
                </form>
              )}
            </FormDialog>
          ) : null
        }
      >
        <DataTable
          columns={['المورد', 'الموضوع', 'القناة', 'الحالة', 'التاريخ']}
          rows={(ctx.state.supplierCommunications ?? []).map((item) => [
            partyName(ctx.state.suppliers, item.supplierId),
            item.subject,
            statusLabel(item.channel),
            statusLabel(item.status),
            item.sentAt.slice(0, 10),
          ])}
        />
      </Card>
    </div>
  )
}

export function ProductionScreens({ entityKey, ctx }: { entityKey: string; ctx: LiveCtx }) {
  if (entityKey === 'productionReports') return <ReportEntry ctx={ctx} section="production" />
  if (entityKey === 'recipe' || entityKey === 'recipeItem') return <Recipes ctx={ctx} />
  if (entityKey === 'productionOrder') return <Production ctx={ctx} />
  if (entityKey === 'customerRecipe') return <CustomerRecipes ctx={ctx} />
  if (entityKey === 'scaleReading') return <ScaleReadings ctx={ctx} />
  if (entityKey === 'machine') return <Machines ctx={ctx} />
  if (entityKey === 'maintenanceSchedule') return <MaintenanceSchedules ctx={ctx} />
  if (entityKey === 'maintenanceRecord') return <MaintenanceRecords ctx={ctx} />
  return null
}

function Recipes({ ctx }: { ctx: LiveCtx }) {
  const [productId, setProductId] = useState(ctx.state.products[0]?.id ?? '')
  const [nameAr, setNameAr] = useState('وصفة جديدة')
  const [baseOutputQty, setBaseOutputQty] = useState('1000')
  const [qtys, setQtys] = useState<Record<string, string>>({})
  return (
    <div className="space-y-4">
      <Card
        title="الوصفات"
        hint="الكمية المتوقعة = كمية الأمر × (كمية المكوّن ÷ أساس الوصفة)."
        extra={
          <FormDialog title="وصفة BOM" openLabel="وصفة جديدة" wide>
            {(close) => (
              <form className="space-y-3" onSubmit={async (event) => {
                event.preventDefault()
                const items = ctx.state.materials
                  .map((material) => ({ materialId: material.id, qty: Number(qtys[material.id] || 0) }))
                  .filter((item) => item.qty > 0)
                const result = await ctx.act('createRecipe', { productId, nameAr, baseOutputQty: Number(baseOutputQty), items })
                if (result.ok) {
                  setQtys({})
                  setNameAr('وصفة جديدة')
                  close()
                }
              }}>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="المنتج">
                    <SelectInput value={productId} onChange={(e) => setProductId(e.target.value)}>
                      {ctx.state.products.map((item) => <option key={item.id} value={item.id}>{item.nameAr}</option>)}
                    </SelectInput>
                  </Field>
                  <Field label="اسم الوصفة"><TextInput value={nameAr} onChange={(e) => setNameAr(e.target.value)} /></Field>
                  <Field label="أساس المخرجات (كجم)"><TextInput type="number" min="0.001" step="0.001" value={baseOutputQty} onChange={(e) => setBaseOutputQty(e.target.value)} /></Field>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {ctx.state.materials.map((material) => (
                    <label key={material.id} className="flex items-center justify-between gap-3 text-sm">
                      <span>{material.nameAr}</span>
                      <input className="h-10 w-32 rounded-xl border border-[#dfe7e3] px-3" type="number" min="0" step="0.001" placeholder="كجم" value={qtys[material.id] ?? ''} onChange={(e) => setQtys((current) => ({ ...current, [material.id]: e.target.value }))} />
                    </label>
                  ))}
                </div>
                <PrimaryButton disabled={ctx.pending || !can(ctx.permissions, 'production.create')}>حفظ الوصفة</PrimaryButton>
              </form>
            )}
          </FormDialog>
        }
      >
        <DataTable
          columns={['الوصفة', 'المنتج', 'الأساس', 'المكونات']}
          rows={ctx.state.recipes.map((recipe) => [
            recipe.nameAr,
            productName(ctx.state, recipe.productId),
            qtyFmt(recipe.baseOutputQty),
            recipe.items.map((item) => `${materialName(ctx.state, item.materialId)} ${qtyFmt(item.qty)}`).join('، '),
          ])}
        />
      </Card>
    </div>
  )
}

function Production({ ctx }: { ctx: LiveCtx }) {
  const [productId, setProductId] = useState(ctx.state.products[0]?.id ?? '')
  const recipes = ctx.state.recipes.filter((recipe) => recipe.productId === productId)
  const [recipeId, setRecipeId] = useState(recipes[0]?.id ?? '')
  const [plannedQty, setPlannedQty] = useState('1000')
  const [completingId, setCompletingId] = useState<string | null>(null)
  const activeRecipe = ctx.state.recipes.find((recipe) => recipe.id === (recipeId || recipes[0]?.id))
  const completing = ctx.state.productionOrders.find((order) => order.id === completingId && order.status === 'RELEASED')
  return (
    <div className="space-y-4">
      <Card
        title="أوامر الإنتاج"
        hint="احسب المتوقع ثم حوّل المواد لمستودع التصنيع، وبعدها سجّل الفعلي والهدر."
        extra={
          <FormDialog title="أمر إنتاج" openLabel="أمر إنتاج">
            {(close) => (
              <form className="grid gap-3" onSubmit={async (event) => {
                event.preventDefault()
                const result = await ctx.act('createProductionOrder', { productId, recipeId: recipeId || recipes[0]?.id, plannedQty: Number(plannedQty) })
                if (result.ok) close()
              }}>
                <Field label="المنتج">
                  <SelectInput value={productId} onChange={(e) => { setProductId(e.target.value); setRecipeId('') }}>
                    {ctx.state.products.map((item) => <option key={item.id} value={item.id}>{item.nameAr}</option>)}
                  </SelectInput>
                </Field>
                <Field label="الوصفة">
                  <SelectInput value={recipeId || recipes[0]?.id || ''} onChange={(e) => setRecipeId(e.target.value)}>
                    {recipes.map((recipe) => <option key={recipe.id} value={recipe.id}>{recipe.nameAr}</option>)}
                  </SelectInput>
                </Field>
                <Field label="الكمية المخططة"><TextInput type="number" min="0.001" step="0.001" value={plannedQty} onChange={(e) => setPlannedQty(e.target.value)} /></Field>
                {activeRecipe && Number(plannedQty) > 0 ? (
                  <p className="text-sm text-[#53655e]">
                    المتوقع: {activeRecipe.items.map((item) => `${materialName(ctx.state, item.materialId)} ${qtyFmt(Number(plannedQty) * (item.qty / activeRecipe.baseOutputQty))}`).join(' — ')}
                  </p>
                ) : null}
                <PrimaryButton disabled={ctx.pending || !can(ctx.permissions, 'production.create')}>فتح الأمر</PrimaryButton>
              </form>
            )}
          </FormDialog>
        }
      >
        <DataTable
          columns={['الرقم', 'المنتج', 'المخطط', 'الفعلي', 'الفرق عن المتوقع', 'التكلفة', 'الحالة', '']}
          rows={ctx.state.productionOrders.map((order) => [
            order.number,
            productName(ctx.state, order.productId),
            qtyFmt(order.plannedQty),
            qtyFmt(order.actualOutputQty),
            order.status === 'COMPLETED'
              ? order.expected
                  .map((line) => {
                    const diffPct = line.expectedQty > 0 ? Math.round(((line.actualQty - line.expectedQty) / line.expectedQty) * 1000) / 10 : 0
                    const waste = line.wasteQty > 0 ? `، هدر ${qtyFmt(line.wasteQty)}` : ''
                    return `${materialName(ctx.state, line.materialId)} ${pctFmt(diffPct)}${waste}`
                  })
                  .join(' — ') || '—'
              : '—',
            moneyFmt(order.totalCost),
            statusLabel(order.status),
            order.status === 'RELEASED' ? (
              <GhostButton key={`${order.id}-done`} type="button" onClick={() => setCompletingId(order.id)}>إكمال</GhostButton>
            ) : '—',
          ])}
        />
      </Card>
      {completing ? <CompleteBox ctx={ctx} orderId={completing.id} onClose={() => setCompletingId(null)} /> : null}
    </div>
  )
}

function CompleteBox({ ctx, orderId, onClose }: { ctx: LiveCtx; orderId: string; onClose: () => void }) {
  const order = ctx.state.productionOrders.find((item) => item.id === orderId)!
  const operators = ctx.state.employees.filter((item) => item.active)
  const [operatorId, setOperatorId] = useState(operators.find((item) => item.department === 'الإنتاج')?.id ?? operators[0]?.id ?? '')
  const [actuals, setActuals] = useState<Record<string, { actualQty: string; wasteQty: string }>>({})
  const [output, setOutput] = useState(String(order.plannedQty))
  const [reason, setReason] = useState('')
  const [costs, setCosts] = useState({ ELECTRICITY: '', GAS: '', LABOR: '', TRANSPORT: '', MAINTENANCE: '', OVERHEAD: '' })
  const [formError, setFormError] = useState('')
  const needsReason = formError.includes('سبب الانحراف')
  return (
    <Dialog title={`إكمال ${order.number}`} hint="الصرف يتم من مستودع التصنيع فقط. الناتج المتوقع يُحسب من الوصفة على الكمية الداخلة فعلاً. إذا تجاوز الانحراف حد الشركة فسبب الانحراف إلزامي. بند تكلفة أعلى من حد الاعتماد يُحفظ بانتظار المدير أو المحاسب ولا يدخل في الهامش قبل ذلك." wide onClose={onClose}>
      <form className="space-y-2" onSubmit={async (event) => {
        event.preventDefault()
        setFormError('')
        const result = await ctx.act('completeProduction', {
          productionOrderId: order.id,
          operatorId,
          actualOutputQty: Number(output),
          varianceReason: reason,
          costLines: (Object.entries(costs) as Array<[keyof typeof costs, string]>)
            .filter(([, value]) => value.trim() !== '')
            .map(([type, value]) => ({ type, amount: Number(value) })),
          actuals: order.expected.map((line) => ({
            materialId: line.materialId,
            actualQty: Number(actuals[line.materialId]?.actualQty || line.expectedQty),
            wasteQty: Number(actuals[line.materialId]?.wasteQty || 0),
          })),
        })
        if (result.ok) onClose()
        else setFormError(result.message)
      }}>
        {order.expected.map((line) => (
          <div key={line.materialId} className="grid items-center gap-2 md:grid-cols-4">
            <div className="text-sm font-semibold">{materialName(ctx.state, line.materialId)}</div>
            <div className="text-sm text-[#788983]">متوقع {qtyFmt(line.expectedQty)}</div>
            <TextInput type="number" min="0" step="0.001" placeholder="الفعلي" value={actuals[line.materialId]?.actualQty ?? String(line.expectedQty)} onChange={(e) => setActuals((current) => ({ ...current, [line.materialId]: { actualQty: e.target.value, wasteQty: current[line.materialId]?.wasteQty ?? '0' } }))} />
            <TextInput type="number" min="0" step="0.001" placeholder="الهدر" value={actuals[line.materialId]?.wasteQty ?? '0'} onChange={(e) => setActuals((current) => ({ ...current, [line.materialId]: { actualQty: current[line.materialId]?.actualQty ?? String(line.expectedQty), wasteQty: e.target.value } }))} />
          </div>
        ))}
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="مشغّل الخط">
            <SelectInput value={operatorId} onChange={(e) => setOperatorId(e.target.value)} required>
              {operators.map((item) => <option key={item.id} value={item.id}>{item.nameAr}</option>)}
            </SelectInput>
          </Field>
          <Field label="الناتج الفعلي (كجم)"><TextInput type="number" min="0.001" step="0.001" value={output} onChange={(e) => setOutput(e.target.value)} /></Field>
          <Field label={needsReason ? 'سبب الانحراف مطلوب' : 'سبب الانحراف إن وجد'}><TextInput value={reason} onChange={(e) => setReason(e.target.value)} required={needsReason} aria-invalid={needsReason} /></Field>
        </div>
        <p className="text-sm text-[#53655e]">بنود التكلفة اليدوية تستبدل سعر التحميل للطن. اتركها فارغة لاستخدام إعدادات الشركة. الأكياس تُحسب من وزن الكيس.</p>
        <div className="grid gap-3 md:grid-cols-3">
          {([
            ['ELECTRICITY', 'كهرباء'],
            ['GAS', 'غاز'],
            ['LABOR', 'أجور'],
            ['TRANSPORT', 'نقل'],
            ['MAINTENANCE', 'صيانة'],
            ['OVERHEAD', 'مصاريف عامة'],
          ] as const).map(([key, label]) => (
            <Field key={key} label={label}>
              <TextInput type="number" min="0" step="0.001" value={costs[key]} onChange={(e) => setCosts({ ...costs, [key]: e.target.value })} />
            </Field>
          ))}
        </div>
        <InlineError message={formError} />
        <PrimaryButton disabled={ctx.pending || !can(ctx.permissions, 'production.complete')}>إكمال الإنتاج</PrimaryButton>
      </form>
    </Dialog>
  )
}

function CustomerRecipes({ ctx }: { ctx: LiveCtx }) {
  const [customerId, setCustomerId] = useState(ctx.state.customers[0]?.id ?? '')
  const [productId, setProductId] = useState(ctx.state.products[0]?.id ?? '')
  const [recipeId, setRecipeId] = useState(ctx.state.recipes[0]?.id ?? '')
  const [nameAr, setNameAr] = useState('')
  const [baseOutputQty, setBaseOutputQty] = useState('1000')
  const [salePrice, setSalePrice] = useState('')
  return (
    <div className="space-y-4">
      <Card
        title="وصفات العملاء"
        extra={
          can(ctx.permissions, 'recipes.custom') ? (
            <FormDialog title="وصفة عميل جديدة" openLabel="إضافة وصفة عميل">
              {(close) => (
                <form className="grid gap-3" onSubmit={async (event) => {
                  event.preventDefault()
                  const result = await ctx.act('createCustomerRecipe', {
                    customerId,
                    productId,
                    recipeId,
                    nameAr,
                    baseOutputQty: Number(baseOutputQty),
                    salePrice: Number(salePrice),
                  })
                  if (result.ok) {
                    setNameAr('')
                    setBaseOutputQty('1000')
                    setSalePrice('')
                    close()
                  }
                }}>
                  <Field label="العميل">
                    <SelectInput value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                      {ctx.state.customers.map((item) => <option key={item.id} value={item.id}>{item.nameAr}</option>)}
                    </SelectInput>
                  </Field>
                  <Field label="المنتج">
                    <SelectInput value={productId} onChange={(e) => setProductId(e.target.value)}>
                      {ctx.state.products.map((item) => <option key={item.id} value={item.id}>{item.nameAr}</option>)}
                    </SelectInput>
                  </Field>
                  <Field label="الوصفة الأساسية">
                    <SelectInput value={recipeId} onChange={(e) => setRecipeId(e.target.value)}>
                      {ctx.state.recipes.filter((r) => r.productId === productId).map((item) => <option key={item.id} value={item.id}>{item.nameAr}</option>)}
                    </SelectInput>
                  </Field>
                  <Field label="اسم الوصفة"><TextInput value={nameAr} onChange={(e) => setNameAr(e.target.value)} required /></Field>
                  <Field label="أساس المخرجات (كجم)"><TextInput type="number" min="0.001" step="0.001" value={baseOutputQty} onChange={(e) => setBaseOutputQty(e.target.value)} required /></Field>
                  <Field label="سعر البيع / كجم"><TextInput type="number" min="0" step="0.001" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} required /></Field>
                  <PrimaryButton disabled={ctx.pending}>حفظ</PrimaryButton>
                </form>
              )}
            </FormDialog>
          ) : null
        }
      >
        <DataTable
          columns={['العميل', 'المنتج', 'الوصفة', 'سعر البيع', 'الهامش', 'الحالة']}
          rows={(ctx.state.customerRecipes ?? []).map((item) => [
            partyName(ctx.state.customers, item.customerId),
            productName(ctx.state, item.productId),
            item.nameAr,
            moneyFmt(item.salePrice),
            moneyFmt(item.marginPerTon),
            item.active ? 'نشط' : 'موقوف',
          ])}
        />
      </Card>
    </div>
  )
}

function ScaleReadings({ ctx }: { ctx: LiveCtx }) {
  return (
    <Card title="قراءات الميزان" hint="تكامل مع أجهزة الوزن لضمان دقة الكميات المستخدمة في الإنتاج.">
      <p className="text-sm text-[#788983]">جاري التطوير...</p>
    </Card>
  )
}

function Machines({ ctx }: { ctx: LiveCtx }) {
  const [code, setCode] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [type, setType] = useState('')
  const [location, setLocation] = useState('')
  return (
    <div className="space-y-4">
      <Card
        title="الآلات"
        extra={
          can(ctx.permissions, 'maintenance.manage') ? (
            <FormDialog title="آلة جديدة" openLabel="إضافة آلة">
              {(close) => (
                <form className="grid gap-3 md:grid-cols-2" onSubmit={async (event) => {
                  event.preventDefault()
                  const result = await ctx.act('createMachine', { code, nameAr, type, location })
                  if (result.ok) {
                    setCode('')
                    setNameAr('')
                    setType('')
                    setLocation('')
                    close()
                  }
                }}>
                  <Field label="الكود"><TextInput value={code} onChange={(e) => setCode(e.target.value)} required /></Field>
                  <Field label="الاسم"><TextInput value={nameAr} onChange={(e) => setNameAr(e.target.value)} required /></Field>
                  <Field label="النوع"><TextInput value={type} onChange={(e) => setType(e.target.value)} required /></Field>
                  <Field label="الموقع"><TextInput value={location} onChange={(e) => setLocation(e.target.value)} required /></Field>
                  <div className="flex items-end"><PrimaryButton disabled={ctx.pending}>حفظ</PrimaryButton></div>
                </form>
              )}
            </FormDialog>
          ) : null
        }
      >
        <DataTable
          columns={['الكود', 'الاسم', 'النوع', 'الموقع', 'ساعات التشغيل', 'الحالة']}
          rows={(ctx.state.machines ?? []).map((item) => [
            item.code,
            item.nameAr,
            item.type,
            item.location,
            item.operatingHours.toFixed(1),
            item.active ? 'نشط' : 'موقوف',
          ])}
        />
      </Card>
    </div>
  )
}

function MaintenanceSchedules({ ctx }: { ctx: LiveCtx }) {
  const [machineId, setMachineId] = useState(ctx.state.machines[0]?.id ?? '')
  const [type, setType] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'HOURS_BASED'>('MONTHLY')
  const [description, setDescription] = useState('')
  const [interval, setInterval] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  return (
    <div className="space-y-4">
      <Card
        title="جداول الصيانة"
        extra={
          can(ctx.permissions, 'maintenance.manage') ? (
            <FormDialog title="جدول صيانة جديد" openLabel="إضافة جدول">
              {(close) => (
                <form className="grid gap-3 md:grid-cols-2" onSubmit={async (event) => {
                  event.preventDefault()
                  const result = await ctx.act('createMaintenanceSchedule', {
                    machineId,
                    type,
                    description,
                    interval: Number(interval),
                    assignedTo,
                  })
                  if (result.ok) {
                    setDescription('')
                    setInterval('')
                    setAssignedTo('')
                    close()
                  }
                }}>
                  <Field label="الآلة">
                    <SelectInput value={machineId} onChange={(e) => setMachineId(e.target.value)}>
                      {(ctx.state.machines ?? []).map((item) => <option key={item.id} value={item.id}>{item.nameAr}</option>)}
                    </SelectInput>
                  </Field>
                  <Field label="النوع">
                    <SelectInput value={type} onChange={(e) => setType(e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'HOURS_BASED')}>
                      <option value="DAILY">يومي</option>
                      <option value="WEEKLY">أسبوعي</option>
                      <option value="MONTHLY">شهري</option>
                      <option value="YEARLY">سنوي</option>
                      <option value="HOURS_BASED">حسب ساعات التشغيل</option>
                    </SelectInput>
                  </Field>
                  <Field label="الوصف"><TextInput value={description} onChange={(e) => setDescription(e.target.value)} required /></Field>
                  <Field label="الفترة"><TextInput type="number" min="1" step="1" value={interval} onChange={(e) => setInterval(e.target.value)} required /></Field>
                  <Field label="المسؤول"><TextInput value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} /></Field>
                  <div className="flex items-end"><PrimaryButton disabled={ctx.pending}>حفظ</PrimaryButton></div>
                </form>
              )}
            </FormDialog>
          ) : null
        }
      >
        <DataTable
          columns={['الآلة', 'النوع', 'الوصف', 'الفترة', 'التالي الموعد', 'المسؤول']}
          rows={(ctx.state.maintenanceSchedules ?? []).map((item) => [
            (ctx.state.machines ?? []).find((m) => m.id === item.machineId)?.nameAr || '—',
            statusLabel(item.type),
            item.description,
            String(item.interval),
            item.nextDue.slice(0, 10),
            item.assignedTo,
          ])}
        />
      </Card>
    </div>
  )
}

function MaintenanceRecords({ ctx }: { ctx: LiveCtx }) {
  const [machineId, setMachineId] = useState(ctx.state.machines[0]?.id ?? '')
  const [type, setType] = useState<'ROUTINE' | 'EMERGENCY' | 'PREVENTIVE'>('ROUTINE')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')
  const [cost, setCost] = useState('')
  const [performedBy, setPerformedBy] = useState('')
  return (
    <div className="space-y-4">
      <Card
        title="سجلات الصيانة"
        extra={
          can(ctx.permissions, 'maintenance.manage') ? (
            <FormDialog title="سجل صيانة جديد" openLabel="إضافة سجل">
              {(close) => (
                <form className="grid gap-3 md:grid-cols-2" onSubmit={async (event) => {
                  event.preventDefault()
                  const result = await ctx.act('createMaintenanceRecord', {
                    machineId,
                    type,
                    startDate,
                    endDate,
                    description,
                    cost: Number(cost),
                    performedBy,
                  })
                  if (result.ok) {
                    setDescription('')
                    setCost('')
                    setPerformedBy('')
                    close()
                  }
                }}>
                  <Field label="الآلة">
                    <SelectInput value={machineId} onChange={(e) => setMachineId(e.target.value)}>
                      {(ctx.state.machines ?? []).map((item) => <option key={item.id} value={item.id}>{item.nameAr}</option>)}
                    </SelectInput>
                  </Field>
                  <Field label="النوع">
                    <SelectInput value={type} onChange={(e) => setType(e.target.value as 'ROUTINE' | 'EMERGENCY' | 'PREVENTIVE')}>
                      <option value="ROUTINE">روتيني</option>
                      <option value="EMERGENCY">طوارئ</option>
                      <option value="PREVENTIVE">وقائي</option>
                    </SelectInput>
                  </Field>
                  <Field label="تاريخ البدء"><TextInput type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required /></Field>
                  <Field label="تاريخ الانتهاء"><TextInput type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required /></Field>
                  <Field label="الوصف"><TextInput value={description} onChange={(e) => setDescription(e.target.value)} required /></Field>
                  <Field label="التكلفة"><TextInput type="number" min="0" step="0.001" value={cost} onChange={(e) => setCost(e.target.value)} required /></Field>
                  <Field label="المنفذ"><TextInput value={performedBy} onChange={(e) => setPerformedBy(e.target.value)} required /></Field>
                  <div className="flex items-end"><PrimaryButton disabled={ctx.pending}>حفظ</PrimaryButton></div>
                </form>
              )}
            </FormDialog>
          ) : null
        }
      >
        <DataTable
          columns={['الآلة', 'النوع', 'تاريخ البدء', 'تاريخ الانتهاء', 'الوصف', 'التكلفة', 'المنفذ']}
          rows={(ctx.state.maintenanceRecords ?? []).map((item) => [
            (ctx.state.machines ?? []).find((m) => m.id === item.machineId)?.nameAr || '—',
            statusLabel(item.type),
            item.startDate.slice(0, 10),
            item.endDate.slice(0, 10),
            item.description,
            moneyFmt(item.cost),
            item.performedBy,
          ])}
        />
      </Card>
    </div>
  )
}

export function SalesScreens({ entityKey, ctx }: { entityKey: string; ctx: LiveCtx }) {
  if (entityKey === 'salesReports') return <ReportEntry ctx={ctx} section="sales" />
  if (entityKey === 'customer') return <Customers ctx={ctx} />
  if (entityKey === 'salesInvoice') return <Invoices ctx={ctx} />
  if (entityKey === 'salesPayment') return <Payments ctx={ctx} />
  if (entityKey === 'withdrawal') return <Withdrawals ctx={ctx} />
  if (entityKey === 'distributionPoint' || entityKey === 'distribution') return <DistributionPoints ctx={ctx} />
  if (entityKey === 'distributionClosing') return <DistributionClosings ctx={ctx} />
  if (entityKey === 'invoiceDelivery') return <InvoiceDeliveries ctx={ctx} />
  return null
}

function Customers({ ctx }: { ctx: LiveCtx }) {
  const [nameAr, setNameAr] = useState('')
  const [vatNumber, setVatNumber] = useState('')
  const [address, setAddress] = useState('')
  return (
    <Card
      title="العملاء"
      extra={
        can(ctx.permissions, 'sales.create') ? (
          <FormDialog title="عميل جديد" openLabel="إضافة عميل">
            {(close) => (
              <form className="grid gap-3" onSubmit={async (event) => {
                event.preventDefault()
                const result = await ctx.act('createCustomer', { nameAr, vatNumber, address })
                if (result.ok) {
                  setNameAr('')
                  setVatNumber('')
                  setAddress('')
                  close()
                }
              }}>
                <Field label="الاسم"><TextInput value={nameAr} onChange={(e) => setNameAr(e.target.value)} required /></Field>
                <Field label="الرقم الضريبي"><TextInput value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} /></Field>
                <Field label="العنوان"><TextInput value={address} onChange={(e) => setAddress(e.target.value)} /></Field>
                <PrimaryButton disabled={ctx.pending}>حفظ</PrimaryButton>
              </form>
            )}
          </FormDialog>
        ) : null
      }
    >
      <DataTable columns={['الكود', 'الاسم', 'الرقم الضريبي', 'العنوان']} rows={ctx.state.customers.map((item) => [item.code, item.nameAr, item.vatNumber || '—', item.address || '—'])} />
    </Card>
  )
}

function Invoices({ ctx }: { ctx: LiveCtx }) {
  const editor = useLines({ productId: ctx.state.products[0]?.id ?? '', qty: '' })
  const [customerId, setCustomerId] = useState(ctx.state.customers[0]?.id ?? '')
  const [confirmError, setConfirmError] = useState('')
  return (
    <div className="space-y-4">
      <Card
        title="الفواتير"
        hint="الأسعار غير شاملة الضريبة. التأكيد يخصم من مستودع المنتجات النهائية."
        extra={
          <div className="flex flex-wrap items-center gap-3">
            <a className="text-sm font-bold text-[#1d7f72]" href="/api/erp/export?kind=invoices">تصدير Excel</a>
            {can(ctx.permissions, 'sales.create') ? (
              <FormDialog title="فاتورة مبيعات" openLabel="فاتورة جديدة" wide>
                {(close) => (
                  <form className="space-y-3" onSubmit={async (event) => {
                    event.preventDefault()
                    const result = await ctx.act('createInvoice', {
                      customerId,
                      lines: editor.lines.map((line) => ({ productId: line.productId, qty: Number(line.qty) })),
                    })
                    if (result.ok) {
                      editor.reset()
                      close()
                    }
                  }}>
                    <Field label="العميل">
                      <SelectInput value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                        {ctx.state.customers.map((item) => <option key={item.id} value={item.id}>{item.nameAr}</option>)}
                      </SelectInput>
                    </Field>
                    {editor.lines.map((line, index) => (
                      <div key={index} className="grid gap-3 md:grid-cols-2">
                        <SelectInput value={line.productId} onChange={(e) => editor.update(index, { productId: e.target.value })}>
                          {ctx.state.products.map((item) => <option key={item.id} value={item.id}>{item.nameAr} — {moneyFmt(item.salePrice)}</option>)}
                        </SelectInput>
                        <TextInput type="number" min="0.001" step="0.001" placeholder="الكمية كجم" value={line.qty} onChange={(e) => editor.update(index, { qty: e.target.value })} required />
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <GhostButton type="button" onClick={editor.add}>بند</GhostButton>
                      <PrimaryButton disabled={ctx.pending}>حفظ مسودة</PrimaryButton>
                    </div>
                  </form>
                )}
              </FormDialog>
            ) : null}
          </div>
        }
      >
        <DataTable
          columns={['الرقم', 'العميل', 'الضريبة', 'الإجمالي', 'المحصّل', 'الحالة', '']}
          rows={ctx.state.invoices.map((invoice) => [
            invoice.number,
            partyName(ctx.state.customers, invoice.customerId),
            moneyFmt(invoice.vatAmount),
            moneyFmt(invoice.total),
            moneyFmt(invoice.paidAmount),
            <Badge key={invoice.id} tone={toneForStatus(invoice.status)}>{statusLabel(invoice.status)}</Badge>,
            <span key={`${invoice.id}-a`} className="flex flex-wrap gap-2">
              <a className="text-sm font-bold text-[#1d7f72]" href={`/print/invoice/${invoice.id}`} target="_blank" rel="noreferrer">طباعة</a>
              {invoice.status === 'DRAFT' && can(ctx.permissions, 'sales.confirm') ? (
                <GhostButton type="button" onClick={async () => {
                  const result = await ctx.act('confirmInvoice', { id: invoice.id })
                  setConfirmError(result.ok ? '' : result.message)
                }}>تأكيد وخصم المخزون</GhostButton>
              ) : null}
            </span>,
          ])}
        />
        <div className="mt-3"><InlineError message={confirmError} /></div>
      </Card>
    </div>
  )
}

function Payments({ ctx }: { ctx: LiveCtx }) {
  const open = ctx.state.invoices.filter((invoice) => invoice.status === 'CONFIRMED' || invoice.status === 'PARTIAL')
  const [invoiceId, setInvoiceId] = useState(open[0]?.id ?? '')
  const [amount, setAmount] = useState('')
  return (
    <div className="space-y-4">
      <Card
        title="التحصيلات"
        extra={
          <FormDialog title="تحصيل" openLabel="تسجيل تحصيل">
            {(close) => (
              <form className="grid gap-3" onSubmit={async (event) => {
                event.preventDefault()
                const result = await ctx.act('recordPayment', { invoiceId, amount: Number(amount), method: 'تحويل بنكي' })
                if (result.ok) {
                  setAmount('')
                  close()
                }
              }}>
                <Field label="الفاتورة">
                  <SelectInput value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)}>
                    {open.map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.number} — متبقي {moneyFmt(invoice.total - invoice.paidAmount)}</option>)}
                  </SelectInput>
                </Field>
                <Field label="المبلغ"><TextInput type="number" min="0.001" step="0.001" value={amount} onChange={(e) => setAmount(e.target.value)} required /></Field>
                <PrimaryButton disabled={ctx.pending || !can(ctx.permissions, 'sales.payments.manage')}>تسجيل التحصيل</PrimaryButton>
              </form>
            )}
          </FormDialog>
        }
      >
        <DataTable columns={['الرقم', 'الفاتورة', 'المبلغ', 'الطريقة', 'التاريخ']} rows={ctx.state.payments.map((payment) => [payment.number, ctx.state.invoices.find((invoice) => invoice.id === payment.invoiceId)?.number ?? '', moneyFmt(payment.amount), payment.method, payment.at.slice(0, 10)])} />
      </Card>
    </div>
  )
}

function Withdrawals({ ctx }: { ctx: LiveCtx }) {
  const [productId, setProductId] = useState(ctx.state.products[0]?.id ?? '')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  return (
    <div className="space-y-4">
      <Card
        title="السحوبات"
        hint="يخصم من المنتجات النهائية ويُحمَّل على مصروفات التشغيل بدون ضريبة مبيعات."
        extra={
          <FormDialog title="سحب داخلي" openLabel="سحب جديد">
            {(close) => (
              <form className="grid gap-3" onSubmit={async (event) => {
                event.preventDefault()
                const result = await ctx.act('createWithdrawal', { reason, lines: [{ productId, qty: Number(amount) }] })
                if (result.ok) {
                  setAmount('')
                  setReason('')
                  close()
                }
              }}>
                <Field label="المنتج">
                  <SelectInput value={productId} onChange={(e) => setProductId(e.target.value)}>
                    {ctx.state.products.map((item) => <option key={item.id} value={item.id}>{item.nameAr}</option>)}
                  </SelectInput>
                </Field>
                <Field label="الكمية"><TextInput type="number" min="0.001" step="0.001" value={amount} onChange={(e) => setAmount(e.target.value)} required /></Field>
                <Field label="السبب"><TextInput value={reason} onChange={(e) => setReason(e.target.value)} required /></Field>
                <PrimaryButton disabled={ctx.pending || !can(ctx.permissions, 'sales.create')}>تنفيذ السحب</PrimaryButton>
              </form>
            )}
          </FormDialog>
        }
      >
        <DataTable columns={['الرقم', 'السبب', 'التكلفة', 'التاريخ']} rows={ctx.state.withdrawals.map((row) => [row.number, row.reason, moneyFmt(row.totalCost), row.at.slice(0, 10)])} />
      </Card>
    </div>
  )
}

function DistributionPoints({ ctx }: { ctx: LiveCtx }) {
  const [code, setCode] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [location, setLocation] = useState('')
  const [managerId, setManagerId] = useState('')
  const [phone, setPhone] = useState('')
  return (
    <div className="space-y-4">
      <Card
        title="نقاط التوزيع"
        extra={
          can(ctx.permissions, 'distribution.manage') ? (
            <FormDialog title="نقطة توزيع جديدة" openLabel="إضافة نقطة توزيع">
              {(close) => (
                <form className="grid gap-3 md:grid-cols-2" onSubmit={async (event) => {
                  event.preventDefault()
                  const result = await ctx.act('createDistributionPoint', {
                    code,
                    nameAr,
                    location,
                    managerId,
                    phone,
                  })
                  if (result.ok) {
                    setCode('')
                    setNameAr('')
                    setLocation('')
                    setManagerId('')
                    setPhone('')
                    close()
                  }
                }}>
                  <Field label="الكود"><TextInput value={code} onChange={(e) => setCode(e.target.value)} required /></Field>
                  <Field label="الاسم"><TextInput value={nameAr} onChange={(e) => setNameAr(e.target.value)} required /></Field>
                  <Field label="الموقع"><TextInput value={location} onChange={(e) => setLocation(e.target.value)} required /></Field>
                  <Field label="المدير">
                    <SelectInput value={managerId} onChange={(e) => setManagerId(e.target.value)}>
                      {ctx.state.employees.map((item) => <option key={item.id} value={item.id}>{item.nameAr}</option>)}
                    </SelectInput>
                  </Field>
                  <Field label="الهاتف"><TextInput value={phone} onChange={(e) => setPhone(e.target.value)} required /></Field>
                  <div className="flex items-end"><PrimaryButton disabled={ctx.pending}>حفظ</PrimaryButton></div>
                </form>
              )}
            </FormDialog>
          ) : null
        }
      >
        <DataTable
          columns={['الكود', 'الاسم', 'الموقع', 'المدير', 'الهاتف', 'الحالة']}
          rows={(ctx.state.distributionPoints ?? []).map((item) => [
            item.code,
            item.nameAr,
            item.location,
            ctx.state.employees.find((e) => e.id === item.managerId)?.nameAr || '—',
            item.phone,
            item.active ? 'نشط' : 'موقوف',
          ])}
        />
      </Card>
    </div>
  )
}

function DistributionClosings({ ctx }: { ctx: LiveCtx }) {
  const [pointId, setPointId] = useState((ctx.state.distributionPoints ?? [])[0]?.id ?? '')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  return (
    <div className="space-y-4">
      <Card
        title="قفل التوزيع"
        extra={
          can(ctx.permissions, 'distribution.manage') ? (
            <FormDialog title="قفل يومي جديد" openLabel="إضافة قفل">
              {(close) => (
                <form className="grid gap-3" onSubmit={async (event) => {
                  event.preventDefault()
                  const result = await ctx.act('createDistributionClosing', { pointId, date })
                  if (result.ok) close()
                }}>
                  <Field label="نقطة التوزيع">
                    <SelectInput value={pointId} onChange={(e) => setPointId(e.target.value)}>
                      {(ctx.state.distributionPoints ?? []).map((item) => <option key={item.id} value={item.id}>{item.nameAr}</option>)}
                    </SelectInput>
                  </Field>
                  <Field label="التاريخ"><TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></Field>
                  <PrimaryButton disabled={ctx.pending}>حفظ</PrimaryButton>
                </form>
              )}
            </FormDialog>
          ) : null
        }
      >
        <DataTable
          columns={['نقطة التوزيع', 'التاريخ', 'المبيعات', 'المرتجعات', 'الصافي', 'الحالة']}
          rows={(ctx.state.distributionClosings ?? []).map((item) => [
            (ctx.state.distributionPoints ?? []).find((p) => p.id === item.pointId)?.nameAr || '—',
            item.date,
            moneyFmt(item.cash),
            moneyFmt(item.transfers),
            moneyFmt(item.variance),
            statusLabel(item.status),
          ])}
        />
      </Card>
    </div>
  )
}

function InvoiceDeliveries({ ctx }: { ctx: LiveCtx }) {
  return (
    <div className="space-y-4">
      <Card title="تسليم الفواتير" hint="تتبع سير عمل تسليم الفواتير من المحاسب إلى العميل.">
        <DataTable
          columns={['الفاتورة', 'الخطوة الحالية', 'الخطوات المنجزة', 'حالة التسليم']}
          rows={(ctx.state.invoiceDeliveries ?? []).map((item) => [
            ctx.state.invoices.find((i) => i.id === item.invoiceId)?.number || '—',
            statusLabel(item.currentStep),
            item.steps.length.toString(),
            item.deliveryProof ? 'مكتمل' : 'قيد التنفيذ',
          ])}
        />
      </Card>
    </div>
  )
}

export function SupplierRelations(_props: { entityKey: string; ctx: LiveCtx }) {
  return null
}

function MaterialPriceAnalysisScreen({ ctx }: { ctx: LiveCtx }) {
  const [materialId, setMaterialId] = useState(() => ctx.state.materials[0]?.id ?? '')
  const rows = materialPriceAnalysis(ctx.state)
  const active = rows.find((row) => row.material.id === materialId) ?? rows[0] ?? null

  if (!active) {
    return <Card title="تحليل أسعار المواد الخام" hint="لا توجد مواد خام بعد"><p className="text-sm text-[#6b7280]">أضف مواد خام أولاً من شاشة المواد الخام.</p></Card>
  }

  const maxMonthPrice = Math.max(...active.months.map((month) => month.avgPrice), 0.0001)
  const maxMonthQty = Math.max(...active.months.map((month) => month.purchasedQty), 1)

  return (
    <div className="space-y-4">
      <Card title="تحليل أسعار المواد الخام" hint="متوسط/أعلى/أقل سعر شهرياً، المورد، الكمية المشتراة والمستهلكة، تكلفة النقل، والتكلفة الواصلة للمصنع">
        <Field label="الخامة">
          <SelectInput value={active.material.id} onChange={(e) => setMaterialId(e.target.value)}>
            {rows.map((row) => (
              <option key={row.material.id} value={row.material.id}>{row.material.nameAr}</option>
            ))}
          </SelectInput>
        </Field>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={active.material.nameAr} hint="ملخص الشراء والاستهلاك">
          <Answer label="الكمية المشتراة" value={`${qtyFmt(active.purchasedQty)} ${active.material.unit}`} />
          <Answer label="قيمة الشراء" value={moneyFmt(active.purchasedValue)} />
          <Answer label="متوسط السعر" value={moneyFmt(active.avgPrice)} />
          <Answer label="أقل سعر" value={moneyFmt(active.minPrice)} />
          <Answer label="أعلى سعر" value={moneyFmt(active.maxPrice)} />
          <Answer label="آخر سعر (الحالي)" value={moneyFmt(active.currentPrice)} />
          <Answer label="الكمية المستهلكة في التصنيع" value={`${qtyFmt(active.usedQty)} ${active.material.unit}`} />
          <Answer label="تكلفة النقل الموزّعة" value={moneyFmt(active.transportCost)} />
          <Answer label="التكلفة الواصلة للمصنع (Landed)" value={moneyFmt(active.landedUnitCost)} />
        </Card>

        <Card title="الموردون" hint="الكمية ومتوسط السعر لكل مورد">
          <DataTable
            columns={['المورد', 'الكمية', 'متوسط السعر']}
            rows={active.suppliers.length
              ? active.suppliers.map((supplier) => [supplier.nameAr, qtyFmt(supplier.qty), moneyFmt(supplier.avgPrice)])
              : [['—', '—', '—']]}
          />
        </Card>
      </div>

      <Card title="التغيّر الشهري" hint="متوسط السعر والكمية المشتراة والمستهلكة وتكلفة النقل لكل شهر">
        <DataTable
          columns={['الشهر', 'الكمية المشتراة', 'متوسط السعر', 'أقل سعر', 'أعلى سعر', 'المستهلك', 'النقل', 'Landed']}
          rows={active.months.length
            ? active.months.map((month) => [
                month.month,
                qtyFmt(month.purchasedQty),
                moneyFmt(month.avgPrice),
                moneyFmt(month.minPrice),
                moneyFmt(month.maxPrice),
                qtyFmt(month.usedQty),
                moneyFmt(month.transportCost),
                moneyFmt(month.landedUnitCost),
              ])
            : [['—', '—', '—', '—', '—', '—', '—', '—']]}
        />
        {active.months.length ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm font-medium text-[#53655e]">منحنى السعر والكمية</p>
            {active.months.map((month) => (
              <div key={month.month} className="grid grid-cols-[80px_1fr] items-center gap-2 text-xs">
                <span className="text-[#6b7280]">{month.month}</span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="h-3 rounded-full bg-[#0f766e]" style={{ width: `${Math.max((month.avgPrice / maxMonthPrice) * 100, 2)}%` }} />
                    <span className="whitespace-nowrap text-[#0f766e]">سعر {moneyFmt(month.avgPrice)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 rounded-full bg-[#c2410c]" style={{ width: `${Math.max((month.purchasedQty / maxMonthQty) * 100, 2)}%` }} />
                    <span className="whitespace-nowrap text-[#c2410c]">كمية {qtyFmt(month.purchasedQty)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </Card>
    </div>
  )
}

function ReportEntry({ ctx, section }: { ctx: LiveCtx; section: string }) {
  const links: Record<string, Array<{ href: string; label: string }>> = {
    inventory: [
      { href: '/inventory/raw-materials/batches', label: 'دفعات المواد' },
      { href: '/inventory/raw-materials/balances', label: 'أرصدة المواد' },
      { href: '/inventory/raw-materials/ledger', label: 'حركة المخزون' },
      { href: '/inventory/raw-materials/value', label: 'قيمة المخزون' },
    ],
    production: [
      { href: '/inventory/manufacturing/planned', label: 'المخطط' },
      { href: '/inventory/manufacturing/actual', label: 'الفعلي' },
      { href: '/inventory/manufacturing/execution', label: 'نسبة التنفيذ' },
    ],
    sales: [
      { href: '/sales/today', label: 'مبيعات اليوم' },
      { href: '/sales/month', label: 'مبيعات الشهر' },
      { href: '/sales/open-orders', label: 'الطلبات المفتوحة' },
    ],
  }
  const items = links[section] ?? []
  return (
    <Card title="التقارير" hint="اختر التقرير المطلوب">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <a key={item.href} href={item.href} className="rounded-xl border border-[#e5e7eb] bg-white p-4 text-sm font-medium text-[#1f1f1f] shadow-sm hover:bg-neutral-200/50">
            {item.label}
          </a>
        ))}
      </div>
    </Card>
  )
}

