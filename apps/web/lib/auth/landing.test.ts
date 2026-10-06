import assert from 'node:assert/strict'
import { test } from 'node:test'
import { landingPath } from './landing'
import { DEFAULT_ROLE_PERMISSIONS, type RoleKey } from '@/lib/erp/domain/permissions'
import { canAccessPage, canonicalPages } from '@/lib/nav/config'

function user(role: RoleKey) {
  return { roles: [{ key: role, nameAr: role }], permissions: [...DEFAULT_ROLE_PERMISSIONS[role]] }
}

test('operational accounts land on their permitted role screen instead of owner home', () => {
  const expected: Partial<Record<RoleKey, string>> = {
    ACCOUNTANT: '/accounting/journals', OPERATIONS: '/inventory/overview',
    STOREKEEPER: '/inventory/overview', PRODUCTION: '/inventory/manufacturing',
    QUALITY: '/inventory/manufacturing/quality',
    MAINTENANCE: '/inventory/manufacturing/maintenance/machines',
    SALES: '/sales', DRIVER: '/fleet/trips',
  }
  for (const [key, path] of Object.entries(expected)) {
    const account = user(key as RoleKey)
    assert.equal(landingPath(account), path, key)
    const page = canonicalPages().find((item) => item.href === path)
    assert.ok(page && canAccessPage(page, account.permissions), `${key} must have access`)
  }
})

test('home remains the entry screen for users permitted to see it', () => {
  for (const role of ['GM', 'ADMIN', 'SUPER_ADMIN'] as const) assert.equal(landingPath(user(role)), '/')
})

test('mandatory first password change precedes every entry screen', () => {
  for (const role of ['GM', 'ACCOUNTANT', 'PRODUCTION'] as const) {
    assert.equal(landingPath({ ...user(role), mustChangePassword: true }), '/account/password')
    assert.notEqual(landingPath({ ...user(role), mustChangePassword: false }), '/account/password')
  }
})

test('custom permissions override the role label and cannot route to a forbidden screen', () => {
  const account = { ...user('ACCOUNTANT'), permissions: ['packaging.read'] }
  const destination = landingPath(account)
  assert.notEqual(destination, '/accounting/journals')
  assert.notEqual(destination, '/')
  const page = canonicalPages().find((item) => item.href === destination)
  assert.ok(page && canAccessPage(page, account.permissions))
  assert.equal(landingPath({ roles: [], permissions: [] }), '/guide')
})
