import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Explicit empty values take precedence over Next's .env loading.
const env = { ...process.env, APP_MODE: 'demo', ERP_DATA_DIR: join(tmpdir(), 'factory-ui-demo') }
for (const key of [
  'DATABASE_URL', 'DATABASE_URL_UNPOOLED', 'PRISMA_DATABASE_URL',
  'NEON_DATABASE_URL', 'NEON_DATABASE_URL_UNPOOLED', 'NEON_POSTGRES_PRISMA_URL',
  'NEON_POSTGRES_URL', 'NEON_POSTGRES_URL_NON_POOLING', 'POSTGRES_PRISMA_URL',
  'POSTGRES_URL', 'POSTGRES_URL_NON_POOLING', 'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_PUBLISHABLE_KEY',
]) env[key] = ''
const child = spawn('pnpm', ['--filter', '@erp/web', 'exec', 'next', 'dev', '--webpack', '-H', '127.0.0.1', '-p', '3000'], { env, stdio: 'inherit' })
child.on('error', error => { console.error(error.message); process.exitCode = 1 })
child.on('exit', code => { process.exitCode = code ?? 1 })
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal))
