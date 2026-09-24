'use client'

import { useState } from 'react'

type Profile = { id: string; firstName: string | null; lastName: string | null; email: string }
type Department = { id: string; name: string; icon: string | null; managerId: string | null; manager?: Profile | null }

export function DepartmentsContainer({
  initialDepartments,
  profiles,
  permissions,
}: {
  initialDepartments: Department[]
  profiles: Profile[]
  permissions: string[]
}) {
  const [rows, setRows] = useState<Department[]>(initialDepartments)
  const [name, setName] = useState('')
  const [managerId, setManagerId] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const canCreate = permissions.includes('departments.create')
  const canEdit = permissions.includes('departments.edit')
  const canDelete = permissions.includes('departments.delete')

  async function refresh() {
    const res = await fetch('/api/departments', { cache: 'no-store' })
    const json = (await res.json().catch(() => null)) as { success?: boolean; data?: Department[] } | null
    if (res.ok && json?.success) setRows(json.data ?? [])
  }

  return (
    <div className="space-y-4">
      {canCreate ? (
        <div className="rounded-lg border border-[#d0d7de] bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold">New department</div>
          <form
            className="mt-3 grid gap-3 md:grid-cols-3"
            onSubmit={async (e) => {
              e.preventDefault()
              setPending(true)
              setError('')
              const res = await fetch('/api/departments', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ name, managerId: managerId || undefined }),
              })
              const json = (await res.json().catch(() => null)) as { success?: boolean; message?: string } | null
              setPending(false)
              if (!res.ok || !json?.success) {
                setError(json?.message || 'تعذر الحفظ')
                return
              }
              setName('')
              setManagerId('')
              await refresh()
            }}
          >
            <label className="block text-sm font-medium">
              Name
              <input className="mt-2 h-10 w-full rounded-md border border-[#d0d7de] px-3 text-sm" value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label className="block text-sm font-medium">
              Manager
              <select className="mt-2 h-10 w-full rounded-md border border-[#d0d7de] bg-white px-3 text-sm" value={managerId} onChange={(e) => setManagerId(e.target.value)}>
                <option value="">—</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {(p.firstName || p.email) + (p.lastName ? ` ${p.lastName}` : '')}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <button className="h-10 w-full rounded-md border border-[#1f2328] bg-[#1f2328] px-4 text-sm font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">
                {pending ? '...' : 'Create'}
              </button>
            </div>
            {error ? <div className="md:col-span-3 rounded-md border border-[#ff818266] bg-[#ffebe9] px-3 py-2 text-sm text-[#cf222e]">{error}</div> : null}
          </form>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-[#d0d7de] bg-white shadow-sm">
        <table className="w-full text-right text-sm">
          <thead className="bg-[#f6f8fa] text-[#656d76]">
            <tr>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Manager</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id} className="border-t border-[#d0d7de]">
                <td className="px-3 py-2 font-semibold">{d.name}</td>
                <td className="px-3 py-2">{d.manager ? (d.manager.firstName || d.manager.email) : '—'}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    {canEdit ? (
                      <button
                        className="rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-2 py-1 text-xs font-semibold"
                        type="button"
                        onClick={async () => {
                          const next = prompt('Department name', d.name)
                          if (!next) return
                          await fetch(`/api/departments/${d.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: next }) })
                          await refresh()
                        }}
                      >
                        Rename
                      </button>
                    ) : null}
                    {canDelete ? (
                      <button
                        className="rounded-md border border-[#d0d7de] bg-[#ffebe9] px-2 py-1 text-xs font-semibold text-[#cf222e]"
                        type="button"
                        onClick={async () => {
                          await fetch(`/api/departments/${d.id}`, { method: 'DELETE' })
                          await refresh()
                        }}
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-sm text-[#656d76]" colSpan={3}>
                  No departments
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}

