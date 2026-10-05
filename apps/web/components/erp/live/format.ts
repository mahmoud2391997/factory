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
  QC: 'جودة',
  PASSED: 'مقبول',
  FAILED: 'مرفوض',
  HOLD: 'معلّق',
  PENDING: 'بانتظار النتيجة',
  UNTESTED: 'لم يُفحص',
  RAW_MATERIAL: 'خام',
  FINISHED_PRODUCT: 'منتج نهائي',
  MANUAL: 'يدوي',
  CSV: 'ملف',
  DEVICE: 'جهاز',
  PURCHASE_RECEIPT: 'استلام مشتريات',
  TRANSFER_OUT: 'تحويل صادر',
  TRANSFER_IN: 'تحويل وارد',
  PRODUCTION_CONSUMPTION: 'استهلاك إنتاج',
  PRODUCTION_OUTPUT: 'ناتج إنتاج',
  SALE: 'بيع',
  WITHDRAWAL: 'سحب',
  ADJUSTMENT: 'تعديل مخزون',
  ANNUAL: 'سنوية',
  SICK: 'مرضية',
  UNPAID: 'غير مدفوعة',
  EMERGENCY: 'طارئة',
  OTHER: 'أخرى',
}

function uiLang(): 'ar' | 'en' | 'hi' {
  try {
    const v = typeof localStorage !== 'undefined' ? localStorage.getItem('erp-language') : null
    return v === 'en' || v === 'hi' ? v : 'ar'
  } catch {
    return 'ar'
  }
}

function uiLocale() {
  const lang = uiLang()
  return lang === 'hi' ? 'hi-IN' : lang === 'en' ? 'en-GB' : 'ar-OM'
}

export function moneyFmt(value: number) {
  return `${new Intl.NumberFormat(uiLocale(), {
    numberingSystem: 'latn',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value)} ${uiLang() === 'en' ? 'OMR' : uiLang() === 'hi' ? 'ओमानी रियाल' : 'ر.ع.'}`
}

export function qtyFmt(value: number) {
  return new Intl.NumberFormat(uiLocale(), { numberingSystem: 'latn', maximumFractionDigits: 3 }).format(value)
}

export function tonsFmt(kg: number) {
  return `${new Intl.NumberFormat(uiLocale(), {
    numberingSystem: 'latn',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(kg / 1000)} ${uiLang() === 'en' ? 't' : uiLang() === 'hi' ? 'टन' : 'طن'}`
}

export function pctFmt(value: number) {
  const digits = Math.abs(value - Math.round(value)) < 0.05 ? 0 : 1
  return `${new Intl.NumberFormat(uiLocale(), {
    numberingSystem: 'latn',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)}%`
}

export function dayFmt(day: string) {
  const [year, month, date] = day.split('-').map(Number)
  return new Intl.DateTimeFormat(uiLocale(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
    numberingSystem: 'latn',
  }).format(new Date(Date.UTC(year!, month! - 1, date, 12)))
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
