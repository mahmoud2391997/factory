import { z } from 'zod'

export type FieldType = 'text' | 'number' | 'textarea'

export type FieldDef = {
  key: string
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  min?: number
  unit?: string
  datalist?: string[]
  defaultValue?: string
}

const statusSuggestions = [
  'جديد',
  'قيد التنفيذ',
  'مكتمل',
  'متأخر',
  'معتمد',
  'نشط',
  'منخفض',
  'متوفر',
  'آجلة',
  'مدفوعة',
  'مورد',
  'عميل',
  'بانتظار التخطيط',
  'جاهز',
  'مفتوح',
  'غياب جزئي',
] as const

export type ModuleFormValues = {
  detail: string
  quantity?: number
  status: string
  notes?: string
}

export type ModuleFormDefinition = {
  fields: FieldDef[]
  schema: z.ZodType<ModuleFormValues>
}

function isProductionModule(title: string) {
  return title.includes('تصنيع') || title.includes('الإنتاج')
}
function isSalesModule(title: string) {
  return title.includes('مبيعات')
}
function isMaterialModule(title: string) {
  return title.includes('مواد خام')
}

export function getModuleFormDefinition(moduleTitle: string): ModuleFormDefinition {
  const needsQuantity = isProductionModule(moduleTitle) || isSalesModule(moduleTitle) || isMaterialModule(moduleTitle)

  const detailLabel = isProductionModule(moduleTitle)
    ? 'المنتج والوصفة'
    : isSalesModule(moduleTitle)
      ? 'العميل / الجهة'
      : isMaterialModule(moduleTitle)
        ? 'اسم المادة الخام'
        : 'الاسم أو المرجع'

  const fields: FieldDef[] = [
    {
      key: 'detail',
      label: detailLabel,
      type: 'text',
      required: true,
      placeholder: isProductionModule(moduleTitle) ? 'مثال: علف تسمين مواشي' : 'اكتب القيمة',
    },
    ...(needsQuantity
      ? [
          {
            key: 'quantity',
            label: 'الكمية',
            type: 'number' as const,
            min: 0,
            placeholder: '0',
            unit: 'كجم',
          },
        ]
      : []),
    {
      key: 'status',
      label: 'الحالة',
      type: 'text',
      required: true,
      defaultValue: 'جديد',
      datalist: [...statusSuggestions],
    },
    {
      key: 'notes',
      label: 'ملاحظات',
      type: 'textarea',
      placeholder: 'سبب العملية أو تفاصيل إضافية',
    },
  ]

  const schemaBase = z.object({
    detail: z.string().trim().min(1, 'هذا الحقل مطلوب'),
    status: z.string().trim().min(1, 'هذا الحقل مطلوب'),
    notes: z.string().trim().optional(),
  })

  const schema = needsQuantity
    ? schemaBase.extend({
        quantity: z.coerce.number().min(0, 'لا يمكن أن تكون الكمية سالبة').optional(),
      })
    : schemaBase.extend({
        quantity: z.coerce.number().optional(),
      })

  return { fields, schema }
}

export function toModuleRowValue(values: ModuleFormValues, unit?: string) {
  if (values.quantity === undefined || Number.isNaN(values.quantity)) return '—'
  const trimmedUnit = unit?.trim()
  return trimmedUnit ? `${values.quantity} ${trimmedUnit}` : `${values.quantity}`
}

