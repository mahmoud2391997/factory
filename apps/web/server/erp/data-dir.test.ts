import assert from 'node:assert/strict'
import { test } from 'node:test'

const dataDirModule = './data-dir'

test('Vercel keeps ERP data under /tmp even when ERP_DATA_DIR is configured', async () => {
  const { resolveErpDataDir } = await import(dataDirModule) as {
    resolveErpDataDir: (options: {
      vercel: boolean
      lambda?: boolean
      configured?: string
      tmpDir: string
      cwd: string
    }) => string
  }

  assert.equal(resolveErpDataDir({
    vercel: true,
    configured: '/var/task/persistent-data',
    tmpDir: '/tmp',
    cwd: '/var/task',
  }), '/tmp/erp-data')
})
