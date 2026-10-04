import assert from 'node:assert/strict'
import { test } from 'node:test'

import { shouldUseNoopPrismaFallback } from '../../../../packages/database/src/client-policy'

test('a configured production database never permits the no-op Prisma fallback', () => {
  // Real database configured in production must fail-closed (return false -> throws)
  assert.equal(shouldUseNoopPrismaFallback('postgresql://db.example.test/erp', 'production'), false)
  assert.equal(shouldUseNoopPrismaFallback('postgres://user:pass@host:5432/db?sslmode=require', 'production'), false)

  // Production without a database fails closed unless demo mode is explicitly enabled.
  assert.equal(shouldUseNoopPrismaFallback(null, 'production'), false)
  assert.equal(shouldUseNoopPrismaFallback('', 'production'), false)
  assert.equal(shouldUseNoopPrismaFallback(null, 'production', 'demo'), true)
  assert.equal(shouldUseNoopPrismaFallback('', 'production', 'demo'), true)

  // Non-production environments permit developer/demo fallback
  assert.equal(shouldUseNoopPrismaFallback('postgresql://db.example.test/erp', 'development'), true)
  assert.equal(shouldUseNoopPrismaFallback('postgresql://db.example.test/erp', 'test'), true)
  assert.equal(shouldUseNoopPrismaFallback('postgresql://db.example.test/erp', undefined), true)
  assert.equal(shouldUseNoopPrismaFallback(null, 'development'), true)
})
