import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url))
const codeExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])

function sourceFiles(directory: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ['node_modules', '.next', 'dist', 'build'].includes(entry.name)) continue
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...sourceFiles(fullPath))
    else if (entry.isFile() && codeExtensions.has(path.extname(entry.name)) && !/\.(test|spec)\./.test(entry.name)) {
      files.push(fullPath)
    }
  }
  return files
}

function environmentKeysIn(source: string, filePath: string) {
  const keys = new Set<string>()
  const directRead = /process\.env(?:\.([A-Z][A-Z0-9_]*)|\[['"]([A-Z][A-Z0-9_]*)['"]\])/g
  for (const match of source.matchAll(directRead)) keys.add(match[1] ?? match[2]!)

  const arrays = new Map<string, string[]>()
  const arrayDeclaration = /\b(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*\[([\s\S]*?)\]\s*(?:as\s+const)?/g
  for (const match of source.matchAll(arrayDeclaration)) {
    arrays.set(match[1]!, [...match[2]!.matchAll(/['"]([A-Z][A-Z0-9_]*)['"]/g)].map((item) => item[1]!))
  }

  const dynamicRead = /process\.env\s*\[\s*([A-Za-z_$][\w$]*)\s*\]/g
  for (const match of source.matchAll(dynamicRead)) {
    const variable = match[1]!
    let resolved = false

    const loop = source.match(new RegExp(`for\\s*\\(\\s*(?:const|let)\\s+${variable}\\s+of\\s+([A-Za-z_$][\\w$]*)\\s*\\)`))
    if (loop && arrays.has(loop[1]!)) {
      for (const key of arrays.get(loop[1]!)!) keys.add(key)
      resolved = true
    }

    const typedParameter = source.match(new RegExp(`\\b${variable}\\s*:\\s*([^,)\\n]+)`))
    if (typedParameter) {
      for (const item of typedParameter[1]!.matchAll(/['"]([A-Z][A-Z0-9_]*)['"]/g)) keys.add(item[1]!)
      resolved = true
    }

    const wrapper = source.match(new RegExp(`(?:const|let)\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*\\(\\s*${variable}\\s*\\)\\s*=>[\\s\\S]{0,120}?process\\.env\\s*\\[\\s*${variable}\\s*\\]`))
    if (wrapper) {
      const calls = new RegExp(`\\b${wrapper[1]}\\s*\\(\\s*['"]([A-Z][A-Z0-9_]*)['"]\\s*\\)`, 'g')
      for (const call of source.matchAll(calls)) keys.add(call[1]!)
      if (source.includes(`${wrapper[1]}(${variable})`)) {
        for (const arrayKeys of arrays.values()) for (const key of arrayKeys) keys.add(key)
      }
      resolved = true
    }

    assert.ok(resolved, `unrecognized dynamic environment read process.env[${variable}] in ${filePath}; make its keys statically discoverable`)
  }
  return keys
}

test('every source environment read is documented in .env.example', () => {
  const example = readFileSync(path.join(repoRoot, '.env.example'), 'utf8')
  const documented = new Set(example.split(/\r?\n/).map((line) => line.match(/^([A-Z][A-Z0-9_]*)=/)?.[1]).filter(Boolean) as string[])
  const files = ['apps', 'packages', 'scripts'].flatMap((directory) => sourceFiles(path.join(repoRoot, directory)))
  const reads = new Set<string>()
  for (const file of files) {
    const source = readFileSync(file, 'utf8')
    for (const key of environmentKeysIn(source, file)) reads.add(key)
  }

  const missing = [...reads].filter((key) => !documented.has(key)).sort()
  assert.deepEqual(missing, [], `environment variables read by source but missing from .env.example: ${missing.join(', ')}`)

  for (const key of [
    'DATABASE_URL', 'DATABASE_URL_UNPOOLED', 'JWT_SECRET', 'SETUP_TOKEN', 'APP_MODE',
    'NEXT_PUBLIC_APP_ENV', 'ACCESS_TOKEN_TTL_SECONDS', 'REFRESH_TOKEN_TTL_SECONDS',
    'ERP_DATA_DIR', 'ERP_SCALE_INGEST_TOKEN', 'ERP_SCALE_USER_ID', 'SMTP_HOST', 'SMTP_USER',
  ]) {
    assert.ok(documented.has(key), `${key} must be listed in .env.example`)
  }
  assert.match(example, /do NOT set SUPABASE_\* for this test/i)
})

test('the Node engine declaration and .nvmrc select the same Vercel Node major', () => {
  const root = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8')) as {
    engines?: { node?: string }
  }
  const engine = root.engines?.node ?? ''
  const nvmrc = readFileSync(path.join(repoRoot, '.nvmrc'), 'utf8').trim()
  const engineMajor = engine.match(/\d+/)?.[0]
  const nvmMajor = nvmrc.match(/\d+/)?.[0]
  assert.ok(engineMajor, 'package.json engines.node must declare a Node version')
  assert.ok(nvmMajor, '.nvmrc must declare a Node version')
  assert.equal(engineMajor, nvmMajor, `package.json engines.node (${engine}) and .nvmrc (${nvmrc}) must match`)
  assert.match(engine, /^22(?:\.x)?$/, 'the Vercel target for this release is Node 22')
  assert.equal(nvmMajor, '22')
})
