import assert from 'node:assert/strict'
import { test } from 'node:test'

import { money, qty, round3 } from './money'

test('OMR money and quantities round consistently to three decimals', () => {
  assert.equal(round3(1.23456), 1.235)
  assert.equal(money(12.3456), 12.346)
  assert.equal(qty(0.1 + 0.2), 0.3)
  assert.equal(money(Number.NaN), 0)
  assert.equal(qty(Number.POSITIVE_INFINITY), 0)
})
