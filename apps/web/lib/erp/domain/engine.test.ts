import assert from 'node:assert/strict'
import { test } from 'node:test'

import { code128Values } from './barcode'
import { commitWithRetry, REVISION_CONFLICT } from './commit'
import { actorFromUser, applyCommand, defaultClock, publicState } from './engine'
import { BCRYPT_ROUNDS } from '../../../server/auth/password'
import bcrypt from 'bcryptjs'
import { DEFAULT_ROLE_PERMISSIONS } from './permissions'
import { factoryStatus, inventoryIntegrity, materialStatement, muscatDay, profitAndLoss, trialBalance, vatReturn } from './reports'
import { buildSeedState, createClock, emptyState } from './seed'
import type { Actor, ErpState } from './types'

function actor(state: ErpState, id: string): Actor {
  const found = actorFromUser(state, id)
  assert.ok(found)
  return found
}

test('CODE128 checksum for HI is 20', () => {
  const codes = code128Values('HI')
  assert.deepEqual(codes, [104, 40, 41, 20, 106])
})

test('seeded factory keeps a balanced ledger and Oman VAT invoice', () => {
  const state = buildSeedState()
  const tb = trialBalance(state)
  assert.equal(tb.balanced, true)
  assert.ok(state.materials.length >= 6)
  assert.ok(state.purchaseOrders.some((order) => order.status === 'PENDING_APPROVAL'))
  const invoice = state.invoices.find((item) => item.status === 'PARTIAL')
  assert.ok(invoice)
  assert.equal(invoice.subtotal, 90)
  assert.equal(invoice.vatAmount, 4.5)
  assert.equal(invoice.total, 94.5)
  const soya = state.materials.find((item) => item.code === 'RM-SOYA')!
  const soyaQty = state.balances.filter((row) => row.itemId === soya.id).reduce((sum, row) => sum + row.qty, 0)
  assert.ok(soyaQty < soya.minQty)
  const unreadLow = state.notifications.filter((item) => item.kind === 'LOW_STOCK' && !item.read)
  assert.equal(unreadLow.length, 1)
  assert.match(unreadLow[0]!.title, /الصويا/)
  const beef = state.products.find((item) => item.code === 'FG-BEEF')!
  const fg = state.balances.find((row) => row.itemId === beef.id && row.warehouse === 'WH_FG')
  assert.equal(fg?.qty, 16500)
  const operatingAt = state.productionOrders.find((order) => order.status === 'COMPLETED')!.completedAt!
  const today = factoryStatus(state, operatingAt)
  assert.equal(today.shifted, false)
  assert.equal(today.production.plannedKg, 20000)
  assert.equal(today.production.actualKg, 17000)
  assert.equal(today.production.executionPct, 85)
  assert.equal(today.sales.today, 90)
  assert.equal(today.sales.month, 90)
  assert.equal(today.sales.openCount, 1)
  assert.equal(today.sales.openOutstanding, 44.5)
  assert.ok(today.profit.costPerTon > 0)
  assert.equal(today.profit.avgPricePerTon, 180)
  assert.equal(today.profit.marginPerTon, Math.round((180 - today.profit.costPerTon) * 1000) / 1000)
  assert.ok(today.inventory.value > 0)
  assert.ok(today.inventory.runningOut.some((item) => item.nameAr.includes('الصويا')))
  assert.ok(today.inventory.stagnant.some((item) => item.nameAr === 'بنتونيت'))
  assert.ok(today.inventory.reserved.length > 0)
  assert.equal(today.operations.wasteKg, 40)
  assert.ok(today.operations.deviations.every((line) => line.diffPct === -15))
  assert.equal(today.operations.stoppageMinutes, 45)
  const later = factoryStatus(state, new Date(Date.parse(operatingAt) + 80 * 86_400_000).toISOString())
  assert.equal(later.shifted, true)
  assert.equal(later.production.actualKg, 17000)
  const pnl = profitAndLoss(state)
  assert.equal(pnl.revenue, 90)
  const vat = vatReturn(state, muscatDay(invoice.issuedAt).slice(0, 7))
  assert.equal(vat.outputVat, 4.5)
  assert.ok(vat.inputVat > 0)
})

test('a raw material statement answers the mill questions', () => {
  const state = buildSeedState()
  const corn = state.materials.find((item) => item.code === 'RM-CORN')!
  const statement = materialStatement(state, corn.id)
  assert.ok(statement)
  assert.equal(statement.receivedQty, 20000)
  assert.equal(statement.consumedQty, 8840)
  assert.equal(statement.onHand, 11160)
  assert.equal(statement.balanceMatches, true)
  assert.equal(statement.outputKg, 17000)
  assert.equal(statement.soldQty, 500)
  assert.equal(statement.withdrawnQty, 0)
  assert.equal(statement.productOnHand, 16500)
  assert.equal(statement.wasteQty, 40)
  assert.equal(statement.shortfallKg, 3000)
  assert.equal(statement.aligned, true)
  assert.match(statement.reasons[0] ?? '', /الكهرباء/)
  assert.equal(statement.stoppages[0]?.minutes, 45)
})

test('operations cannot approve a purchase order', () => {
  const state = buildSeedState()
  const pending = state.purchaseOrders.find((order) => order.status === 'PENDING_APPROVAL')!
  const result = applyCommand(state, actor(state, 'user-ops'), {
    action: 'decidePurchaseOrder',
    input: { id: pending.id, decision: 'APPROVED' },
  })
  assert.equal(result.ok, false)
})

test('goods cannot be received before approval or above the order', () => {
  const clock = createClock('2026-09-21T08:00:00.000Z')
  let state = emptyState('x')
  const gm = actor(state, 'user-gm')
  state = must(state, gm, clock, {
    action: 'createMaterial',
    input: { code: 'RM-TEST', nameAr: 'اختبار', category: 'حبوب', minQty: 1, vatTreatment: 'ZERO' },
  })
  state = must(state, gm, clock, {
    action: 'createSupplier',
    input: { nameAr: 'مورد اختبار' },
  })
  const materialId = state.materials[0]!.id
  const supplierId = state.suppliers[0]!.id
  state = must(state, gm, clock, {
    action: 'createPurchaseOrder',
    input: { supplierId, lines: [{ materialId, qty: 100, unitCost: 1 }] },
  })
  const poId = state.purchaseOrders[0]!.id
  const early = applyCommand(
    state,
    gm,
    { action: 'receiveGoods', input: { purchaseOrderId: poId, lines: [{ materialId, qty: 10, batchNo: 'B1' }] } },
    clock,
  )
  assert.equal(early.ok, false)
  state = must(state, gm, clock, { action: 'decidePurchaseOrder', input: { id: poId, decision: 'APPROVED' } })
  const over = applyCommand(
    state,
    gm,
    { action: 'receiveGoods', input: { purchaseOrderId: poId, lines: [{ materialId, qty: 101, batchNo: 'B1' }] } },
    clock,
  )
  assert.equal(over.ok, false)
  state = must(state, gm, clock, {
    action: 'receiveGoods',
    input: { purchaseOrderId: poId, lines: [{ materialId, qty: 40, batchNo: 'B1' }] },
  })
  assert.equal(state.purchaseOrders[0]!.status, 'PARTIALLY_RECEIVED')
  assert.equal(state.balances[0]!.qty, 40)
  const tb = trialBalance(state)
  assert.equal(tb.balanced, true)
})

test('transfer cannot make stock negative and production needs the manufacturing warehouse', () => {
  const state = buildSeedState()
  const gm = actor(state, 'user-gm')
  const corn = state.materials.find((item) => item.code === 'RM-CORN')!
  const moved = applyCommand(state, gm, {
    action: 'transferStock',
    input: {
      from: 'WH_RAW',
      to: 'WH_MFG',
      lines: [{ itemType: 'MATERIAL', itemId: corn.id, batchNo: 'B-CORN-0901', qty: 999999 }],
    },
  })
  assert.equal(moved.ok, false)

  const broiler = state.products.find((item) => item.code === 'FG-BROILER')!
  const recipe = state.recipes.find((item) => item.productId === broiler.id)!
  let next = must(state, gm, defaultClock(), {
    action: 'createProductionOrder',
    input: { productId: broiler.id, recipeId: recipe.id, plannedQty: 1000 },
  })
  const order = next.productionOrders[0]!
  assert.equal(order.expected.find((line) => line.materialId === corn.id)?.expectedQty, 580)
  const completed = applyCommand(next, gm, {
    action: 'completeProduction',
    input: {
      productionOrderId: order.id,
      actualOutputQty: 1000,
      actuals: order.expected.map((line) => ({ materialId: line.materialId, actualQty: line.expectedQty })),
    },
  })
  assert.equal(completed.ok, false)
})

test('variance above the threshold requires a reason', () => {
  const state = buildSeedState()
  const gm = actor(state, 'user-gm')
  const beef = state.products.find((item) => item.code === 'FG-BEEF')!
  const recipe = state.recipes.find((item) => item.productId === beef.id)!
  const corn = state.materials.find((item) => item.code === 'RM-CORN')!
  let next = must(state, gm, defaultClock(), {
    action: 'transferStock',
    input: {
      from: 'WH_RAW',
      to: 'WH_MFG',
      lines: recipe.items.map((item) => ({
        itemType: 'MATERIAL' as const,
        itemId: item.materialId,
        batchNo:
          item.materialId === corn.id
            ? 'B-CORN-0901'
            : state.balances.find((row) => row.itemId === item.materialId && row.warehouse === 'WH_RAW')!.batchNo,
        qty: item.materialId === corn.id ? item.qty * 1.1 : item.qty,
      })),
    },
  })
  next = must(next, gm, defaultClock(), {
    action: 'createProductionOrder',
    input: { productId: beef.id, recipeId: recipe.id, plannedQty: 1000 },
  })
  const order = next.productionOrders[0]!
  const denied = applyCommand(next, gm, {
    action: 'completeProduction',
    input: {
      productionOrderId: order.id,
      actualOutputQty: 1000,
      actuals: order.expected.map((line) => ({
        materialId: line.materialId,
        actualQty: line.materialId === corn.id ? line.expectedQty * 1.1 : line.expectedQty,
      })),
    },
  })
  assert.equal(denied.ok, false)
  if (!denied.ok) assert.match(denied.error, /سبب الانحراف/)
  const allowed = applyCommand(next, gm, {
    action: 'completeProduction',
    input: {
      productionOrderId: order.id,
      actualOutputQty: 1000,
      varianceReason: 'رطوبة أعلى في الذرة',
      actuals: order.expected.map((line) => ({
        materialId: line.materialId,
        actualQty: line.materialId === corn.id ? line.expectedQty * 1.1 : line.expectedQty,
      })),
    },
  })
  assert.equal(allowed.ok, true)
  if (allowed.ok) assert.equal(trialBalance(allowed.state).balanced, true)
})

test('invoice cannot sell more than finished goods', () => {
  const state = buildSeedState()
  const gm = actor(state, 'user-gm')
  const customer = state.customers[0]!
  const beef = state.products.find((item) => item.code === 'FG-BEEF')!
  let next = must(state, gm, defaultClock(), {
    action: 'createInvoice',
    input: { customerId: customer.id, lines: [{ productId: beef.id, qty: 20000 }] },
  })
  const result = applyCommand(next, gm, { action: 'confirmInvoice', input: { id: next.invoices[0]!.id } })
  assert.equal(result.ok, false)
})

test('expense approval and payroll post balanced journals', () => {
  const state = buildSeedState()
  const gm = actor(state, 'user-gm')
  const acc = actor(state, 'user-acc')
  assert.ok(acc.permissions.includes('accounting.manage'))
  assert.equal(acc.permissions.includes('approvals.decide'), false)
  const expense = state.expenses.find((item) => item.status === 'PENDING_APPROVAL')!
  const posted = applyCommand(state, gm, { action: 'decideExpense', input: { id: expense.id, decision: 'POSTED' } })
  assert.equal(posted.ok, true)
  const payroll = state.payrolls[0]!
  const approved = applyCommand(posted.ok ? posted.state : state, gm, {
    action: 'decidePayroll',
    input: { id: payroll.id, decision: 'APPROVED' },
  })
  assert.equal(approved.ok, true)
  if (!approved.ok) return
  const paid = applyCommand(approved.state, acc, { action: 'payPayroll', input: { id: payroll.id } })
  assert.equal(paid.ok, true)
  if (paid.ok) assert.equal(trialBalance(paid.state).balanced, true)
})

test('accountant does not receive warehouse permissions by default', () => {
  assert.equal(DEFAULT_ROLE_PERMISSIONS.ACCOUNTANT.includes('inventory.adjust'), false)
  assert.equal(DEFAULT_ROLE_PERMISSIONS.OPERATIONS.includes('accounting.manage'), false)
  assert.equal(DEFAULT_ROLE_PERMISSIONS.GM.includes('users.manage'), true)
})

test('day 4: seeded stock balances reconcile with the inventory ledger', () => {
  const state = buildSeedState()
  const check = inventoryIntegrity(state)
  assert.equal(check.ok, true, check.issues.join(' | '))
  assert.ok(state.ledger.length > 0)
  assert.ok(state.balances.some((row) => row.qty > 0))
})

test('day 4: every stock add and issue updates balance and ledger together', () => {
  const clock = createClock('2026-09-22T08:00:00.000Z')
  let state = emptyState('day4')
  const gm = actor(state, 'user-gm')
  state = must(state, gm, clock, {
    action: 'createMaterial',
    input: { code: 'RM-DAY4', nameAr: 'مادة يوم ٤', category: 'اختبار', minQty: 10, vatTreatment: 'ZERO' },
  })
  const materialId = state.materials[0]!.id

  state = must(state, gm, clock, {
    action: 'requestAdjustment',
    input: {
      warehouse: 'WH_RAW',
      itemType: 'MATERIAL',
      itemId: materialId,
      batchNo: 'B-DAY4',
      qtyDelta: 100,
      unitCost: 0.25,
      reason: 'جرد افتتاحي ليوم ٤',
    },
  })
  const addId = state.adjustments[0]!.id
  state = must(state, gm, clock, { action: 'decideAdjustment', input: { id: addId, decision: 'APPROVED' } })

  const afterAdd = state.balances.find((row) => row.itemId === materialId && row.batchNo === 'B-DAY4')
  assert.ok(afterAdd)
  assert.equal(afterAdd.qty, 100)
  const addLedger = state.ledger.find((row) => row.refId === addId && row.type === 'ADJUSTMENT')
  assert.ok(addLedger)
  assert.equal(addLedger.prevQty, 0)
  assert.equal(addLedger.newQty, 100)
  assert.equal(addLedger.qty, 100)

  state = must(state, gm, clock, {
    action: 'requestAdjustment',
    input: {
      warehouse: 'WH_RAW',
      itemType: 'MATERIAL',
      itemId: materialId,
      batchNo: 'B-DAY4',
      qtyDelta: -30,
      reason: 'صرف تجريبي ليوم ٤',
    },
  })
  const issueId = state.adjustments[0]!.id
  state = must(state, gm, clock, { action: 'decideAdjustment', input: { id: issueId, decision: 'APPROVED' } })

  const afterIssue = state.balances.find((row) => row.itemId === materialId && row.batchNo === 'B-DAY4')
  assert.ok(afterIssue)
  assert.equal(afterIssue.qty, 70)
  const issueLedger = state.ledger.find((row) => row.refId === issueId && row.type === 'ADJUSTMENT')
  assert.ok(issueLedger)
  assert.equal(issueLedger.prevQty, 100)
  assert.equal(issueLedger.newQty, 70)
  assert.equal(issueLedger.qty, -30)

  const overIssue = applyCommand(
    state,
    gm,
    {
      action: 'requestAdjustment',
      input: {
        warehouse: 'WH_RAW',
        itemType: 'MATERIAL',
        itemId: materialId,
        batchNo: 'B-DAY4',
        qtyDelta: -999,
        reason: 'محاولة صرف زائد',
      },
    },
    clock,
  )
  assert.equal(overIssue.ok, true)
  if (!overIssue.ok) return
  const denied = applyCommand(overIssue.state, gm, {
    action: 'decideAdjustment',
    input: { id: overIssue.state.adjustments[0]!.id, decision: 'APPROVED' },
  })
  assert.equal(denied.ok, false)

  const check = inventoryIntegrity(state)
  assert.equal(check.ok, true, check.issues.join(' | '))
})

test('day 4: goods receipt posts purchase ledger lines that match WH_RAW balances', () => {
  const clock = createClock('2026-09-22T09:00:00.000Z')
  let state = emptyState('day4-gr')
  const gm = actor(state, 'user-gm')
  state = must(state, gm, clock, {
    action: 'createMaterial',
    input: { code: 'RM-GR4', nameAr: 'ذرة يوم ٤', category: 'حبوب', minQty: 1, vatTreatment: 'ZERO' },
  })
  state = must(state, gm, clock, { action: 'createSupplier', input: { nameAr: 'مورد يوم ٤' } })
  const materialId = state.materials[0]!.id
  const supplierId = state.suppliers[0]!.id
  state = must(state, gm, clock, {
    action: 'createPurchaseOrder',
    input: { supplierId, lines: [{ materialId, qty: 50, unitCost: 0.12 }] },
  })
  const poId = state.purchaseOrders[0]!.id
  state = must(state, gm, clock, { action: 'decidePurchaseOrder', input: { id: poId, decision: 'APPROVED' } })
  state = must(state, gm, clock, {
    action: 'receiveGoods',
    input: { purchaseOrderId: poId, lines: [{ materialId, qty: 50, batchNo: 'B-GR4' }] },
  })

  const balance = state.balances.find((row) => row.batchNo === 'B-GR4' && row.warehouse === 'WH_RAW')
  assert.ok(balance)
  assert.equal(balance.qty, 50)
  const receipt = state.goodsReceipts[0]!
  const ledger = state.ledger.find((row) => row.refId === receipt.id && row.type === 'PURCHASE_RECEIPT')
  assert.ok(ledger)
  assert.equal(ledger.prevQty, 0)
  assert.equal(ledger.newQty, 50)
  assert.equal(ledger.qty, 50)
  assert.equal(inventoryIntegrity(state).ok, true)
})

test('publicState hides salaries, payroll, journals, and audit logs from operations', () => {
  const state = buildSeedState()
  const ops = actor(state, 'user-ops')
  const view = publicState(state, ops.permissions)
  for (const employee of view.employees) {
    assert.equal(Object.hasOwn(employee, 'basicSalary'), false)
  }
  assert.deepEqual(view.payrolls, [])
  assert.deepEqual(view.journals, [])
  assert.deepEqual(view.auditLogs, [])
  assert.ok(view.employees.length > 0)
  assert.ok(state.journals.length > 0)
  assert.ok(state.auditLogs.length > 0)
  assert.ok(state.payrolls.length > 0)
})

test('two commands that start from the same revision both commit', async () => {
  let db = buildSeedState()
  db.revision = 3
  const stale = structuredClone(db)

  function persist(next: ErpState, expected: number) {
    if (db.revision !== expected) throw new Error(REVISION_CONFLICT)
    db = structuredClone(next)
  }

  async function commit(code: string, nameAr: string, firstSnapshot?: ErpState) {
    let attempt = 0
    return commitWithRetry(async () => {
      attempt += 1
      const loaded = attempt === 1 && firstSnapshot ? structuredClone(firstSnapshot) : structuredClone(db)
      const result = applyCommand(loaded, actor(loaded, 'user-gm'), {
        action: 'createMaterial',
        input: { code, nameAr, category: 'اختبار', minQty: 1 },
      })
      if (!result.ok) throw new Error(result.error)
      const expected = result.state.revision
      result.state.revision = expected + 1
      persist(result.state, expected)
      return result.state
    })
  }

  await commit('RM-RACE-A', 'مادة أ')
  await commit('RM-RACE-B', 'مادة ب', stale)
  assert.ok(db.materials.some((item) => item.code === 'RM-RACE-A'))
  assert.ok(db.materials.some((item) => item.code === 'RM-RACE-B'))
  assert.equal(db.revision, 5)
})

test('publicState keeps payroll, journals, and salaries for the general manager', () => {
  const state = buildSeedState()
  const gm = actor(state, 'user-gm')
  const view = publicState(state, gm.permissions)
  assert.ok(view.employees.every((employee) => typeof employee.basicSalary === 'number' && employee.basicSalary > 0))
  assert.ok(view.payrolls.length > 0)
  assert.ok(view.journals.length > 0)
  assert.ok(view.auditLogs.length > 0)
  assert.ok(view.users.every((user) => !('passwordHash' in user)))
})

test('seeded admin can use demo immediately', () => {
  const state = buildSeedState()
  const admin = actor(state, 'user-admin')
  assert.equal(admin.mustChangePassword, false)
  const allowed = applyCommand(state, admin, {
    action: 'createMaterial',
    input: { code: 'RM-AFTER', nameAr: 'بعد التغيير', category: 'اختبار', minQty: 1 },
  })
  assert.equal(allowed.ok, true)
})

test('archiving old rows keeps stock integrity and the trial balance', () => {
  const state = buildSeedState()
  const before = trialBalance(state)
  assert.equal(inventoryIntegrity(state).ok, true)
  const ledgerBefore = state.ledger.length
  const journalsBefore = state.journals.length
  const result = applyCommand(state, actor(state, 'user-gm'), {
    action: 'archiveHistory',
    input: { olderThanDays: 30, nowIso: '2027-01-01T00:00:00.000Z' },
  })
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.ok(result.state.ledger.length < ledgerBefore)
  assert.ok(result.state.journals.length < journalsBefore)
  assert.equal(inventoryIntegrity(result.state).ok, true, inventoryIntegrity(result.state).issues.join('\n'))
  const after = trialBalance(result.state)
  assert.equal(after.balanced, true)
  assert.equal(after.debit, before.debit)
  assert.equal(after.credit, before.credit)
  const denied = applyCommand(result.state, actor(result.state, 'user-ops'), {
    action: 'archiveHistory',
    input: { olderThanDays: 30, nowIso: '2027-01-01T00:00:00.000Z' },
  })
  assert.equal(denied.ok, false)
})

test('new password hashes use bcrypt cost 12', () => {
  assert.equal(BCRYPT_ROUNDS, 12)
  const hash = bcrypt.hashSync('Admin123!', BCRYPT_ROUNDS)
  assert.match(hash, /^\$2[ab]\$12\$/)
  assert.equal(bcrypt.compareSync('Admin123!', hash), true)
})

function must(state: ErpState, who: Actor, clock: ReturnType<typeof defaultClock>, command: Parameters<typeof applyCommand>[2]) {
  const result = applyCommand(state, who, command, clock)
  if (!result.ok) throw new Error(result.error)
  return result.state
}
