import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url))
const apiRoot = path.join(repoRoot, 'apps/web/app/api')

function collectRouteFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) return collectRouteFiles(fullPath)
    return entry.isFile() && entry.name === 'route.ts' ? [fullPath] : []
  })
}

test('API route files are pinned to Node.js and never use the Edge runtime', () => {
  const routes = collectRouteFiles(apiRoot)
  assert.ok(routes.length > 0, 'the API route scan must find route.ts files')

  for (const routeFile of routes) {
    const source = readFileSync(routeFile, 'utf8')
    const relativePath = path.relative(repoRoot, routeFile)
    assert.doesNotMatch(
      source,
      /export\s+const\s+runtime\s*=\s*['"]edge['"]/i,
      `${relativePath} must not select the Edge runtime`,
    )
    assert.match(
      source,
      /export\s+const\s+runtime\s*=\s*['"]nodejs['"]/,
      `${relativePath} must explicitly select Node.js for Prisma, bcrypt, filesystem, and crypto compatibility`,
    )
  }
})
