import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const publicDir = new URL('../public/', import.meta.url)

test('PWA has correctly sized install icons and a reachable barcode shortcut', () => {
  const manifest = JSON.parse(readFileSync(new URL('manifest.webmanifest', publicDir), 'utf8'))
  assert.equal(manifest.scope, '/')
  assert.equal(manifest.display, 'standalone')
  for (const icon of manifest.icons) {
    const file = new URL(icon.src.slice(1), publicDir)
    assert.ok(existsSync(file))
    const bytes = readFileSync(file)
    assert.equal(`${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`, icon.sizes)
  }
  assert.ok(manifest.icons.some((icon: { purpose: string }) => icon.purpose === 'maskable'))
  assert.equal(manifest.shortcuts[0].url, '/inventory/warehouses/barcode')
})

test('service worker leaves APIs, mutations and foreign URLs untouched and does not cache business pages', async () => {
  const listeners: Record<string, (event: any) => void> = {}
  const cacheReads: string[] = []
  let networkCalls = 0
  let offline = false
  vm.runInNewContext(readFileSync(new URL('sw.js', publicDir), 'utf8'), {
    URL,
    self: { location: { origin: 'https://factory.example' }, addEventListener: (name: string, handler: (event: any) => void) => { listeners[name] = handler } },
    caches: { match: async (key: string) => { cacheReads.push(key); return 'offline-page' } },
    fetch: async () => { networkCalls++; if (offline) throw new Error('offline'); return 'network-page' },
  })
  for (const [url, method] of [['/api/erp', 'GET'], ['/api/auth/me', 'GET'], ['/sales', 'POST'], ['https://other.example/', 'GET']]) {
    listeners.fetch({ request: { url: new URL(url, 'https://factory.example').href, method, mode: 'navigate' }, respondWith: () => assert.fail('private request intercepted') })
  }
  assert.equal(networkCalls, 0)
  let response: Promise<string> | undefined
  const navigation = { request: { url: 'https://factory.example/sales', method: 'GET', mode: 'navigate' }, respondWith: (value: Promise<string>) => { response = value } }
  listeners.fetch(navigation)
  assert.equal(await response, 'network-page')
  assert.deepEqual(cacheReads, [])
  offline = true
  listeners.fetch(navigation)
  assert.equal(await response, 'offline-page')
  assert.deepEqual(cacheReads, ['/offline.html'])
})
