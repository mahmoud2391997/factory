import assert from 'node:assert/strict'
import { test } from 'node:test'

import { canSeeEntity, DESTINATIONS, EXTRA_LEAVES, pageTabs, resolvePath } from './erp-routes'
import { ERP_NAV } from './erp-nav'

const allRegisteredPermissions = [...new Set(
  ERP_NAV.flatMap((main) => [
    ...(main.permission ?? []),
    ...main.subs.flatMap((sub) => sub.permission ?? []),
  ]),
)]

test('every navigation module has one resolvable route', () => {
  const leaves = [
    ...DESTINATIONS.flatMap((destination) => destination.groups.flatMap((group) => group.leaves)),
    ...EXTRA_LEAVES,
  ]
  const routeKeys = leaves.map((leaf) => leaf.entityKey)
  const navKeys = ERP_NAV.flatMap((main) => main.subs.map((sub) => sub.entityKey))

  assert.equal(new Set(leaves.map((leaf) => leaf.href)).size, leaves.length, 'route paths are unique')
  assert.equal(new Set(routeKeys).size, routeKeys.length, 'route entity keys are unique')
  assert.deepEqual([...routeKeys].sort(), [...navKeys].sort(), 'navigation and routes cover the same modules')

  for (const leaf of leaves) {
    const resolved = resolvePath(leaf.href)
    assert.ok(resolved, `${leaf.href} resolves`)
    assert.equal(resolved.leaf.entityKey, leaf.entityKey, `${leaf.href} resolves to ${leaf.entityKey}`)
    assert.ok(canSeeEntity(allRegisteredPermissions, leaf.entityKey), `${leaf.entityKey} has navigation permissions`)
  }
})

test('every tabbed module is present in the rendered page tabs', () => {
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
