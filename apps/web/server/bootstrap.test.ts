import assert from 'node:assert/strict'
import { test } from 'node:test'

import { createBootstrapDocument } from './bootstrap'

test('two concurrent bootstrap creates allow exactly one winner', async () => {
  let exists = false
  const create = async () => {
    await Promise.resolve()
    if (exists) throw Object.assign(new Error('Unique constraint failed on id'), { code: 'P2002' })
    exists = true
  }

  const results = await Promise.all([
    createBootstrapDocument(create),
    createBootstrapDocument(create),
  ])
  assert.deepEqual(results.sort(), [false, true])
})
