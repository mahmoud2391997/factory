#!/usr/bin/env node
import assert from 'node:assert/strict'

const args = process.argv.slice(2)
const flags = new Set(args.filter((arg) => arg.startsWith('--')))
const baseArg = args.find((arg) => !arg.startsWith('--'))
if (!baseArg || flags.has('--help')) {
  console.log('Usage: node scripts/smoke-test.mjs <base-url> [--public-only] [--expect-prod] [--mutate]')
  console.log('Authenticated checks require SMOKE_EMAIL and SMOKE_PASSWORD. --mutate implies --expect-prod.')
  process.exit(flags.has('--help') ? 0 : 2)
}
const baseUrl = new URL(baseArg.endsWith('/') ? baseArg : `${baseArg}/`)
const publicOnly = flags.has('--public-only') || (!flags.has('--expect-prod') && !flags.has('--mutate'))
const expectProd = flags.has('--expect-prod') || flags.has('--mutate')
const mutate = flags.has('--mutate')
let cookieJar = ''
let passed = 0
let failed = 0

function check(name, condition, details = '') {
  if (condition) {
    passed += 1
    console.log(`PASS ${name}`)
  } else {
    failed += 1
    console.error(`FAIL ${name}${details ? ` — ${details}` : ''}`)
  }
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {})
  if (cookieJar) headers.set('cookie', cookieJar)
  const response = await fetch(new URL(path, baseUrl), { redirect: 'manual', ...options, headers })
  const cookies = response.headers.getSetCookie?.() ?? []
  for (const cookie of cookies) {
    const pair = cookie.split(';', 1)[0]
    const name = pair.slice(0, pair.indexOf('='))
    const existing = cookieJar.split('; ').filter((item) => item && !item.startsWith(`${name}=`))
    existing.push(pair)
    cookieJar = existing.join('; ')
  }
  const contentType = response.headers.get('content-type') || ''
  let body
  if (contentType.includes('application/json')) {
    body = await response.json().catch(() => null)
  } else {
    body = await response.text()
  }
  return { response, body }
}

async function checkStatus(name, path, method, expected, options = {}) {
  try {
    const { response, body } = await request(path, { method, ...options })
    check(name, response.status === expected, `expected ${expected}, received ${response.status}; ${typeof body === 'string' ? body.slice(0, 160) : JSON.stringify(body)?.slice(0, 160)}`)
    return { response, body }
  } catch (error) {
    check(name, false, error instanceof Error ? error.message : String(error))
    return null
  }
}

try {
  const health = await request('/api/health')
  const healthJson = health.body && typeof health.body === 'object'
  check('health endpoint returns JSON', healthJson && (health.response.status === 200 || health.response.status === 503))
  if (healthJson) {
    check('health payload has a coarse status', typeof health.body.data?.status === 'string')
    check('health does not expose database diagnostics', !('databaseError' in health.body.data) && !('databaseEnvKey' in health.body.data))
  }

  const loginPage = await request('/login')
  check('login page loads', loginPage.response.status === 200)
  for (const header of ['x-content-type-options', 'x-frame-options', 'referrer-policy']) {
    check(`security header ${header}`, Boolean(loginPage.response.headers.get(header)))
  }

  const anonymousPage = await request('/')
  const location = anonymousPage.response.headers.get('location') || ''
  check('anonymous page redirects to login', [301, 302, 307, 308].includes(anonymousPage.response.status) && location.includes('/login'))
  await checkStatus('anonymous ERP GET is unauthorized', '/api/erp', 'GET', 401)
  await checkStatus('anonymous ERP write is unauthorized', '/api/erp', 'POST', 401, {
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'createCustomer', input: { nameAr: 'unauthorized' } }),
  })
  await checkStatus('anonymous journal export is unauthorized', '/api/erp/export?kind=journals&format=csv', 'GET', 401)
  await checkStatus('anonymous backup is unauthorized', '/api/erp/backup', 'GET', 401)

  const invalidSetup = await request('/api/setup/bootstrap', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-setup-token': 'invalid-smoke-token' },
    body: JSON.stringify({ email: 'smoke@example.invalid', password: 'NotARealPassword123!', fullName: 'Smoke Test' }),
  })
  check('invalid bootstrap token is refused', [400, 401, 403].includes(invalidSetup.response.status), `received ${invalidSetup.response.status}`)

  const wrongPassword = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'smoke-invalid@example.invalid', password: 'DefinitelyWrong123!' }),
  })
  check('invalid login credentials return 401', wrongPassword.response.status === 401, `received ${wrongPassword.response.status}`)

  if (expectProd) {
    check('production health status is ok', health.body?.data?.status === 'ok')
    check('production health is not demo mode', health.body?.data?.demoMode === false)
    check('production health omits demo credentials', !health.body?.data || !('demoCredentials' in health.body.data))
    check('production ERP is bootstrapped', health.body?.data?.bootstrapped === true)

    if (!process.env.SMOKE_EMAIL || !process.env.SMOKE_PASSWORD) {
      throw new Error('--expect-prod requires SMOKE_EMAIL and SMOKE_PASSWORD environment variables')
    }
    const login = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: process.env.SMOKE_EMAIL, password: process.env.SMOKE_PASSWORD }),
    })
    check('configured smoke account can log in', login.response.status === 200 && login.body?.success === true, `received ${login.response.status}`)

    if (login.response.status === 200) {
      const me = await request('/api/auth/me')
      check('authenticated session endpoint returns user', me.response.status === 200 && Boolean(me.body?.data?.user ?? me.body?.user))
      const erp = await request('/api/erp')
      check('authenticated ERP state is readable', erp.response.status === 200 && erp.body?.success === true)

      const pages = [
        '/', '/guide', '/accounting/journals', '/accounting/expenses', '/accounting/obligations',
        '/fleet/fuel', '/fleet/trips', '/hr/attendance', '/hr/payroll',
        '/inventory/products', '/inventory/raw-materials', '/inventory/warehouses',
        '/inventory/manufacturing/orders', '/inventory/manufacturing/quality',
        '/inventory/manufacturing/lots', '/inventory/manufacturing/maintenance/machines',
        '/sales/invoices', '/sales/delivery', '/settings',
      ]
      for (const page of pages) {
        try {
          const result = await request(page)
          check(`authenticated page ${page} avoids 5xx`, result.response.status < 500, `received ${result.response.status}`)
        } catch (error) {
          check(`authenticated page ${page} avoids 5xx`, false, error instanceof Error ? error.message : String(error))
        }
      }

      for (const format of ['csv', 'excel']) {
        const exported = await request(`/api/erp/export?kind=journals&format=${format}`)
        check(`${format} journal export succeeds`, exported.response.status === 200 && typeof exported.body === 'string')
      }
      const backup = await request('/api/erp/backup')
      let backupValid = false
      if (backup.response.status === 200 && typeof backup.body === 'string') {
        try { JSON.parse(backup.body); backupValid = true } catch {}
      }
      check('authenticated backup is valid JSON', backupValid, `received ${backup.response.status}`)

      const unknownAction = await request('/api/erp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'smokeUnknownAction', input: {} }),
      })
      check('unknown ERP action returns 400', unknownAction.response.status === 400)

      const reset = await request('/api/erp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'resetDemo', input: {} }),
      })
      check('production resetDemo is blocked with HTTP 400', reset.response.status === 400)

      if (mutate) {
        const key = `smoke-customer-${Date.now()}`
        const customerName = `Smoke Customer ${key}`
        const createBody = JSON.stringify({ action: 'createCustomer', input: { nameAr: customerName }, idempotencyKey: key })
        const first = await request('/api/erp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: createBody })
        const second = await request('/api/erp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: createBody })
        check('idempotent customer create responses succeed', first.response.status === 200 && second.response.status === 200)
        const after = await request('/api/erp')
        const customerMatches = after.body?.data?.state?.customers?.filter((item) => item.nameAr === customerName) ?? []
        check('idempotent customer create does not duplicate', customerMatches.length === 1, `found ${customerMatches.length}`)
        if (customerMatches.length === 1) {
          const deleted = await request('/api/erp', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ action: 'deleteCustomer', input: { id: customerMatches[0].id }, idempotencyKey: `${key}-delete` }),
          })
          check('smoke customer cleanup succeeds', deleted.response.status === 200)
          const reread = await request('/api/erp')
          const remains = reread.body?.data?.state?.customers?.some((item) => item.nameAr === customerName)
          check('smoke customer is deleted after persistence check', !remains)
        }
      }
    }
  } else if (!publicOnly) {
    throw new Error('Choose --public-only or --expect-prod (optionally --mutate).')
  }
} catch (error) {
  check('smoke test execution', false, error instanceof Error ? error.message : String(error))
}

console.log(`\nSmoke summary: ${passed} passed; ${failed} failed.`)
if (failed) process.exitCode = 1
