export const PERMISSIONS = [
  'users.read',
  'users.manage',
  'roles.read',
  'roles.manage',
  'settings.read',
  'settings.update',
  'warehouses.read',
  'warehouses.manage',
  'inventory.read',
  'inventory.transfer.create',
  'inventory.adjust',
  'inventory.ledger.read',
  'purchasing.read',
  'purchasing.po.create',
  'purchasing.po.approve',
  'purchasing.gr.create',
  'production.read',
  'production.create',
  'production.complete',
  'production.cost.approve',
  'qc.read',
  'qc.manage',
  'qc.release',
  'qc.limits',
  'sales.read',
  'sales.create',
  'sales.confirm',
  'sales.payments.manage',
  'accounting.read',
  'accounting.manage',
  'tax.read',
  'tax.manage',
  'expenses.manage',
  'expenses.approve',
  'employees.read',
  'employees.manage',
  'attendance.read',
  'attendance.manage',
  'payroll.manage',
  'payroll.approve',
  'payroll.pay',
  'approvals.decide',
  'barcode.scan',
  'reports.read',
  'audit.read',
  'notifications.read',
  'fleet.read',
  'fleet.manage',
  'obligations.read',
  'obligations.manage',
  'obligations.pay',
  'documents.read',
  'documents.manage',
] as const

export type Permission = (typeof PERMISSIONS)[number]

export const ROLE_LABELS = {
  GM: 'المدير العام',
  ACCOUNTANT: 'المحاسب والموارد البشرية',
  OPERATIONS: 'المستودع والإنتاج والمبيعات',
  QUALITY: 'مسؤول الجودة',
  DRIVER: 'سائق',
} as const

export type RoleKey = keyof typeof ROLE_LABELS

const ALL = [...PERMISSIONS]

export const DEFAULT_ROLE_PERMISSIONS: Record<RoleKey, Permission[]> = {
  GM: ALL,
  ACCOUNTANT: [
    'users.read',
    'settings.read',
    'purchasing.read',
    'sales.read',
    'sales.payments.manage',
    'accounting.read',
    'accounting.manage',
    'tax.read',
    'tax.manage',
    'expenses.manage',
    'employees.read',
    'employees.manage',
    'attendance.read',
    'attendance.manage',
    'payroll.manage',
    'payroll.pay',
    'reports.read',
    'audit.read',
    'notifications.read',
    'qc.read',
    'production.cost.approve',
    'fleet.read',
    'obligations.read',
    'obligations.pay',
    'documents.read',
  ],
  OPERATIONS: [
    'warehouses.read',
    'inventory.read',
    'inventory.transfer.create',
    'inventory.adjust',
    'inventory.ledger.read',
    'purchasing.read',
    'purchasing.po.create',
    'purchasing.gr.create',
    'production.read',
    'production.create',
    'production.complete',
    'qc.read',
    'qc.manage',
    'sales.read',
    'sales.create',
    'sales.confirm',
    'barcode.scan',
    'reports.read',
    'notifications.read',
    'fleet.read',
    'fleet.manage',
    'documents.read',
  ],
  QUALITY: ['qc.read', 'qc.manage', 'inventory.read', 'production.read', 'reports.read', 'notifications.read'],
  DRIVER: ['fleet.read', 'reports.read', 'notifications.read'],
}

export function hasPermission(permissions: readonly string[], required: string) {
  return permissions.includes(required)
}

/** Bump when built-in roles gain new default permissions. The migration adds only these keys. */
export const PERMISSIONS_VERSION = 4

export const PERMISSIONS_INTRODUCED: Record<number, Partial<Record<RoleKey, Permission[]>>> = {
  1: {
    GM: ['qc.read', 'qc.manage', 'qc.release', 'qc.limits'],
    ACCOUNTANT: ['qc.read'],
    OPERATIONS: ['qc.read', 'qc.manage'],
  },
  2: {
    QUALITY: ['qc.read', 'qc.manage', 'inventory.read', 'production.read', 'reports.read', 'notifications.read'],
  },
  3: {
    GM: ['production.cost.approve'],
    ACCOUNTANT: ['production.cost.approve'],
  },
  4: {
    GM: ['fleet.read', 'fleet.manage', 'obligations.read', 'obligations.manage', 'obligations.pay', 'documents.read', 'documents.manage'],
    ACCOUNTANT: ['fleet.read', 'obligations.read', 'obligations.pay', 'documents.read'],
    OPERATIONS: ['fleet.read', 'fleet.manage', 'documents.read'],
    DRIVER: ['fleet.read', 'reports.read', 'notifications.read'],
  },
}
