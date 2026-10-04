import assert from 'node:assert/strict'
import { test } from 'node:test'

test('page-tab layout groups related pages and keeps visible and overflow tabs reachable', async () => {
  // Import by a variable path so the red-first test compiles before the model is implemented.
  const modelPath = './page-tabs-model'
  const { buildPageTabsModel } = await import(modelPath)
  const tabs = [
    { id: 'overview', href: '/inventory', label: 'Overview', group: 'stock' },
    { id: 'balances', href: '/inventory/balances', label: 'Stock levels', group: 'stock' },
    { id: 'movements', href: '/inventory/ledger', label: 'Movements', group: 'stock' },
    { id: 'transfers', href: '/inventory/transfers', label: 'Transfers', group: 'stock' },
    { id: 'adjustments', href: '/inventory/adjustments', label: 'Adjustments', group: 'stock' },
    { id: 'lots', href: '/inventory/lots', label: 'Lots and batches', group: 'traceability' },
    { id: 'reserved', href: '/inventory/reserved', label: 'Reserved stock', group: 'planning' },
    { id: 'reports', href: '/inventory/reports', label: 'Reports', group: 'insights' },
  ]

  const model = buildPageTabsModel(tabs, 'adjustments', 5)
  assert.deepEqual(model.groups.map((group: { id: string }) => group.id), [
    'stock',
    'traceability',
    'planning',
    'insights',
  ])
  assert.deepEqual(model.visible.map((tab: { id: string }) => tab.id), [
    'overview',
    'balances',
    'movements',
    'transfers',
    'adjustments',
  ])
  assert.deepEqual(model.overflow.map((tab: { id: string }) => tab.id), [
    'lots',
    'reserved',
    'reports',
  ])

  const routedTabIds = [...model.visible, ...model.overflow].map((tab: { id: string }) => tab.id)
  assert.equal(new Set(routedTabIds).size, tabs.length, 'every tab must appear exactly once')
  assert.deepEqual(new Set(routedTabIds), new Set(tabs.map((tab) => tab.id)))
})
