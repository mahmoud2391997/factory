import assert from 'node:assert/strict'
import { test } from 'node:test'
import { NextResponse } from 'next/server'

import { issueAccessToken, issueRefreshToken, setAuthCookies } from './jwt'

const ENV_KEYS = ['APP_MODE', 'NODE_ENV', 'JWT_SECRET', 'ACCESS_TOKEN_TTL_SECONDS', 'REFRESH_TOKEN_TTL_SECONDS']

test('configured access and refresh TTLs are used for JWT exp and cookie maxAge', async () => {
  const previous = new Map(ENV_KEYS.map((key) => [key, process.env[key]]))
  try {
    process.env.APP_MODE = 'demo'
    Reflect.set(process.env, 'NODE_ENV', 'test')
    delete process.env.JWT_SECRET
    process.env.ACCESS_TOKEN_TTL_SECONDS = '37'
    process.env.REFRESH_TOKEN_TTL_SECONDS = '89'

    const accessToken = await issueAccessToken({ sub: 'user-test' })
    const refreshToken = await issueRefreshToken({ sub: 'user-test' })
    const claims = (token: string) => JSON.parse(Buffer.from(token.split('.')[1]!, 'base64url').toString('utf8')) as { iat: number; exp: number }
    assert.equal(claims(accessToken).exp - claims(accessToken).iat, 37)
    assert.equal(claims(refreshToken).exp - claims(refreshToken).iat, 89)

    const response = NextResponse.json({ success: true })
    setAuthCookies(response, { accessToken, refreshToken })
    const cookieHeader = response.headers.get('set-cookie') ?? ''
    assert.match(cookieHeader, /access_token=.*Max-Age=37/)
    assert.match(cookieHeader, /refresh_token=.*Max-Age=89/)
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
})

test('invalid configured token TTL is rejected instead of silently creating inconsistent cookies', async () => {
  const previous = process.env.ACCESS_TOKEN_TTL_SECONDS
  try {
    process.env.ACCESS_TOKEN_TTL_SECONDS = '0'
    await assert.rejects(issueAccessToken({ sub: 'user-test' }), /ACCESS_TOKEN_TTL_SECONDS must be a positive integer/)
  } finally {
    if (previous === undefined) delete process.env.ACCESS_TOKEN_TTL_SECONDS
    else process.env.ACCESS_TOKEN_TTL_SECONDS = previous
  }
})
