#!/usr/bin/env node
import assert from 'node:assert/strict'

const baseArg = process.argv.slice(2).find((arg) => !arg.startsWith('--'))
if (!baseArg || !process.argv.includes('--confirm-test-db')) {
  console.error('Usage: SMOKE_EMAIL=<GM email> SMOKE_PASSWORD=<GM password> [SEED_TEST_PASSWORD=<known test password>] node scripts/seed-test-data.mjs <base-url> --confirm-test-db')
  console.error('This permanently adds test data and accounts. Run only against an isolated test database.')
  process.exit(2)
}
if (!process.env.SMOKE_EMAIL || !process.env.SMOKE_PASSWORD) {
  console.error('SMOKE_EMAIL and SMOKE_PASSWORD must identify an administrator account.')
  process.exit(2)
}
const baseUrl = new URL(baseArg.endsWith('/') ? baseArg : `${baseArg}/`)
const testPassword = process.env.SEED_TEST_PASSWORD || 'FactoryTest123!'
assert.ok(testPassword.length >= 8, 'SEED_TEST_PASSWORD must contain at least 8 characters')
let cookieJar = ''
const counts = { created: 0, updated: 0, skipped: 0 }

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {})
  if (cookieJar) headers.set('cookie', cookieJar)
  const response = await fetch(new URL(path, baseUrl), { redirect: 'manual', ...options, headers })
  for (const cookie of response.headers.getSetCookie?.() ?? []) {
    const pair = cookie.split(';', 1)[0]
    const name = pair.slice(0, pair.indexOf('='))
    cookieJar = [...cookieJar.split('; ').filter((item) => item && !item.startsWith(`${name}=`)), pair].join('; ')
  }
  const type = response.headers.get('content-type') || ''
  const body = type.includes('application/json') ? await response.json().catch(() => null) : await response.text()
  if (!response.ok) throw new Error(`${options.method || 'GET'} ${path} returned HTTP ${response.status}: ${JSON.stringify(body).slice(0, 240)}`)
  return body
}

async function login() {
  const body = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: process.env.SMOKE_EMAIL, password: process.env.SMOKE_PASSWORD }),
  })
  assert.equal(body?.success, true, 'administrator login failed')
}

async function getState() {
  const body = await request('/api/erp')
  assert.equal(body?.success, true, 'ERP state could not be read')
  return body.data.state
}

async function command(action, input, key) {
  const body = await request('/api/erp', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action, input, idempotencyKey: key }),
  })
  assert.equal(body?.success, true, `${action} was rejected: ${body?.message || 'unknown error'}`)
  return body
}

async function ensureByName(collection, name, action, input) {
  const state = await getState()
  if (state[collection].some((item) => item.nameAr === name)) {
    counts.skipped += 1
    return
  }
  await command(action, input, `seed:${collection}:${name}`)
  counts.created += 1
}

async function ensureByCode(collection, code, action, input) {
  const state = await getState()
  if (state[collection].some((item) => item.code === code)) {
    counts.skipped += 1
    return
  }
  await command(action, input, `seed:${collection}:${code}`)
  counts.created += 1
}

await login()
let state = await getState()
const warehouseKeys = new Set((state.warehouses ?? []).map((item) => item.key))
for (const key of ['WH_RAW', 'WH_MFG', 'WH_FG']) {
  assert.ok(warehouseKeys.has(key), `required built-in stock location ${key} is missing`)
}
console.log('Verified stock locations: WH_RAW, WH_MFG, WH_FG.')

const roles = [
  ['ACCOUNTANT', 'Test Accountant'],
  ['OPERATIONS', 'Test Operations'],
  ['QUALITY', 'Test Quality'],
  ['STOREKEEPER', 'Test Storekeeper'],
  ['DRIVER', 'Test Driver'],
  ['SALES', 'Test Sales'],
]
for (const [role, fullName] of roles) {
  const email = `seed-${role.toLowerCase()}@factory.local`
  state = await getState()
  const user = state.users.find((item) => item.email.toLowerCase() === email)
  if (user) {
    await command('setUserPassword', { userId: user.id, password: testPassword }, `seed-password:${email}`)
    counts.updated += 1
  } else {
    await command('createUser', { fullName, email, role, password: testPassword }, `seed-user:${email}`)
    counts.created += 1
  }
}

for (const suffix of ['01', '02']) {
  const supplierName = `مورد اختبارات المصنع ${suffix}`
  await ensureByName('suppliers', supplierName, 'createSupplier', { nameAr: supplierName })
  const customerName = `عميل اختبارات المصنع ${suffix}`
  await ensureByName('customers', customerName, 'createCustomer', { nameAr: customerName, phone: `900000${suffix}` })
}

const materials = []
for (let index = 1; index <= 4; index += 1) {
  const code = `SEED-RM-0${index}`
  await ensureByCode('materials', code, 'createMaterial', {
    code,
    nameAr: `مادة خام اختبارية ${index}`,
    category: index === 1 ? 'حبوب' : 'مكونات',
    minQty: 10,
    vatTreatment: 'ZERO',
  })
  state = await getState()
  materials.push(state.materials.find((item) => item.code === code))
}
assert.ok(materials.every(Boolean), 'one or more test raw materials could not be reread')

const productCode = 'SEED-FG-01'
await ensureByCode('products', productCode, 'createProduct', {
  code: productCode,
  nameAr: 'علف اختبار تشغيلي',
  salePrice: 0.25,
  vatTreatment: 'ZERO',
  bagKg: 50,
})
state = await getState()
const product = state.products.find((item) => item.code === productCode)
assert.ok(product, 'test product could not be reread')
if (state.recipes.some((item) => item.productId === product.id)) {
  counts.skipped += 1
} else {
  await command('createRecipe', {
    productId: product.id,
    nameAr: 'وصفة تشغيل اختبارية',
    baseOutputQty: 1000,
    items: materials.map((material) => ({ materialId: material.id, qty: 250 })),
  }, `seed:recipe:${productCode}`)
  counts.created += 1
}

await ensureByCode('machines', 'SEED-M-01', 'createMachine', {
  code: 'SEED-M-01', nameAr: 'خط إنتاج اختباري', type: 'LINE', location: 'مصنع الاختبار',
})
await ensureByCode('vehicles', 'SEED-V-01', 'createVehicle', {
  code: 'SEED-V-01', plateNo: 'SEED-001', type: 'TRUCK', nameAr: 'شاحنة اختبارية',
})
await ensureByCode('distributionPoints', 'SEED-DP-01', 'createDistributionPoint', {
  code: 'SEED-DP-01', nameAr: 'نقطة توزيع اختبارية', location: 'الموقع التجريبي', phone: '',
})

console.log('\nSeed summary:')
console.log('- Suppliers: 2; customers: 2; raw materials: 4; finished products: 1; recipe: 1.')
console.log('- Stock locations verified: WH_RAW, WH_MFG, WH_FG; vehicle: 1; machine: 1; distribution point: 1.')
console.log(`- Test users: ${roles.length} (accountant, operations, quality, storekeeper, driver, sales).`)
console.log(`- API operations: ${counts.created} created, ${counts.updated} password updates, ${counts.skipped} already present.`)
console.log('- All test users use SEED_TEST_PASSWORD (default is test-only FactoryTest123!). Change or remove these accounts before any live business use.')
