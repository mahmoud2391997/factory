import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { NextRequest } from 'next/server'

import { issueAccessToken } from '@/server/auth/jwt'
import { loadState } from '@/server/erp/store'
import { POST } from './route'

const ENV_KEYS = ['APP_MODE', 'DEMO_JWT_SECRET', 'JWT_SECRET', 'DATABASE_URL', 'DATABASE_URL_UNPOOLED', 'ERP_DATA_DIR']

test('POST /api/erp returns JSON for unauthenticated and forbidden notification commands', async () => {
  const previous = new Map(ENV_KEYS.map((key) => [key, process.env[key]]))
  const dataDir = await mkdtemp(path.join(tmpdir(), 'erp-notification-route-'))
  try {
    process.env.APP_MODE = 'demo'
    process.env.DEMO_JWT_SECRET = 'b2-test-only-notification-route-secret'
    delete process.env.JWT_SECRET
    delete process.env.DATABASE_URL
    delete process.env.DATABASE_URL_UNPOOLED
    process.env.ERP_DATA_DIR = dataDir

    const unauthorized = await POST(new NextRequest('http://localhost/api/erp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'markNotificationRead', input: { id: 'notification-1' } }),
    }))
    const unauthorizedBody = await unauthorized.json()
    assert.equal(unauthorized.status, 401)
    assert.match(unauthorized.headers.get('content-type') ?? '', /application\/json/i)
    assert.equal(unauthorizedBody.success, false)
    assert.equal(typeof unauthorizedBody.message, 'string')

    const { state } = await loadState()
    const addressedToOtherRoles = state.notifications.find((notification) => !notification.roles.includes('DRIVER'))
    assert.ok(addressedToOtherRoles, 'the fixture includes a notification not addressed to DRIVER')
    const accessToken = await issueAccessToken({ sub: 'user-driver', ver: 1 })
    const forbidden = await POST(new NextRequest('http://localhost/api/erp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `access_token=${accessToken}`,
      },
      body: JSON.stringify({ action: 'markNotificationRead', input: { id: addressedToOtherRoles.id } }),
    }))
    const forbiddenBody = await forbidden.json()
    assert.equal(forbidden.status, 400)
    assert.match(forbidden.headers.get('content-type') ?? '', /application\/json/i)
    assert.equal(forbiddenBody.success, false)
    assert.equal(typeof forbiddenBody.message, 'string')
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
    await rm(dataDir, { recursive: true, force: true })
  }
})
