import assert from 'node:assert/strict'
import { test } from 'node:test'

import { actorFromUser, applyCommand, defaultClock, publicState } from './engine'
import { emptyState } from './seed'
import type { Command, ErpState } from './types'

function must(state: ErpState, clock: ReturnType<typeof defaultClock>, command: Command, id = 'user-gm') {
  const actor = actorFromUser(state, id)
  assert.ok(actor)
  const result = applyCommand(state, actor, command, clock)
  if (!result.ok) throw new Error(`${command.action}: ${result.error}`)
  return result.state
}

function fail(state: ErpState, clock: ReturnType<typeof defaultClock>, command: Command, id: string) {
  const actor = actorFromUser(state, id)
  if (!actor) return 'المستخدم غير موجود'
  const result = applyCommand(state, actor, command, clock)
  assert.equal(result.ok, false)
  return result.ok ? '' : result.error
}

test('createVehicle requires valid input and creates vehicle', () => {
  const clock = defaultClock()
  let state = emptyState('fleet')
  
  state = must(state, clock, {
    action: 'createVehicle',
    input: { code: 'V1', plateNo: '12345', type: 'TRUCK', nameAr: 'شاحنة', kmPerLiter: 8 },
  })
  
  assert.equal(state.vehicles.length, 1)
  const vehicle = state.vehicles[0]!
  assert.equal(vehicle.code, 'V1')
  assert.equal(vehicle.plateNo, '12345')
  assert.equal(vehicle.type, 'TRUCK')
  assert.equal(vehicle.nameAr, 'شاحنة')
  assert.equal(vehicle.active, true)
  assert.equal(vehicle.currentOdometer, 0)
  assert.equal(vehicle.kmPerLiter, 8)
})

test('createVehicle rejects duplicate code and plate', () => {
  const clock = defaultClock()
  let state = emptyState('fleet')
  
  state = must(state, clock, {
    action: 'createVehicle',
    input: { code: 'V1', plateNo: '12345', type: 'TRUCK', nameAr: 'شاحنة' },
  })
  
  assert.match(
    fail(state, clock, { action: 'createVehicle', input: { code: 'V1', plateNo: '67890', type: 'TRUCK', nameAr: 'شاحنة 2' } }, 'user-gm'),
    /كود المركبة مستخدم/,
  )
  assert.match(
    fail(state, clock, { action: 'createVehicle', input: { code: 'V2', plateNo: '12345', type: 'TRUCK', nameAr: 'شاحنة 2' } }, 'user-gm'),
    /رقم اللوحة مستخدم/,
  )
})

test('updateVehicle modifies vehicle fields', () => {
  const clock = defaultClock()
  let state = emptyState('fleet')
  
  state = must(state, clock, {
    action: 'createVehicle',
    input: { code: 'V1', plateNo: '12345', type: 'TRUCK', nameAr: 'شاحنة' },
  })
  
  const vehicle = state.vehicles[0]!
  state = must(state, clock, {
    action: 'updateVehicle',
    input: { id: vehicle.id, plateNo: '67890', nameAr: 'شاحنة جديدة', active: false },
  })
  
  assert.equal(state.vehicles[0].plateNo, '67890')
  assert.equal(state.vehicles[0].nameAr, 'شاحنة جديدة')
  assert.equal(state.vehicles[0].active, false)
})

test('addFuelLog requires valid input and updates odometer', () => {
  const clock = defaultClock()
  let state = emptyState('fleet')
  
  state = must(state, clock, {
    action: 'createVehicle',
    input: { code: 'V1', plateNo: '12345', type: 'TRUCK', nameAr: 'شاحنة' },
  })
  
  state = must(state, clock, {
    action: 'createEmployee',
    input: { nameAr: 'سائق', department: 'النقل', jobTitle: 'سائق', basicSalary: 400 },
  })
  
  const vehicle = state.vehicles[0]!
  const driver = state.employees[0]!
  
  state = must(state, clock, {
    action: 'addFuelLog',
    input: {
      vehicleId: vehicle.id,
      date: '2026-09-29',
      liters: 50,
      cost: 20,
      odometer: 1000,
      driverId: driver.id,
      station: 'محطة أ',
    },
  })
  
  assert.equal(state.fuelLogs.length, 1)
  assert.equal(state.fuelLogs[0].liters, 50)
  assert.equal(state.fuelLogs[0].cost, 20)
  assert.equal(state.fuelLogs[0].odometer, 1000)
  assert.equal(state.vehicles[0].currentOdometer, 1000)
})

test('addFuelLog rejects odometer lower than previous reading', () => {
  const clock = defaultClock()
  let state = emptyState('fleet')
  
  state = must(state, clock, {
    action: 'createVehicle',
    input: { code: 'V1', plateNo: '12345', type: 'TRUCK', nameAr: 'شاحنة' },
  })
  
  state = must(state, clock, {
    action: 'createEmployee',
    input: { nameAr: 'سائق', department: 'النقل', jobTitle: 'سائق', basicSalary: 400 },
  })
  
  const vehicle = state.vehicles[0]!
  const driver = state.employees[0]!
  
  state = must(state, clock, {
    action: 'addFuelLog',
    input: { vehicleId: vehicle.id, date: '2026-09-29', liters: 50, cost: 20, odometer: 1000, driverId: driver.id },
  })
  
  assert.match(
    fail(state, clock, {
      action: 'addFuelLog',
      input: { vehicleId: vehicle.id, date: '2026-09-30', liters: 50, cost: 20, odometer: 900, driverId: driver.id },
    }, 'user-gm'),
    /أقل من القراءة السابقة/,
  )
})

test('addVehicleService creates service record', () => {
  const clock = defaultClock()
  let state = emptyState('fleet')
  
  state = must(state, clock, {
    action: 'createVehicle',
    input: { code: 'V1', plateNo: '12345', type: 'TRUCK', nameAr: 'شاحنة' },
  })
  
  const vehicle = state.vehicles[0]!
  
  state = must(state, clock, {
    action: 'addVehicleService',
    input: {
      vehicleId: vehicle.id,
      date: '2026-09-29',
      kind: 'OIL',
      description: 'تغيير زيت',
      cost: 50,
      odometer: 5000,
      nextDueDate: '2026-12-29',
      nextDueKm: 10000,
    },
  })
  
  assert.equal(state.vehicleServices.length, 1)
  assert.equal(state.vehicleServices[0].kind, 'OIL')
  assert.equal(state.vehicleServices[0].description, 'تغيير زيت')
  assert.equal(state.vehicleServices[0].cost, 50)
  assert.equal(state.vehicleServices[0].nextDueDate, '2026-12-29')
  assert.equal(state.vehicleServices[0].nextDueKm, 10000)
})

test('createTrip requires valid input and calculates cost', () => {
  const clock = defaultClock()
  let state = emptyState('fleet')
  
  state = must(state, clock, {
    action: 'createVehicle',
    input: { code: 'V1', plateNo: '12345', type: 'TRUCK', nameAr: 'شاحنة', kmPerLiter: 8 },
  })
  
  state = must(state, clock, {
    action: 'createEmployee',
    input: { nameAr: 'سائق', department: 'النقل', jobTitle: 'سائق', basicSalary: 400 },
  })
  
  const vehicle = state.vehicles[0]!
  const driver = state.employees[0]!
  
  state = must(state, clock, {
    action: 'createTrip',
    input: {
      vehicleId: vehicle.id,
      driverId: driver.id,
      date: '2026-09-29',
      destination: 'صحار',
      km: 100,
      loadKg: 5000,
      fuelLiters: 12.5,
    },
  })
  
  assert.equal(state.trips.length, 1)
  const trip = state.trips[0]!
  assert.equal(trip.destination, 'صحار')
  assert.equal(trip.km, 100)
  assert.equal(trip.loadKg, 5000)
  assert.equal(trip.fuelLiters, 12.5)
  assert.ok(trip.cost >= 0)
})

test('createTrip requires fuel variance reason when exceeding threshold', () => {
  const clock = defaultClock()
  let state = emptyState('fleet')
  
  state = must(state, clock, {
    action: 'createVehicle',
    input: { code: 'V1', plateNo: '12345', type: 'TRUCK', nameAr: 'شاحنة', kmPerLiter: 8 },
  })
  
  state = must(state, clock, {
    action: 'createEmployee',
    input: { nameAr: 'سائق', department: 'النقل', jobTitle: 'سائق', basicSalary: 400 },
  })
  
  const vehicle = state.vehicles[0]!
  const driver = state.employees[0]!
  
  // Expected: 100km / 8km/L = 12.5L. Using 20L is 60% higher (exceeds 15% threshold)
  assert.match(
    fail(state, clock, {
      action: 'createTrip',
      input: {
        vehicleId: vehicle.id,
        driverId: driver.id,
        date: '2026-09-29',
        destination: 'صحار',
        km: 100,
        loadKg: 5000,
        fuelLiters: 20,
      },
    }, 'user-gm'),
    /يتجاوز الحد المسموح/,
  )
  
  // Should succeed with reason
  state = must(state, clock, {
    action: 'createTrip',
    input: {
      vehicleId: vehicle.id,
      driverId: driver.id,
      date: '2026-09-29',
      destination: 'صحار',
      km: 100,
      loadKg: 5000,
      fuelLiters: 20,
      fuelVarianceReason: 'ازدحام مروري',
    },
  })
  
  assert.equal(state.trips.length, 1)
  assert.equal(state.trips[0].fuelVarianceReason, 'ازدحام مروري')
})

test('createTrip notifies when fuel variance exceeds threshold', () => {
  const clock = defaultClock()
  let state = emptyState('fleet')
  
  state = must(state, clock, {
    action: 'createVehicle',
    input: { code: 'V1', plateNo: '12345', type: 'TRUCK', nameAr: 'شاحنة', kmPerLiter: 8 },
  })
  
  state = must(state, clock, {
    action: 'createEmployee',
    input: { nameAr: 'سائق', department: 'النقل', jobTitle: 'سائق', basicSalary: 400 },
  })
  
  const vehicle = state.vehicles[0]!
  const driver = state.employees[0]!
  
  state = must(state, clock, {
    action: 'createTrip',
    input: {
      vehicleId: vehicle.id,
      driverId: driver.id,
      date: '2026-09-29',
      destination: 'صحار',
      km: 100,
      loadKg: 5000,
      fuelLiters: 20,
      fuelVarianceReason: 'ازدحام مروري',
    },
  })
  
  const notifications = state.notifications.filter((n) => n.kind === 'INFO' && n.title.includes('استهلاك وقود غير طبيعي'))
  assert.equal(notifications.length, 1)
  assert.ok(notifications[0]?.roles.includes('GM'))
  assert.ok(notifications[0]?.roles.includes('OPERATIONS'))
})

test('DRIVER role can only see own trips and fuel logs', () => {
  const clock = defaultClock()
  let state = emptyState('fleet')
  
  state = must(state, clock, {
    action: 'createVehicle',
    input: { code: 'V1', plateNo: '12345', type: 'TRUCK', nameAr: 'شاحنة' },
  })
  
  state = must(state, clock, {
    action: 'createEmployee',
    input: { nameAr: 'سائق 1', department: 'النقل', jobTitle: 'سائق', basicSalary: 400 },
  })
  
  state = must(state, clock, {
    action: 'createEmployee',
    input: { nameAr: 'سائق 2', department: 'النقل', jobTitle: 'سائق', basicSalary: 400 },
  })
  
  const vehicle = state.vehicles[0]!
  const driver1 = state.employees[0]!
  const driver2 = state.employees[1]!
  
  state = must(state, clock, {
    action: 'addFuelLog',
    input: { vehicleId: vehicle.id, date: '2026-09-29', liters: 50, cost: 20, odometer: 1000, driverId: driver1.id },
  })
  
  state = must(state, clock, {
    action: 'addFuelLog',
    input: { vehicleId: vehicle.id, date: '2026-09-30', liters: 50, cost: 20, odometer: 2000, driverId: driver2.id },
  })
  
  state = must(state, clock, {
    action: 'createTrip',
    input: { vehicleId: vehicle.id, driverId: driver1.id, date: '2026-09-29', destination: 'صحار', km: 100, loadKg: 5000, fuelLiters: 12.5 },
  })
  
  state = must(state, clock, {
    action: 'createTrip',
    input: { vehicleId: vehicle.id, driverId: driver2.id, date: '2026-09-30', destination: 'مسقط', km: 200, loadKg: 3000, fuelLiters: 25 },
  })
  
  // Add DRIVER user
  state.users.push({
    id: 'user-driver',
    email: 'driver@factory.local',
    fullName: 'سائق',
    role: 'DRIVER',
    passwordHash: 'hash',
    active: true,
  })
  
  const driverView = publicState(state, state.rolePermissions.DRIVER, driver1.id)
  assert.equal(driverView.trips.length, 1)
  assert.equal(driverView.trips[0]?.driverId, driver1.id)
  assert.equal(driverView.fuelLogs.length, 1)
  assert.equal(driverView.fuelLogs[0]?.driverId, driver1.id)
  
  const gmView = publicState(state, state.rolePermissions.GM)
  assert.equal(gmView.trips.length, 2)
  assert.equal(gmView.fuelLogs.length, 2)
})

test('fleet.manage permission required for fleet commands', () => {
  const clock = defaultClock()
  let state = emptyState('fleet')
  
  state = must(state, clock, {
    action: 'createEmployee',
    input: { nameAr: 'سائق', department: 'النقل', jobTitle: 'سائق', basicSalary: 400 },
  })
  
  assert.match(
    fail(state, clock, { action: 'createVehicle', input: { code: 'V1', plateNo: '12345', type: 'TRUCK', nameAr: 'شاحنة' } }, 'user-acc'),
    /صلاحية/,
  )
})
