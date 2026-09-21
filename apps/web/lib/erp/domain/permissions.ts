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
] as const

export type Permission = (typeof PERMISSIONS)[number]

export const ROLE_LABELS = {
  GM: 'المدير العام',
  ACCOUNTANT: 'المحاسب والموارد البشرية',
  OPERATIONS: 'المستودع والإنتاج والمبيعات',
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
    'sales.read',
    'sales.create',
    'sales.confirm',
    'barcode.scan',
    'reports.read',
    'notifications.read',
  ],
}

export function hasPermission(permissions: readonly string[], required: string) {
  return permissions.includes(required)
}
