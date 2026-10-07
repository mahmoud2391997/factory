import test from 'node:test'
import assert from 'node:assert/strict'
import { ALL_NAV_PAGES, canAccessPage } from './config'
import { DEFAULT_ROLE_PERMISSIONS } from '../erp/domain/permissions'
import { buildSystemMap } from './system-map-model'

test('no permissions reveal no entities, relations, or workflow choices', () => {
  assert.deepEqual(buildSystemMap([]), { entities: [], relations: [], workflows: [] })
})

test('every role only receives accessible destinations and flows between visible entities', () => {
  for (const [role, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const map = buildSystemMap(permissions)
    const ids = new Set(map.entities.map(node => node.id))
    for (const node of map.entities) {
      const page = ALL_NAV_PAGES.find(page => page.href === node.href)
      assert.ok(page && canAccessPage(page, permissions), `${role}: inaccessible ${node.href}`)
    }
    for (const relation of map.relations) {
      assert.ok(ids.has(relation.from) && ids.has(relation.to), `${role}: hidden relationship endpoint`)
    }
    for (const workflow of map.workflows) {
      assert.ok(workflow.nodes.every(id => ids.has(id)), `${role}: hidden workflow step`)
      assert.ok(map.relations.some(relation => relation.type === 'workflow' && workflow.nodes.includes(relation.from) && workflow.nodes.includes(relation.to)))
    }
  }
})

test('sales-only access hides purchasing, production, and financial workflows', () => {
  const map = buildSystemMap(['sales.read'])
  assert.ok(map.entities.some(node => node.id === 'salesInvoice'))
  assert.ok(!map.entities.some(node => ['supplier', 'purchaseOrder', 'recipe', 'account'].includes(node.id)))
  assert.deepEqual(map.workflows.map(workflow => workflow.id), ['sales'])
})

test('partial inventory workflow omits restricted steps without adding invented links', () => {
  const map = buildSystemMap(['inventory.ledger.read'])
  const workflow = map.workflows.find(workflow => workflow.id === 'inventory')
  assert.ok(workflow)
  assert.ok(!workflow.nodes.includes('material'))
  assert.deepEqual(workflow.nodes, ['inventoryTransaction', 'inventoryReports'])
  assert.ok(!map.relations.some(relation => relation.from === 'material' && relation.to === 'inventoryReports'))
})

test('single accessible step does not expose the rest of a workflow', () => {
  const map = buildSystemMap(['scale.read'])
  assert.ok(map.entities.some(node => node.id === 'scaleReading'))
  assert.ok(!map.entities.some(node => node.id === 'productionOrder'))
  assert.ok(!map.workflows.some(workflow => workflow.id === 'production'))
})

test('full permissions retain the complete map and all workflows', () => {
  const map = buildSystemMap(DEFAULT_ROLE_PERMISSIONS.GM)
  assert.deepEqual(map.workflows.map(workflow => workflow.id), ['purchasing', 'inventory', 'production', 'sales', 'financial'])
  assert.ok(map.entities.some(node => node.id === 'supplier'))
  assert.ok(map.entities.some(node => node.id === 'inventoryExtensions-packaging'))
  assert.ok(map.entities.some(node => node.id === 'account'))
})
