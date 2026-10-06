'use client'

import { useMemo, useState } from 'react'
import { Plus, Search, Trash2, Pencil } from 'lucide-react'

import { emptyValuesFromFields, SchemaForm, validateSchemaFields } from '@/components/erp/schema-form'
import type { EntitySchema } from '@/lib/erp-schema'
import { downloadCsv } from '@/lib/csv'
import { useLanguage } from '@/lib/i18n/language-provider'
import { translateUiText } from '@/lib/i18n/translations'

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
  const { language } = useLanguage()
  const t = (text: string) => translateUiText(language, text)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<EntityRecord | null>(null)
  const [values, setValues] = useState<Record<string, unknown>>(() => emptyValuesFromFields(schema.fields))
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false)
  const [bulkError, setBulkError] = useState('')

  const columns = useMemo(() => schema.fields.filter((f) => f.column), [schema.fields])

  const filtered = useMemo(() => {
    const q = search.trim()
    if (!q) return records
    return records.filter((row) =>
      JSON.stringify(row.values).includes(q) || row.id.includes(q),
    )
  }, [records, search])

  const allFilteredSelected = filtered.length > 0 && filtered.every((row) => selectedIds.includes(row.id))

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(filtered.map((row) => row.id))
    }
  }

  const toggleSelectRow = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  const handleBulkDelete = async () => {
    setBulkError('')
    const failedIds: string[] = []
    for (const id of selectedIds) {
      try {
        await onDelete(id)
      } catch (err) {
        failedIds.push(id)
      }
    }
    if (failedIds.length > 0) {
      setBulkError(`تعذر حذف ${failedIds.length} عنصر لارتباطها بسجلات أخرى`)
      setSelectedIds(failedIds)
    } else {
      setSelectedIds([])
    }
    setConfirmBulkDeleteOpen(false)
  }

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
    const nextErrors = validateSchemaFields(schema.fields, values, t)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    if (editing) onUpdate(editing.id, values)
    else onCreate(values)
    setDialogOpen(false)
  }

  const exportCsv = () => {
    const header = [t('المعرّف'), ...columns.map((c) => c.label)]
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
            <span className="text-[#1e127c]">{schema.title}</span>
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
            {t('تصدير CSV')}
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-[#1e127c] px-4 py-3 text-base font-bold text-white hover:bg-[#35269b]"
          >
            <Plus size={18} />
            {t('إضافة جديد')}
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-[#e1e9e5] bg-white p-5 shadow-[0_4px_22px_rgba(31,65,53,0.04)]">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-bold">{t('السجلات')}</h3>
            <p className="mt-1 text-base text-[#899892]">{filtered.length} {t('سجل — الحقول مطابقة لنموذج البيانات')}</p>
          </div>
          <div className="relative">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9aa9a3]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('بحث...')}
              className="h-11 rounded-lg border border-[#dfe7e3] pr-10 pl-3 text-base outline-none focus:border-[#1e127c]"
            />
          </div>
        </div>

        {bulkError ? (
          <div className="mb-3 rounded-lg border border-[#f0d0c8] bg-[#fff5f2] p-3 text-sm font-semibold text-[#ad5e46]">
            {bulkError}
          </div>
        ) : null}

        {selectedIds.length > 0 ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e0dbfa] bg-[#f3f0ff] p-3 text-sm text-[#271a83] shadow-xs">
            <div className="flex items-center gap-3">
              <span className="font-semibold">
                {t('تم تحديد')} {selectedIds.length} {t('من أصل')} {filtered.length} {t('سجل')}
              </span>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-xs text-[#6b7280] underline hover:text-[#1f1f1f]"
              >
                {t('إلغاء التحديد')}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setConfirmBulkDeleteOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-[#ad5e46] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#8f4733]"
            >
              <Trash2 size={14} />
              {t('حذف المحدد')} ({selectedIds.length})
            </button>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-right">
            <thead>
              <tr className="border-b border-[#edf2ef] text-base text-[#97a49f]">
                <th className="w-12 pb-3 text-center">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    aria-label={t('تحديد كل السجلات')}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="pb-3 font-medium">{t('المعرّف')}</th>
                {columns.map((col) => (
                  <th key={col.key} className="pb-3 font-medium">
                    {col.label}
                  </th>
                ))}
                <th className="pb-3 font-medium">{t('إجراءات')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 3} className="py-10 text-center text-lg text-[#899892]">
                    {t('لا توجد سجلات — أضف أول سجل من النموذج')}
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const isSelected = selectedIds.includes(row.id)
                  return (
                    <tr key={row.id} className={`border-b border-[#f0f4f2] transition-colors duration-200 last:border-0 hover:bg-[#fcfdfd] ${isSelected ? 'bg-[#f3f0ff]' : ''}`}>
                      <td className="w-12 py-4 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          aria-label={`${t('تحديد')} ${row.id}`}
                          onChange={() => toggleSelectRow(row.id)}
                        />
                      </td>
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
                            aria-label={t('تعديل')}
                            onClick={() => openEdit(row)}
                            className="rounded-lg border border-[#dfe7e3] p-2 text-[#53655e] hover:bg-[#f8faf9]"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            aria-label={t('حذف')}
                            onClick={() => onDelete(row.id)}
                            className="rounded-lg border border-[#f0d0c8] p-2 text-[#ad5e46] hover:bg-[#fff5f2]"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {confirmBulkDeleteOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-[#1f1f1f]">{t('تأكيد الحذف الجماعي')}</h3>
            <p className="mt-2 text-sm text-[#6b7280]">
              {t('هل أنت متأكد من حذف')} {selectedIds.length} {t('سجل محدد؟ لن يمكن التراجع عن هذا الإجراء وسيتم رفض حذف السجلات المرتبطة بعمليات أخرى.')}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmBulkDeleteOpen(false)}
                className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-semibold text-[#53655e] hover:bg-[#f9fafb]"
              >
                {t('إلغاء')}
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="rounded-lg bg-[#ad5e46] px-4 py-2 text-sm font-bold text-white hover:bg-[#8f4733]"
              >
                {t('تأكيد الحذف')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {dialogOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-[#1e127c]">
                  {editing ? t('تعديل سجل') : t('إضافة سجل جديد')}
                </h3>
                <p className="mt-1 text-sm text-[#899892]">{schema.title} — حقول النموذج من الـ Schema</p>
              </div>
              <button type="button" onClick={() => setDialogOpen(false)} className="text-sm text-[#899892] hover:text-[#1e127c]">
                {t('إغلاق')}
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
                className="rounded-xl bg-[#1e127c] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#35269b]"
              >
                {t('حفظ')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function formatCell(value: unknown, t: (text: string) => string = (text) => text) {
  if (value === undefined || value === null || value === '') return '—'
  if (typeof value === 'boolean') return value ? t('نعم') : t('لا')
  return String(value)
}
