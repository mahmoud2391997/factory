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

type TeamMember = {
  teamId: string
  employeeId: string
  role: string
  employee: Employee
}

type Team = {
  id: string
  key: string
  nameAr: string
  description: string | null
  isActive: boolean
  members: TeamMember[]
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const [nameAr, setNameAr] = useState('')
  const [description, setDescription] = useState('')

  const activeEmployees = useMemo(() => employees.filter((e) => e.active), [employees])

  async function load() {
    setError('')
    const [teamsRes, empRes] = await Promise.all([
      fetch('/api/teams', { cache: 'no-store' }),
      fetch('/api/employees', { cache: 'no-store' }),
    ])
    const teamsJson = (await teamsRes.json().catch(() => null)) as { success?: boolean; data?: Team[]; message?: string } | null
    const empJson = (await empRes.json().catch(() => null)) as { success?: boolean; data?: Employee[]; message?: string } | null
    if (!teamsRes.ok || !teamsJson?.success) setError(teamsJson?.message || 'تعذر تحميل الفرق')
    if (!empRes.ok || !empJson?.success) setError((prev) => prev || empJson?.message || 'تعذر تحميل الموظفين')
    setTeams(teamsJson?.data ?? [])
    setEmployees(empJson?.data ?? [])
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <main className="space-y-4">
      <div className="rounded-lg border border-[#d0d7de] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">الفرق</h1>
          <div className="text-sm text-[#656d76]">{teams.length} فرق</div>
        </div>
        <form
          className="mt-4 grid gap-3 md:grid-cols-3"
          onSubmit={async (e) => {
            e.preventDefault()
            setPending(true)
            setError('')
            const res = await fetch('/api/teams', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ nameAr, description: description || undefined }),
            })
            const json = (await res.json().catch(() => null)) as { success?: boolean; message?: string } | null
            setPending(false)
            if (!res.ok || !json?.success) {
              setError(json?.message || 'تعذر الحفظ')
              return
            }
            setNameAr('')
            setDescription('')
            await load()
          }}
        >
          <Field label="اسم الفريق">
            <input className="h-10 w-full rounded-md border border-[#d0d7de] px-3 text-sm" value={nameAr} onChange={(e) => setNameAr(e.target.value)} required />
          </Field>
          <Field label="الوصف (اختياري)">
            <input className="h-10 w-full rounded-md border border-[#d0d7de] px-3 text-sm" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <div className="flex items-end">
            <button disabled={pending} className="h-10 w-full rounded-md border border-[#1f2328] bg-[#1f2328] px-4 text-sm font-semibold text-white disabled:opacity-60" type="submit">
              إنشاء فريق
            </button>
          </div>
        </form>
        {error ? <div className="mt-3 rounded-md border border-[#ff818266] bg-[#ffebe9] px-3 py-2 text-sm text-[#cf222e]">{error}</div> : null}
      </div>

      <div className="grid gap-4">
        {teams.map((team) => (
          <TeamCard key={team.id} team={team} employees={activeEmployees} onChanged={load} />
        ))}
        {teams.length === 0 ? (
          <div className="rounded-lg border border-[#d0d7de] bg-white p-6 text-sm text-[#656d76] shadow-sm">لا توجد فرق</div>
        ) : null}
      </div>
    </main>
  )
}

function TeamCard({
  team,
  employees,
  onChanged,
}: {
  team: Team
  employees: Employee[]
  onChanged: () => Promise<void>
}) {
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? '')
  const [role, setRole] = useState('MEMBER')
  const members = team.members ?? []

  return (
    <div className="rounded-lg border border-[#d0d7de] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">{team.nameAr}</div>
          <div className="mt-1 text-sm text-[#656d76]">{team.description || '—'}</div>
        </div>
        <div className={`rounded-md border px-2 py-1 text-xs font-semibold ${team.isActive ? 'border-[#1f883d33] bg-[#dafbe1] text-[#1f883d]' : 'border-[#d0d7de] bg-[#f6f8fa] text-[#656d76]'}`}>
          {team.isActive ? 'نشط' : 'غير نشط'}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-[#d0d7de]">
        <table className="w-full text-right text-sm">
          <thead className="bg-[#f6f8fa] text-[#656d76]">
            <tr>
              <th className="px-3 py-2 font-medium">العضو</th>
              <th className="px-3 py-2 font-medium">الدور</th>
              <th className="px-3 py-2 font-medium">إزالة</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.employeeId} className="border-t border-[#d0d7de]">
                <td className="px-3 py-2">{m.employee.nameAr} — {m.employee.department}</td>
                <td className="px-3 py-2">{m.role}</td>
                <td className="px-3 py-2">
                  <button
                    className="rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-2 py-1 text-xs font-semibold text-[#656d76] hover:bg-white"
                    type="button"
                    onClick={async () => {
                      await fetch(`/api/teams/${team.id}/members?employeeId=${encodeURIComponent(m.employeeId)}`, { method: 'DELETE' })
                      await onChanged()
                    }}
                  >
                    إزالة
                  </button>
                </td>
              </tr>
            ))}
            {members.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-center text-sm text-[#656d76]" colSpan={3}>لا يوجد أعضاء</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <form
        className="mt-4 grid gap-3 md:grid-cols-3"
        onSubmit={async (e) => {
          e.preventDefault()
          await fetch(`/api/teams/${team.id}/members`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ employeeId, role }),
          })
          await onChanged()
        }}
      >
        <Field label="إضافة عضو">
          <select className="h-10 w-full rounded-md border border-[#d0d7de] bg-white px-3 text-sm" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.nameAr} — {e.department}</option>
            ))}
          </select>
        </Field>
        <Field label="الدور">
          <select className="h-10 w-full rounded-md border border-[#d0d7de] bg-white px-3 text-sm" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="MEMBER">MEMBER</option>
            <option value="LEAD">LEAD</option>
          </select>
        </Field>
        <div className="flex items-end">
          <button className="h-10 w-full rounded-md border border-[#1f2328] bg-[#1f2328] px-4 text-sm font-semibold text-white" type="submit">
            إضافة
          </button>
        </div>
      </form>
    </div>
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

