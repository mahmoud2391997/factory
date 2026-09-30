import assert from 'node:assert/strict'
import { test } from 'node:test'

import { isScaleBearerAuthorized, scaleReadingSchema } from './ingest'

test('scale readings require finite non-negative weights and stable event identifiers', () => {
  const valid = {
    eventId: 'scale-1-00042',
    scaleId: 'hopper-1',
    productionOrderId: 'po-1',
    materialId: 'mat-1',
    actualQty: 125.75,
  }
  assert.equal(scaleReadingSchema.safeParse(valid).success, true)
  assert.equal(scaleReadingSchema.safeParse({ ...valid, actualQty: Number.NaN }).success, false)
  assert.equal(scaleReadingSchema.safeParse({ ...valid, actualQty: -1 }).success, false)
  assert.equal(scaleReadingSchema.safeParse({ ...valid, eventId: 'bad event id' }).success, false)
})

test('scale bearer authorization requires an exact configured token', () => {
  const token = 'a'.repeat(32)
  assert.equal(isScaleBearerAuthorized(`Bearer ${token}`, token), true)
  assert.equal(isScaleBearerAuthorized(`Bearer ${'b'.repeat(32)}`, token), false)
  assert.equal(isScaleBearerAuthorized(token, token), false)
  assert.equal(isScaleBearerAuthorized(null, token), false)
})
