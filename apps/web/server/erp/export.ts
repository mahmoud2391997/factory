export type ExportKind = 'journals' | 'invoices' | 'vat' | 'trial' | 'payroll' | 'stock' | 'lots' | 'pnl' | 'documents'

const EXPORT_KINDS = new Set<ExportKind>([
  'journals',
  'invoices',
  'vat',
  'trial',
  'payroll',
  'stock',
  'lots',
  'pnl',
  'documents',
])

function hasAny(permissions: readonly string[], required: string[]) {
  return required.some((permission) => permissions.includes(permission))
}

export function isExportKind(kind: string): kind is ExportKind {
  return EXPORT_KINDS.has(kind as ExportKind)
}

export function canExport(kind: ExportKind, permissions: readonly string[]) {
  if (kind === 'documents') return hasAny(permissions, ['documents.read', 'documents.manage'])
  if (kind === 'payroll') return hasAny(permissions, ['payroll.manage', 'payroll.approve', 'payroll.pay'])
  if (kind === 'stock') return hasAny(permissions, ['inventory.read', 'warehouses.read'])
  if (kind === 'lots') return hasAny(permissions, ['production.read', 'accounting.read'])
  if (kind === 'invoices') return hasAny(permissions, ['sales.read', 'accounting.read', 'accounting.manage'])
  return hasAny(permissions, ['accounting.read', 'accounting.manage'])
}

export function exportPermissionStatus(kind: ExportKind, permissions: readonly string[]): 200 | 403 {
  return canExport(kind, permissions) ? 200 : 403
}

export function canExportCosts(permissions: readonly string[]) {
  return hasAny(permissions, ['accounting.read', 'accounting.manage', 'production.cost.approve'])
}

export function exportRowsForPermissions(
  kind: ExportKind,
  rows: Array<Array<string | number>>,
  permissions: readonly string[],
) {
  if (canExportCosts(permissions) || (kind !== 'stock' && kind !== 'lots')) return rows
  const omitted = kind === 'stock' ? new Set([4, 5]) : new Set([5, 6, 7, 8])
  return rows.map((row) => row.filter((_, index) => !omitted.has(index)))
}

function csvCell(value: string | number) {
  const text = String(value ?? '')
  const protectedText = typeof value === 'string' && /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text
  return `"${protectedText.replace(/"/g, '""')}"`
}

export function csvSpreadsheet(rows: Array<Array<string | number>>) {
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`
}
