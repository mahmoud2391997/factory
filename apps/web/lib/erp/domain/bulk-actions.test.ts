import test from 'node:test'
import assert from 'node:assert/strict'

import { buildSeedState } from './seed'
import { executeBulkEngineCommands } from './bulk-actions'
import type { Actor } from './types'

test('bulk-actions: engine bulk command enforces permissions and denies unauthorized user', () => {
  const state = buildSeedState('mock-hash')

  // Unauthorized actor (driver has no inventory delete permission)
  const unauthorizedActor: Actor = {
    id: 'user-driver',
    name: 'محمد الكندي',
    role: 'DRIVER',
    permissions: ['fleet.read'],
  }

  const commands = [
    { action: 'deleteMaterial' as const, input: { id: 'mat-corn' } },
  ]

  const result = executeBulkEngineCommands(state, unauthorizedActor, commands)
  assert.equal(result.ok, false)
  assert.equal(result.successCount, 0)
  assert.equal(result.failureCount, 1)
  assert.equal(result.results[0]?.ok, false)
  assert.match(result.results[0]?.error ?? '', /صلاحية/)
})

test('bulk-actions: engine bulk command handles partial failures gracefully', () => {
  const state = buildSeedState('mock-hash')

  // Authorized manager actor
  const managerActor: Actor = {
    id: 'user-gm',
    name: 'سعيد الوهيبي',
    role: 'GM',
    permissions: ['inventory.read', 'inventory.adjust', 'settings.update', 'users.manage'],
  }

  // Create two temporary test materials: one unreferenced, one referenced in a recipe
  state.materials.push({
    id: 'mat-unused',
    code: 'MAT-UNUSED',
    nameAr: 'مادة تجريبية غير مستخدمة',
    category: 'خام',
    unit: 'كجم',
    minQty: 10,
    vatTreatment: 'STANDARD',
    barcode: 'MAT-UNUSED-BAR',
    active: true,
  })

  state.materials.push({
    id: 'mat-referenced',
    code: 'MAT-REF',
    nameAr: 'مادة مرتبطة بوصفة',
    category: 'خام',
    unit: 'كجم',
    minQty: 10,
    vatTreatment: 'STANDARD',
    barcode: 'MAT-REF-BAR',
    active: true,
  })

  // Reference mat-referenced in a recipe
  state.recipes.push({
    id: 'recipe-test',
    productId: 'prod-feed-1',
    nameAr: 'خلطة تجريبية',
    baseOutputQty: 1000,
    items: [{ materialId: 'mat-referenced', qty: 100 }],
  })

  const commands = [
    { action: 'deleteMaterial' as const, input: { id: 'mat-unused' } },
    { action: 'deleteMaterial' as const, input: { id: 'mat-referenced' } },
  ]

  const result = executeBulkEngineCommands(state, managerActor, commands)

  // Overall ok is false because at least one failed, but successful items are applied
  assert.equal(result.ok, false)
  assert.equal(result.successCount, 1)
  assert.equal(result.failureCount, 1)

  // mat-unused should be deleted from state
  assert.equal(result.state.materials.some((m) => m.id === 'mat-unused'), false)

  // mat-referenced should NOT be deleted from state
  assert.equal(result.state.materials.some((m) => m.id === 'mat-referenced'), true)

  // Errors reported per item
  const failResult = result.results.find((r) => r.id === 'mat-referenced')
  assert.equal(failResult?.ok, false)
  assert.match(failResult?.error ?? '', /لا يمكن حذف مادة مرتبطة/)
})
