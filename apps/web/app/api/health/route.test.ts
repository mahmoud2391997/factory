import assert from 'node:assert/strict'
import { test } from 'node:test'

import { GET } from './route'

const ENV_KEYS = [
  'NODE_ENV', 'APP_MODE', 'DATABASE_URL', 'POSTGRES_PRISMA_URL', 'POSTGRES_URL',
  'DATABASE_URL_UNPOOLED', 'JWT_SECRET',
]

test('health returns 503 and only coarse non-demo status when production has no reachable database', async () => {
  const previous = new Map(ENV_KEYS.map((key) => [key, process.env[key]]))
  try {
    Reflect.set(process.env, 'NODE_ENV', 'production')
    process.env.APP_MODE = 'production'
    for (const key of ['DATABASE_URL', 'POSTGRES_PRISMA_URL', 'POSTGRES_URL', 'DATABASE_URL_UNPOOLED', 'JWT_SECRET']) {
      delete process.env[key]
    }

    const response = await GET()
    assert.equal(response.status, 503)
    const body = await response.json()
    assert.equal(body.success, false)
    assert.equal(body.data.demoMode, false)
    assert.equal(body.data.databaseReachable, false)
    assert.equal(Object.hasOwn(body.data, 'databaseError'), false)
    assert.equal(Object.hasOwn(body.data, 'databaseEnvKey'), false)
    assert.equal(Object.hasOwn(body.data, 'demoCredentials'), false)
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
})
