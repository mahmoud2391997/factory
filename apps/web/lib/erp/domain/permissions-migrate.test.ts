import assert from 'node:assert/strict'
import { test } from 'node:test'

import { migrateErpState } from './migrate'
import { PERMISSIONS_VERSION } from './permissions'
import { emptyState } from './seed'
import type { ErpState } from './types'

function withoutQc(state: ErpState) {
  state.permissionsVersion = 0
  for (const role of ['GM', 'ACCOUNTANT', 'OPERATIONS'] as const) {
    state.rolePermissions[role] = state.rolePermissions[role].filter((permission) => !permission.startsWith('qc.'))
  }
  state.rolePermissions.ACCOUNTANT = [...state.rolePermissions.ACCOUNTANT, 'warehouses.read']
  return state
}

test('schema-2 document without qc permissions gets them for the right roles', () => {
  const state = withoutQc(emptyState('perm'))
  const migrated = migrateErpState(state)
  assert.equal(migrated.permissionsVersion, PERMISSIONS_VERSION)
  assert.ok(migrated.rolePermissions.GM.includes('qc.release'))
  assert.ok(migrated.rolePermissions.GM.includes('qc.limits'))
  assert.ok(migrated.rolePermissions.ACCOUNTANT.includes('qc.read'))
  assert.equal(migrated.rolePermissions.ACCOUNTANT.includes('qc.manage'), false)
  assert.ok(migrated.rolePermissions.ACCOUNTANT.includes('warehouses.read'))
  assert.ok(migrated.rolePermissions.OPERATIONS.includes('qc.manage'))
  assert.equal(migrated.rolePermissions.OPERATIONS.includes('qc.release'), false)
  const audits = migrated.auditLogs.filter((entry) => entry.action === 'دمج الصلاحيات الافتراضية')
  assert.equal(audits.length, 1)
})

test('a custom removal by the admin is preserved and running twice is a no-op', () => {
  const state = withoutQc(emptyState('perm'))
  const migrated = migrateErpState(state)
  migrated.rolePermissions.OPERATIONS = migrated.rolePermissions.OPERATIONS.filter((permission) => permission !== 'qc.manage')
  migrated.rolePermissions.GM = migrated.rolePermissions.GM.filter((permission) => permission !== 'barcode.scan')
  const snapshot = JSON.stringify(migrated)
  const again = migrateErpState(migrated)
  assert.equal(JSON.stringify(again), snapshot)
  assert.equal(again.rolePermissions.OPERATIONS.includes('qc.manage'), false)
  assert.equal(again.rolePermissions.GM.includes('barcode.scan'), false)
  assert.ok(again.rolePermissions.OPERATIONS.includes('qc.read'))
  assert.equal(again.auditLogs.filter((entry) => entry.action === 'دمج الصلاحيات الافتراضية').length, 1)
})

test('v7 permissions gain the functional roles and fleet service control once', () => {
  const state = emptyState('perm-v7')
  state.permissionsVersion = 7
  state.rolePermissions.GM = state.rolePermissions.GM.filter((permission) => permission !== 'fleet.service.manage')
  state.rolePermissions.OPERATIONS = state.rolePermissions.OPERATIONS.filter((permission) => permission !== 'fleet.service.manage')

  const migrated = migrateErpState(state)
  assert.ok(migrated.rolePermissions.GM.includes('fleet.service.manage'))
  assert.ok(migrated.rolePermissions.OPERATIONS.includes('fleet.service.manage'))
  assert.ok(migrated.rolePermissions.STOREKEEPER.includes('inventory.read'))
  assert.ok(migrated.rolePermissions.PRODUCTION.includes('production.create'))
  assert.ok(migrated.rolePermissions.MAINTENANCE.includes('fleet.service.manage'))
  assert.ok(migrated.rolePermissions.SALES.includes('sales.create'))

  migrated.rolePermissions.GM = migrated.rolePermissions.GM.filter((permission) => permission !== 'fleet.service.manage')
  assert.equal(migrateErpState(migrated).rolePermissions.GM.includes('fleet.service.manage'), false)
})
