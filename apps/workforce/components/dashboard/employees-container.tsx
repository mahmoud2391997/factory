'use client'

import { useMemo, useState } from 'react'

type Department = { id: string; name: string }
type Profile = { id: string; firstName: string | null; lastName: string | null; email: string }
type Employee = {
  id: string
  profileId: string
  departmentId: string | null
  position: string | null
  joinDate: string | null
  salary: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED'
  managerId: string | null
  profile: { id: string; email: string; firstName: string | null; lastName: string | null; role: string; teamId: string | null }
  department?: Department | null
  manager?: Profile | null
}

export function EmployeesContainer({
  initialEmployees,
  departments,
  profiles,
  permissions,
}: {
  initialEmployees: Employee[]
  departments: Department[]
  profiles: Profile[]
  permissions: string[]
}) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees)
  const [q, setQ] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)

  const canCreate = permissions.includes('employees.create')
  const canEdit = permissions.includes('employees.edit')
  const canDelete = permissions.includes('employees.delete')

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return employees
    return employees.filter((e) => {
      const name = `${e.profile.firstName ?? ''} ${e.profile.lastName ?? ''}`.trim().toLowerCase()
      const email = e.profile.email.toLowerCase()
      const position = (e.position ?? '').toLowerCase()
      const dept = (e.department?.name ?? '').toLowerCase()
      return name.includes(query) || email.includes(query) || position.includes(query) || dept.includes(query)
    })
  }, [employees, q])

  async function refresh() {
    const res = await fetch('/api/employees', { cache: 'no-store' })
    const json = (await res.json().catch(() => null)) as { success?: boolean; data?: Employee[] } | null
    if (res.ok && json?.success) setEmployees(json.data ?? [])
  }

  async function deleteEmployee(id: string) {
    if (!canDelete) return
    await fetch(`/api/employees/${id}`, { method: 'DELETE' })
    await refresh()
  }

  return (
    <div className="space-y-4">
      {showForm ? (
        <EmployeeForm
          employee={editing}
          departments={departments}
          profiles={profiles}
          onClose={() => {
            setShowForm(false)
            setEditing(null)
          }}
          onSaved={async () => {
            setShowForm(false)
            setEditing(null)
            await refresh()
          }}
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#d0d7de] bg-white p-4 shadow-sm">
        <input
          className="h-10 w-full max-w-sm rounded-md border border-[#d0d7de] px-3 text-sm"
          placeholder="Search employees..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {canCreate ? (
          <button
            className="h-10 rounded-md border border-[#1f2328] bg-[#1f2328] px-4 text-sm font-semibold text-white"
            type="button"
            onClick={() => {
              setEditing(null)
              setShowForm(true)
            }}
          >
            + Add Employee
          </button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-lg border border-[#d0d7de] bg-white shadow-sm">
        <table className="w-full text-right text-sm">
          <thead className="bg-[#f6f8fa] text-[#656d76]">
            <tr>
              <th className="px-3 py-2 font-medium">Employee</th>
              <th className="px-3 py-2 font-medium">Department</th>
              <th className="px-3 py-2 font-medium">Position</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id} className="border-t border-[#d0d7de]">
                <td className="px-3 py-2">
                  <div className="font-semibold">
                    {(e.profile.firstName || e.profile.email) + (e.profile.lastName ? ` ${e.profile.lastName}` : '')}
                  </div>
                  <div className="text-xs text-[#656d76]">{e.profile.email}</div>
                </td>
                <td className="px-3 py-2">{e.department?.name ?? '—'}</td>
                <td className="px-3 py-2">{e.position ?? '—'}</td>
                <td className="px-3 py-2">
                  <StatusBadge status={e.status} />
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-2">
                    {canEdit ? (
                      <button
                        className="rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-2 py-1 text-xs font-semibold"
                        type="button"
                        onClick={() => {
                          setEditing(e)
                          setShowForm(true)
                        }}
                      >
                        Edit
                      </button>
                    ) : null}
                    {canDelete ? (
                      <button
                        className="rounded-md border border-[#d0d7de] bg-[#ffebe9] px-2 py-1 text-xs font-semibold text-[#cf222e]"
                        type="button"
                        onClick={() => deleteEmployee(e.id)}
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-sm text-[#656d76]" colSpan={5}>
                  No employees
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EmployeeForm({
  employee,
  departments,
  profiles,
  onClose,
  onSaved,
}: {
  employee: Employee | null
  departments: Department[]
  profiles: Profile[]
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = Boolean(employee)

  const [email, setEmail] = useState(employee?.profile.email ?? '')
  const [firstName, setFirstName] = useState(employee?.profile.firstName ?? '')
  const [lastName, setLastName] = useState(employee?.profile.lastName ?? '')
  const [role, setRole] = useState(employee?.profile.role ?? 'EMPLOYEE')
  const [departmentId, setDepartmentId] = useState(employee?.departmentId ?? '')
  const [position, setPosition] = useState(employee?.position ?? '')
  const [joinDate, setJoinDate] = useState(employee?.joinDate?.slice(0, 10) ?? '')
  const [salary, setSalary] = useState(employee?.salary ?? '')
  const [status, setStatus] = useState<Employee['status']>(employee?.status ?? 'ACTIVE')
  const [managerId, setManagerId] = useState(employee?.managerId ?? '')

  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  return (
    <div className="rounded-lg border border-[#d0d7de] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">{isEdit ? 'Edit Employee' : 'New Employee'}</div>
        <button className="rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-3 py-1.5 text-sm font-semibold" type="button" onClick={onClose}>
          Close
        </button>
      </div>

      <form
        className="mt-4 grid gap-3 md:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault()
          setPending(true)
          setError('')

          const body = isEdit
            ? {
                departmentId: departmentId || null,
                position: position || null,
                joinDate: joinDate || null,
                salary: salary ? salary : null,
                status,
                managerId: managerId || null,
              }
            : {
                email,
                firstName,
                lastName: lastName || undefined,
                role: role || undefined,
                departmentId: departmentId || undefined,
                position: position || undefined,
                joinDate: joinDate || undefined,
                salary: salary ? salary : undefined,
                status,
                managerId: managerId || undefined,
              }

          const res = await fetch(isEdit ? `/api/employees/${employee!.id}` : '/api/employees', {
            method: isEdit ? 'PATCH' : 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body),
          })
          const json = (await res.json().catch(() => null)) as { success?: boolean; message?: string } | null
          setPending(false)
          if (!res.ok || !json?.success) {
            setError(json?.message || 'تعذر الحفظ')
            return
          }
          onSaved()
        }}
      >
        {!isEdit ? (
          <>
            <label className="block text-sm font-medium md:col-span-2">
              Email
              <input className="mt-2 h-10 w-full rounded-md border border-[#d0d7de] px-3 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label className="block text-sm font-medium">
              First name
              <input className="mt-2 h-10 w-full rounded-md border border-[#d0d7de] px-3 text-sm" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </label>
            <label className="block text-sm font-medium">
              Last name
              <input className="mt-2 h-10 w-full rounded-md border border-[#d0d7de] px-3 text-sm" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </label>
            <label className="block text-sm font-medium md:col-span-2">
              Role
              <input className="mt-2 h-10 w-full rounded-md border border-[#d0d7de] px-3 text-sm" value={role} onChange={(e) => setRole(e.target.value)} />
              <div className="mt-1 text-xs text-[#656d76]">Use a default role (ADMIN/MANAGER/EMPLOYEE) or a custom role name.</div>
            </label>
          </>
        ) : null}

        <label className="block text-sm font-medium">
          Department
          <select className="mt-2 h-10 w-full rounded-md border border-[#d0d7de] bg-white px-3 text-sm" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
            <option value="">—</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
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
        <label className="block text-sm font-medium">
          Position
          <input className="mt-2 h-10 w-full rounded-md border border-[#d0d7de] px-3 text-sm" value={position} onChange={(e) => setPosition(e.target.value)} />
        </label>
        <label className="block text-sm font-medium">
          Status
          <select className="mt-2 h-10 w-full rounded-md border border-[#d0d7de] bg-white px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value as any)}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="ON_LEAVE">ON_LEAVE</option>
            <option value="TERMINATED">TERMINATED</option>
          </select>
        </label>
        <label className="block text-sm font-medium">
          Join date
          <input className="mt-2 h-10 w-full rounded-md border border-[#d0d7de] px-3 text-sm" type="date" value={joinDate} onChange={(e) => setJoinDate(e.target.value)} />
        </label>
        <label className="block text-sm font-medium">
          Salary (optional)
          <input className="mt-2 h-10 w-full rounded-md border border-[#d0d7de] px-3 text-sm" inputMode="decimal" value={salary} onChange={(e) => setSalary(e.target.value)} />
        </label>

        {error ? <div className="md:col-span-2 rounded-md border border-[#ff818266] bg-[#ffebe9] px-3 py-2 text-sm text-[#cf222e]">{error}</div> : null}
        <button className="md:col-span-2 h-10 w-full rounded-md border border-[#1f2328] bg-[#1f2328] px-4 text-sm font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">
          {pending ? '...' : 'Save'}
        </button>
      </form>
    </div>
  )
}

function StatusBadge({ status }: { status: Employee['status'] }) {
  const meta =
    status === 'ACTIVE'
      ? { bg: 'bg-[#dafbe1]', bd: 'border-[#1f883d33]', fg: 'text-[#1f883d]' }
      : status === 'ON_LEAVE'
        ? { bg: 'bg-[#fff8c5]', bd: 'border-[#9a670033]', fg: 'text-[#9a6700]' }
        : status === 'TERMINATED'
          ? { bg: 'bg-[#ffebe9]', bd: 'border-[#ff818266]', fg: 'text-[#cf222e]' }
          : { bg: 'bg-[#f6f8fa]', bd: 'border-[#d0d7de]', fg: 'text-[#656d76]' }

  return <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${meta.bg} ${meta.bd} ${meta.fg}`}>{status}</span>
}

