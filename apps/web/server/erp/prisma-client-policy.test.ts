import assert from 'node:assert/strict'
import { test } from 'node:test'

import { shouldUseNoopPrismaFallback } from '../../../../packages/database/src/client-policy'

test('a configured production database never permits the no-op Prisma fallback', () => {
  assert.equal(shouldUseNoopPrismaFallback('postgresql://db.example.test/erp', 'production'), false)
  assert.equal(shouldUseNoopPrismaFallback(null, 'production'), true)
  assert.equal(shouldUseNoopPrismaFallback('postgresql://db.example.test/erp', 'development'), true)
})
