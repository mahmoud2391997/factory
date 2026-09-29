import assert from 'node:assert/strict'
import { test } from 'node:test'

import { emptyState } from './seed'
import { machineCostsByMachine, obligationForecast, packagingVarianceSummary, unmatchedBankTransactions, utilitiesPerTon } from './reports'

test('obligation forecast groups remaining active installments by month', () => {
  const state = emptyState('obligation-forecast')
  state.obligations.push(
    { id: 'active', beneficiary: 'A', description: 'Loan', kind: 'LOAN', total: 300, installmentAmount: 100, firstDueDate: '2026-09-01', frequency: 'MONTHLY', status: 'ACTIVE', createdBy: 'u', createdAt: '' },
    { id: 'cancelled', beneficiary: 'B', description: 'Rent', kind: 'RENT', total: 90, installmentAmount: 90, firstDueDate: '2026-09-01', frequency: 'ONE_TIME', status: 'CANCELLED', createdBy: 'u', createdAt: '' },
  )
  state.obligationScheduleLines.push(
    { id: 'partial', obligationId: 'active', dueDate: '2026-09-15', amount: 100, paidAmount: 25, status: 'PENDING' },
    { id: 'paid', obligationId: 'active', dueDate: '2026-09-20', amount: 50, paidAmount: 50, status: 'PAID' },
    { id: 'next', obligationId: 'active', dueDate: '2026-10-15', amount: 100, paidAmount: 0, status: 'PENDING' },
    { id: 'ignored', obligationId: 'cancelled', dueDate: '2026-09-15', amount: 90, paidAmount: 0, status: 'PENDING' },
  )

  assert.deepEqual(obligationForecast(state, '2026-09', 2), [
    { month: '2026-09', amount: 75, installments: 1 },
    { month: '2026-10', amount: 100, installments: 1 },
  ])
  assert.throws(() => obligationForecast(state, '2026-09', 0), /عدد أشهر/)
})

test('machine costs combine recorded maintenance and separately issued parts', () => {
  const state = emptyState('machine-cost-report')
  state.machines.push(
    { id: 'm1', code: 'M1', nameAr: 'مطحنة', type: 'Mill', location: 'A', active: true, operatingHours: 0 },
    { id: 'm2', code: 'M2', nameAr: 'خلاط', type: 'Mixer', location: 'B', active: true, operatingHours: 0 },
  )
  state.maintenanceRecords.push({
    id: 'r1', machineId: 'm1', type: 'ROUTINE', startDate: '2026-09-01', endDate: '2026-09-01', downtimeMinutes: 30,
    description: 'خدمة', cost: 20, sparePartsUsed: [], performedBy: 'u',
  })
  state.sparePartUsages.push({
    id: 'u1', sparePartId: 'sp1', machineId: 'm1', date: '2026-09-01', quantity: 2, cost: 15, reason: 'تغيير', usedBy: 'u',
  })
  assert.deepEqual(machineCostsByMachine(state), [
    { machineId: 'm1', maintenanceCost: 20, issuedPartsCost: 15, totalCost: 35 },
    { machineId: 'm2', maintenanceCost: 0, issuedPartsCost: 0, totalCost: 0 },
  ])
})

test('packaging report compares calculated consumption to actual and sums its cost', () => {
  const state = emptyState('packaging-variance-report')
  state.packagingMaterials.push({
    id: 'pkg1', code: 'BAG', nameAr: 'كيس', category: 'BAG', quantity: 100, unit: 'قطعة', unitCost: 0.2, minStock: 10, active: true,
  })
  state.packagingConsumption.push(
    { id: 'c1', packagingMaterialId: 'pkg1', productionOrderId: 'po1', lotNo: 'L1', date: '', quantity: 102, cost: 20.4, calculatedQty: 100, variance: 2 },
    { id: 'c2', packagingMaterialId: 'pkg1', productionOrderId: 'po2', lotNo: 'L2', date: '', quantity: 48, cost: 9.6, calculatedQty: 50, variance: -2 },
  )
  assert.deepEqual(packagingVarianceSummary(state), [
    { packagingMaterialId: 'pkg1', expected: 150, actual: 150, variance: 0, cost: 30 },
  ])
})

test('unmatched bank queue includes review-needed and excludes matched transactions', () => {
  const state = emptyState('bank-queue-report')
  state.bankTransactions.push(
    { id: '1', bankAccount: 'A', transactionId: 'T1', date: '2026-09-01', amount: 1, type: 'CREDIT', description: 'known', matched: true, status: 'MATCHED' },
    { id: '2', bankAccount: 'A', transactionId: 'T2', date: '2026-09-01', amount: 2, type: 'DEBIT', description: 'unknown', matched: false, status: 'UNMATCHED' },
    { id: '3', bankAccount: 'A', transactionId: 'T3', date: '2026-09-01', amount: 3, type: 'DEBIT', description: 'review', matched: false, status: 'REVIEW_NEEDED' },
  )
  assert.deepEqual(unmatchedBankTransactions(state).map((item) => item.transactionId), ['T2', 'T3'])
})

test('utilities report keeps consumption and cost-per-ton readings by month', () => {
  const state = emptyState('utilities-per-ton-report')
  state.utilitiesReadings.push({
    id: 'ur1', utility: 'ELECTRICITY', readingDate: '2026-09-30', previousReading: 0, currentReading: 500,
    consumption: 500, cost: 250, productionTon: 100, costPerTon: 2.5,
  })
  assert.deepEqual(utilitiesPerTon(state), [{
    readingId: 'ur1', month: '2026-09', utility: 'ELECTRICITY', consumption: 500, productionTon: 100, costPerTon: 2.5,
  }])
})
