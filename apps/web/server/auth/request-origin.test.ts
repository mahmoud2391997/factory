import { test } from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'
import { proxy } from '@/proxy'
import { mutationOriginAllowed } from './request-origin'
function request(headers: Record<string,string> = {}, path = '/api/erp', method = 'POST') { return new NextRequest('http://factory.test' + path, { method, headers: { host: 'factory.test', ...headers } }) }
test('cookie writes require the exact browser origin including proxy TLS and port', () => {
 assert.equal(mutationOriginAllowed(request({ cookie: 'access_token=test' })), false)
 assert.equal(mutationOriginAllowed(request({ origin: 'http://factory.test', cookie: 'access_token=test' })), true)
 assert.equal(mutationOriginAllowed(request({ origin: 'https://factory.test', 'x-forwarded-proto': 'https' })), true)
 for(const origin of ['https://evil.test', 'null', 'http://factory.test:8080', 'http://user:pass@factory.test']) assert.equal(mutationOriginAllowed(request({ origin })), false)
 assert.equal(mutationOriginAllowed(request({ origin: 'http://factory.test', 'sec-fetch-site': 'cross-site' })), false)
})
test('origin enforcement covers unauthenticated login and protects all future API writes', () => {
 assert.equal(proxy(request({ origin: 'https://evil.test' }, '/api/auth/login')).status, 403)
 assert.equal(proxy(request({ origin: 'https://evil.test' }, '/api/future-endpoint')).status, 403)
 assert.equal(mutationOriginAllowed(request({}, '/api/erp', 'GET')), true)
 assert.equal(mutationOriginAllowed(request({}, '/api/internal/outbox')), true)
 assert.equal(mutationOriginAllowed(request({}, '/api/scale/readings')), true)
 assert.equal(mutationOriginAllowed(request()), true) // token/CLI callers without a cookie retain existing authentication
})
