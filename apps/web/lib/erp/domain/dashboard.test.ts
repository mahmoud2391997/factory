import assert from 'node:assert/strict'
import { test } from 'node:test'

import { dashboardAccess, dashboardAlerts } from './dashboard'
import { DEFAULT_ROLE_PERMISSIONS } from './permissions'
import { factoryStatus } from './reports'
import { buildSeedState, emptyState } from './seed'
import type { ErpState, SalesInvoice } from './types'

function invoice(partial: Pick<SalesInvoice, 'id' | 'issuedAt' | 'total' | 'paidAmount' | 'status'>): SalesInvoice {
  return {
    number: partial.id,
    customerId: 'c',
    notes: '',
    lines: [],
    subtotal: partial.total,
    vatAmount: 0,
    createdBy: 'user-gm',
    ...partial,
  }
}

test('the owner dashboard ages receivables and sums collections against the factory day', () => {
  const state = emptyState('dash')
  state.productionOrders.push({
    id: 'ord',
    number: 'PR-1',
    productId: 'p',
    recipeId: 'r',
    plannedQty: 1000,
    status: 'COMPLETED',
    expected: [],
    actualOutputQty: 1000,
    totalCost: 100,
    unitCost: 0.1,
    outputBatch: 'L',
    varianceReason: '',
    createdBy: 'user-gm',
    createdAt: '2026-09-29T04:00:00.000Z',
    completedAt: '2026-09-29T04:00:00.000Z',
  })
  state.invoices = [
    invoice({ id: 'new', issuedAt: '2026-09-20T04:00:00.000Z', total: 30, paidAmount: 10, status: 'PARTIAL' }),
    invoice({ id: 'mid', issuedAt: '2026-08-15T04:00:00.000Z', total: 40, paidAmount: 0, status: 'CONFIRMED' }),
    invoice({ id: 'old', issuedAt: '2026-06-01T04:00:00.000Z', total: 15, paidAmount: 5, status: 'PARTIAL' }),
    invoice({ id: 'paid', issuedAt: '2026-01-01T04:00:00.000Z', total: 9, paidAmount: 9, status: 'PAID' }),
  ]
  state.payments = [
    { id: 'p1', number: 'PAY-1', invoiceId: 'new', amount: 12, method: 'نقد', at: '2026-09-29T05:00:00.000Z', createdBy: 'user-gm' },
    { id: 'p2', number: 'PAY-2', invoiceId: 'mid', amount: 3, method: 'نقد', at: '2026-09-02T05:00:00.000Z', createdBy: 'user-gm' },
  ]
  state.qualitySamples = [
    { id: 'a', type: 'RAW_MATERIAL', materialId: 'm', batchNo: 'B1', sampledBy: 'user-gm', sampledAt: '2026-09-29T04:00:00.000Z', result: 'FAILED' },
    { id: 'b', type: 'RAW_MATERIAL', materialId: 'm', batchNo: 'B1', sampledBy: 'user-gm', sampledAt: '2026-09-29T05:00:00.000Z', result: 'HOLD' },
    { id: 'c', type: 'FINISHED_PRODUCT', lotNo: 'L1', sampledBy: 'user-gm', sampledAt: '2026-09-29T04:00:00.000Z', result: 'PASSED' },
    { id: 'd', type: 'FINISHED_PRODUCT', lotNo: 'L2', sampledBy: 'user-gm', sampledAt: '2026-09-01T04:00:00.000Z', result: 'FAILED' },
    { id: 'e', type: 'IN_PROCESS', productionOrderId: 'ord', sampledBy: 'user-gm', sampledAt: '2026-09-29T06:00:00.000Z', result: 'PENDING' },
  ]
  state.lots = [
    {
      id: 'lot',
      lotNo: 'LOT-1',
      productionOrderId: 'ord',
      productId: 'p',
      operatorId: 'e',
      manufacturedAt: '2026-09-29T04:00:00.000Z',
      inputKg: 1000,
      expectedOutputKg: 1000,
      actualOutputKg: 1000,
      wasteKg: 0,
      varianceKg: 0,
      variancePct: 0,
      materials: [],
      costLines: [
        { type: 'RAW_MATERIAL', amount: 70 },
        { type: 'BAGS', amount: 10 },
        { type: 'ELECTRICITY', amount: 20 },
      ],
      totalCost: 100,
      costPerTon: 100,
      salePricePerTon: 80,
      marginPerTon: -20,
      marginPct: -25,
      deliveries: [],
    },
  ]
  state.products.push({ id: 'p', code: 'FG', nameAr: 'علف', unit: 'كجم', salePrice: 0.2, vatTreatment: 'ZERO', barcode: 'FG', bagKg: 50, active: true })

  const status = factoryStatus(state, '2026-09-29T08:00:00.000Z')
  assert.equal(status.day, '2026-09-29')
  assert.equal(status.aging.d0_30, 20)
  assert.equal(status.aging.d31_60, 40)
  assert.equal(status.aging.d61, 10)
  assert.equal(status.collections.today, 12)
  assert.equal(status.collections.month, 15)
  assert.equal(status.qc.awaiting.length, 3)
  assert.equal(status.qc.awaiting.find((item) => item.label.includes('B1'))?.result, 'HOLD')
  assert.equal(status.qc.awaiting.find((item) => item.label.includes('أمر إنتاج'))?.result, 'PENDING')
  assert.equal(status.qc.monthPassRate, 25)
  assert.equal(status.cost.avgCostPerTon, 100)
  assert.equal(status.cost.breakdown.find((line) => line.type === 'RAW_MATERIAL')?.pct, 70)
  assert.equal(status.cost.breakdown.find((line) => line.type === 'BAGS')?.amount, 10)
  assert.equal(status.lowestMarginLots[0]?.marginPerTon, -20)
  assert.equal(status.lowestMarginLots[0]?.productName, 'علف')
})

test('seeded factory exposes a held batch, a pass rate, and today collections', () => {
  const state = buildSeedState()
  const operatingAt = state.productionOrders.find((order) => order.status === 'COMPLETED')!.completedAt!
  const status = factoryStatus(state, operatingAt)
  assert.equal(status.qc.awaiting.length, 1)
  assert.equal(status.qc.awaiting[0]?.result, 'HOLD')
  assert.equal(status.qc.monthPassRate, 50)
  assert.ok(status.cost.avgCostPerTon > 0)
  assert.ok(status.cost.breakdown.some((line) => line.type === 'BAGS' && line.amount > 0))
  assert.equal(status.collections.today, 50)
  assert.equal(status.collections.month, 50)
  assert.equal(status.aging.d0_30, 44.5)
  assert.equal(status.aging.d31_60, 0)
  assert.equal(status.aging.d61, 0)
  assert.equal(status.lowestMarginLots.length, 1)
})

test('dashboard cards follow least-privilege role permissions', () => {
  assert.deepEqual(dashboardAccess(DEFAULT_ROLE_PERMISSIONS.GM), {
    production: true,
    sales: true,
    profitability: true,
    inventory: true,
    quality: true,
    fleet: true,
    obligations: true,
    documents: true,
    maintenance: true,
  })
  assert.deepEqual(dashboardAccess(DEFAULT_ROLE_PERMISSIONS.DRIVER), {
    production: false,
    sales: false,
    profitability: false,
    inventory: false,
    quality: false,
    fleet: true,
    obligations: false,
    documents: false,
    maintenance: false,
  })
  assert.equal(dashboardAccess(DEFAULT_ROLE_PERMISSIONS.QUALITY).quality, true)
  assert.equal(dashboardAccess(DEFAULT_ROLE_PERMISSIONS.QUALITY).profitability, false)
  assert.equal(dashboardAccess(DEFAULT_ROLE_PERMISSIONS.ACCOUNTANT).production, false)
  assert.equal(dashboardAccess(DEFAULT_ROLE_PERMISSIONS.ACCOUNTANT).profitability, true)
})

test('dashboard alerts use a fixed business date and surface upcoming or overdue obligations and maintenance', () => {
  const state = emptyState('dashboard-alerts')
  state.obligations.push({
    id: 'obligation-1',
    beneficiary: 'المورد',
    description: 'قسط',
    kind: 'INSTALLMENT',
    total: 200,
    installmentAmount: 100,
    firstDueDate: '2026-09-01',
    frequency: 'MONTHLY',
    status: 'ACTIVE',
    createdBy: 'user-gm',
    createdAt: '2026-08-01T00:00:00.000Z',
  })
  state.obligationScheduleLines.push(
    { id: 'late', obligationId: 'obligation-1', dueDate: '2026-09-01', amount: 100, paidAmount: 25, status: 'OVERDUE' },
    { id: 'paid', obligationId: 'obligation-1', dueDate: '2026-09-20', amount: 100, paidAmount: 100, status: 'PAID' },
  )
  state.companyDocuments.push({
    id: 'license',
    title: 'رخصة المصنع',
    kind: 'LICENSE',
    issueDate: '2025-09-01',
    expiryDate: '2026-10-01',
    createdBy: 'user-gm',
    createdAt: '2025-09-01T00:00:00.000Z',
  })
  state.vehicles.push({
    id: 'vehicle-1',
    code: 'V-1',
    plateNo: '123',
    type: 'truck',
    nameAr: 'الشاحنة',
    active: true,
    currentOdometer: 5000,
  })
  state.vehicleServices.push(
    {
      id: 'old-service',
      vehicleId: 'vehicle-1',
      date: '2026-08-01',
      kind: 'OIL',
      description: 'تغيير زيت سابق',
      cost: 10,
      odometer: 4000,
      nextDueKm: 4500,
      createdBy: 'user-gm',
      createdAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'next-service',
      vehicleId: 'vehicle-1',
      date: '2026-09-20',
      kind: 'OIL',
      description: 'تغيير الزيت',
      cost: 10,
      odometer: 4900,
      nextDueKm: 5500,
      createdBy: 'user-gm',
      createdAt: '2026-09-20T00:00:00.000Z',
    },
  )
  state.machines.push({
    id: 'machine-1',
    code: 'M-1',
    nameAr: 'الخلاط',
    type: 'mixer',
    location: 'المصنع',
    active: true,
    operatingHours: 120,
  })
  state.maintenanceSchedules.push({
    id: 'machine-service',
    machineId: 'machine-1',
    type: 'HOURS_BASED',
    description: 'فحص تشحيم',
    interval: 100,
    lastCompleted: '2026-09-01',
    nextDue: '2026-12-01',
    hoursAtLastCompletion: 20,
    estimatedCost: 10,
    assignedTo: 'employee-1',
  })

  const alerts = dashboardAlerts(state, '2026-09-29T08:00:00.000Z')
  assert.equal(alerts.today, '2026-09-29')
  assert.equal(alerts.obligations.length, 1)
  assert.equal(alerts.obligations[0]?.outstanding, 75)
  assert.equal(alerts.obligations[0]?.daysLeft, -28)
  assert.equal(alerts.documents[0]?.title, 'رخصة المصنع')
  assert.equal(alerts.documents[0]?.daysLeft, 2)
  assert.equal(alerts.vehicleServices.length, 1)
  assert.equal(alerts.vehicleServices[0]?.kmLeft, 500)
  assert.equal(alerts.machineMaintenance[0]?.hoursDue, true)
  assert.equal(alerts.machineMaintenance[0]?.overdue, true)
})
