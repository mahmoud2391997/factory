import { ensureDatabaseUrlEnv, resolveDatabaseUrl } from '@/server/db-url'

export const DEMO_USER_ID = 'demo-admin-user'
export const DEMO_EMAIL = 'admin@factory.local'
export const DEMO_PASSWORD = 'Admin123!'
export const DEMO_FULL_NAME = 'مدير تجريبي'
export const DEMO_JWT_SECRET = 'erp-demo-jwt-secret-change-me-in-production'
export const DEMO_SETUP_TOKEN = 'demo-setup-token'

function hasDatabaseUrl() {
  return Boolean(ensureDatabaseUrlEnv() ?? resolveDatabaseUrl())
}

/** True when no Postgres URL is configured — app runs with in-memory demo auth/data. */
export function isDemoMode() {
  return !hasDatabaseUrl()
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
