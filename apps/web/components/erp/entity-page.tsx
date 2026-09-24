'use client'

import { useMemo, useState } from 'react'
import { Plus, Search, Trash2, Pencil } from 'lucide-react'

import { emptyValuesFromFields, SchemaForm, validateSchemaFields } from '@/components/erp/schema-form'
import type { EntitySchema } from '@/lib/erp-schema'
import { downloadCsv } from '@/lib/csv'

export type EntityRecord = {
  id: string
  createdAt: number
  values: Record<string, unknown>
}

export function EntityPage({
  schema,
  records,
  onCreate,
  onUpdate,
  onDelete,
  mainLabel,
}: {
  schema: EntitySchema
  records: EntityRecord[]
  onCreate: (values: Record<string, unknown>) => void
  onUpdate: (id: string, values: Record<string, unknown>) => void
  onDelete: (id: string) => void
  mainLabel: string
}) {
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<EntityRecord | null>(null)
  const [values, setValues] = useState<Record<string, unknown>>(() => emptyValuesFromFields(schema.fields))
  const [errors, setErrors] = useState<Record<string, string>>({})

  const columns = useMemo(() => schema.fields.filter((f) => f.column), [schema.fields])

  const filtered = useMemo(() => {
    const q = search.trim()
    if (!q) return records
    return records.filter((row) =>
      JSON.stringify(row.values).includes(q) || row.id.includes(q),
    )
  }, [records, search])

  const openCreate = () => {
    setEditing(null)
    setValues(emptyValuesFromFields(schema.fields))
    setErrors({})
    setDialogOpen(true)
  }

  const openEdit = (row: EntityRecord) => {
    setEditing(row)
    setValues({ ...emptyValuesFromFields(schema.fields), ...row.values })
    setErrors({})
    setDialogOpen(true)
  }

  const save = () => {
    const nextErrors = validateSchemaFields(schema.fields, values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    if (editing) onUpdate(editing.id, values)
    else onCreate(values)
    setDialogOpen(false)
  }

  const exportCsv = () => {
    const header = ['المعرّف', ...columns.map((c) => c.label)]
    const rows = filtered.map((row) => [
      row.id,
      ...columns.map((c) => formatCell(row.values[c.key])),
    ])
    downloadCsv({ filename: `${schema.title}.csv`, rows: [header, ...rows] })
  }

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-base text-[#7c8c86]">
            <span>{mainLabel}</span>
            <span>/</span>
            <span className="text-[#1d7f72]">{schema.title}</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{schema.title}</h2>
          <p className="mt-2 text-lg text-[#788983]">{schema.description}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-xl border border-[#dfe7e3] bg-white px-4 py-3 text-base font-semibold text-[#53655e] hover:bg-[#f8faf9]"
          >
            تصدير Excel
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-[#123c35] px-4 py-3 text-base font-bold text-white hover:bg-[#1d594d]"
          >
            <Plus size={18} />
            إضافة جديد
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-[#e1e9e5] bg-white p-5 shadow-[0_4px_22px_rgba(31,65,53,0.04)]">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-bold">السجلات</h3>
            <p className="mt-1 text-base text-[#899892]">{filtered.length} سجل — الحقول مطابقة لنموذج البيانات</p>
          </div>
          <div className="relative">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9aa9a3]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث..."
              className="h-11 rounded-lg border border-[#dfe7e3] pr-10 pl-3 text-base outline-none focus:border-[#1d7f72]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-right">
            <thead>
              <tr className="border-b border-[#edf2ef] text-base text-[#97a49f]">
                <th className="pb-3 font-medium">المعرّف</th>
                {columns.map((col) => (
                  <th key={col.key} className="pb-3 font-medium">
                    {col.label}
                  </th>
                ))}
                <th className="pb-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 2} className="py-10 text-center text-lg text-[#899892]">
                    لا توجد سجلات — أضف أول سجل من النموذج
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="border-b border-[#f0f4f2] last:border-0">
                    <td className="py-4 text-base font-semibold text-[#50635b]">{row.id}</td>
                    {columns.map((col) => (
                      <td key={col.key} className="py-4 text-base text-[#53655e]">
                        {formatCell(row.values[col.key])}
                      </td>
                    ))}
                    <td className="py-3.5">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          aria-label="تعديل"
                          onClick={() => openEdit(row)}
                          className="rounded-lg border border-[#dfe7e3] p-2 text-[#53655e] hover:bg-[#f8faf9]"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          aria-label="حذف"
                          onClick={() => onDelete(row.id)}
                          className="rounded-lg border border-[#f0d0c8] p-2 text-[#ad5e46] hover:bg-[#fff5f2]"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {dialogOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-[#123c35]">
                  {editing ? 'تعديل سجل' : 'إضافة سجل جديد'}
                </h3>
                <p className="mt-1 text-sm text-[#899892]">{schema.title} — حقول النموذج من الـ Schema</p>
              </div>
              <button type="button" onClick={() => setDialogOpen(false)} className="text-sm text-[#899892] hover:text-[#123c35]">
                إغلاق
              </button>
            </div>

            <SchemaForm
              fields={schema.fields}
              values={values}
              errors={errors}
              onChange={(key, value) => setValues((current) => ({ ...current, [key]: value }))}
            />

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="rounded-xl border border-[#dfe7e3] px-4 py-2.5 text-sm font-semibold text-[#53655e]"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={save}
                className="rounded-xl bg-[#123c35] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1d594d]"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function formatCell(value: unknown) {
  if (value === undefined || value === null || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'نعم' : 'لا'
  return String(value)
}
