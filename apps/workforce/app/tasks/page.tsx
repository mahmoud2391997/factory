'use client'

import { useEffect, useMemo, useState } from 'react'

type Employee = {
  id: string
  nameAr: string
  department: string
  active: boolean
}

type Team = {
  id: string
  nameAr: string
  isActive: boolean
}

type Task = {
  id: string
  title: string
  description: string | null
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED'
  dueDate: string | null
  priority: number
  teamId: string | null
  assigneeEmployeeId: string | null
  team: Team | null
  assignee: Employee | null
  createdAt: string
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('2')
  const [teamId, setTeamId] = useState('')
  const [assigneeEmployeeId, setAssigneeEmployeeId] = useState('')

  const activeEmployees = useMemo(() => employees.filter((e) => e.active), [employees])
  const activeTeams = useMemo(() => teams.filter((t) => t.isActive), [teams])

  async function load() {
    setError('')
    const [tRes, eRes, teamRes] = await Promise.all([
      fetch('/api/tasks', { cache: 'no-store' }),
      fetch('/api/employees', { cache: 'no-store' }),
      fetch('/api/teams', { cache: 'no-store' }),
    ])
    const tJson = (await tRes.json().catch(() => null)) as { success?: boolean; data?: Task[]; message?: string } | null
    const eJson = (await eRes.json().catch(() => null)) as { success?: boolean; data?: Employee[]; message?: string } | null
    const teamJson = (await teamRes.json().catch(() => null)) as { success?: boolean; data?: Array<Team & { members?: unknown[] }>; message?: string } | null
    if (!tRes.ok || !tJson?.success) setError(tJson?.message || 'تعذر تحميل المهام')
    if (!eRes.ok || !eJson?.success) setError((prev) => prev || eJson?.message || 'تعذر تحميل الموظفين')
    if (!teamRes.ok || !teamJson?.success) setError((prev) => prev || teamJson?.message || 'تعذر تحميل الفرق')
    setTasks(tJson?.data ?? [])
    setEmployees(eJson?.data ?? [])
    setTeams((teamJson?.data ?? []).map((t) => ({ id: t.id, nameAr: t.nameAr, isActive: t.isActive })))
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <main className="space-y-4">
      <div className="rounded-lg border border-[#d0d7de] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">المهام</h1>
          <div className="text-sm text-[#656d76]">{tasks.length} مهام</div>
        </div>

        <form
          className="mt-4 grid gap-3 md:grid-cols-6"
          onSubmit={async (e) => {
            e.preventDefault()
            setPending(true)
            setError('')
            const res = await fetch('/api/tasks', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({
                title,
                description: description || undefined,
                dueDate: dueDate || undefined,
                priority: Number(priority),
                teamId: teamId || undefined,
                assigneeEmployeeId: assigneeEmployeeId || undefined,
              }),
            })
            const json = (await res.json().catch(() => null)) as { success?: boolean; message?: string } | null
            setPending(false)
            if (!res.ok || !json?.success) {
              setError(json?.message || 'تعذر الحفظ')
              return
            }
            setTitle('')
            setDescription('')
            setDueDate('')
            setPriority('2')
            await load()
          }}
        >
          <Field label="العنوان" span={2}>
            <input className="h-10 w-full rounded-md border border-[#d0d7de] px-3 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>
          <Field label="الاستحقاق" span={1}>
            <input className="h-10 w-full rounded-md border border-[#d0d7de] px-3 text-sm" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
          <Field label="الأولوية" span={1}>
            <select className="h-10 w-full rounded-md border border-[#d0d7de] bg-white px-3 text-sm" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="1">1 (عاجلة)</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5 (منخفضة)</option>
            </select>
          </Field>
          <Field label="الفريق" span={1}>
            <select className="h-10 w-full rounded-md border border-[#d0d7de] bg-white px-3 text-sm" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
              <option value="">—</option>
              {activeTeams.map((t) => (
                <option key={t.id} value={t.id}>{t.nameAr}</option>
              ))}
            </select>
          </Field>
          <Field label="المكلّف" span={1}>
            <select className="h-10 w-full rounded-md border border-[#d0d7de] bg-white px-3 text-sm" value={assigneeEmployeeId} onChange={(e) => setAssigneeEmployeeId(e.target.value)}>
              <option value="">—</option>
              {activeEmployees.map((e) => (
                <option key={e.id} value={e.id}>{e.nameAr} — {e.department}</option>
              ))}
            </select>
          </Field>
          <Field label="الوصف" span={6}>
            <textarea className="min-h-20 w-full rounded-md border border-[#d0d7de] px-3 py-2 text-sm" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <div className="md:col-span-6">
            <button disabled={pending} className="h-10 w-full rounded-md border border-[#1f2328] bg-[#1f2328] px-4 text-sm font-semibold text-white disabled:opacity-60" type="submit">
              إضافة مهمة
            </button>
          </div>
        </form>
        {error ? <div className="mt-3 rounded-md border border-[#ff818266] bg-[#ffebe9] px-3 py-2 text-sm text-[#cf222e]">{error}</div> : null}
      </div>

      <div className="overflow-hidden rounded-lg border border-[#d0d7de] bg-white shadow-sm">
        <table className="w-full text-right text-sm">
          <thead className="bg-[#f6f8fa] text-[#656d76]">
            <tr>
              <th className="px-3 py-2 font-medium">المهمة</th>
              <th className="px-3 py-2 font-medium">الفريق</th>
              <th className="px-3 py-2 font-medium">المكلّف</th>
              <th className="px-3 py-2 font-medium">الاستحقاق</th>
              <th className="px-3 py-2 font-medium">الحالة</th>
              <th className="px-3 py-2 font-medium">تعديل</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id} className="border-t border-[#d0d7de]">
                <td className="px-3 py-2">
                  <div className="font-semibold">{t.title}</div>
                  {t.description ? <div className="mt-1 text-xs text-[#656d76]">{t.description}</div> : null}
                </td>
                <td className="px-3 py-2">{t.team?.nameAr || '—'}</td>
                <td className="px-3 py-2">{t.assignee ? `${t.assignee.nameAr} — ${t.assignee.department}` : '—'}</td>
                <td className="px-3 py-2">{t.dueDate ? t.dueDate.slice(0, 10) : '—'}</td>
                <td className="px-3 py-2">
                  <StatusBadge status={t.status} />
                </td>
                <td className="px-3 py-2">
                  <select
                    className="h-9 rounded-md border border-[#d0d7de] bg-white px-2 text-sm"
                    value={t.status}
                    onChange={async (e) => {
                      await fetch(`/api/tasks/${t.id}`, {
                        method: 'PATCH',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({ status: e.target.value }),
                      })
                      await load()
                    }}
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="DONE">DONE</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </td>
              </tr>
            ))}
            {tasks.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-sm text-[#656d76]" colSpan={6}>
                  لا توجد مهام
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </main>
  )
}

function Field({ label, span, children }: { label: string; span: number; children: React.ReactNode }) {
  const spanClass =
    span === 6
      ? 'md:col-span-6'
      : span === 4
        ? 'md:col-span-4'
        : span === 3
          ? 'md:col-span-3'
          : span === 2
            ? 'md:col-span-2'
            : 'md:col-span-1'
  return (
    <label className={`block text-sm font-medium ${spanClass}`}>
      <div className="mb-2 text-[#1f2328]">{label}</div>
      {children}
    </label>
  )
}

function StatusBadge({ status }: { status: Task['status'] }) {
  const meta =
    status === 'DONE'
      ? { bg: 'bg-[#dafbe1]', bd: 'border-[#1f883d33]', fg: 'text-[#1f883d]', label: 'DONE' }
      : status === 'IN_PROGRESS'
        ? { bg: 'bg-[#ddf4ff]', bd: 'border-[#0969da33]', fg: 'text-[#0969da]', label: 'IN_PROGRESS' }
        : status === 'CANCELLED'
          ? { bg: 'bg-[#f6f8fa]', bd: 'border-[#d0d7de]', fg: 'text-[#656d76]', label: 'CANCELLED' }
          : { bg: 'bg-[#fff8c5]', bd: 'border-[#9a670033]', fg: 'text-[#9a6700]', label: 'OPEN' }

  return <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${meta.bg} ${meta.bd} ${meta.fg}`}>{meta.label}</span>
}

