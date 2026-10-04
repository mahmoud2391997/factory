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
    assert.equal(body.data.status, 'degraded')
    assert.equal(body.data.bootstrapped, false)
    assert.equal(body.data.demoMode, false)
    assert.deepEqual(Object.keys(body.data).sort(), ['bootstrapped', 'demoMode', 'status'])
    assert.equal(Object.hasOwn(body.data, 'databaseConfigured'), false)
    assert.equal(Object.hasOwn(body.data, 'jwtConfigured'), false)
    assert.equal(Object.hasOwn(body.data, 'databaseReachable'), false)
    assert.equal(Object.hasOwn(body.data, 'demoCredentials'), false)
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
})

test('health returns 200 with demo credentials in demo mode', async () => {
  const previous = new Map(ENV_KEYS.map((key) => [key, process.env[key]]))
  try {
    Reflect.set(process.env, 'NODE_ENV', 'development')
    delete process.env.APP_MODE
    for (const key of ['DATABASE_URL', 'POSTGRES_PRISMA_URL', 'POSTGRES_URL', 'DATABASE_URL_UNPOOLED']) {
      delete process.env[key]
    }

    const response = await GET()
    assert.equal(response.status, 200)
    const body = await response.json()
    assert.equal(body.success, true)
    assert.equal(body.data.status, 'demo')
    assert.equal(body.data.demoMode, true)
    assert.equal(body.data.bootstrapped, true)
    assert.deepEqual(body.data.demoCredentials, {
      email: 'admin@factory.local',
      password: 'Admin123!',
    })
    assert.equal(Object.hasOwn(body.data, 'databaseConfigured'), false)
    assert.equal(Object.hasOwn(body.data, 'jwtConfigured'), false)
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
})
