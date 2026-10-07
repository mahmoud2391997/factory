import assert from 'node:assert/strict'
import { test } from 'node:test'

import { actorFromUser, applyCommand, refreshSystemNotifications } from './engine'
import { createClock, emptyState } from './seed'
import type { Actor, Command, ErpState } from './types'

const NOW = '2026-09-29T08:00:00.000Z'

test('existing low stock creates one system alert per shortage and re-alerts after replenishment', () => {
  const clock = createClock(NOW)
  let state = emptyState('low-stock-refresh')
  state.materials.push({ id: 'mat-low', code: 'RM-LOW', nameAr: 'ذرة', category: 'حبوب', unit: 'كجم', minQty: 10, vatTreatment: 'ZERO', barcode: 'RM-LOW', active: true })
  state = refreshSystemNotifications(state, clock)
  const alert = state.notifications.find((note) => note.dedupeKey === 'low:mat-low')!
  assert.equal(alert.kind, 'LOW_STOCK')
  assert.deepEqual(alert.roles, ['GM', 'OPERATIONS'])
  alert.readBy = ['user-gm']
  state = refreshSystemNotifications(state, clock)
  assert.equal(state.notifications.filter((note) => note.dedupeKey === alert.dedupeKey).length, 1)
  // Replenishment resolves the current occurrence; a later shortage starts a new one.
  state.balances.push({ id: 'balance-low', warehouse: 'WH_RAW', itemType: 'MATERIAL', itemId: 'mat-low', batchNo: 'B1', qty: 20, unitCost: 1, expiryDate: null, receivedAt: NOW })
  state = refreshSystemNotifications(state, clock)
  assert.equal(state.notifications.find((note) => note.id === alert.id)!.read, true)
  state.balances[0]!.qty = 5
  state = refreshSystemNotifications(state, clock)
  assert.equal(state.notifications.filter((note) => note.dedupeKey === alert.dedupeKey && !note.read).length, 1)
})

function actor(state: ErpState): Actor {
  const found = actorFromUser(state, 'user-gm')
  assert.ok(found)
  return found
}

function must(state: ErpState, clock: ReturnType<typeof createClock>, command: Command) {
  const result = applyCommand(state, actor(state), command, clock)
  if (!result.ok) throw new Error(`${command.action}: ${result.error}`)
  return result.state
}

function daysFromNow(days: number) {
  const date = new Date(NOW)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function keys(state: ErpState) {
  return state.notifications.map((note) => note.dedupeKey)
}

test('vehicle papers fire the 90/60/30/7 ladder and an expired alert', () => {
  const clock = createClock(NOW)
  let state = emptyState('alerts')
  state = must(state, clock, { action: 'createVehicle', input: { code: 'V1', plateNo: '12345', type: 'TRUCK', nameAr: 'شاحنة' } })
  const vehicleId = state.vehicles[0]!.id

  state = must(state, clock, { action: 'updateVehicle', input: { id: vehicleId, insuranceExpiryDate: daysFromNow(95) } })
  assert.deepEqual(keys(state).filter((key) => key.startsWith(`vehicle:${vehicleId}:`)), [])

  state = must(state, clock, { action: 'updateVehicle', input: { id: vehicleId, insuranceExpiryDate: daysFromNow(20) } })
  assert.deepEqual(keys(state).filter((key) => key.startsWith(`vehicle:${vehicleId}:`)), [`vehicle:${vehicleId}:insurance:expiry:30`])
  const note = state.notifications[0]!
  assert.equal(note.kind, 'EXPIRY')
  assert.deepEqual(note.roles, ['GM', 'OPERATIONS'])

  state = must(state, clock, { action: 'updateVehicle', input: { id: vehicleId, inspectionExpiryDate: daysFromNow(-3) } })
  assert.ok(keys(state).includes(`vehicle:${vehicleId}:inspection:expired`))

  // A second refresh must not duplicate the open alert.
  const before = state.notifications.length
  state = must(state, clock, { action: 'createEmployee', input: { nameAr: 'موظف إضافي', department: 'عام', jobTitle: 'عامل', basicSalary: 300 } })
  assert.equal(state.notifications.length, before)
})

test('vehicle upcoming service fires the ladder off the latest service of that kind', () => {
  const clock = createClock(NOW)
  let state = emptyState('alerts-service')
  state = must(state, clock, { action: 'createVehicle', input: { code: 'V1', plateNo: '12345', type: 'TRUCK', nameAr: 'شاحنة' } })
  const vehicleId = state.vehicles[0]!.id

  state = must(state, clock, {
    action: 'addVehicleService',
    input: { vehicleId, date: daysFromNow(-30), kind: 'OIL', description: 'تغيير زيت', cost: 20, odometer: 1000, nextDueDate: daysFromNow(95) },
  })
  assert.deepEqual(keys(state).filter((key) => key.startsWith(`vehicle:${vehicleId}:service:`)), [])

  // A later OIL service supersedes the earlier one's due date.
  state = must(state, clock, {
    action: 'addVehicleService',
    input: { vehicleId, date: daysFromNow(-1), kind: 'OIL', description: 'تغيير زيت', cost: 20, odometer: 1500, nextDueDate: daysFromNow(6) },
  })
  const noteKeys = keys(state).filter((key) => key.startsWith(`vehicle:${vehicleId}:service:`))
  assert.deepEqual(noteKeys, [`vehicle:${vehicleId}:service:OIL:${daysFromNow(6)}:expiry:7`])
  const note = state.notifications.find((n) => n.dedupeKey === noteKeys[0])!
  assert.equal(note.kind, 'EXPIRY')
  assert.deepEqual(note.roles, ['GM', 'OPERATIONS'])
})

test('employee residence and contract papers alert the GM and the accountant', () => {
  const clock = createClock(NOW)
  let state = emptyState('alerts-emp')
  state = must(state, clock, { action: 'createEmployee', input: { nameAr: 'سالم', department: 'الإنتاج', jobTitle: 'فني', basicSalary: 400 } })
  const employeeId = state.employees[0]!.id

  state = must(state, clock, { action: 'updateEmployee', input: { id: employeeId, residenceExpiryDate: daysFromNow(5), contractExpiryDate: daysFromNow(80) } })
  const open = keys(state).filter((key) => key.startsWith(`employee:${employeeId}:`)).sort()
  assert.deepEqual(open, [`employee:${employeeId}:contract:expiry:90`, `employee:${employeeId}:residence:expiry:7`])
  assert.deepEqual(state.notifications[0]!.roles, ['GM', 'ACCOUNTANT'])

  const badDate = applyCommand(state, actor(state), { action: 'updateEmployee', input: { id: employeeId, idExpiryDate: '05/01/2027' } }, clock)
  assert.equal(badDate.ok, false)
})

test('machine maintenance due date comes from the earliest schedule and alerts on the ladder', () => {
  const clock = createClock(NOW)
  let state = emptyState('alerts-machine')
  state = must(state, clock, { action: 'createEmployee', input: { nameAr: 'فني الصيانة', department: 'الصيانة', jobTitle: 'فني', basicSalary: 400 } })
  state = must(state, clock, { action: 'createMachine', input: { code: 'M-1', nameAr: 'مكبس 1', type: 'PRESS', location: 'الخط 1' } })
  const machineId = state.machines[0]!.id

  state = must(state, clock, {
    action: 'createMaintenanceSchedule',
    input: { machineId, type: 'DAILY', description: 'تزييت يومي', interval: 45, estimatedCost: 5, assignedTo: state.employees[0]!.id },
  })
  assert.equal(state.machines[0]!.nextMaintenanceDate, daysFromNow(45))
  assert.ok(keys(state).includes(`machine:${machineId}:maintenance:expiry:60`))
})

test('hours-based schedules alert once reported run hours pass the interval', () => {
  const clock = createClock(NOW)
  let state = emptyState('alerts-hours')
  state = must(state, clock, { action: 'createEmployee', input: { nameAr: 'فني', department: 'الصيانة', jobTitle: 'فني', basicSalary: 400 } })
  state = must(state, clock, { action: 'createMachine', input: { code: 'M-2', nameAr: 'مكبس 2', type: 'PRESS', location: 'الخط 2' } })
  const machineId = state.machines[0]!.id
  state = must(state, clock, {
    action: 'createMaintenanceSchedule',
    input: { machineId, type: 'HOURS_BASED', description: 'تغيير فلتر كل 100 ساعة', interval: 100, estimatedCost: 20, assignedTo: state.employees[0]!.id },
  })
  const scheduleId = state.maintenanceSchedules[0]!.id

  state = must(state, clock, {
    action: 'recordMaintenance',
    input: {
      machineId,
      scheduleId,
      type: 'PREVENTIVE',
      startDate: '2026-09-29T08:00:00.000Z',
      endDate: '2026-09-29T09:00:00.000Z',
      description: 'صيانة مجدولة',
      cost: 0,
      sparePartsUsed: [],
      operatingMinutes: 6000,
    },
  })
  assert.equal(state.maintenanceSchedules[0]!.hoursAtLastCompletion, 100)
  assert.equal(keys(state).includes(`machine:${scheduleId}:hours`), false)

  state = must(state, clock, {
    action: 'recordMaintenance',
    input: {
      machineId,
      type: 'EMERGENCY',
      startDate: '2026-09-30T08:00:00.000Z',
      endDate: '2026-09-30T08:30:00.000Z',
      description: 'إصلاح طارئ',
      cost: 10,
      sparePartsUsed: [],
      operatingMinutes: 6000,
    },
  })
  assert.equal(state.machines[0]!.operatingHours, 200)
  assert.ok(keys(state).includes(`machine:${scheduleId}:hours`))
})

test('spare parts and packaging below their minimum raise low-stock alerts', () => {
  const clock = createClock(NOW)
  let state = emptyState('alerts-min')
  state = must(state, clock, {
    action: 'createSparePart',
    input: { code: 'SP-1', nameAr: 'فلتر هواء', quantity: 2, unitCost: 5, minStock: 5 },
  })
  state = must(state, clock, {
    action: 'createPackagingMaterial',
    input: { code: 'BAG-1', nameAr: 'كيس', category: 'BAG', quantity: 10, unit: 'كيس', unitCost: 0.05, minStock: 50 },
  })
  const spareId = state.spareParts[0]!.id
  const packagingId = state.packagingMaterials[0]!.id
  assert.ok(keys(state).includes(`low-spare:${spareId}`))
  assert.ok(keys(state).includes(`low-packaging:${packagingId}`))
  const low = state.notifications.find((note) => note.dedupeKey === `low-packaging:${packagingId}`)!
  assert.equal(low.kind, 'LOW_STOCK')
})
