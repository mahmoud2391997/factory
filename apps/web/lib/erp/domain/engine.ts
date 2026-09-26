import { applyArchive, planArchive } from './archive'
import { money, qty, round3 } from './money'
import { PERMISSIONS, type Permission, type RoleKey } from './permissions'
import type {
  Actor,
  Balance,
  Clock,
  Command,
  CommandResult,
  ErpState,
  PublicState,
  ItemType,
  JournalLine,
  LedgerType,
  Notification,
  VatTreatment,
  WarehouseKey,
} from './types'

const INVENTORY_ACCOUNT: Record<ItemType, string> = {
  MATERIAL: '1100',
  PRODUCT: '1300',
}

export function defaultClock(): Clock {
  let n = 0
  return {
    now: () => new Date().toISOString(),
    id: (prefix) => {
      n += 1
      return `${prefix}-${Date.now().toString(36)}-${n.toString(36)}`
    },
  }
}

function fail(error: string): CommandResult {
  return { ok: false, error }
}

function allow(actor: Actor, permission: string): CommandResult | null {
  if (!actor.permissions.includes(permission)) return fail('ليست لديك صلاحية لهذا الإجراء')
  return null
}

function yearOf(iso: string) {
  return iso.slice(0, 4)
}

function nextNumber(state: ErpState, docType: string, at: string) {
  const key = `${docType}-${yearOf(at)}`
  const current = state.sequences[key] ?? 0
  const next = current + 1
  state.sequences[key] = next
  return `${docType}-${yearOf(at)}-${String(next).padStart(3, '0')}`
}

function audit(state: ErpState, actor: Actor, clock: Clock, action: string, entity: string, entityId: string, detail: string) {
  state.auditLogs.unshift({
    id: clock.id('aud'),
    at: clock.now(),
    userId: actor.id,
    userName: actor.name,
    action,
    entity,
    entityId,
    detail,
  })
  if (state.auditLogs.length > 1000) state.auditLogs.length = 1000
}

function notify(
  state: ErpState,
  clock: Clock,
  kind: Notification['kind'],
  title: string,
  body: string,
  roles: RoleKey[],
  dedupeKey: string,
) {
  if (dedupeKey && state.notifications.some((item) => !item.read && item.dedupeKey === dedupeKey)) return
  state.notifications.unshift({
    id: clock.id('ntf'),
    kind,
    title,
    body,
    dedupeKey,
    roles,
    read: false,
    emailStatus: 'pending',
    at: clock.now(),
  })
  if (state.notifications.length > 300) state.notifications.length = 300
}

function postJournal(
  state: ErpState,
  clock: Clock,
  memo: string,
  refType: string,
  refId: string,
  lines: JournalLine[],
) {
  const cleaned = lines
    .map((line) => ({
      accountCode: line.accountCode,
      debit: money(line.debit),
      credit: money(line.credit),
    }))
    .filter((line) => line.debit > 0 || line.credit > 0)
  const debit = money(cleaned.reduce((sum, line) => sum + line.debit, 0))
  const credit = money(cleaned.reduce((sum, line) => sum + line.credit, 0))
  if (Math.abs(debit - credit) > 0.001) {
    throw new Error(`قيد غير متوازن: مدين ${debit} دائن ${credit}`)
  }
  if (cleaned.length === 0) return
  const at = clock.now()
  state.journals.unshift({
    id: clock.id('je'),
    number: nextNumber(state, 'JE', at),
    at,
    memo,
    refType,
    refId,
    lines: cleaned,
  })
}

function vatAmount(net: number, treatment: VatTreatment, ratePct: number) {
  if (treatment !== 'STANDARD') return 0
  return money(net * (ratePct / 100))
}

function findMaterial(state: ErpState, id: string) {
  return state.materials.find((item) => item.id === id && item.active)
}

function findProduct(state: ErpState, id: string) {
  return state.products.find((item) => item.id === id && item.active)
}

function itemName(state: ErpState, itemType: ItemType, itemId: string) {
  if (itemType === 'MATERIAL') return state.materials.find((item) => item.id === itemId)?.nameAr ?? itemId
  return state.products.find((item) => item.id === itemId)?.nameAr ?? itemId
}

function onHand(state: ErpState, warehouse: WarehouseKey, itemType: ItemType, itemId: string, batchNo?: string) {
  return qty(
    state.balances
      .filter(
        (row) =>
          row.warehouse === warehouse &&
          row.itemType === itemType &&
          row.itemId === itemId &&
          (batchNo ? row.batchNo === batchNo : true),
      )
      .reduce((sum, row) => sum + row.qty, 0),
  )
}

function upsertBalance(
  state: ErpState,
  clock: Clock,
  input: {
    warehouse: WarehouseKey
    itemType: ItemType
    itemId: string
    batchNo: string
    qtyDelta: number
    unitCost: number
    expiryDate?: string | null
    receivedAt?: string
  },
) {
  let row = state.balances.find(
    (item) =>
      item.warehouse === input.warehouse &&
      item.itemType === input.itemType &&
      item.itemId === input.itemId &&
      item.batchNo === input.batchNo,
  )
  if (!row) {
    row = {
      id: clock.id('bal'),
      warehouse: input.warehouse,
      itemType: input.itemType,
      itemId: input.itemId,
      batchNo: input.batchNo,
      qty: 0,
      unitCost: money(input.unitCost),
      expiryDate: input.expiryDate ?? null,
      receivedAt: input.receivedAt ?? clock.now(),
    }
    state.balances.push(row)
  }
  const prev = row.qty
  const next = qty(row.qty + input.qtyDelta)
  if (next < -0.0001) return { error: 'الكمية غير كافية في المستودع' as const, prev, row }
  if (input.qtyDelta > 0) {
    const incoming = input.qtyDelta
    const cost = input.unitCost
    row.unitCost = prev + incoming === 0 ? money(cost) : money((prev * row.unitCost + incoming * cost) / (prev + incoming))
    if (input.expiryDate) row.expiryDate = input.expiryDate
  }
  row.qty = next
  return { prev, next, row }
}

function addLedger(
  state: ErpState,
  clock: Clock,
  actor: Actor,
  input: {
    type: LedgerType
    warehouse: WarehouseKey
    itemType: ItemType
    itemId: string
    batchNo: string
    qty: number
    unitCost: number
    prevQty: number
    newQty: number
    refType: string
    refId: string
    notes?: string
  },
) {
  state.ledger.unshift({
    id: clock.id('led'),
    at: clock.now(),
    type: input.type,
    warehouse: input.warehouse,
    itemType: input.itemType,
    itemId: input.itemId,
    batchNo: input.batchNo,
    qty: qty(input.qty),
    unitCost: money(input.unitCost),
    prevQty: qty(input.prevQty),
    newQty: qty(input.newQty),
    refType: input.refType,
    refId: input.refId,
    userId: actor.id,
    notes: input.notes ?? '',
  })
}

function issueBatch(
  state: ErpState,
  clock: Clock,
  actor: Actor,
  input: {
    warehouse: WarehouseKey
    itemType: ItemType
    itemId: string
    batchNo: string
    qty: number
    type: LedgerType
    refType: string
    refId: string
  },
) {
  const row = state.balances.find(
    (item) =>
      item.warehouse === input.warehouse &&
      item.itemType === input.itemType &&
      item.itemId === input.itemId &&
      item.batchNo === input.batchNo &&
      item.qty > 0,
  )
  if (!row || row.qty + 0.0001 < input.qty) {
    return { error: `الرصيد غير كافٍ للدفعة ${input.batchNo}` }
  }
  const prev = row.qty
  row.qty = qty(row.qty - input.qty)
  addLedger(state, clock, actor, {
    type: input.type,
    warehouse: input.warehouse,
    itemType: input.itemType,
    itemId: input.itemId,
    batchNo: input.batchNo,
    qty: -input.qty,
    unitCost: row.unitCost,
    prevQty: prev,
    newQty: row.qty,
    refType: input.refType,
    refId: input.refId,
  })
  return { unitCost: row.unitCost, cost: money(input.qty * row.unitCost) }
}

function fifoIssue(
  state: ErpState,
  clock: Clock,
  actor: Actor,
  input: {
    warehouse: WarehouseKey
    itemType: ItemType
    itemId: string
    qty: number
    type: LedgerType
    refType: string
    refId: string
  },
) {
  const needQty = qty(input.qty)
  const available = onHand(state, input.warehouse, input.itemType, input.itemId)
  if (available + 0.0001 < needQty) {
    return { error: `الرصيد غير كافٍ في المستودع (${available} متاح / ${needQty} مطلوب)` }
  }
  const rows = state.balances
    .filter(
      (item) =>
        item.warehouse === input.warehouse &&
        item.itemType === input.itemType &&
        item.itemId === input.itemId &&
        item.qty > 0,
    )
    .slice()
    .sort((a, b) => a.receivedAt.localeCompare(b.receivedAt))
  let left = needQty
  let cost = 0
  const lines: Array<{ batchNo: string; qty: number; unitCost: number }> = []
  for (const row of rows) {
    if (left <= 0) break
    const take = qty(Math.min(row.qty, left))
    const issued = issueBatch(state, clock, actor, {
      warehouse: input.warehouse,
      itemType: input.itemType,
      itemId: input.itemId,
      batchNo: row.batchNo,
      qty: take,
      type: input.type,
      refType: input.refType,
      refId: input.refId,
    })
    if ('error' in issued && issued.error) return { error: issued.error }
    if (!('error' in issued)) {
      cost = money(cost + issued.cost)
      lines.push({ batchNo: row.batchNo, qty: take, unitCost: issued.unitCost })
      left = qty(left - take)
    }
  }
  if (left > 0.001) return { error: 'تعذر صرف الكمية بالكامل' }
  return { cost, lines }
}

function refreshAlerts(state: ErpState, clock: Clock) {
  const today = clock.now().slice(0, 10)
  for (const material of state.materials) {
    if (!material.active) continue
    const total = qty(
      state.balances
        .filter((row) => row.itemType === 'MATERIAL' && row.itemId === material.id)
        .reduce((sum, row) => sum + row.qty, 0),
    )
    const dedupeKey = `low:${material.id}`
    if (total <= material.minQty) {
      notify(
        state,
        clock,
        'LOW_STOCK',
        `مخزون منخفض: ${material.nameAr}`,
        `الرصيد ${total} ${material.unit} والحد الأدنى ${material.minQty}.`,
        ['GM', 'OPERATIONS'],
        dedupeKey,
      )
    } else {
      for (const note of state.notifications) {
        if (note.dedupeKey === dedupeKey && !note.read) note.read = true
      }
    }
  }
  const horizon = new Date(clock.now())
  horizon.setUTCDate(horizon.getUTCDate() + 30)
  const horizonIso = horizon.toISOString().slice(0, 10)
  for (const row of state.balances) {
    if (!row.expiryDate || row.qty <= 0) continue
    if (row.expiryDate <= horizonIso) {
      notify(
        state,
        clock,
        'EXPIRY',
        `دفعة قاربت الانتهاء: ${row.batchNo}`,
        `${itemName(state, row.itemType, row.itemId)} — الصلاحية ${row.expiryDate} والكمية ${row.qty}.`,
        ['GM', 'OPERATIONS'],
        `exp:${row.batchNo}:${today}`,
      )
    }
  }
}

function cloneState(state: ErpState): ErpState {
  return structuredClone(state)
}

function ok(state: ErpState, message: string, extra?: Record<string, unknown>): CommandResult {
  return { ok: true, state, message, extra }
}

export function applyCommand(source: ErpState, actor: Actor, command: Command, clock: Clock = defaultClock()): CommandResult {
  const denied = authorize(actor, command)
  if (denied) return denied
  const state = cloneState(source)
  try {
    const result = run(state, actor, command, clock)
    if (!result.ok) return result
    refreshAlerts(result.state, clock)
    return result
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'تعذر تنفيذ العملية')
  }
}

function authorize(actor: Actor, command: Command): CommandResult | null {
  if (actor.mustChangePassword) {
    if (command.action === 'setUserPassword' && command.input.userId === actor.id) return null
    return fail('يجب تغيير كلمة المرور قبل استخدام النظام')
  }
  const map: Record<Command['action'], string> = {
    createMaterial: 'inventory.read',
    createProduct: 'production.read',
    createSupplier: 'purchasing.po.create',
    createCustomer: 'sales.create',
    createEmployee: 'employees.manage',
    createRecipe: 'production.create',
    updateCompany: 'settings.update',
    fundBank: 'settings.update',
    createPurchaseOrder: 'purchasing.po.create',
    decidePurchaseOrder: 'purchasing.po.approve',
    receiveGoods: 'purchasing.gr.create',
    transferStock: 'inventory.transfer.create',
    requestAdjustment: 'inventory.adjust',
    decideAdjustment: 'approvals.decide',
    createProductionOrder: 'production.create',
    completeProduction: 'production.complete',
    createInvoice: 'sales.create',
    confirmInvoice: 'sales.confirm',
    recordPayment: 'sales.payments.manage',
    createWithdrawal: 'sales.create',
    createExpense: 'expenses.manage',
    decideExpense: 'expenses.approve',
    recordAttendance: 'attendance.manage',
    importAttendance: 'attendance.manage',
    createPayroll: 'payroll.manage',
    decidePayroll: 'payroll.approve',
    payPayroll: 'payroll.pay',
    markNotificationRead: 'notifications.read',
    scanBarcode: 'barcode.scan',
    setRolePermissions: 'users.manage',
    setUserPassword: 'users.manage',
    archiveHistory: 'settings.update',
  }
  return allow(actor, map[command.action])
}

function run(state: ErpState, actor: Actor, command: Command, clock: Clock): CommandResult {
  switch (command.action) {
    case 'createMaterial':
      return createMaterial(state, actor, command.input, clock)
    case 'createProduct':
      return createProduct(state, actor, command.input, clock)
    case 'createSupplier':
      return createParty(state, actor, 'suppliers', command.input, clock)
    case 'createCustomer':
      return createParty(state, actor, 'customers', command.input, clock)
    case 'createEmployee':
      return createEmployee(state, actor, command.input, clock)
    case 'createRecipe':
      return createRecipe(state, actor, command.input, clock)
    case 'updateCompany':
      return updateCompany(state, actor, command.input, clock)
    case 'fundBank':
      return fundBank(state, actor, command.input, clock)
    case 'createPurchaseOrder':
      return createPurchaseOrder(state, actor, command.input, clock)
    case 'decidePurchaseOrder':
      return decidePurchaseOrder(state, actor, command.input, clock)
    case 'receiveGoods':
      return receiveGoods(state, actor, command.input, clock)
    case 'transferStock':
      return transferStock(state, actor, command.input, clock)
    case 'requestAdjustment':
      return requestAdjustment(state, actor, command.input, clock)
    case 'decideAdjustment':
      return decideAdjustment(state, actor, command.input, clock)
    case 'createProductionOrder':
      return createProductionOrder(state, actor, command.input, clock)
    case 'completeProduction':
      return completeProduction(state, actor, command.input, clock)
    case 'createInvoice':
      return createInvoice(state, actor, command.input, clock)
    case 'confirmInvoice':
      return confirmInvoice(state, actor, command.input, clock)
    case 'recordPayment':
      return recordPayment(state, actor, command.input, clock)
    case 'createWithdrawal':
      return createWithdrawal(state, actor, command.input, clock)
    case 'createExpense':
      return createExpense(state, actor, command.input, clock)
    case 'decideExpense':
      return decideExpense(state, actor, command.input, clock)
    case 'recordAttendance':
      return recordAttendance(state, actor, command.input, clock)
    case 'importAttendance':
      return importAttendance(state, actor, command.input, clock)
    case 'createPayroll':
      return createPayroll(state, actor, command.input, clock)
    case 'decidePayroll':
      return decidePayroll(state, actor, command.input, clock)
    case 'payPayroll':
      return payPayroll(state, actor, command.input, clock)
    case 'markNotificationRead':
      return markNotificationRead(state, actor, command.input, clock)
    case 'scanBarcode':
      return scanBarcode(state, actor, command.input, clock)
    case 'setRolePermissions':
      return setRolePermissions(state, actor, command.input, clock)
    case 'setUserPassword':
      return setUserPassword(state, actor, command.input, clock)
    case 'archiveHistory':
      return archiveHistory(state, actor, command.input, clock)
    default:
      return fail('إجراء غير معروف')
  }
}

function createMaterial(state: ErpState, actor: Actor, input: Extract<Command, { action: 'createMaterial' }>['input'], clock: Clock): CommandResult {
  const code = input.code.trim().toUpperCase()
  if (!code || !input.nameAr.trim()) return fail('كود المادة والاسم مطلوبان')
  if (state.materials.some((item) => item.code === code)) return fail('كود المادة مستخدم')
  if (input.minQty < 0) return fail('الحد الأدنى غير صحيح')
  const material = {
    id: clock.id('mat'),
    code,
    nameAr: input.nameAr.trim(),
    category: input.category.trim() || 'عام',
    unit: input.unit?.trim() || 'كجم',
    minQty: qty(input.minQty),
    vatTreatment: input.vatTreatment ?? 'STANDARD',
    barcode: (input.barcode || code).trim(),
    active: true,
  }
  state.materials.unshift(material)
  audit(state, actor, clock, 'إنشاء مادة', 'material', material.id, material.nameAr)
  return ok(state, 'تم حفظ المادة الخام')
}

function createProduct(state: ErpState, actor: Actor, input: Extract<Command, { action: 'createProduct' }>['input'], clock: Clock): CommandResult {
  const code = input.code.trim().toUpperCase()
  if (!code || !input.nameAr.trim()) return fail('كود المنتج والاسم مطلوبان')
  if (state.products.some((item) => item.code === code)) return fail('كود المنتج مستخدم')
  if (input.salePrice < 0) return fail('سعر البيع غير صحيح')
  const product = {
    id: clock.id('prd'),
    code,
    nameAr: input.nameAr.trim(),
    unit: input.unit?.trim() || 'كجم',
    salePrice: money(input.salePrice),
    vatTreatment: input.vatTreatment ?? 'STANDARD',
    barcode: (input.barcode || code).trim(),
    bagKg: qty(input.bagKg ?? 50),
    active: true,
  }
  state.products.unshift(product)
  audit(state, actor, clock, 'إنشاء منتج', 'product', product.id, product.nameAr)
  return ok(state, 'تم حفظ المنتج النهائي')
}

function createParty(
  state: ErpState,
  actor: Actor,
  kind: 'suppliers' | 'customers',
  input: { nameAr: string; vatNumber?: string; phone?: string; email?: string; address?: string },
  clock: Clock,
): CommandResult {
  if (!input.nameAr.trim()) return fail('الاسم مطلوب')
  const list = state[kind]
  const prefix = kind === 'suppliers' ? 'S' : 'C'
  const party = {
    id: clock.id(prefix.toLowerCase()),
    code: `${prefix}-${String(list.length + 1).padStart(3, '0')}`,
    nameAr: input.nameAr.trim(),
    vatNumber: input.vatNumber?.trim() ?? '',
    phone: input.phone?.trim() ?? '',
    email: input.email?.trim() ?? '',
    address: input.address?.trim() ?? '',
  }
  list.unshift(party)
  audit(state, actor, clock, kind === 'suppliers' ? 'إنشاء مورد' : 'إنشاء عميل', kind, party.id, party.nameAr)
  return ok(state, kind === 'suppliers' ? 'تم حفظ المورد' : 'تم حفظ العميل')
}

function createEmployee(state: ErpState, actor: Actor, input: Extract<Command, { action: 'createEmployee' }>['input'], clock: Clock): CommandResult {
  if (!input.nameAr.trim()) return fail('اسم الموظف مطلوب')
  if (input.basicSalary < 0) return fail('الراتب غير صحيح')
  const employee = {
    id: clock.id('emp'),
    code: `EMP-${String(state.employees.length + 1).padStart(3, '0')}`,
    nameAr: input.nameAr.trim(),
    department: input.department.trim() || 'عام',
    jobTitle: input.jobTitle.trim() || 'موظف',
    basicSalary: money(input.basicSalary),
    active: true,
  }
  state.employees.unshift(employee)
  audit(state, actor, clock, 'إنشاء موظف', 'employee', employee.id, employee.nameAr)
  return ok(state, 'تم حفظ الموظف')
}

function createRecipe(state: ErpState, actor: Actor, input: Extract<Command, { action: 'createRecipe' }>['input'], clock: Clock): CommandResult {
  if (!findProduct(state, input.productId)) return fail('المنتج غير موجود')
  if (input.baseOutputQty <= 0) return fail('كمية المخرجات الأساسية يجب أن تكون أكبر من صفر')
  if (input.items.length === 0) return fail('أضف مكونات الوصفة')
  for (const item of input.items) {
    if (!findMaterial(state, item.materialId)) return fail('إحدى المواد غير موجودة')
    if (item.qty <= 0) return fail('كمية المكوّن يجب أن تكون أكبر من صفر')
  }
  const recipe = {
    id: clock.id('rcp'),
    productId: input.productId,
    nameAr: input.nameAr.trim() || 'وصفة',
    baseOutputQty: qty(input.baseOutputQty),
    items: input.items.map((item) => ({ materialId: item.materialId, qty: qty(item.qty) })),
  }
  state.recipes.unshift(recipe)
  audit(state, actor, clock, 'إنشاء وصفة', 'recipe', recipe.id, recipe.nameAr)
  return ok(state, 'تم حفظ الوصفة')
}

function updateCompany(state: ErpState, actor: Actor, input: Extract<Command, { action: 'updateCompany' }>['input'], clock: Clock): CommandResult {
  if (input.vatRatePct != null && (input.vatRatePct < 0 || input.vatRatePct > 100)) return fail('نسبة الضريبة غير صحيحة')
  state.company = {
    ...state.company,
    ...input,
    vatRatePct: input.vatRatePct != null ? round3(input.vatRatePct) : state.company.vatRatePct,
    varianceThresholdPct:
      input.varianceThresholdPct != null ? round3(input.varianceThresholdPct) : state.company.varianceThresholdPct,
    currency: 'OMR',
  }
  audit(state, actor, clock, 'تحديث إعدادات الشركة', 'company', 'company', state.company.nameAr)
  return ok(state, 'تم حفظ إعدادات الشركة')
}

function fundBank(state: ErpState, actor: Actor, input: Extract<Command, { action: 'fundBank' }>['input'], clock: Clock): CommandResult {
  const amount = money(input.amount)
  if (amount <= 0) return fail('مبلغ التمويل غير صحيح')
  postJournal(state, clock, input.memo?.trim() || 'تمويل رأس المال', 'capital', 'bank', [
    { accountCode: '1500', debit: amount, credit: 0 },
    { accountCode: '3100', debit: 0, credit: amount },
  ])
  audit(state, actor, clock, 'تمويل البنك', 'journal', 'capital', String(amount))
  return ok(state, 'تم تسجيل تمويل رأس المال')
}

function createPurchaseOrder(state: ErpState, actor: Actor, input: Extract<Command, { action: 'createPurchaseOrder' }>['input'], clock: Clock): CommandResult {
  if (!state.suppliers.some((item) => item.id === input.supplierId)) return fail('المورد غير موجود')
  if (input.lines.length === 0) return fail('أضف بنود أمر الشراء')
  const lines = []
  for (const line of input.lines) {
    if (!findMaterial(state, line.materialId)) return fail('إحدى المواد غير موجودة')
    if (line.qty <= 0 || line.unitCost < 0) return fail('كمية أو سعر البند غير صحيح')
    lines.push({
      materialId: line.materialId,
      qty: qty(line.qty),
      unitCost: money(line.unitCost),
      receivedQty: 0,
    })
  }
  const at = clock.now()
  const po = {
    id: clock.id('po'),
    number: nextNumber(state, 'PO', at),
    supplierId: input.supplierId,
    status: 'PENDING_APPROVAL' as const,
    notes: input.notes?.trim() ?? '',
    lines,
    createdBy: actor.id,
    createdAt: at,
  }
  state.purchaseOrders.unshift(po)
  notify(state, clock, 'APPROVAL', `اعتماد أمر شراء ${po.number}`, 'أمر شراء بانتظار اعتماد المدير العام.', ['GM'], `appr:po:${po.id}`)
  audit(state, actor, clock, 'إنشاء أمر شراء', 'purchaseOrder', po.id, po.number)
  return ok(state, `تم إرسال ${po.number} للاعتماد`, { id: po.id, number: po.number })
}

function decidePurchaseOrder(state: ErpState, actor: Actor, input: Extract<Command, { action: 'decidePurchaseOrder' }>['input'], clock: Clock): CommandResult {
  const po = state.purchaseOrders.find((item) => item.id === input.id)
  if (!po) return fail('أمر الشراء غير موجود')
  if (po.status !== 'PENDING_APPROVAL') return fail('لا يمكن اعتماد أمر الشراء في هذه الحالة')
  po.status = input.decision
  po.decidedBy = actor.id
  po.decidedAt = clock.now()
  audit(state, actor, clock, input.decision === 'APPROVED' ? 'اعتماد أمر شراء' : 'رفض أمر شراء', 'purchaseOrder', po.id, po.number)
  return ok(state, input.decision === 'APPROVED' ? `تم اعتماد ${po.number}` : `تم رفض ${po.number}`)
}

function receiveGoods(state: ErpState, actor: Actor, input: Extract<Command, { action: 'receiveGoods' }>['input'], clock: Clock): CommandResult {
  const po = state.purchaseOrders.find((item) => item.id === input.purchaseOrderId)
  if (!po) return fail('أمر الشراء غير موجود')
  if (po.status !== 'APPROVED' && po.status !== 'PARTIALLY_RECEIVED') return fail('الاستلام متاح بعد اعتماد أمر الشراء فقط')
  if (input.lines.length === 0) return fail('أدخل الكميات المستلمة')
  const receiptLines = []
  let net = 0
  let vat = 0
  const receiptId = clock.id('gr')
  for (const line of input.lines) {
    const poLine = po.lines.find((item) => item.materialId === line.materialId)
    const material = findMaterial(state, line.materialId)
    if (!poLine || !material) return fail('البند ليس ضمن أمر الشراء')
    const receiveQty = qty(line.qty)
    if (receiveQty <= 0) return fail('كمية الاستلام يجب أن تكون أكبر من صفر')
    if (qty(poLine.receivedQty + receiveQty) > poLine.qty + 0.001) return fail(`الكمية تتجاوز أمر الشراء للمادة ${material.nameAr}`)
    const batchNo = line.batchNo.trim()
    if (!batchNo) return fail('رقم الدفعة مطلوب')
    const unitCost = money(line.unitCost ?? poLine.unitCost)
    const posted = upsertBalance(state, clock, {
      warehouse: 'WH_RAW',
      itemType: 'MATERIAL',
      itemId: material.id,
      batchNo,
      qtyDelta: receiveQty,
      unitCost,
      expiryDate: line.expiryDate ?? null,
    })
    if ('error' in posted && posted.error) return fail(posted.error)
    if (!posted.row || posted.prev == null || posted.next == null) return fail('تعذر تحديث الرصيد')
    addLedger(state, clock, actor, {
      type: 'PURCHASE_RECEIPT',
      warehouse: 'WH_RAW',
      itemType: 'MATERIAL',
      itemId: material.id,
      batchNo,
      qty: receiveQty,
      unitCost,
      prevQty: posted.prev,
      newQty: posted.next,
      refType: 'goodsReceipt',
      refId: receiptId,
    })
    poLine.receivedQty = qty(poLine.receivedQty + receiveQty)
    const lineNet = money(receiveQty * unitCost)
    net = money(net + lineNet)
    vat = money(vat + vatAmount(lineNet, material.vatTreatment, state.company.vatRatePct))
    receiptLines.push({
      materialId: material.id,
      qty: receiveQty,
      unitCost,
      batchNo,
      expiryDate: line.expiryDate ?? null,
    })
  }
  const at = clock.now()
  const receipt = {
    id: receiptId,
    number: nextNumber(state, 'GR', at),
    purchaseOrderId: po.id,
    at,
    createdBy: actor.id,
    lines: receiptLines,
  }
  state.goodsReceipts.unshift(receipt)
  const fully = po.lines.every((line) => line.receivedQty + 0.001 >= line.qty)
  po.status = fully ? 'RECEIVED' : 'PARTIALLY_RECEIVED'
  postJournal(state, clock, `استلام مشتريات ${receipt.number}`, 'goodsReceipt', receipt.id, [
    { accountCode: '1100', debit: net, credit: 0 },
    { accountCode: '2300', debit: vat, credit: 0 },
    { accountCode: '2100', debit: 0, credit: money(net + vat) },
  ])
  audit(state, actor, clock, 'استلام بضاعة', 'goodsReceipt', receipt.id, receipt.number)
  return ok(state, `تم الاستلام ${receipt.number} إلى مستودع المواد الخام`, { id: receipt.id, number: receipt.number })
}

function transferStock(state: ErpState, actor: Actor, input: Extract<Command, { action: 'transferStock' }>['input'], clock: Clock): CommandResult {
  if (input.from === input.to) return fail('لا يمكن التحويل إلى نفس المستودع')
  if (input.lines.length === 0) return fail('أضف بنود التحويل')
  const at = clock.now()
  const transfer = {
    id: clock.id('tr'),
    number: nextNumber(state, 'TR', at),
    from: input.from,
    to: input.to,
    at,
    createdBy: actor.id,
    notes: input.notes?.trim() ?? '',
    lines: [] as Array<{ itemType: ItemType; itemId: string; batchNo: string; qty: number }>,
  }
  for (const line of input.lines) {
    const amount = qty(line.qty)
    if (amount <= 0) return fail('كمية التحويل غير صحيحة')
    const exists = line.itemType === 'MATERIAL' ? findMaterial(state, line.itemId) : findProduct(state, line.itemId)
    if (!exists) return fail('الصنف غير موجود')
    const issued = issueBatch(state, clock, actor, {
      warehouse: input.from,
      itemType: line.itemType,
      itemId: line.itemId,
      batchNo: line.batchNo.trim(),
      qty: amount,
      type: 'TRANSFER_OUT',
      refType: 'stockTransfer',
      refId: transfer.id,
    })
    if ('error' in issued && issued.error) return fail(issued.error)
    const unitCost = 'unitCost' in issued ? issued.unitCost : 0
    const source = state.balances.find(
      (row) =>
        row.warehouse === input.from &&
        row.itemType === line.itemType &&
        row.batchNo === line.batchNo.trim() &&
        row.itemId === line.itemId,
    )
    const posted = upsertBalance(state, clock, {
      warehouse: input.to,
      itemType: line.itemType,
      itemId: line.itemId,
      batchNo: line.batchNo.trim(),
      qtyDelta: amount,
      unitCost: unitCost ?? 0,
      expiryDate: source?.expiryDate ?? null,
      receivedAt: source?.receivedAt,
    })
    if ('error' in posted && posted.error) return fail(posted.error)
    if (!posted.row || posted.prev == null || posted.next == null) return fail('تعذر تحديث رصيد الوجهة')
    addLedger(state, clock, actor, {
      type: 'TRANSFER_IN',
      warehouse: input.to,
      itemType: line.itemType,
      itemId: line.itemId,
      batchNo: line.batchNo.trim(),
      qty: amount,
      unitCost: unitCost ?? 0,
      prevQty: posted.prev,
      newQty: posted.next,
      refType: 'stockTransfer',
      refId: transfer.id,
    })
    transfer.lines.push({ itemType: line.itemType, itemId: line.itemId, batchNo: line.batchNo.trim(), qty: amount })
  }
  state.transfers.unshift(transfer)
  audit(state, actor, clock, 'تحويل مخزون', 'stockTransfer', transfer.id, transfer.number)
  return ok(state, `تم التحويل ${transfer.number}`)
}

function requestAdjustment(state: ErpState, actor: Actor, input: Extract<Command, { action: 'requestAdjustment' }>['input'], clock: Clock): CommandResult {
  if (!input.reason.trim()) return fail('سبب التعديل مطلوب')
  if (input.qtyDelta === 0) return fail('كمية التعديل لا يمكن أن تكون صفراً')
  const exists = input.itemType === 'MATERIAL' ? findMaterial(state, input.itemId) : findProduct(state, input.itemId)
  if (!exists) return fail('الصنف غير موجود')
  const at = clock.now()
  const adjustment = {
    id: clock.id('adj'),
    number: nextNumber(state, 'ADJ', at),
    warehouse: input.warehouse,
    itemType: input.itemType,
    itemId: input.itemId,
    batchNo: input.batchNo.trim() || 'ADJ',
    qtyDelta: qty(input.qtyDelta),
    unitCost: money(input.unitCost ?? 0),
    reason: input.reason.trim(),
    status: 'PENDING_APPROVAL' as const,
    createdBy: actor.id,
    createdAt: at,
  }
  state.adjustments.unshift(adjustment)
  notify(state, clock, 'APPROVAL', `اعتماد تعديل مخزون ${adjustment.number}`, adjustment.reason, ['GM'], `appr:adj:${adjustment.id}`)
  audit(state, actor, clock, 'طلب تعديل مخزون', 'stockAdjustment', adjustment.id, adjustment.number)
  return ok(state, `تم إرسال ${adjustment.number} للاعتماد`)
}

function decideAdjustment(state: ErpState, actor: Actor, input: Extract<Command, { action: 'decideAdjustment' }>['input'], clock: Clock): CommandResult {
  const adjustment = state.adjustments.find((item) => item.id === input.id)
  if (!adjustment) return fail('التعديل غير موجود')
  if (adjustment.status !== 'PENDING_APPROVAL') return fail('تمت معالجة التعديل')
  if (input.decision === 'REJECTED') {
    adjustment.status = 'REJECTED'
    adjustment.decidedBy = actor.id
    audit(state, actor, clock, 'رفض تعديل مخزون', 'stockAdjustment', adjustment.id, adjustment.number)
    return ok(state, `تم رفض ${adjustment.number}`)
  }
  const account = adjustment.itemType === 'PRODUCT' ? '1300' : '1100'
  if (adjustment.qtyDelta > 0) {
    const unitCost = adjustment.unitCost
    const posted = upsertBalance(state, clock, {
      warehouse: adjustment.warehouse,
      itemType: adjustment.itemType,
      itemId: adjustment.itemId,
      batchNo: adjustment.batchNo,
      qtyDelta: adjustment.qtyDelta,
      unitCost,
    })
    if ('error' in posted && posted.error) return fail(posted.error)
    if (!posted.row || posted.prev == null || posted.next == null) return fail('تعذر تحديث الرصيد')
    addLedger(state, clock, actor, {
      type: 'ADJUSTMENT',
      warehouse: adjustment.warehouse,
      itemType: adjustment.itemType,
      itemId: adjustment.itemId,
      batchNo: adjustment.batchNo,
      qty: adjustment.qtyDelta,
      unitCost,
      prevQty: posted.prev,
      newQty: posted.next,
      refType: 'stockAdjustment',
      refId: adjustment.id,
      notes: adjustment.reason,
    })
    const value = money(adjustment.qtyDelta * unitCost)
    postJournal(state, clock, `تعديل مخزون ${adjustment.number}`, 'stockAdjustment', adjustment.id, [
      { accountCode: account, debit: value, credit: 0 },
      { accountCode: '6300', debit: 0, credit: value },
    ])
  } else {
    const issued = issueBatch(state, clock, actor, {
      warehouse: adjustment.warehouse,
      itemType: adjustment.itemType,
      itemId: adjustment.itemId,
      batchNo: adjustment.batchNo,
      qty: Math.abs(adjustment.qtyDelta),
      type: 'ADJUSTMENT',
      refType: 'stockAdjustment',
      refId: adjustment.id,
    })
    if ('error' in issued && issued.error) return fail(issued.error)
    const value = 'cost' in issued ? (issued.cost ?? 0) : 0
    postJournal(state, clock, `تعديل مخزون ${adjustment.number}`, 'stockAdjustment', adjustment.id, [
      { accountCode: '6300', debit: value, credit: 0 },
      { accountCode: account, debit: 0, credit: value },
    ])
  }
  adjustment.status = 'APPROVED'
  adjustment.decidedBy = actor.id
  audit(state, actor, clock, 'اعتماد تعديل مخزون', 'stockAdjustment', adjustment.id, adjustment.number)
  return ok(state, `تم اعتماد ${adjustment.number}`)
}

function createProductionOrder(state: ErpState, actor: Actor, input: Extract<Command, { action: 'createProductionOrder' }>['input'], clock: Clock): CommandResult {
  const product = findProduct(state, input.productId)
  const recipe = state.recipes.find((item) => item.id === input.recipeId && item.productId === input.productId)
  if (!product || !recipe) return fail('المنتج أو الوصفة غير موجودة')
  if (input.plannedQty <= 0) return fail('الكمية المخططة غير صحيحة')
  if (recipe.baseOutputQty <= 0) return fail('أساس الوصفة غير صحيح')
  const at = clock.now()
  const order = {
    id: clock.id('prdord'),
    number: nextNumber(state, 'PR', at),
    productId: product.id,
    recipeId: recipe.id,
    plannedQty: qty(input.plannedQty),
    status: 'RELEASED' as const,
    expected: recipe.items.map((item) => ({
      materialId: item.materialId,
      expectedQty: qty(input.plannedQty * (item.qty / recipe.baseOutputQty)),
      actualQty: 0,
      wasteQty: 0,
    })),
    actualOutputQty: 0,
    totalCost: 0,
    unitCost: 0,
    outputBatch: '',
    varianceReason: '',
    createdBy: actor.id,
    createdAt: at,
  }
  state.productionOrders.unshift(order)
  audit(state, actor, clock, 'إنشاء أمر إنتاج', 'productionOrder', order.id, order.number)
  return ok(state, `تم فتح ${order.number}`, { id: order.id, number: order.number })
}

function completeProduction(state: ErpState, actor: Actor, input: Extract<Command, { action: 'completeProduction' }>['input'], clock: Clock): CommandResult {
  const order = state.productionOrders.find((item) => item.id === input.productionOrderId)
  if (!order) return fail('أمر الإنتاج غير موجود')
  if (order.status !== 'RELEASED') return fail('أمر الإنتاج مكتمل بالفعل')
  if (input.actualOutputQty <= 0) return fail('كمية الناتج يجب أن تكون أكبر من صفر')
  let totalCost = 0
  for (const expected of order.expected) {
    const actual = input.actuals.find((item) => item.materialId === expected.materialId)
    const actualQty = qty(actual?.actualQty ?? expected.expectedQty)
    const wasteQty = qty(actual?.wasteQty ?? 0)
    if (actualQty < 0 || wasteQty < 0) return fail('الكميات الفعلية غير صحيحة')
    if (wasteQty - actualQty > 0.001) return fail('الهدر لا يمكن أن يتجاوز الكمية المصروفة')
    const material = findMaterial(state, expected.materialId)
    if (!material) return fail('مادة الوصفة غير موجودة')
    if (expected.expectedQty > 0) {
      const diffPct = Math.abs((actualQty - expected.expectedQty) / expected.expectedQty) * 100
      if (diffPct - state.company.varianceThresholdPct > 0.001 && !input.varianceReason?.trim()) {
        return fail(`الانحراف في ${material.nameAr} تجاوز ${state.company.varianceThresholdPct}% — سبب الانحراف مطلوب`)
      }
    }
    if (actualQty > 0) {
      const issued = fifoIssue(state, clock, actor, {
        warehouse: 'WH_MFG',
        itemType: 'MATERIAL',
        itemId: expected.materialId,
        qty: actualQty,
        type: 'PRODUCTION_CONSUMPTION',
        refType: 'productionOrder',
        refId: order.id,
      })
      if ('error' in issued && issued.error) {
        return fail(`${material.nameAr}: ${issued.error}. حوّل المواد إلى مستودع التصنيع أولاً.`)
      }
      if (!('error' in issued)) totalCost = money(totalCost + issued.cost)
    }
    expected.actualQty = actualQty
    expected.wasteQty = wasteQty
  }
  const outputQty = qty(input.actualOutputQty)
  const unitCost = outputQty > 0 ? money(totalCost / outputQty) : 0
  const posted = upsertBalance(state, clock, {
    warehouse: 'WH_FG',
    itemType: 'PRODUCT',
    itemId: order.productId,
    batchNo: order.number,
    qtyDelta: outputQty,
    unitCost,
  })
  if ('error' in posted && posted.error) return fail(posted.error)
  if (!posted.row || posted.prev == null || posted.next == null) return fail('تعذر إضافة المنتج النهائي')
  addLedger(state, clock, actor, {
    type: 'PRODUCTION_OUTPUT',
    warehouse: 'WH_FG',
    itemType: 'PRODUCT',
    itemId: order.productId,
    batchNo: order.number,
    qty: outputQty,
      unitCost: unitCost ?? 0,
      prevQty: posted.prev,
    newQty: posted.next,
    refType: 'productionOrder',
    refId: order.id,
  })
  postJournal(state, clock, `استهلاك إنتاج ${order.number}`, 'productionOrder', order.id, [
    { accountCode: '1200', debit: totalCost, credit: 0 },
    { accountCode: '1100', debit: 0, credit: totalCost },
  ])
  postJournal(state, clock, `إخراج إنتاج ${order.number}`, 'productionOrder', order.id, [
    { accountCode: '1300', debit: totalCost, credit: 0 },
    { accountCode: '1200', debit: 0, credit: totalCost },
  ])
  order.status = 'COMPLETED'
  order.actualOutputQty = outputQty
  order.totalCost = totalCost
  order.unitCost = unitCost
  order.outputBatch = order.number
  order.varianceReason = input.varianceReason?.trim() ?? ''
  order.completedAt = clock.now()
  if (order.varianceReason) {
    notify(state, clock, 'INFO', `انحراف إنتاج ${order.number}`, order.varianceReason, ['GM'], `var:${order.id}`)
  }
  audit(state, actor, clock, 'إكمال الإنتاج', 'productionOrder', order.id, order.number)
  return ok(state, `اكتمل ${order.number} ودخل مستودع المنتجات`)
}

function createInvoice(state: ErpState, actor: Actor, input: Extract<Command, { action: 'createInvoice' }>['input'], clock: Clock): CommandResult {
  if (!state.customers.some((item) => item.id === input.customerId)) return fail('العميل غير موجود')
  if (input.lines.length === 0) return fail('أضف بنود الفاتورة')
  const lines = []
  let subtotal = 0
  let vatTotal = 0
  for (const line of input.lines) {
    const product = findProduct(state, line.productId)
    if (!product) return fail('المنتج غير موجود')
    if (line.qty <= 0) return fail('كمية البيع غير صحيحة')
    const unitPrice = money(line.unitPrice ?? product.salePrice)
    const net = money(line.qty * unitPrice)
    const rate = state.company.vatRatePct
    const vat = vatAmount(net, product.vatTreatment, rate)
    subtotal = money(subtotal + net)
    vatTotal = money(vatTotal + vat)
    lines.push({
      productId: product.id,
      qty: qty(line.qty),
      unitPrice,
      vatTreatment: product.vatTreatment,
      vatRatePct: product.vatTreatment === 'STANDARD' ? rate : 0,
      net,
      vat,
      total: money(net + vat),
      batchNo: '',
      unitCost: 0,
    })
  }
  const at = clock.now()
  const invoice = {
    id: clock.id('inv'),
    number: nextNumber(state, 'INV', at),
    customerId: input.customerId,
    status: 'DRAFT' as const,
    issuedAt: at,
    notes: input.notes?.trim() ?? '',
    lines,
    subtotal,
    vatAmount: vatTotal,
    total: money(subtotal + vatTotal),
    paidAmount: 0,
    createdBy: actor.id,
  }
  state.invoices.unshift(invoice)
  audit(state, actor, clock, 'إنشاء فاتورة', 'salesInvoice', invoice.id, invoice.number)
  return ok(state, `تم حفظ مسودة ${invoice.number}`, { id: invoice.id, number: invoice.number })
}

function confirmInvoice(state: ErpState, actor: Actor, input: Extract<Command, { action: 'confirmInvoice' }>['input'], clock: Clock): CommandResult {
  const invoice = state.invoices.find((item) => item.id === input.id)
  if (!invoice) return fail('الفاتورة غير موجودة')
  if (invoice.status !== 'DRAFT') return fail('الفاتورة مؤكدة بالفعل')
  let cogs = 0
  for (const line of invoice.lines) {
    const issued = fifoIssue(state, clock, actor, {
      warehouse: 'WH_FG',
      itemType: 'PRODUCT',
      itemId: line.productId,
      qty: line.qty,
      type: 'SALE',
      refType: 'salesInvoice',
      refId: invoice.id,
    })
    if ('error' in issued && issued.error) {
      const product = findProduct(state, line.productId)
      return fail(`${product?.nameAr ?? 'المنتج'}: ${issued.error}`)
    }
    if (!('error' in issued)) {
      cogs = money(cogs + issued.cost)
      line.batchNo = issued.lines.map((item) => item.batchNo).join(', ')
      line.unitCost = line.qty > 0 ? money(issued.cost / line.qty) : 0
    }
  }
  invoice.status = 'CONFIRMED'
  invoice.issuedAt = clock.now()
  postJournal(state, clock, `فاتورة مبيعات ${invoice.number}`, 'salesInvoice', invoice.id, [
    { accountCode: '1400', debit: invoice.total, credit: 0 },
    { accountCode: '4100', debit: 0, credit: invoice.subtotal },
    { accountCode: '2200', debit: 0, credit: invoice.vatAmount },
  ])
  postJournal(state, clock, `تكلفة مبيعات ${invoice.number}`, 'salesInvoice', invoice.id, [
    { accountCode: '5100', debit: cogs, credit: 0 },
    { accountCode: '1300', debit: 0, credit: cogs },
  ])
  audit(state, actor, clock, 'تأكيد فاتورة', 'salesInvoice', invoice.id, invoice.number)
  return ok(state, `تم تأكيد ${invoice.number} وخصم المخزون`)
}

function recordPayment(state: ErpState, actor: Actor, input: Extract<Command, { action: 'recordPayment' }>['input'], clock: Clock): CommandResult {
  const invoice = state.invoices.find((item) => item.id === input.invoiceId)
  if (!invoice) return fail('الفاتورة غير موجودة')
  if (invoice.status === 'DRAFT') return fail('أكّد الفاتورة قبل التحصيل')
  const amount = money(input.amount)
  if (amount <= 0) return fail('مبلغ التحصيل غير صحيح')
  const outstanding = money(invoice.total - invoice.paidAmount)
  if (amount - outstanding > 0.001) return fail(`المبلغ أكبر من المتبقي (${outstanding} ر.ع.)`)
  const at = clock.now()
  const payment = {
    id: clock.id('pay'),
    number: nextNumber(state, 'PAY', at),
    invoiceId: invoice.id,
    amount,
    method: input.method?.trim() || 'تحويل بنكي',
    at,
    createdBy: actor.id,
  }
  state.payments.unshift(payment)
  invoice.paidAmount = money(invoice.paidAmount + amount)
  invoice.status = invoice.total - invoice.paidAmount <= 0.001 ? 'PAID' : 'PARTIAL'
  postJournal(state, clock, `تحصيل ${payment.number}`, 'salesPayment', payment.id, [
    { accountCode: '1500', debit: amount, credit: 0 },
    { accountCode: '1400', debit: 0, credit: amount },
  ])
  audit(state, actor, clock, 'تحصيل فاتورة', 'salesPayment', payment.id, payment.number)
  return ok(state, `تم تسجيل التحصيل ${payment.number}`)
}

function createWithdrawal(state: ErpState, actor: Actor, input: Extract<Command, { action: 'createWithdrawal' }>['input'], clock: Clock): CommandResult {
  if (!input.reason.trim()) return fail('سبب السحب مطلوب')
  if (input.lines.length === 0) return fail('أضف بنود السحب')
  const at = clock.now()
  const withdrawal = {
    id: clock.id('wd'),
    number: nextNumber(state, 'WD', at),
    reason: input.reason.trim(),
    at,
    createdBy: actor.id,
    lines: [] as Array<{ productId: string; qty: number; batchNo: string; unitCost: number }>,
    totalCost: 0,
  }
  let totalCost = 0
  for (const line of input.lines) {
    if (!findProduct(state, line.productId)) return fail('المنتج غير موجود')
    if (line.qty <= 0) return fail('كمية السحب غير صحيحة')
    const issued = fifoIssue(state, clock, actor, {
      warehouse: 'WH_FG',
      itemType: 'PRODUCT',
      itemId: line.productId,
      qty: line.qty,
      type: 'WITHDRAWAL',
      refType: 'withdrawal',
      refId: withdrawal.id,
    })
    if ('error' in issued && issued.error) return fail(issued.error)
    if (!('error' in issued)) {
      totalCost = money(totalCost + issued.cost)
      withdrawal.lines.push({
        productId: line.productId,
        qty: qty(line.qty),
        batchNo: issued.lines.map((item) => item.batchNo).join(', '),
        unitCost: line.qty > 0 ? money(issued.cost / line.qty) : 0,
      })
    }
  }
  withdrawal.totalCost = totalCost
  state.withdrawals.unshift(withdrawal)
  postJournal(state, clock, `سحب داخلي ${withdrawal.number}`, 'withdrawal', withdrawal.id, [
    { accountCode: '6200', debit: totalCost, credit: 0 },
    { accountCode: '1300', debit: 0, credit: totalCost },
  ])
  audit(state, actor, clock, 'سحب داخلي', 'withdrawal', withdrawal.id, withdrawal.number)
  return ok(state, `تم السحب ${withdrawal.number}`)
}

function createExpense(state: ErpState, actor: Actor, input: Extract<Command, { action: 'createExpense' }>['input'], clock: Clock): CommandResult {
  if (!input.description.trim()) return fail('وصف المصروف مطلوب')
  if (input.amount <= 0) return fail('مبلغ المصروف غير صحيح')
  const treatment = input.vatTreatment ?? 'STANDARD'
  const net = money(input.amount)
  const vat = vatAmount(net, treatment, state.company.vatRatePct)
  const at = clock.now()
  const expense = {
    id: clock.id('exp'),
    number: nextNumber(state, 'EXP', at),
    category: input.category.trim() || 'تشغيل',
    description: input.description.trim(),
    amount: net,
    vatTreatment: treatment,
    payFrom: input.payFrom ?? 'BANK',
    status: 'PENDING_APPROVAL' as const,
    vatAmount: vat,
    total: money(net + vat),
    createdBy: actor.id,
    createdAt: at,
  }
  state.expenses.unshift(expense)
  notify(state, clock, 'APPROVAL', `اعتماد مصروف ${expense.number}`, expense.description, ['GM'], `appr:exp:${expense.id}`)
  audit(state, actor, clock, 'إنشاء مصروف', 'expense', expense.id, expense.number)
  return ok(state, `تم إرسال ${expense.number} للاعتماد`)
}

function decideExpense(state: ErpState, actor: Actor, input: Extract<Command, { action: 'decideExpense' }>['input'], clock: Clock): CommandResult {
  const expense = state.expenses.find((item) => item.id === input.id)
  if (!expense) return fail('المصروف غير موجود')
  if (expense.status !== 'PENDING_APPROVAL') return fail('تمت معالجة المصروف')
  if (input.decision === 'REJECTED') {
    expense.status = 'REJECTED'
    expense.decidedBy = actor.id
    audit(state, actor, clock, 'رفض مصروف', 'expense', expense.id, expense.number)
    return ok(state, `تم رفض ${expense.number}`)
  }
  const creditAccount = expense.payFrom === 'BANK' ? '1500' : '2100'
  postJournal(state, clock, `مصروف ${expense.number}`, 'expense', expense.id, [
    { accountCode: '6200', debit: expense.amount, credit: 0 },
    { accountCode: '2300', debit: expense.vatAmount, credit: 0 },
    { accountCode: creditAccount, debit: 0, credit: expense.total },
  ])
  expense.status = 'POSTED'
  expense.decidedBy = actor.id
  audit(state, actor, clock, 'ترحيل مصروف', 'expense', expense.id, expense.number)
  return ok(state, `تم ترحيل ${expense.number}`)
}

function recordAttendance(state: ErpState, actor: Actor, input: Extract<Command, { action: 'recordAttendance' }>['input'], clock: Clock): CommandResult {
  if (!state.employees.some((item) => item.id === input.employeeId && item.active)) return fail('الموظف غير موجود')
  if (!input.date || !input.checkIn) return fail('التاريخ ووقت الحضور مطلوبان')
  const row = {
    id: clock.id('att'),
    employeeId: input.employeeId,
    date: input.date,
    checkIn: input.checkIn,
    checkOut: input.checkOut || '',
    source: input.source ?? 'MANUAL',
  }
  state.attendance.unshift(row)
  audit(state, actor, clock, 'تسجيل حضور', 'attendance', row.id, input.date)
  return ok(state, 'تم تسجيل الحضور')
}

function importAttendance(state: ErpState, actor: Actor, input: Extract<Command, { action: 'importAttendance' }>['input'], clock: Clock): CommandResult {
  const lines = input.csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  let count = 0
  for (const line of lines) {
    if (line.startsWith('employee')) continue
    const [code, date, checkIn, checkOut] = line.split(',').map((part) => part.trim())
    const employee = state.employees.find((item) => item.code === code)
    if (!employee || !date || !checkIn) continue
    state.attendance.unshift({
      id: clock.id('att'),
      employeeId: employee.id,
      date,
      checkIn,
      checkOut: checkOut ?? '',
      source: 'CSV',
    })
    count += 1
  }
  if (count === 0) return fail('لم يُستورد أي صف. الصيغة: كود الموظف,التاريخ,الحضور,الانصراف')
  audit(state, actor, clock, 'استيراد حضور', 'attendance', 'csv', `${count} صف`)
  return ok(state, `تم استيراد ${count} سجل حضور`)
}

function hoursBetween(checkIn: string, checkOut: string) {
  const [ih, im] = checkIn.split(':').map(Number)
  const [oh, om] = checkOut.split(':').map(Number)
  if (![ih, im, oh, om].every((n) => Number.isFinite(n))) return 0
  return Math.max(0, oh + om / 60 - (ih + im / 60))
}

function createPayroll(state: ErpState, actor: Actor, input: Extract<Command, { action: 'createPayroll' }>['input'], clock: Clock): CommandResult {
  if (!/^\d{4}-\d{2}$/.test(input.month)) return fail('الشهر بصيغة YYYY-MM')
  if (state.payrolls.some((item) => item.month === input.month && item.status !== 'REJECTED')) return fail('يوجد مسير لهذا الشهر')
  if (input.lines.length === 0) return fail('أضف موظفين للمسير')
  const lines = []
  for (const line of input.lines) {
    const employee = state.employees.find((item) => item.id === line.employeeId && item.active)
    if (!employee) return fail('موظف غير موجود في المسير')
    const overtimeHours = qty(line.overtimeHours ?? 0)
    const hourly = employee.basicSalary / 30 / 8
    const overtimeAmount = money(overtimeHours * hourly * 1.25)
    const allowances = money(line.allowances ?? 0)
    const deductions = money(line.deductions ?? 0)
    const gross = money(employee.basicSalary + overtimeAmount + allowances)
    const net = money(gross - deductions)
    if (net < 0) return fail(`صافي راتب ${employee.nameAr} سالب`)
    lines.push({
      employeeId: employee.id,
      basic: employee.basicSalary,
      overtimeHours,
      overtimeAmount,
      allowances,
      deductions,
      gross,
      net,
    })
  }
  const at = clock.now()
  const payroll = {
    id: clock.id('payr'),
    number: nextNumber(state, 'PRL', at),
    month: input.month,
    status: 'PENDING_APPROVAL' as const,
    lines,
    totalNet: money(lines.reduce((sum, line) => sum + line.net, 0)),
    createdBy: actor.id,
    createdAt: at,
  }
  state.payrolls.unshift(payroll)
  notify(state, clock, 'APPROVAL', `اعتماد مسير ${payroll.month}`, `الصافي ${payroll.totalNet} ر.ع.`, ['GM'], `appr:prl:${payroll.id}`)
  audit(state, actor, clock, 'إنشاء مسير رواتب', 'payroll', payroll.id, payroll.number)
  return ok(state, `تم إرسال مسير ${payroll.month} للاعتماد`)
}

function decidePayroll(state: ErpState, actor: Actor, input: Extract<Command, { action: 'decidePayroll' }>['input'], clock: Clock): CommandResult {
  const payroll = state.payrolls.find((item) => item.id === input.id)
  if (!payroll) return fail('المسير غير موجود')
  if (payroll.status !== 'PENDING_APPROVAL') return fail('تمت معالجة المسير')
  if (input.decision === 'REJECTED') {
    payroll.status = 'REJECTED'
    payroll.decidedBy = actor.id
    audit(state, actor, clock, 'رفض مسير', 'payroll', payroll.id, payroll.number)
    return ok(state, `تم رفض ${payroll.number}`)
  }
  const gross = money(payroll.lines.reduce((sum, line) => sum + line.gross, 0))
  const deductions = money(payroll.lines.reduce((sum, line) => sum + line.deductions, 0))
  postJournal(state, clock, `رواتب ${payroll.month}`, 'payroll', payroll.id, [
    { accountCode: '6100', debit: gross, credit: 0 },
    { accountCode: '2400', debit: 0, credit: payroll.totalNet },
    { accountCode: '2500', debit: 0, credit: deductions },
  ])
  payroll.status = 'APPROVED'
  payroll.decidedBy = actor.id
  audit(state, actor, clock, 'اعتماد مسير رواتب', 'payroll', payroll.id, payroll.number)
  return ok(state, `تم اعتماد مسير ${payroll.month}`)
}

function payPayroll(state: ErpState, actor: Actor, input: Extract<Command, { action: 'payPayroll' }>['input'], clock: Clock): CommandResult {
  const payroll = state.payrolls.find((item) => item.id === input.id)
  if (!payroll) return fail('المسير غير موجود')
  if (payroll.status !== 'APPROVED') return fail('اعتمد المسير قبل الصرف')
  postJournal(state, clock, `صرف رواتب ${payroll.month}`, 'payroll', payroll.id, [
    { accountCode: '2400', debit: payroll.totalNet, credit: 0 },
    { accountCode: '1500', debit: 0, credit: payroll.totalNet },
  ])
  payroll.status = 'PAID'
  audit(state, actor, clock, 'صرف رواتب', 'payroll', payroll.id, payroll.number)
  return ok(state, `تم صرف رواتب ${payroll.month}`)
}

function markNotificationRead(state: ErpState, actor: Actor, input: Extract<Command, { action: 'markNotificationRead' }>['input'], clock: Clock): CommandResult {
  const note = state.notifications.find((item) => item.id === input.id)
  if (!note) return fail('الإشعار غير موجود')
  note.read = true
  audit(state, actor, clock, 'قراءة إشعار', 'notification', note.id, note.title)
  return ok(state, 'تم تعليم الإشعار كمقروء')
}

function scanBarcode(state: ErpState, actor: Actor, input: Extract<Command, { action: 'scanBarcode' }>['input'], clock: Clock): CommandResult {
  const code = input.code.trim()
  if (!code) return fail('مرّر الباركود أو اكتبه')
  const material = state.materials.find((item) => item.barcode === code || item.code === code)
  const product = state.products.find((item) => item.barcode === code || item.code === code)
  if (!material && !product) return fail('لا يوجد صنف بهذا الباركود')
  const itemType: ItemType = material ? 'MATERIAL' : 'PRODUCT'
  const itemId = material?.id ?? product!.id
  const balances = state.balances.filter((row) => row.itemType === itemType && row.itemId === itemId && row.qty > 0)
  audit(state, actor, clock, 'مسح باركود', itemType === 'MATERIAL' ? 'material' : 'product', itemId, code)
  return ok(state, material ? material.nameAr : product!.nameAr, {
    itemType,
    itemId,
    code: material?.code ?? product!.code,
    nameAr: material?.nameAr ?? product!.nameAr,
    balances,
  })
}

function setRolePermissions(state: ErpState, actor: Actor, input: Extract<Command, { action: 'setRolePermissions' }>['input'], clock: Clock): CommandResult {
  const allowed = new Set<string>(PERMISSIONS)
  const next = input.permissions.filter((item): item is Permission => allowed.has(item))
  if (input.role === 'GM' && !next.includes('users.manage')) return fail('لا يمكن سحب إدارة المستخدمين من المدير العام')
  state.rolePermissions[input.role] = next
  audit(state, actor, clock, 'تحديث صلاحيات', 'role', input.role, `${next.length} صلاحية`)
  return ok(state, 'تم تحديث صلاحيات الدور')
}

function archiveHistory(state: ErpState, actor: Actor, input: Extract<Command, { action: 'archiveHistory' }>['input'], clock: Clock): CommandResult {
  if (!Number.isFinite(input.olderThanDays) || input.olderThanDays < 1) return fail('مدة الأرشفة غير صحيحة')
  const plan = planArchive(state, input.olderThanDays, input.nowIso ?? clock.now())
  applyArchive(state, plan)
  const count = plan.ledger.length + plan.journals.length + plan.auditLogs.length
  audit(state, actor, clock, 'أرشفة السجلات', 'archive', plan.cutoffIso, `${count} سجل`)
  return ok(state, count ? `تمت أرشفة ${count} سجل أقدم من ${input.olderThanDays} يوماً` : 'لا توجد سجلات أقدم من المدة المحددة', {
    ledger: plan.ledger.length,
    journals: plan.journals.length,
    auditLogs: plan.auditLogs.length,
  })
}

function setUserPassword(state: ErpState, actor: Actor, input: Extract<Command, { action: 'setUserPassword' }>['input'], clock: Clock): CommandResult {
  const user = state.users.find((item) => item.id === input.userId)
  if (!user) return fail('المستخدم غير موجود')
  if (!input.passwordHash) return fail('كلمة المرور مطلوبة')
  user.passwordHash = input.passwordHash
  user.mustChangePassword = false
  audit(state, actor, clock, 'تغيير كلمة المرور', 'user', user.id, user.email)
  return ok(state, 'تم تحديث كلمة المرور')
}

function canAny(permissions: readonly string[], keys: readonly string[]) {
  return keys.some((key) => permissions.includes(key))
}

/** Strip secrets and collections the caller is not allowed to read. */
export function publicState(state: ErpState, permissions: readonly string[]): PublicState {
  const seeSalary = canAny(permissions, ['employees.read', 'employees.manage'])
  const seePayroll = canAny(permissions, ['payroll.manage', 'payroll.approve', 'payroll.pay'])
  const seeJournals = canAny(permissions, ['accounting.read', 'accounting.manage'])
  const seeAudit = permissions.includes('audit.read')
  const seeAttendance = canAny(permissions, ['attendance.read', 'attendance.manage'])
  return {
    ...state,
    idempotency: [],
    users: state.users.map(({ passwordHash: _password, ...user }) => user),
    employees: seeSalary
      ? state.employees
      : state.employees.map((employee) => {
          const { basicSalary: _salary, ...rest } = employee
          return rest as typeof employee
        }),
    payrolls: seePayroll ? state.payrolls : [],
    journals: seeJournals ? state.journals : [],
    auditLogs: seeAudit ? state.auditLogs : [],
    attendance: seeAttendance ? state.attendance : [],
  }
}

export function actorFromUser(state: ErpState, userId: string): Actor | null {
  const user = state.users.find((item) => item.id === userId && item.active)
  if (!user) return null
  return {
    id: user.id,
    name: user.fullName,
    role: user.role,
    permissions: state.rolePermissions[user.role],
    mustChangePassword: Boolean(user.mustChangePassword),
  }
}

export { hoursBetween, INVENTORY_ACCOUNT }
