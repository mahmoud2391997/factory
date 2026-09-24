'use client'

import { useEffect, useMemo, useState } from 'react'

type Employee = {
  id: string
  code: string
  nameAr: string
  department: string
  jobTitle: string
  active: boolean
}

export default function EmployeesPage() {
  const [rows, setRows] = useState<Employee[]>([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const [nameAr, setNameAr] = useState('')
  const [department, setDepartment] = useState('')
  const [jobTitle, setJobTitle] = useState('')

  const activeCount = useMemo(() => rows.filter((r) => r.active).length, [rows])

  async function load() {
    setError('')
    const res = await fetch('/api/employees', { cache: 'no-store' })
    const json = (await res.json().catch(() => null)) as { success?: boolean; data?: Employee[]; message?: string } | null
    if (!res.ok || !json?.success) {
      setError(json?.message || 'تعذر تحميل الموظفين')
      return
    }
    setRows(json.data ?? [])
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <main className="space-y-4">
      <div className="rounded-lg border border-[#d0d7de] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">الموظفون</h1>
          <div className="text-sm text-[#656d76]">{activeCount} نشط</div>
        </div>
        <form
          className="mt-4 grid gap-3 md:grid-cols-4"
          onSubmit={async (e) => {
            e.preventDefault()
            setPending(true)
            setError('')
            const res = await fetch('/api/employees', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ nameAr, department, jobTitle }),
            })
            const json = (await res.json().catch(() => null)) as { success?: boolean; message?: string } | null
            setPending(false)
            if (!res.ok || !json?.success) {
              setError(json?.message || 'تعذر الحفظ')
              return
            }
            setNameAr('')
            setDepartment('')
            setJobTitle('')
            await load()
          }}
        >
          <Field label="الاسم">
            <input className="h-10 w-full rounded-md border border-[#d0d7de] px-3 text-sm" value={nameAr} onChange={(e) => setNameAr(e.target.value)} required />
          </Field>
          <Field label="القسم">
            <input className="h-10 w-full rounded-md border border-[#d0d7de] px-3 text-sm" value={department} onChange={(e) => setDepartment(e.target.value)} required />
          </Field>
          <Field label="المسمى">
            <input className="h-10 w-full rounded-md border border-[#d0d7de] px-3 text-sm" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required />
          </Field>
          <div className="flex items-end">
            <button disabled={pending} className="h-10 w-full rounded-md border border-[#1f2328] bg-[#1f2328] px-4 text-sm font-semibold text-white disabled:opacity-60" type="submit">
              إضافة
            </button>
          </div>
        </form>
        {error ? <div className="mt-3 rounded-md border border-[#ff818266] bg-[#ffebe9] px-3 py-2 text-sm text-[#cf222e]">{error}</div> : null}
      </div>

      <div className="overflow-hidden rounded-lg border border-[#d0d7de] bg-white shadow-sm">
        <table className="w-full text-right text-sm">
          <thead className="bg-[#f6f8fa] text-[#656d76]">
            <tr>
              <th className="px-3 py-2 font-medium">الكود</th>
              <th className="px-3 py-2 font-medium">الاسم</th>
              <th className="px-3 py-2 font-medium">القسم</th>
              <th className="px-3 py-2 font-medium">المسمى</th>
              <th className="px-3 py-2 font-medium">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-[#d0d7de]">
                <td className="px-3 py-2 font-mono text-xs">{r.code}</td>
                <td className="px-3 py-2">{r.nameAr}</td>
                <td className="px-3 py-2">{r.department}</td>
                <td className="px-3 py-2">{r.jobTitle}</td>
                <td className="px-3 py-2">
                  <button
                    className={`rounded-md border px-2 py-1 text-xs font-semibold ${r.active ? 'border-[#1f883d33] bg-[#dafbe1] text-[#1f883d]' : 'border-[#d0d7de] bg-[#f6f8fa] text-[#656d76]'}`}
                    type="button"
                    onClick={async () => {
                      await fetch(`/api/employees/${r.id}`, {
                        method: 'PATCH',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({ active: !r.active }),
                      })
                      await load()
                    }}
                  >
                    {r.active ? 'نشط' : 'غير نشط'}
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-sm text-[#656d76]" colSpan={5}>
                  لا يوجد موظفون
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </main>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium">
      <div className="mb-2 text-[#1f2328]">{label}</div>
      {children}
    </label>
  )
}

