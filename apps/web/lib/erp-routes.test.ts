import assert from 'node:assert/strict'
import { test } from 'node:test'

import { DEFAULT_ROLE_PERMISSIONS } from './erp/domain/permissions'
import { canSeeEntity, DESTINATIONS, EXTRA_LEAVES, hrefForEntity, pageTabs, resolvePath } from './erp-routes'
import { ERP_NAV, LEGACY_ENTITY_KEYS, NAV_SECTIONS, visibleMainTabs } from './erp-nav'

const allRegisteredPermissions = [...new Set(
  ERP_NAV.flatMap((main) => [
    ...(main.permission ?? []),
    ...main.subs.flatMap((sub) => sub.permission ?? []),
  ]),
)]

const routeLeaves = [
  ...DESTINATIONS.flatMap((destination) => destination.groups.flatMap((group) => group.leaves)),
  ...EXTRA_LEAVES,
]

test('every navigation sub-tab resolves to its existing route and screen key', () => {
  const routeKeys = routeLeaves.map((leaf) => leaf.entityKey)
  assert.equal(new Set(routeLeaves.map((leaf) => leaf.href)).size, routeLeaves.length, 'route paths are unique')
  assert.equal(new Set(routeKeys).size, routeKeys.length, 'route entity keys are unique')

  for (const main of ERP_NAV) {
    assert.equal(new Set(main.subs.map((sub) => sub.entityKey)).size, main.subs.length, `${main.label} has no duplicate screen aliases`)
    for (const sub of main.subs) {
      const href = hrefForEntity(sub.entityKey)
      assert.ok(href, `${main.label} / ${sub.label} has a route`)
      const resolved = resolvePath(href!)
      assert.ok(resolved, `${href} resolves`)
      assert.equal(resolved.leaf.entityKey, sub.entityKey, `${href} resolves to ${sub.entityKey}`)
    }
  }

  for (const leaf of routeLeaves) {
    const resolved = resolvePath(leaf.href)
    assert.ok(resolved, `${leaf.href} resolves`)
    assert.equal(resolved.leaf.entityKey, leaf.entityKey, `${leaf.href} resolves to ${leaf.entityKey}`)
    assert.ok(canSeeEntity(allRegisteredPermissions, leaf.entityKey), `${leaf.entityKey} has navigation permissions`)
  }
})

test('no existing entity key disappeared from the new navigation', () => {
  const navKeys = new Set(ERP_NAV.flatMap((main) => main.subs.map((sub) => sub.entityKey)))
  for (const entityKey of LEGACY_ENTITY_KEYS) {
    assert.ok(navKeys.has(entityKey), `${entityKey} remains in ERP_NAV`)
  }
  assert.deepEqual([...new Set(routeLeaves.map((leaf) => leaf.entityKey))].sort(), [...LEGACY_ENTITY_KEYS].sort(), 'old route and entity catalogs are retained')
})

test('general manager sees every main tab', () => {
  const visible = visibleMainTabs(DEFAULT_ROLE_PERMISSIONS.GM)
  assert.deepEqual(visible.map((main) => main.id), ERP_NAV.map((main) => main.id))
  assert.deepEqual(NAV_SECTIONS.flatMap((section) => section.mainIds), ERP_NAV.map((main) => main.id))
})

test('driver sees only fleet trip and fuel tabs', () => {
  const visible = visibleMainTabs(DEFAULT_ROLE_PERMISSIONS.DRIVER)
  assert.deepEqual(visible.map((main) => main.id), ['fleet-transport'])
  const visibleScreens = new Set(visible.flatMap((main) => main.subs
    .filter((sub) => (sub.permission ?? main.permission ?? []).some((permission) => DEFAULT_ROLE_PERMISSIONS.DRIVER.includes(permission as never)))
    .map((sub) => sub.entityKey)))
  assert.deepEqual([...visibleScreens].sort(), ['fleetFuel', 'fleetTrips'])
})

test('every tabbed route remains available in rendered page tabs', () => {
  for (const destination of DESTINATIONS) {
    for (const group of destination.groups) {
      for (const leaf of group.leaves) {
        if (!leaf.tab) continue
        const resolved = resolvePath(leaf.href)
        assert.ok(resolved, `${leaf.href} resolves`)
        const tabs = pageTabs(resolved, allRegisteredPermissions)
        const visibleTabs = [...tabs.primary, ...tabs.secondary]
        assert.ok(visibleTabs.some((tab) => tab.href === leaf.href), `${leaf.entityKey} is available as a page tab`)
      }
    }
  }
})
