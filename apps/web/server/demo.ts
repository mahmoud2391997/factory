import { randomUUID } from 'node:crypto'

import { resolveDatabaseUrl } from '@/server/db-url'
import { PERMISSIONS } from '@/lib/erp/domain/permissions'

export const DEMO_USER_ID = 'demo-admin-user'
export const DEMO_EMAIL = 'admin@factory.local'
export const DEMO_FULL_NAME = 'مدير تجريبي'

let generatedDemoSecrets: { password: string; jwtSecret: string; setupToken: string } | null = null
let demoSecretsLogged = false

export function getDemoSecrets() {
  if (!generatedDemoSecrets) {
    generatedDemoSecrets = {
      password: process.env.DEMO_PASSWORD?.trim() || 'Admin123!',
      jwtSecret: process.env.DEMO_JWT_SECRET?.trim() || randomUUID(),
      setupToken: process.env.DEMO_SETUP_TOKEN?.trim() || process.env.SETUP_TOKEN?.trim() || randomUUID(),
    }
  }
  if (!demoSecretsLogged) {
    console.info('[erp] demo mode active; set DEMO_PASSWORD, DEMO_JWT_SECRET, and DEMO_SETUP_TOKEN to override defaults')
    demoSecretsLogged = true
  }
  return generatedDemoSecrets
}

/** Demo mode works out of the box when no production configuration is present. */
export function isDemoMode() {
  const configuredMode = process.env.APP_MODE?.trim().toLowerCase()
  const hasDatabase = Boolean(resolveDatabaseUrl())

  // A configured PostgreSQL connection always takes precedence so Vercel
  // cannot silently serve demo data when the database integration is present.
  if (hasDatabase) return false
  if (configuredMode === 'production' || configuredMode === 'prod') return false
  if (configuredMode === 'demo') return true

  return true
}

export const DEMO_PERMISSIONS = [...PERMISSIONS]

export function getDemoSessionUser() {
  return {
    id: DEMO_USER_ID,
    email: DEMO_EMAIL,
    fullName: DEMO_FULL_NAME,
    isActive: true,
    roles: [
      { key: 'GM', nameAr: 'المدير العام' },
      { key: 'SUPER_ADMIN', nameAr: 'مدير النظام' },
    ],
    permissions: [...PERMISSIONS] as string[],
    mustChangePassword: false,
  }
}

export function getDemoWarehouses() {
  return [
    {
      id: 'demo-wh-raw',
      key: 'WH_RAW',
      nameAr: 'مستودع المواد الخام',
      isActive: true,
      locations: [{ id: 'demo-loc-a1', code: 'A1', nameAr: 'منطقة A1' }],
    },
    {
      id: 'demo-wh-mfg',
      key: 'WH_MFG',
      nameAr: 'مستودع التصنيع',
      isActive: true,
      locations: [{ id: 'demo-loc-m1', code: 'M1', nameAr: 'منطقة M1' }],
    },
    {
      id: 'demo-wh-fg',
      key: 'WH_FG',
      nameAr: 'مستودع المنتجات النهائية',
      isActive: true,
      locations: [{ id: 'demo-loc-f1', code: 'F1', nameAr: 'منطقة F1' }],
    },
  ]
}

export function isDemoUserId(userId: string | null | undefined) {
  return userId === DEMO_USER_ID
}
