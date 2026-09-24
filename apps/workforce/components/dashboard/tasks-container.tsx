'use client'

import { useMemo, useState } from 'react'

type Department = { id: string; name: string }
type Profile = { id: string; firstName: string | null; lastName: string | null; email: string }
type Task = {
  id: string
  title: string
  description: string | null
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED'
  departmentId: string | null
  assigneeId: string | null
  createdById: string | null
  dueDate: string | null
  department?: Department | null
  assignee?: Profile | null
  creator?: Profile | null
}

const statusColumns: Array<{ id: Task['status']; label: string; bg: string }> = [
  { id: 'TODO', label: 'To Do', bg: 'bg-[#f6f8fa]' },
  { id: 'IN_PROGRESS', label: 'In Progress', bg: 'bg-[#ddf4ff]' },
  { id: 'REVIEW', label: 'Review', bg: 'bg-[#fff8c5]' },
  { id: 'COMPLETED', label: 'Completed', bg: 'bg-[#dafbe1]' },
]

export function TasksContainer({
  initialTasks,
  departments,
  profiles,
  currentProfileId,
  permissions,
}: {
  initialTasks: Task[]
  departments: Department[]
  profiles: Profile[]
  currentProfileId: string
  permissions: string[]
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [filterDept, setFilterDept] = useState('')
  const [filterAssignee, setFilterAssignee] = useState<'all' | 'me' | 'by_me'>('all')

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)

  const canCreate = permissions.includes('tasks.create')
  const canEdit = permissions.includes('tasks.edit')
  const canDelete = permissions.includes('tasks.delete')

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (filterDept && t.departmentId !== filterDept) return false
      if (filterAssignee === 'me' && t.assigneeId !== currentProfileId) return false
      if (filterAssignee === 'by_me' && t.createdById !== currentProfileId) return false
      return true
    })
  }, [tasks, filterDept, filterAssignee, currentProfileId])

  async function refresh() {
    const res = await fetch('/api/tasks', { cache: 'no-store' })
    const json = (await res.json().catch(() => null)) as { success?: boolean; data?: Task[] } | null
    if (res.ok && json?.success) setTasks(json.data ?? [])
  }

  async function updateTask(id: string, patch: Partial<Task>) {
    setTasks((prev) => prev.map((t) => (t.id === id ? ({ ...t, ...patch } as Task) : t)))
    await fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(patch) })
    await refresh()
  }

  async function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    await refresh()
  }

  return (
    <div className="space-y-4">
      {showForm ? (
        <TaskForm
          task={editing}
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
        <div className="flex flex-wrap items-center gap-2">
          <select className="h-10 rounded-md border border-[#d0d7de] bg-white px-3 text-sm" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select className="h-10 rounded-md border border-[#d0d7de] bg-white px-3 text-sm" value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value as any)}>
            <option value="all">All Tasks</option>
            <option value="me">Assigned to Me</option>
            <option value="by_me">Created by Me</option>
          </select>
        </div>
        {canCreate ? (
          <button className="h-10 rounded-md border border-[#1f2328] bg-[#1f2328] px-4 text-sm font-semibold text-white" type="button" onClick={() => { setEditing(null); setShowForm(true) }}>
            + Add Task
          </button>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {statusColumns.map((col) => (
          <div
            key={col.id}
            className={`min-h-[28rem] rounded-lg border border-[#d0d7de] ${col.bg} p-3`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={async (e) => {
              e.preventDefault()
              const taskId = e.dataTransfer.getData('text/plain')
              const t = tasks.find((x) => x.id === taskId)
              if (!t || t.status === col.id) return
              if (!canEdit) return
              await updateTask(taskId, { status: col.id } as any)
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold">{col.label}</div>
              <div className="text-xs text-[#656d76]">({filtered.filter((t) => t.status === col.id).length})</div>
            </div>

            <div className="space-y-2">
              {filtered
                .filter((t) => t.status === col.id)
                .map((t) => (
                  <div
                    key={t.id}
                    draggable={canEdit}
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', t.id)}
                    className="rounded-lg border border-[#d0d7de] bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{t.title}</div>
                        {t.description ? <div className="mt-1 line-clamp-2 text-xs text-[#656d76]">{t.description}</div> : null}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        {canEdit ? (
                          <button className="rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-2 py-1 text-xs font-semibold" type="button" onClick={() => { setEditing(t); setShowForm(true) }}>
                            Edit
                          </button>
                        ) : null}
                        {canDelete ? (
                          <button className="rounded-md border border-[#d0d7de] bg-[#ffebe9] px-2 py-1 text-xs font-semibold text-[#cf222e]" type="button" onClick={() => deleteTask(t.id)}>
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-2 py-0.5 font-semibold">{t.priority}</span>
                      {t.department?.name ? <span className="rounded-md border border-[#d0d7de] bg-white px-2 py-0.5">{t.department.name}</span> : null}
                      {t.assignee ? (
                        <span className="rounded-md border border-[#0969da33] bg-[#ddf4ff] px-2 py-0.5 text-[#0969da]">
                          {(t.assignee.firstName || t.assignee.email) + (t.assignee.lastName ? ` ${t.assignee.lastName}` : '')}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TaskForm({
  task,
  departments,
  profiles,
  onClose,
  onSaved,
}: {
  task: Task | null
  departments: Department[]
  profiles: Profile[]
  onClose: () => void
  onSaved: () => void
}) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [departmentId, setDepartmentId] = useState(task?.departmentId ?? '')
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId ?? '')
  const [priority, setPriority] = useState<Task['priority']>(task?.priority ?? 'MEDIUM')
  const [status, setStatus] = useState<Task['status']>(task?.status ?? 'TODO')
  const [dueDate, setDueDate] = useState(task?.dueDate?.slice(0, 10) ?? '')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  return (
    <div className="rounded-lg border border-[#d0d7de] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">{task ? 'Edit Task' : 'New Task'}</div>
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
          const body = { title, description: description || undefined, departmentId: departmentId || undefined, assigneeId: assigneeId || undefined, priority, status, dueDate: dueDate || undefined }
          const res = await fetch(task ? `/api/tasks/${task.id}` : '/api/tasks', {
            method: task ? 'PATCH' : 'POST',
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
        <label className="block text-sm font-medium md:col-span-2">
          Title
          <input className="mt-2 h-10 w-full rounded-md border border-[#d0d7de] px-3 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label className="block text-sm font-medium md:col-span-2">
          Description
          <textarea className="mt-2 min-h-24 w-full rounded-md border border-[#d0d7de] px-3 py-2 text-sm" value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
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
          Assignee
          <select className="mt-2 h-10 w-full rounded-md border border-[#d0d7de] bg-white px-3 text-sm" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
            <option value="">—</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {(p.firstName || p.email) + (p.lastName ? ` ${p.lastName}` : '')}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Priority
          <select className="mt-2 h-10 w-full rounded-md border border-[#d0d7de] bg-white px-3 text-sm" value={priority} onChange={(e) => setPriority(e.target.value as any)}>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="URGENT">URGENT</option>
          </select>
        </label>
        <label className="block text-sm font-medium">
          Status
          <select className="mt-2 h-10 w-full rounded-md border border-[#d0d7de] bg-white px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value as any)}>
            <option value="TODO">TODO</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="REVIEW">REVIEW</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
        </label>
        <label className="block text-sm font-medium">
          Due date
          <input className="mt-2 h-10 w-full rounded-md border border-[#d0d7de] px-3 text-sm" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </label>

        {error ? <div className="md:col-span-2 rounded-md border border-[#ff818266] bg-[#ffebe9] px-3 py-2 text-sm text-[#cf222e]">{error}</div> : null}
        <button className="md:col-span-2 h-10 w-full rounded-md border border-[#1f2328] bg-[#1f2328] px-4 text-sm font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">
          {pending ? '...' : 'Save'}
        </button>
      </form>
    </div>
  )
}

