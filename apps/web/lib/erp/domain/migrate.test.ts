import assert from 'node:assert/strict'
import { test } from 'node:test'

import { migrateErpState } from './migrate'
import { PERMISSIONS_INTRODUCED, PERMISSIONS_VERSION, type Permission, type RoleKey } from './permissions'
import { emptyState } from './seed'

test('each schema version from 1 through 6 upgrades to v6 and then becomes a no-op', () => {
  for (let version = 1; version <= 6; version += 1) {
    const state = emptyState(`migration-v${version}`)
    state.schemaVersion = version
    state.permissionsVersion = PERMISSIONS_VERSION

    const upgraded = migrateErpState(state)
    assert.equal(upgraded.schemaVersion, 6, `v${version} should reach v6`)
    const snapshot = JSON.stringify(upgraded)
    assert.equal(JSON.stringify(migrateErpState(upgraded)), snapshot, `v${version} should be idempotent`)
  }
})

test('schema versions above the current version are rejected without mutation', () => {
  const state = emptyState('migration-future')
  state.schemaVersion = 7
  const snapshot = JSON.stringify(state)

  assert.throws(() => migrateErpState(state), /إصدار بيانات المصنع غير مدعوم/)
  assert.equal(JSON.stringify(state), snapshot)
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
