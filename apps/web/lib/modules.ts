import { z } from 'zod'

import type { FieldDef, FieldType } from '@/lib/module-schema'
import { toModuleRowValue, type ModuleFormValues } from '@/lib/module-schema'

export type ColumnDef<Row> = {
  key: string
  label: string
  render: (row: Row) => string
}

export type RowAction<Row> = {
  key: string
  label: string
  tone?: 'default' | 'danger'
  run: (row: Row) => { type: 'edit' } | { type: 'delete' } | { type: 'setStatus'; status: string }
}

export type ModuleDefinition<Row extends { ref: string; status: string; detail: string; value: string; notes?: string; data?: Record<string, unknown> }> = {
  moduleTitle: string
  fields: FieldDef[]
  schema: z.ZodTypeAny
  statusOptions: string[]
  columns: ColumnDef<Row>[]
  actions: RowAction<Row>[]
  toRowPatch: (values: unknown) => Pick<Row, 'detail' | 'value' | 'status' | 'notes' | 'data'>
}

function baseFields(params: {
  detailLabel: string
  detailPlaceholder?: string
  hasQuantity: boolean
  quantityUnit?: string
  statusOptions: string[]
}) {
  const fields: FieldDef[] = [
    {
      key: 'detail',
      label: params.detailLabel,
      type: 'text',
      required: true,
      placeholder: params.detailPlaceholder ?? 'اكتب القيمة',
    },
  ]

  if (params.hasQuantity) {
    fields.push({
      key: 'quantity',
      label: 'الكمية',
      type: 'number',
      min: 0,
      placeholder: '0',
      unit: params.quantityUnit ?? 'كجم',
    })
  }

  fields.push({
    key: 'status',
    label: 'الحالة',
    type: 'text',
    required: true,
    defaultValue: params.statusOptions[0] ?? 'جديد',
    datalist: params.statusOptions,
  })

  fields.push({
    key: 'notes',
    label: 'ملاحظات',
    type: 'textarea',
    placeholder: 'سبب العملية أو تفاصيل إضافية',
  })

  return fields
}

function extendFields(fields: FieldDef[], additions: FieldDef[]) {
  const result = [...fields]
  const afterDetailIndex = result.findIndex((field) => field.key === 'detail')
  const insertAt = afterDetailIndex === -1 ? 1 : afterDetailIndex + 1
  result.splice(insertAt, 0, ...additions)
  return result
}

const asTrimmedText = z.string().trim().min(1, 'هذا الحقل مطلوب')

export function getModuleDefinition<
  Row extends { ref: string; status: string; detail: string; value: string; notes?: string; data?: Record<string, unknown> },
>(
  moduleTitle: string,
): ModuleDefinition<Row> | undefined {
  if (moduleTitle === 'المواد الخام') {
    const statusOptions = ['نشط', 'منخفض', 'منتهي'] as const

    const schema = z.object({
      detail: asTrimmedText.describe('name'),
      supplier: z.string().trim().optional(),
      batchNo: z.string().trim().optional(),
      expiryDate: z.string().trim().optional(), // YYYY-MM-DD
      quantity: z.coerce.number().min(0, 'لا يمكن أن تكون الكمية سالبة').optional(),
      status: z.enum(statusOptions),
      notes: z.string().trim().optional(),
    })

    const fields = extendFields(
      baseFields({
        detailLabel: 'اسم المادة الخام',
        hasQuantity: true,
        quantityUnit: 'كجم',
        statusOptions: [...statusOptions],
      }),
      [
        { key: 'supplier', label: 'المورد', type: 'text' },
        { key: 'batchNo', label: 'رقم الدُفعة', type: 'text' },
        { key: 'expiryDate', label: 'تاريخ الصلاحية', type: 'text', placeholder: 'YYYY-MM-DD' },
      ],
    )

    return {
      moduleTitle,
      fields,
      schema,
      statusOptions: [...statusOptions],
      columns: [
        { key: 'ref', label: 'المرجع', render: (row) => row.ref },
        { key: 'name', label: 'المادة', render: (row) => row.detail },
        { key: 'supplier', label: 'المورد', render: (row) => `${(row.data?.supplier as string) ?? '—'}` },
        { key: 'batchNo', label: 'الدُفعة', render: (row) => `${(row.data?.batchNo as string) ?? '—'}` },
        { key: 'expiry', label: 'الصلاحية', render: (row) => `${(row.data?.expiryDate as string) ?? '—'}` },
        { key: 'qty', label: 'الكمية', render: (row) => row.value },
        { key: 'status', label: 'الحالة', render: (row) => row.status },
      ],
      actions: [
        { key: 'edit', label: 'تعديل', run: () => ({ type: 'edit' }) },
        { key: 'delete', label: 'حذف', tone: 'danger', run: () => ({ type: 'delete' }) },
        { key: 'low', label: 'تعليم كمنخفض', run: () => ({ type: 'setStatus', status: 'منخفض' }) },
      ],
      toRowPatch: (values) => {
        const parsed = schema.parse(values)
        return {
          detail: parsed.detail,
          value: toModuleRowValue(parsed as ModuleFormValues, 'كجم'),
          status: parsed.status,
          notes: parsed.notes?.trim() ? parsed.notes.trim() : undefined,
          data: parsed as unknown as Record<string, unknown>,
        }
      },
    }
  }

  if (moduleTitle === 'التصنيع') {
    const statusOptions = ['بانتظار التخطيط', 'قيد التنفيذ', 'مكتمل', 'ملغي'] as const

    const schema = z.object({
      detail: asTrimmedText.describe('productName'),
      recipeName: z.string().trim().optional(),
      plannedKg: z.coerce.number().min(0).optional(),
      producedKg: z.coerce.number().min(0).optional(),
      lossPercent: z.coerce.number().min(0).max(100).optional(),
      quantity: z.coerce.number().min(0).optional(),
      status: z.enum(statusOptions),
      notes: z.string().trim().optional(),
    })

    const fields = extendFields(
      baseFields({
        detailLabel: 'المنتج',
        detailPlaceholder: 'مثال: علف تسمين مواشي',
        hasQuantity: false,
        statusOptions: [...statusOptions],
      }),
      [
        { key: 'recipeName', label: 'الوصفة', type: 'text' },
        { key: 'plannedKg', label: 'الكمية المخططة (كجم)', type: 'number', min: 0 },
        { key: 'producedKg', label: 'الإنتاج الفعلي (كجم)', type: 'number', min: 0 },
        { key: 'lossPercent', label: 'نسبة الفاقد %', type: 'number', min: 0 },
      ],
    )

    return {
      moduleTitle,
      fields,
      schema,
      statusOptions: [...statusOptions],
      columns: [
        { key: 'ref', label: 'المرجع', render: (row) => row.ref },
        { key: 'product', label: 'المنتج', render: (row) => row.detail },
        { key: 'recipe', label: 'الوصفة', render: (row) => `${(row.data?.recipeName as string) ?? '—'}` },
        { key: 'planned', label: 'مخطط', render: (row) => `${(row.data?.plannedKg as number | undefined) ?? '—'}` },
        { key: 'produced', label: 'فعلي', render: (row) => `${(row.data?.producedKg as number | undefined) ?? '—'}` },
        { key: 'loss', label: 'فاقد %', render: (row) => `${(row.data?.lossPercent as number | undefined) ?? '—'}` },
        { key: 'status', label: 'الحالة', render: (row) => row.status },
      ],
      actions: [
        { key: 'edit', label: 'تعديل', run: () => ({ type: 'edit' }) },
        { key: 'delete', label: 'حذف', tone: 'danger', run: () => ({ type: 'delete' }) },
        { key: 'complete', label: 'إغلاق الأمر', run: () => ({ type: 'setStatus', status: 'مكتمل' }) },
      ],
      toRowPatch: (values) => {
        const parsed = schema.parse(values)
        const produced = parsed.producedKg ?? parsed.plannedKg
        return {
          detail: parsed.detail,
          value: produced !== undefined ? `${produced} كجم` : '—',
          status: parsed.status,
          notes: parsed.notes?.trim() ? parsed.notes.trim() : undefined,
          data: parsed as unknown as Record<string, unknown>,
        }
      },
    }
  }

  if (moduleTitle === 'المبيعات') {
    const statusOptions = ['آجلة', 'مدفوعة', 'ملغاة'] as const

    const schema = z.object({
      detail: asTrimmedText.describe('customerName'),
      productName: z.string().trim().optional(),
      quantity: z.coerce.number().min(0, 'لا يمكن أن تكون الكمية سالبة').optional(),
      pricePerTon: z.coerce.number().min(0).optional(),
      status: z.enum(statusOptions),
      notes: z.string().trim().optional(),
    })

    const fields = extendFields(
      baseFields({
        detailLabel: 'العميل / الجهة',
        hasQuantity: true,
        quantityUnit: 'كجم',
        statusOptions: [...statusOptions],
      }),
      [{ key: 'productName', label: 'المنتج', type: 'text' }, { key: 'pricePerTon', label: 'سعر الطن (ر.ع)', type: 'number', min: 0 }],
    )

    return {
      moduleTitle,
      fields,
      schema,
      statusOptions: [...statusOptions],
      columns: [
        { key: 'ref', label: 'المرجع', render: (row) => row.ref },
        { key: 'customer', label: 'العميل', render: (row) => row.detail },
        { key: 'product', label: 'المنتج', render: (row) => `${(row.data?.productName as string) ?? '—'}` },
        { key: 'qty', label: 'الكمية', render: (row) => row.value },
        {
          key: 'total',
          label: 'الإجمالي (ر.ع)',
          render: (row) => {
            const qtyKg = row.data?.quantity as number | undefined
            const pricePerTon = row.data?.pricePerTon as number | undefined
            if (qtyKg === undefined || pricePerTon === undefined) return '—'
            const total = (qtyKg / 1000) * pricePerTon
            return `${Math.round(total)}`
          },
        },
        { key: 'status', label: 'الحالة', render: (row) => row.status },
      ],
      actions: [
        { key: 'edit', label: 'تعديل', run: () => ({ type: 'edit' }) },
        { key: 'delete', label: 'حذف', tone: 'danger', run: () => ({ type: 'delete' }) },
        { key: 'paid', label: 'تعليم كمدفوعة', run: () => ({ type: 'setStatus', status: 'مدفوعة' }) },
      ],
      toRowPatch: (values) => {
        const parsed = schema.parse(values)
        return {
          detail: parsed.detail,
          value: toModuleRowValue(parsed as ModuleFormValues, 'كجم'),
          status: parsed.status,
          notes: parsed.notes?.trim() ? parsed.notes.trim() : undefined,
          data: parsed as unknown as Record<string, unknown>,
        }
      },
    }
  }

  return undefined
}

