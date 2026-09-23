import { applyCommand, type Clock } from './engine'
import { DEFAULT_ROLE_PERMISSIONS } from './permissions'
import type { Actor, Command, ErpState } from './types'
import { SCHEMA_VERSION } from './types'

export function createClock(startIso = '2026-09-11T05:00:00.000Z'): Clock & { advance: (hours?: number) => void } {
  let time = Date.parse(startIso)
  let serial = 0
  return {
    now: () => new Date(time).toISOString(),
    id: (prefix: string) => {
      serial += 1
      return `${prefix}-${serial}`
    },
    advance(hours = 20) {
      time += hours * 60 * 60 * 1000
    },
  }
}

export function emptyState(passwordHash: string): ErpState {
  return {
    schemaVersion: SCHEMA_VERSION,
    revision: 0,
    company: {
      nameAr: 'مصنع الخليج للأعلاف',
      nameEn: 'Gulf Feed Mill',
      address: 'المنطقة الصناعية، صحار',
      city: 'صحار',
      country: 'سلطنة عُمان',
      phone: '+968 2675 1000',
      email: 'info@gulffeed.om',
      crNumber: '1345789',
      vatNumber: 'OM1100000001',
      currency: 'OMR',
      vatRatePct: 5,
      varianceThresholdPct: 2,
      notifyEmail: 'gm@factory.local',
    },
    rolePermissions: {
      GM: [...DEFAULT_ROLE_PERMISSIONS.GM],
      ACCOUNTANT: [...DEFAULT_ROLE_PERMISSIONS.ACCOUNTANT],
      OPERATIONS: [...DEFAULT_ROLE_PERMISSIONS.OPERATIONS],
    },
    users: [
      { id: 'user-gm', email: 'gm@factory.local', fullName: 'سعيد الوهيبي', role: 'GM', passwordHash, active: true },
      { id: 'user-admin', email: 'admin@factory.local', fullName: 'سعيد الوهيبي', role: 'GM', passwordHash, active: true, mustChangePassword: true },
      { id: 'user-acc', email: 'accounts@factory.local', fullName: 'نورة العامرية', role: 'ACCOUNTANT', passwordHash, active: true },
      { id: 'user-ops', email: 'ops@factory.local', fullName: 'سالم الحارثي', role: 'OPERATIONS', passwordHash, active: true },
    ],
    accounts: [
      { code: '1100', nameAr: 'مخزون مواد خام', type: 'ASSET' },
      { code: '1200', nameAr: 'إنتاج تحت التشغيل', type: 'ASSET' },
      { code: '1300', nameAr: 'مخزون منتجات نهائية', type: 'ASSET' },
      { code: '1400', nameAr: 'ذمم العملاء', type: 'ASSET' },
      { code: '1500', nameAr: 'البنك', type: 'ASSET' },
      { code: '2100', nameAr: 'ذمم الموردين', type: 'LIABILITY' },
      { code: '2200', nameAr: 'ضريبة القيمة المضافة — مخرجات', type: 'LIABILITY' },
      { code: '2300', nameAr: 'ضريبة القيمة المضافة — مدخلات', type: 'ASSET' },
      { code: '2400', nameAr: 'رواتب مستحقة', type: 'LIABILITY' },
      { code: '2500', nameAr: 'استقطاعات موظفين', type: 'LIABILITY' },
      { code: '3100', nameAr: 'رأس المال', type: 'EQUITY' },
      { code: '4100', nameAr: 'إيرادات المبيعات', type: 'REVENUE' },
      { code: '5100', nameAr: 'تكلفة المبيعات', type: 'EXPENSE' },
      { code: '6100', nameAr: 'الرواتب', type: 'EXPENSE' },
      { code: '6200', nameAr: 'مصروفات تشغيل', type: 'EXPENSE' },
      { code: '6300', nameAr: 'فروقات المخزون', type: 'EXPENSE' },
    ],
    warehouses: [
      { key: 'WH_RAW', nameAr: 'مستودع المواد الخام' },
      { key: 'WH_MFG', nameAr: 'مستودع التصنيع' },
      { key: 'WH_FG', nameAr: 'مستودع المنتجات النهائية' },
    ],
    materials: [],
    products: [],
    suppliers: [],
    customers: [],
    employees: [],
    recipes: [],
    balances: [],
    ledger: [],
    purchaseOrders: [],
    goodsReceipts: [],
    transfers: [],
    adjustments: [],
    productionOrders: [],
    invoices: [],
    payments: [],
    withdrawals: [],
    expenses: [],
    journals: [],
    attendance: [],
    payrolls: [],
    tasks: [],
    stoppages: [],
    notifications: [],
    auditLogs: [],
    sequences: {},
  }
}

function systemActor(state: ErpState): Actor {
  const user = state.users.find((item) => item.id === 'user-gm')!
  return { id: user.id, name: user.fullName, role: 'GM', permissions: state.rolePermissions.GM }
}

function step(state: ErpState, clock: Clock & { advance: (hours?: number) => void }, command: Command) {
  const result = applyCommand(state, systemActor(state), command, clock)
  if (!result.ok) throw new Error(`${command.action}: ${result.error}`)
  clock.advance(6)
  return result.state
}

export function buildSeedState(passwordHash = 'seed-hash'): ErpState {
  const clock = createClock()
  let state = emptyState(passwordHash)
  const actorNote = systemActor(state)
  void actorNote

  state = step(state, clock, { action: 'fundBank', input: { amount: 25000, memo: 'رأس مال افتتاحي — البنك' } })

  const materials = [
    ['RM-CORN', 'ذرة صفراء', 'حبوب', 8000, 'ZERO'],
    ['RM-SOYA', 'كسب فول الصويا', 'بروتين', 4000, 'ZERO'],
    ['RM-BRAN', 'نخالة قمح', 'حبوب', 2500, 'ZERO'],
    ['RM-LIME', 'حجر جيري', 'معادن', 400, 'STANDARD'],
    ['RM-SALT', 'ملح طعام', 'معادن', 150, 'STANDARD'],
    ['RM-PRE', 'بريمكس فيتامينات', 'إضافات', 80, 'STANDARD'],
  ] as const
  for (const [code, nameAr, category, minQty, vatTreatment] of materials) {
    state = step(state, clock, {
      action: 'createMaterial',
      input: { code, nameAr, category, minQty, vatTreatment, unit: 'كجم' },
    })
  }

  state = step(state, clock, {
    action: 'createProduct',
    input: { code: 'FG-BEEF', nameAr: 'علف تسمين أبقار', salePrice: 0.18, vatTreatment: 'STANDARD', bagKg: 50 },
  })
  state = step(state, clock, {
    action: 'createProduct',
    input: { code: 'FG-BROILER', nameAr: 'علف دواجن لاحم', salePrice: 0.215, vatTreatment: 'STANDARD', bagKg: 50 },
  })
  state = step(state, clock, {
    action: 'createProduct',
    input: { code: 'FG-SHEEP', nameAr: 'علف أغنام', salePrice: 0.195, vatTreatment: 'STANDARD', bagKg: 50 },
  })

  state = step(state, clock, {
    action: 'createSupplier',
    input: { nameAr: 'المطاحن العمانية', vatNumber: 'OM2200001111', phone: '+968 2450 2200', address: 'مسقط، غلا الصناعية' },
  })
  state = step(state, clock, {
    action: 'createSupplier',
    input: { nameAr: 'شركة ظفار للحبوب', vatNumber: 'OM2200002222', phone: '+968 2329 1100', address: 'صلالة' },
  })
  state = step(state, clock, {
    action: 'createMaterial',
    input: { code: 'RM-BENT', nameAr: 'بنتونيت', category: 'معادن', minQty: 30, vatTreatment: 'STANDARD', unit: 'كجم' },
  })
  const bentonite = state.materials.find((item) => item.code === 'RM-BENT')!
  const mills = state.suppliers.find((item) => item.nameAr.includes('المطاحن'))!
  state = step(state, clock, {
    action: 'createPurchaseOrder',
    input: { supplierId: mills.id, lines: [{ materialId: bentonite.id, qty: 200, unitCost: 0.04 }] },
  })
  const bentoniteOrder = state.purchaseOrders[0]!
  state = step(state, clock, { action: 'decidePurchaseOrder', input: { id: bentoniteOrder.id, decision: 'APPROVED' } })
  state = step(state, clock, {
    action: 'receiveGoods',
    input: {
      purchaseOrderId: bentoniteOrder.id,
      lines: [{ materialId: bentonite.id, qty: 200, batchNo: 'B-BENT-0815', expiryDate: '2027-08-01' }],
    },
  })
  state = step(state, clock, {
    action: 'createCustomer',
    input: { nameAr: 'مزارع الباطنة', vatNumber: 'OM3300001111', phone: '+968 2680 4411', address: 'صحار' },
  })
  state = step(state, clock, {
    action: 'createCustomer',
    input: { nameAr: 'شركة صحار للدواجن', vatNumber: 'OM3300002222', phone: '+968 2672 9090', address: 'صحار' },
  })

  const employees = [
    ['خالد البلوشي', 'الإنتاج', 'مشغّل خط', 420],
    ['سالم الحارثي', 'المستودع', 'أمين مستودع', 380],
    ['نورة العامرية', 'المالية', 'محاسبة', 520],
    ['أحمد السعدي', 'الإنتاج', 'فني صيانة', 400],
  ] as const
  for (const [nameAr, department, jobTitle, basicSalary] of employees) {
    state = step(state, clock, { action: 'createEmployee', input: { nameAr, department, jobTitle, basicSalary } })
  }

  const idOf = (code: string) => {
    const material = state.materials.find((item) => item.code === code)
    const product = state.products.find((item) => item.code === code)
    const found = material ?? product
    if (!found) throw new Error(`missing ${code}`)
    return found.id
  }

  const beef = idOf('FG-BEEF')
  state = step(state, clock, {
    action: 'createRecipe',
    input: {
      productId: beef,
      nameAr: 'وصفة تسمين أبقار — طن',
      baseOutputQty: 1000,
      items: [
        { materialId: idOf('RM-CORN'), qty: 520 },
        { materialId: idOf('RM-SOYA'), qty: 200 },
        { materialId: idOf('RM-BRAN'), qty: 200 },
        { materialId: idOf('RM-LIME'), qty: 40 },
        { materialId: idOf('RM-SALT'), qty: 20 },
        { materialId: idOf('RM-PRE'), qty: 20 },
      ],
    },
  })
  state = step(state, clock, {
    action: 'createRecipe',
    input: {
      productId: idOf('FG-BROILER'),
      nameAr: 'وصفة دواجن لاحم — طن',
      baseOutputQty: 1000,
      items: [
        { materialId: idOf('RM-CORN'), qty: 580 },
        { materialId: idOf('RM-SOYA'), qty: 280 },
        { materialId: idOf('RM-BRAN'), qty: 90 },
        { materialId: idOf('RM-LIME'), qty: 25 },
        { materialId: idOf('RM-SALT'), qty: 10 },
        { materialId: idOf('RM-PRE'), qty: 15 },
      ],
    },
  })

  const supplier = state.suppliers.find((item) => item.nameAr.includes('المطاحن'))!
  const receipts: Array<[string, number, number, string, string | null]> = [
    ['RM-CORN', 20000, 0.085, 'B-CORN-0901', '2027-03-01'],
    ['RM-SOYA', 3800, 0.21, 'B-SOYA-0902', '2027-02-01'],
    ['RM-BRAN', 9000, 0.045, 'B-BRAN-0901', '2027-01-15'],
    ['RM-LIME', 1200, 0.02, 'B-LIME-0801', null],
    ['RM-SALT', 600, 0.03, 'B-SALT-0801', null],
    ['RM-PRE', 450, 1.2, 'B-PRE-0801', '2027-06-01'],
  ]
  for (const [code, qty, unitCost, batchNo, expiryDate] of receipts) {
    state = step(state, clock, {
      action: 'createPurchaseOrder',
      input: { supplierId: supplier.id, lines: [{ materialId: idOf(code), qty, unitCost }] },
    })
    const po = state.purchaseOrders[0]!
    state = step(state, clock, { action: 'decidePurchaseOrder', input: { id: po.id, decision: 'APPROVED' } })
    state = step(state, clock, {
      action: 'receiveGoods',
      input: { purchaseOrderId: po.id, lines: [{ materialId: idOf(code), qty, batchNo, expiryDate }] },
    })
  }

  const transferLines: Array<[string, number, string, number]> = [
    ['RM-CORN', 8840, 'B-CORN-0901', 40],
    ['RM-SOYA', 3400, 'B-SOYA-0902', 0],
    ['RM-BRAN', 3400, 'B-BRAN-0901', 0],
    ['RM-LIME', 680, 'B-LIME-0801', 0],
    ['RM-SALT', 340, 'B-SALT-0801', 0],
    ['RM-PRE', 340, 'B-PRE-0801', 0],
  ]
  state = step(state, clock, {
    action: 'transferStock',
    input: {
      from: 'WH_RAW',
      to: 'WH_MFG',
      notes: 'صرف وصفة تسمين لأمر الإنتاج',
      lines: transferLines.map(([code, qty, batchNo]) => ({
        itemType: 'MATERIAL' as const,
        itemId: idOf(code),
        batchNo,
        qty,
      })),
    },
  })

  const recipe = state.recipes.find((item) => item.productId === beef)!
  state = step(state, clock, {
    action: 'createProductionOrder',
    input: { productId: beef, recipeId: recipe.id, plannedQty: 20000 },
  })
  const production = state.productionOrders[0]!
  state = step(state, clock, {
    action: 'completeProduction',
    input: {
      productionOrderId: production.id,
      actualOutputQty: 17000,
      varianceReason: 'توقف الخط وخفض السرعة بعد انقطاع الكهرباء',
      actuals: transferLines.map(([code, actualQty, , wasteQty]) => ({
        materialId: idOf(code),
        actualQty,
        wasteQty,
      })),
    },
  })

  const customer = state.customers.find((item) => item.nameAr.includes('الباطنة'))!
  state = step(state, clock, {
    action: 'createInvoice',
    input: {
      customerId: customer.id,
      notes: 'تسليم مصنع — صحار',
      lines: [{ productId: beef, qty: 500 }],
    },
  })
  const invoice = state.invoices[0]!
  state = step(state, clock, { action: 'confirmInvoice', input: { id: invoice.id } })
  state = step(state, clock, { action: 'recordPayment', input: { invoiceId: invoice.id, amount: 50, method: 'تحويل بنكي' } })

  state = step(state, clock, {
    action: 'createPurchaseOrder',
    input: {
      supplierId: supplier.id,
      notes: 'تعويض نقص كسب الصويا',
      lines: [{ materialId: idOf('RM-SOYA'), qty: 8000, unitCost: 0.205 }],
    },
  })

  state = step(state, clock, {
    action: 'createExpense',
    input: { category: 'طاقة', description: 'ديزل المولد — أسبوع', amount: 85, vatTreatment: 'STANDARD', payFrom: 'BANK' },
  })

  state = step(state, clock, {
    action: 'createPayroll',
    input: {
      month: '2026-09',
      lines: state.employees.map((employee, index) => ({
        employeeId: employee.id,
        overtimeHours: index === 0 ? 6 : 0,
        allowances: 0,
        deductions: 0,
      })),
    },
  })

  for (const employee of state.employees) {
    state = step(state, clock, {
      action: 'recordAttendance',
      input: { employeeId: employee.id, date: '2026-09-20', checkIn: '07:00', checkOut: '15:10', source: 'MANUAL' },
    })
  }

  state = step(state, clock, {
    action: 'createTask',
    input: { title: 'مراجعة نقص كسب الصويا قبل اعتماد أمر الشراء', assigneeRole: 'GM', dueDate: '2026-09-22' },
  })

  const completed = state.productionOrders.find((order) => order.status === 'COMPLETED')!
  state.stoppages.unshift({
    id: 'stop-power',
    at: completed.completedAt ?? completed.createdAt,
    minutes: 45,
    area: 'خط الخلط',
    reason: 'انقطاع تغذية الكهرباء',
  })

  const broiler = idOf('FG-BROILER')
  const broilerRecipe = state.recipes.find((item) => item.productId === broiler)!
  state = step(state, clock, {
    action: 'createProductionOrder',
    input: { productId: broiler, recipeId: broilerRecipe.id, plannedQty: 1000 },
  })

  return state
}
