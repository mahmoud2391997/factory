'use client'

import { useMemo, useState } from 'react'

import { ALL_PERMISSIONS } from '@/lib/permissions'

type Role = {
  id: string
  name: string
  label: string
  permissions: string[]
  createdAt: string
  updatedAt: string
}

const RESERVED = new Set(['ADMIN', 'MANAGER', 'EMPLOYEE'])

function groupPermissions(perms: readonly string[]) {
  const groups: Record<string, string[]> = {}
  for (const p of perms) {
    const [g] = p.split('.', 1)
    const key = g || 'other'
    groups[key] ??= []
    groups[key].push(p)
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
}

export function RolesContainer({ initialRoles }: { initialRoles: Role[] }) {
  const [roles, setRoles] = useState<Role[]>(initialRoles)
  const [editing, setEditing] = useState<Role | null>(null)
  const [creating, setCreating] = useState(false)

  const grouped = useMemo(() => groupPermissions(ALL_PERMISSIONS), [])

  async function refresh() {
    const res = await fetch('/api/roles', { cache: 'no-store' })
    const json = (await res.json().catch(() => null)) as { success?: boolean; data?: Role[] } | null
    if (res.ok && json?.success) setRoles(json.data ?? [])
  }

  return (
    <div className="space-y-4">
      {creating ? (
        <RoleEditor
          title="New Role"
          grouped={grouped}
          initial={{ name: '', label: '', permissions: [] }}
          onClose={() => setCreating(false)}
          onSave={async (draft) => {
            const res = await fetch('/api/roles', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(draft) })
            const json = (await res.json().catch(() => null)) as { success?: boolean; message?: string } | null
            if (!res.ok || !json?.success) throw new Error(json?.message || 'تعذر الحفظ')
            setCreating(false)
            await refresh()
          }}
          allowEditName
        />
      ) : null}

      {editing ? (
        <RoleEditor
          title={`Edit Role: ${editing.name}`}
          grouped={grouped}
          initial={{ name: editing.name, label: editing.label, permissions: editing.permissions ?? [] }}
          onClose={() => setEditing(null)}
          onSave={async (draft) => {
            const res = await fetch(`/api/roles/${editing.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ label: draft.label, permissions: draft.permissions }) })
            const json = (await res.json().catch(() => null)) as { success?: boolean; message?: string } | null
            if (!res.ok || !json?.success) throw new Error(json?.message || 'تعذر الحفظ')
            setEditing(null)
            await refresh()
          }}
          readOnly={RESERVED.has(editing.name)}
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#d0d7de] bg-white p-4 shadow-sm">
        <div>
          <div className="text-sm font-semibold">Roles</div>
          <div className="text-xs text-[#656d76]">{roles.length} roles</div>
        </div>
        <button className="h-10 rounded-md border border-[#1f2328] bg-[#1f2328] px-4 text-sm font-semibold text-white" type="button" onClick={() => setCreating(true)}>
          + New Role
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#d0d7de] bg-white shadow-sm">
        <table className="w-full text-right text-sm">
          <thead className="bg-[#f6f8fa] text-[#656d76]">
            <tr>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Label</th>
              <th className="px-3 py-2 font-medium">Permissions</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.id} className="border-t border-[#d0d7de]">
                <td className="px-3 py-2 font-mono text-xs">{r.name}</td>
                <td className="px-3 py-2">{r.label}</td>
                <td className="px-3 py-2">{(r.permissions ?? []).length}</td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-2">
                    <button
                      className="rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-2 py-1 text-xs font-semibold"
                      type="button"
                      onClick={() => setEditing(r)}
                    >
                      {RESERVED.has(r.name) ? 'View' : 'Edit'}
                    </button>
                    {!RESERVED.has(r.name) ? (
                      <button
                        className="rounded-md border border-[#d0d7de] bg-[#ffebe9] px-2 py-1 text-xs font-semibold text-[#cf222e]"
                        type="button"
                        onClick={async () => {
                          await fetch(`/api/roles/${r.id}`, { method: 'DELETE' })
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
            {roles.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-sm text-[#656d76]" colSpan={4}>
                  No roles
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RoleEditor({
  title,
  grouped,
  initial,
  onClose,
  onSave,
  allowEditName,
  readOnly,
}: {
  title: string
  grouped: Array<[string, string[]]>
  initial: { name: string; label: string; permissions: string[] }
  onClose: () => void
  onSave: (draft: { name: string; label: string; permissions: string[] }) => Promise<void>
  allowEditName?: boolean
  readOnly?: boolean
}) {
  const [name, setName] = useState(initial.name)
  const [label, setLabel] = useState(initial.label)
  const [permissions, setPermissions] = useState<string[]>(initial.permissions ?? [])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  return (
    <div className="rounded-lg border border-[#d0d7de] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">{title}</div>
        <button className="rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-3 py-1.5 text-sm font-semibold" type="button" onClick={onClose}>
          Close
        </button>
      </div>

      <form
        className="mt-4 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault()
          setPending(true)
          setError('')
          try {
            await onSave({ name, label, permissions })
          } catch (err: any) {
            setError(String(err?.message ?? 'تعذر الحفظ'))
            setPending(false)
          }
        }}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-sm font-medium">
            Name
            <input
              className="mt-2 h-10 w-full rounded-md border border-[#d0d7de] px-3 text-sm font-mono"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!allowEditName || Boolean(readOnly)}
              required
            />
          </label>
          <label className="block text-sm font-medium">
            Label
            <input className="mt-2 h-10 w-full rounded-md border border-[#d0d7de] px-3 text-sm" value={label} onChange={(e) => setLabel(e.target.value)} disabled={Boolean(readOnly)} required />
          </label>
        </div>

        <div className="rounded-lg border border-[#d0d7de] p-4">
          <div className="mb-3 text-sm font-semibold">Permissions</div>
          <div className="grid gap-4 md:grid-cols-2">
            {grouped.map(([group, perms]) => (
              <div key={group} className="rounded-lg border border-[#d0d7de] bg-[#f6f8fa] p-3">
                <div className="mb-2 text-xs font-semibold uppercase text-[#656d76]">{group}</div>
                <div className="space-y-1">
                  {perms.map((p) => {
                    const checked = permissions.includes(p)
                    return (
                      <label key={p} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={Boolean(readOnly)}
                          onChange={(e) => {
                            const next = e.target.checked
                            setPermissions((prev) => (next ? Array.from(new Set([...prev, p])) : prev.filter((x) => x !== p)))
                          }}
                        />
                        <span className="font-mono text-xs">{p}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {error ? <div className="rounded-md border border-[#ff818266] bg-[#ffebe9] px-3 py-2 text-sm text-[#cf222e]">{error}</div> : null}
        {!readOnly ? (
          <button className="h-10 w-full rounded-md border border-[#1f2328] bg-[#1f2328] px-4 text-sm font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">
            {pending ? '...' : 'Save'}
          </button>
        ) : null}
      </form>
    </div>
  )
}

