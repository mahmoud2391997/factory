import assert from 'node:assert/strict'
import { test } from 'node:test'

import { canResetDemoData, isDemoMode } from './demo'

const DATABASE_KEYS = ['DATABASE_URL', 'POSTGRES_PRISMA_URL', 'POSTGRES_URL', 'DATABASE_URL_UNPOOLED']
const ENV_KEYS = [...DATABASE_KEYS, 'APP_MODE', 'NODE_ENV']

test('demo mode is the default and APP_MODE=production disables it', () => {
  const previous = new Map(ENV_KEYS.map((key) => [key, process.env[key]]))
  try {
    for (const key of DATABASE_KEYS) delete process.env[key]
    Reflect.set(process.env, 'NODE_ENV', 'production')
    delete process.env.APP_MODE
    assert.equal(isDemoMode(), true)
    assert.equal(canResetDemoData(), true)

    process.env.APP_MODE = 'production'
    assert.equal(isDemoMode(), false)
    assert.equal(canResetDemoData(), false)

    process.env.APP_MODE = 'demo'
    assert.equal(isDemoMode(), true)
    assert.equal(canResetDemoData(), true)

    process.env.DATABASE_URL = 'postgresql://db.example.test/erp'
    assert.equal(isDemoMode(), true)
    assert.equal(canResetDemoData(), true)

    delete process.env.DATABASE_URL
    Reflect.set(process.env, 'NODE_ENV', 'test')
    delete process.env.APP_MODE
    assert.equal(isDemoMode(), true)
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
})
