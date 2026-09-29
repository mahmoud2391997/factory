import assert from 'node:assert/strict'
import { test } from 'node:test'

import { migrateErpState } from './migrate'
import { PERMISSIONS_INTRODUCED, PERMISSIONS_VERSION, type Permission, type RoleKey } from './permissions'
import { emptyState } from './seed'
import { SCHEMA_VERSION } from './types'

test('each supported schema version upgrades to the current schema and then becomes a no-op', () => {
  for (let version = 1; version <= SCHEMA_VERSION; version += 1) {
    const state = emptyState(`migration-v${version}`)
    state.schemaVersion = version
    state.permissionsVersion = PERMISSIONS_VERSION

    const upgraded = migrateErpState(state)
    assert.equal(upgraded.schemaVersion, SCHEMA_VERSION, `v${version} should reach the current version`)
    const snapshot = JSON.stringify(upgraded)
    assert.equal(JSON.stringify(migrateErpState(upgraded)), snapshot, `v${version} should be idempotent`)
  }
})

test('schema versions above the current version are rejected without mutation', () => {
  const state = emptyState('migration-future')
  state.schemaVersion = SCHEMA_VERSION + 1
  const snapshot = JSON.stringify(state)

  assert.throws(() => migrateErpState(state), /إصدار بيانات المصنع غير مدعوم/)
  assert.equal(JSON.stringify(state), snapshot)
})

test('v6 documents receive an empty manual quality-hold log', () => {
  const state = emptyState('migration-v6-holds')
  state.schemaVersion = 6
  Reflect.deleteProperty(state, 'qualityHolds')
  const migrated = migrateErpState(state)
  assert.equal(migrated.schemaVersion, SCHEMA_VERSION)
  assert.deepEqual(migrated.qualityHolds, [])
})

test('v7 documents receive an empty trip-cost allocation log', () => {
  const state = emptyState('migration-v7-trip-cost')
  state.schemaVersion = 7
  Reflect.deleteProperty(state, 'tripCostAllocations')
  const migrated = migrateErpState(state)
  assert.equal(migrated.schemaVersion, SCHEMA_VERSION)
  assert.deepEqual(migrated.tripCostAllocations, [])
})

test('permissions introduced after v2 are merged and later admin removals stay removed', () => {
  const state = emptyState('permissions-v2')
  state.permissionsVersion = 2
  for (const role of Object.keys(state.rolePermissions) as Array<keyof typeof state.rolePermissions>) {
    state.rolePermissions[role] = []
  }

  const migrated = migrateErpState(state)
  assert.equal(migrated.permissionsVersion, PERMISSIONS_VERSION)
  assert.ok(migrated.rolePermissions.GM.includes('production.cost.approve'))
  assert.ok(migrated.rolePermissions.GM.includes('production.cost.recalculate'))
  assert.ok(migrated.rolePermissions.GM.includes('production.variance.thresholds'))
  for (let version = 3; version <= PERMISSIONS_VERSION; version += 1) {
    for (const [role, permissions] of Object.entries(PERMISSIONS_INTRODUCED[version] ?? {}) as Array<[RoleKey, Permission[]]>) {
      for (const permission of permissions) {
        assert.ok(migrated.rolePermissions[role].includes(permission), `${role} should receive ${permission} from v${version}`)
      }
    }
  }

  migrated.rolePermissions.GM = migrated.rolePermissions.GM.filter((permission) => permission !== 'production.cost.approve')
  const snapshot = JSON.stringify(migrated)
  assert.equal(JSON.stringify(migrateErpState(migrated)), snapshot)
  assert.equal(migrated.rolePermissions.GM.includes('production.cost.approve'), false)
})
