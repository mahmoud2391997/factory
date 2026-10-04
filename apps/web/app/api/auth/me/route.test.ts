import assert from 'node:assert/strict'
import { test } from 'node:test'
import { NextRequest } from 'next/server'

import { issueAccessToken } from '@/server/auth/jwt'
import { GET } from './route'

const ENV_KEYS = ['APP_MODE', 'DEMO_JWT_SECRET', 'JWT_SECRET']

test('a valid demo login cookie restores the session on a full-page Inventory reports load', async () => {
  const previous = new Map(ENV_KEYS.map((key) => [key, process.env[key]]))
  try {
    process.env.APP_MODE = 'demo'
    process.env.DEMO_JWT_SECRET = 'b2-test-only-demo-signing-secret'

    const accessToken = await issueAccessToken({ sub: 'demo-admin-user', ver: 1 })
    const request = new NextRequest('http://localhost/api/auth/me', {
      headers: { cookie: `access_token=${accessToken}` },
    })
    const response = await GET(request)
    const body = await response.json()

    assert.equal(response.status, 200, JSON.stringify(body))
    assert.equal(body.data.user.id, 'demo-admin-user')
    assert.equal(body.data.user.email, 'admin@factory.local')
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
})
