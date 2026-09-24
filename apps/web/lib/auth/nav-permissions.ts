/** Maps sidebar modules to required permission keys (any-of). Empty = any authenticated user. */
export const NAV_PERMISSIONS: Record<string, string[]> = {
  'لوحة التحكم': [],
  'المواد الخام': ['inventory.read'],
  المستودعات: ['warehouses.read', 'inventory.read'],
  التصنيع: ['production.read'],
  المنتجات: ['production.read', 'inventory.read'],
  المبيعات: ['sales.read'],
  'العملاء والموردين': ['sales.read', 'purchasing.read'],
  الحسابات: ['accounting.read'],
  الموظفين: ['employees.read'],
  'الحضور والانصراف': ['attendance.read'],
  الإضافي: ['overtime.read'],
  المهام: ['notifications.read'],
  التقارير: ['reports.read'],
  الإشعارات: ['notifications.read'],
  'سجل العمليات': ['audit.read'],
}

export function canAccessNav(permissions: string[], label: string) {
  const required = NAV_PERMISSIONS[label]
  if (!required || required.length === 0) return true
  return required.some((key) => permissions.includes(key))
}
