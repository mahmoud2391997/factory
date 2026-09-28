import assert from 'node:assert/strict'
import { test } from 'node:test'

import { actorFromUser, applyCommand } from './engine'
import { suggestQcResult } from './qc'
import { supplierQuality, trialBalance } from './reports'
import { createClock, emptyState } from './seed'
import type { Actor, Command, ErpState } from './types'

function who(state: ErpState, id: string): Actor {
  const found = actorFromUser(state, id)
  assert.ok(found)
  return found
}

function must(state: ErpState, clock: ReturnType<typeof createClock>, command: Command, id = 'user-gm') {
  const result = applyCommand(state, who(state, id), command, clock)
  if (!result.ok) throw new Error(`${command.action}: ${result.error}`)
  return result.state
}

test('limits suggest passed or failed, and never hold', () => {
  assert.equal(suggestQcResult({ maxMoisture: 14, minProtein: 18 }, { moisturePct: 12, proteinPct: 20 }), 'PASSED')
  assert.equal(suggestQcResult({ maxMoisture: 14, minProtein: 18 }, { moisturePct: 15, proteinPct: 20 }), 'FAILED')
  assert.equal(suggestQcResult({ minAsh: 2, maxAsh: 8 }, { ashPct: 1 }), 'FAILED')
  assert.equal(suggestQcResult(undefined, { moisturePct: 12 }), 'PENDING')
})

test('quality blocks raw use, finished lots, release, and duplicate alerts', () => {
  const clock = createClock('2026-09-29T04:00:00.000Z')
  let state = emptyState('qc')
  state = must(state, clock, { action: 'createMaterial', input: { code: 'RM-QC', nameAr: 'ذرة الجودة', category: 'حبوب', minQty: 1, vatTreatment: 'ZERO' } })
  state = must(state, clock, { action: 'createProduct', input: { code: 'FG-QC', nameAr: 'علف الجودة', salePrice: 0.2, vatTreatment: 'ZERO' } })
  state = must(state, clock, { action: 'createSupplier', input: { nameAr: 'مورد الجودة' } })
  state = must(state, clock, { action: 'createCustomer', input: { nameAr: 'عميل الجودة' } })
  state = must(state, clock, { action: 'createEmployee', input: { nameAr: 'مشغّل الجودة', department: 'الإنتاج', jobTitle: 'مشغّل', basicSalary: 300 } })
  const material = state.materials[0]!
  const product = state.products[0]!
  const supplier = state.suppliers[0]!
  const customer = state.customers[0]!
  const operator = state.employees[0]!
  state = must(state, clock, { action: 'setQcLimits', input: { itemType: 'MATERIAL', itemId: material.id, limits: { maxMoisture: 14, minProtein: 8 } } })
  state = must(state, clock, {
    action: 'createPurchaseOrder',
    input: { supplierId: supplier.id, lines: [{ materialId: material.id, qty: 500, unitCost: 0.05 }] },
  })
  const poId = state.purchaseOrders[0]!.id
  state = must(state, clock, { action: 'decidePurchaseOrder', input: { id: poId, decision: 'APPROVED' } })
  state = must(state, clock, {
    action: 'receiveGoods',
    input: { purchaseOrderId: poId, lines: [{ materialId: material.id, qty: 500, batchNo: 'B-QC' }] },
  })

  const open = applyCommand(state, who(state, 'user-gm'), {
    action: 'transferStock',
    input: { from: 'WH_RAW', to: 'WH_MFG', lines: [{ itemType: 'MATERIAL', itemId: material.id, batchNo: 'B-QC', qty: 1 }] },
  }, clock)
  assert.equal(open.ok, true)

  state = must(state, clock, { action: 'updateCompany', input: { requireQcBeforeUse: true } })
  const needsSample = applyCommand(state, who(state, 'user-gm'), {
    action: 'transferStock',
    input: { from: 'WH_RAW', to: 'WH_MFG', lines: [{ itemType: 'MATERIAL', itemId: material.id, batchNo: 'B-QC', qty: 1 }] },
  }, clock)
  assert.equal(needsSample.ok, false)
  if (!needsSample.ok) assert.match(needsSample.error, /يتطلب الفحص/)
  state = must(state, clock, { action: 'updateCompany', input: { requireQcBeforeUse: false } })

  const failed = must(state, clock, {
    action: 'createQualitySample',
    input: { type: 'RAW_MATERIAL', materialId: material.id, batchNo: 'B-QC', supplierId: supplier.id, moisturePct: 16, proteinPct: 10 },
  })
  assert.equal(failed.qualitySamples[0]!.result, 'FAILED')
  const again = must(failed, clock, {
    action: 'createQualitySample',
    input: { type: 'RAW_MATERIAL', materialId: material.id, batchNo: 'B-QC', supplierId: supplier.id, moisturePct: 17, proteinPct: 10 },
  })
  const qcNotes = again.notifications.filter((item) => item.dedupeKey.includes('B-QC') && item.kind === 'QC' && !item.read)
  assert.equal(qcNotes.length, 1)
  state = again

  const blockedTransfer = applyCommand(state, who(state, 'user-gm'), {
    action: 'transferStock',
    input: { from: 'WH_RAW', to: 'WH_MFG', lines: [{ itemType: 'MATERIAL', itemId: material.id, batchNo: 'B-QC', qty: 10 }] },
  }, clock)
  assert.equal(blockedTransfer.ok, false)
  if (!blockedTransfer.ok) assert.match(blockedTransfer.error, /مرفوضة/)

  const sampleId = state.qualitySamples.find((item) => item.result === 'FAILED')!.id
  const opsOverride = applyCommand(state, who(state, 'user-ops'), {
    action: 'createQualitySample',
    input: { type: 'RAW_MATERIAL', materialId: material.id, batchNo: 'B-QC', supplierId: supplier.id, moisturePct: 16, proteinPct: 10, result: 'PASSED', reason: 'تجاوز بدون صلاحية' },
  }, clock)
  assert.equal(opsOverride.ok, false)
  if (!opsOverride.ok) assert.match(opsOverride.error, /صلاحية/)
  const opsRelease = applyCommand(state, who(state, 'user-ops'), {
    action: 'updateQualityResult',
    input: { sampleId, result: 'PASSED', reason: 'إعادة فحص' },
  }, clock)
  assert.equal(opsRelease.ok, false)
  if (!opsRelease.ok) assert.match(opsRelease.error, /صلاحية/)
  const noReason = applyCommand(state, who(state, 'user-gm'), {
    action: 'updateQualityResult',
    input: { sampleId, result: 'PASSED', reason: '  ' },
  }, clock)
  assert.equal(noReason.ok, false)
  state = must(state, clock, { action: 'updateQualityResult', input: { sampleId, result: 'PASSED', reason: 'إعادة الفحص نجحت' } })
  assert.ok(state.auditLogs.some((row) => row.action === 'تغيير نتيجة الجودة' && row.detail.includes('إعادة الفحص')))
  state = must(state, clock, {
    action: 'transferStock',
    input: { from: 'WH_RAW', to: 'WH_MFG', lines: [{ itemType: 'MATERIAL', itemId: material.id, batchNo: 'B-QC', qty: 10 }] },
  })
  const summary = supplierQuality(state, supplier.id)
  assert.equal(summary.samples, 2)
  assert.equal(summary.passRate, 50)
})

test('held raw material cannot be consumed and a held lot cannot be sold or withdrawn', () => {
  const clock = createClock('2026-09-29T04:00:00.000Z')
  let state = emptyState('qc2')
  state = must(state, clock, { action: 'createMaterial', input: { code: 'RM-QC2', nameAr: 'ذرة', category: 'حبوب', minQty: 1, vatTreatment: 'ZERO' } })
  state = must(state, clock, { action: 'createProduct', input: { code: 'FG-QC2', nameAr: 'علف', salePrice: 0.2, vatTreatment: 'ZERO' } })
  state = must(state, clock, { action: 'createSupplier', input: { nameAr: 'مورد' } })
  state = must(state, clock, { action: 'createCustomer', input: { nameAr: 'عميل' } })
  state = must(state, clock, { action: 'createEmployee', input: { nameAr: 'مشغّل', department: 'الإنتاج', jobTitle: 'مشغّل', basicSalary: 300 } })
  const material = state.materials[0]!
  const product = state.products[0]!
  const supplier = state.suppliers[0]!
  const customer = state.customers[0]!
  const operator = state.employees[0]!
  state = must(state, clock, {
    action: 'createPurchaseOrder',
    input: { supplierId: supplier.id, lines: [{ materialId: material.id, qty: 400, unitCost: 0.04 }] },
  })
  const poId = state.purchaseOrders[0]!.id
  state = must(state, clock, { action: 'decidePurchaseOrder', input: { id: poId, decision: 'APPROVED' } })
  state = must(state, clock, {
    action: 'receiveGoods',
    input: { purchaseOrderId: poId, lines: [{ materialId: material.id, qty: 400, batchNo: 'B-QC2' }] },
  })
  state = must(state, clock, {
    action: 'createQualitySample',
    input: { type: 'RAW_MATERIAL', materialId: material.id, batchNo: 'B-QC2', supplierId: supplier.id, moisturePct: 10, result: 'HOLD', reason: 'تعليق يدوي' },
  })
  const heldTransfer = applyCommand(state, who(state, 'user-gm'), {
    action: 'transferStock',
    input: { from: 'WH_RAW', to: 'WH_MFG', lines: [{ itemType: 'MATERIAL', itemId: material.id, batchNo: 'B-QC2', qty: 200 }] },
  }, clock)
  assert.equal(heldTransfer.ok, false)
  if (!heldTransfer.ok) assert.match(heldTransfer.error, /معلّقة/)

  state = must(state, clock, { action: 'updateQualityResult', input: { sampleId: state.qualitySamples[0]!.id, result: 'PASSED', reason: 'المختبر وافق' } })
  state = must(state, clock, {
    action: 'transferStock',
    input: { from: 'WH_RAW', to: 'WH_MFG', lines: [{ itemType: 'MATERIAL', itemId: material.id, batchNo: 'B-QC2', qty: 200 }] },
  })
  state = must(state, clock, {
    action: 'createRecipe',
    input: { productId: product.id, nameAr: 'وصفة', baseOutputQty: 1000, items: [{ materialId: material.id, qty: 1000 }] },
  })
  state = must(state, clock, { action: 'createProductionOrder', input: { productId: product.id, recipeId: state.recipes[0]!.id, plannedQty: 200 } })
  state = must(state, clock, {
    action: 'createQualitySample',
    input: { type: 'RAW_MATERIAL', materialId: material.id, batchNo: 'B-QC2', supplierId: supplier.id, result: 'HOLD', reason: 'تعليق قبل التشغيل' },
  })
  const consumed = applyCommand(state, who(state, 'user-gm'), {
    action: 'completeProduction',
    input: {
      productionOrderId: state.productionOrders[0]!.id,
      operatorId: operator.id,
      actualOutputQty: 200,
      actuals: [{ materialId: material.id, actualQty: 200 }],
    },
  }, clock)
  assert.equal(consumed.ok, false)
  if (!consumed.ok) assert.match(consumed.error, /معلّقة/)

  state = must(state, clock, { action: 'updateQualityResult', input: { sampleId: state.qualitySamples[0]!.id, result: 'PASSED', reason: 'فك التعليق' } })
  state = must(state, clock, {
    action: 'completeProduction',
    input: {
      productionOrderId: state.productionOrders[0]!.id,
      operatorId: operator.id,
      actualOutputQty: 200,
      actuals: [{ materialId: material.id, actualQty: 200 }],
    },
  })
  const lot = state.lots[0]!
  state = must(state, clock, {
    action: 'createQualitySample',
    input: { type: 'FINISHED_PRODUCT', lotNo: lot.lotNo, result: 'FAILED', reason: 'المنتج خارج المواصفة' },
  })
  assert.equal(state.lots[0]!.qcStatus, 'FAILED')
  state = must(state, clock, { action: 'createInvoice', input: { customerId: customer.id, lines: [{ productId: product.id, qty: 10 }] } })
  const blockedSale = applyCommand(state, who(state, 'user-gm'), { action: 'confirmInvoice', input: { id: state.invoices[0]!.id } }, clock)
  assert.equal(blockedSale.ok, false)
  if (!blockedSale.ok) assert.match(blockedSale.error, /مرفوضة/)

  state = must(state, clock, { action: 'updateQualityResult', input: { sampleId: state.qualitySamples[0]!.id, result: 'HOLD', reason: 'تعليق المنتج' } })
  const blockedWithdrawal = applyCommand(state, who(state, 'user-gm'), {
    action: 'createWithdrawal',
    input: { reason: 'عينة', lines: [{ productId: product.id, qty: 5 }] },
  }, clock)
  assert.equal(blockedWithdrawal.ok, false)
  if (!blockedWithdrawal.ok) assert.match(blockedWithdrawal.error, /معلّقة/)

  state = must(state, clock, { action: 'updateQualityResult', input: { sampleId: state.qualitySamples[0]!.id, result: 'PASSED', reason: 'اعتماد نهائي' } })
  state = must(state, clock, { action: 'confirmInvoice', input: { id: state.invoices[0]!.id } })
  assert.equal(trialBalance(state).balanced, true)
  const summary = supplierQuality(state, supplier.id)
  assert.ok(summary.samples >= 1)
  assert.equal(summary.supplier?.id, supplier.id)
})
