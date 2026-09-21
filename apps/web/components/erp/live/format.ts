import type { ErpState, ItemType } from '@/lib/erp/domain/types'

export const WAREHOUSE_LABEL: Record<string, string> = {
  WH_RAW: 'مستودع المواد الخام',
  WH_MFG: 'مستودع التصنيع',
  WH_FG: 'مستودع المنتجات النهائية',
}

export const STATUS_LABEL: Record<string, string> = {
  PENDING_APPROVAL: 'بانتظار الاعتماد',
  APPROVED: 'معتمد',
  REJECTED: 'مرفوض',
  PARTIALLY_RECEIVED: 'استلام جزئي',
  RECEIVED: 'مستلم',
  RELEASED: 'قيد التنفيذ',
  COMPLETED: 'مكتمل',
  DRAFT: 'مسودة',
  CONFIRMED: 'مؤكدة',
  PARTIAL: 'تحصيل جزئي',
  PAID: 'مدفوعة',
  POSTED: 'مرحّل',
  OPEN: 'مفتوحة',
  DONE: 'منتهية',
  STANDARD: 'خاضعة 5%',
  ZERO: 'صفرية',
  EXEMPT: 'معفاة',
  LOW_STOCK: 'نقص مخزون',
  APPROVAL: 'اعتماد',
  EXPIRY: 'صلاحية',
  INFO: 'تنبيه',
  MANUAL: 'يدوي',
  CSV: 'ملف',
  DEVICE: 'جهاز',
}

export function moneyFmt(value: number) {
  return `${new Intl.NumberFormat('ar-OM', {
    numberingSystem: 'latn',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value)} ر.ع.`
}

export function qtyFmt(value: number) {
  return new Intl.NumberFormat('ar-OM', { numberingSystem: 'latn', maximumFractionDigits: 3 }).format(value)
}

export function statusLabel(value: string) {
  return STATUS_LABEL[value] ?? value
}

export function materialName(state: Pick<ErpState, 'materials'>, id: string) {
  return state.materials.find((item) => item.id === id)?.nameAr ?? id
}

export function productName(state: Pick<ErpState, 'products'>, id: string) {
  return state.products.find((item) => item.id === id)?.nameAr ?? id
}

export function itemName(state: Pick<ErpState, 'materials' | 'products'>, itemType: ItemType, id: string) {
  return itemType === 'MATERIAL' ? materialName(state, id) : productName(state, id)
}

export function partyName(list: Array<{ id: string; nameAr: string }>, id: string) {
  return list.find((item) => item.id === id)?.nameAr ?? id
}

export function can(permissions: string[], key: string) {
  return permissions.includes(key)
}
