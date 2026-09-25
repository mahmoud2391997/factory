import { randomUUID } from 'node:crypto'

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
    console.info('[erp] demo credentials generated; set DEMO_PASSWORD, DEMO_JWT_SECRET, and DEMO_SETUP_TOKEN to control them')
    console.info(`[erp] demo password: ${generatedDemoSecrets.password}`)
    console.info(`[erp] demo setup token: ${generatedDemoSecrets.setupToken}`)
    demoSecretsLogged = true
  }
  return generatedDemoSecrets
}

/** Demo mode works out of the box when no production configuration is present. */
export function isDemoMode() {
  const configuredMode = process.env.APP_MODE?.trim().toLowerCase()
  if (configuredMode === 'demo') return true
  if (configuredMode === 'production' || configuredMode === 'prod') return false

  return true
}

export const DEMO_PERMISSIONS = [
  'users.read',
  'users.manage',
  'roles.read',
  'roles.manage',
  'settings.read',
  'settings.update',
  'warehouses.read',
  'warehouses.manage',
  'inventory.read',
  'inventory.adjust',
  'inventory.transfer.create',
  'inventory.ledger.read',
  'purchasing.read',
  'purchasing.po.create',
  'purchasing.gr.create',
  'production.read',
  'production.create',
  'production.complete',
  'sales.read',
  'sales.create',
  'sales.confirm',
  'accounting.read',
  'accounting.manage',
  'tax.read',
  'tax.manage',
  'employees.read',
  'employees.manage',
  'attendance.read',
  'attendance.manage',
  'overtime.read',
  'overtime.manage',
  'reports.read',
  'audit.read',
  'notifications.read',
] as const

export function getDemoSessionUser() {
  return {
    id: DEMO_USER_ID,
    email: DEMO_EMAIL,
    fullName: DEMO_FULL_NAME,
    isActive: true,
    roles: [{ key: 'SUPER_ADMIN', nameAr: 'مدير النظام (تجريبي)' }],
    permissions: [...DEMO_PERMISSIONS] as string[],
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
