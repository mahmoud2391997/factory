'use client'

import type { SchemaField } from '@/lib/erp-schema'

type Values = Record<string, unknown>

export function SchemaForm({
  fields,
  values,
  errors,
  onChange,
}: {
  fields: SchemaField[]
  values: Values
  errors: Record<string, string>
  onChange: (key: string, value: unknown) => void
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map((field) => {
        const value = values[field.key]
        const error = errors[field.key]
        const common =
          'w-full rounded-xl border border-[#dfe7e3] bg-white px-3.5 py-3.5 text-base outline-none transition focus:border-[#1d7f72] focus:ring-2 focus:ring-[#1d7f72]/15'

        return (
          <label
            key={field.key}
            className={`block space-y-2 text-base ${field.type === 'textarea' || field.type === 'checkbox' ? 'sm:col-span-2' : ''}`}
          >
            <span className="text-base font-semibold text-[#30453d]">
              {field.label}
              {field.required ? <span className="text-[#ad5e46]"> *</span> : null}
              {field.unit ? <span className="mr-1 text-sm font-normal text-[#899892]">({field.unit})</span> : null}
            </span>

            {field.type === 'textarea' ? (
              <textarea
                rows={3}
                className={common}
                placeholder={field.placeholder}
                value={String(value ?? '')}
                onChange={(e) => onChange(field.key, e.target.value)}
              />
            ) : field.type === 'select' ? (
              <select
                className={common}
                value={String(value ?? field.defaultValue ?? '')}
                onChange={(e) => onChange(field.key, e.target.value)}
              >
                <option value="">— اختر —</option>
                {(field.options ?? []).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : field.type === 'checkbox' ? (
              <div className="flex items-center gap-2 rounded-xl border border-[#dfe7e3] bg-[#fafcfb] px-3 py-3">
                <input
                  type="checkbox"
                  checked={Boolean(value ?? field.defaultValue ?? false)}
                  onChange={(e) => onChange(field.key, e.target.checked)}
                  className="size-4 accent-[#123c35]"
                />
                <span className="text-sm text-[#53655e]">تفعيل</span>
              </div>
            ) : field.type === 'number' ? (
              <input
                type="number"
                className={common}
                placeholder={field.placeholder}
                min={field.min}
                max={field.max}
                step={field.step ?? 'any'}
                value={value === undefined || value === null ? '' : String(value)}
                onChange={(e) => onChange(field.key, e.target.value === '' ? '' : Number(e.target.value))}
              />
            ) : field.type === 'date' ? (
              <input
                type="date"
                className={common}
                value={String(value ?? '')}
                onChange={(e) => onChange(field.key, e.target.value)}
              />
            ) : (
              <input
                type="text"
                className={common}
                placeholder={field.placeholder}
                value={String(value ?? '')}
                onChange={(e) => onChange(field.key, e.target.value)}
              />
            )}

            {error ? <span className="text-xs font-semibold text-[#ad5e46]">{error}</span> : null}
          </label>
        )
      })}
    </div>
  )
}

export function emptyValuesFromFields(fields: SchemaField[]): Values {
  const values: Values = {}
  for (const field of fields) {
    if (field.defaultValue !== undefined) values[field.key] = field.defaultValue
    else if (field.type === 'checkbox') values[field.key] = false
    else values[field.key] = ''
  }
  return values
}

export function validateSchemaFields(fields: SchemaField[], values: Values) {
  const errors: Record<string, string> = {}
  for (const field of fields) {
    const raw = values[field.key]
    if (field.required) {
      if (raw === undefined || raw === null || raw === '') {
        errors[field.key] = 'هذا الحقل مطلوب'
        continue
      }
    }
    if (field.type === 'number' && raw !== '' && raw !== undefined && raw !== null) {
      const n = Number(raw)
      if (Number.isNaN(n)) errors[field.key] = 'رقم غير صالح'
      else if (field.min !== undefined && n < field.min) errors[field.key] = `الحد الأدنى ${field.min}`
      else if (field.max !== undefined && n > field.max) errors[field.key] = `الحد الأقصى ${field.max}`
    }
  }
  return errors
}
