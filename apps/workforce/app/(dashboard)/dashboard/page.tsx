import { getServerSession } from '@/server/auth/server-session'
import { prisma } from '@/server/db'
import { TaskStatusChart } from '@/components/dashboard/task-status-chart'

export default async function DashboardPage() {
  const session = await getServerSession()
  if (!session?.permissions.includes('dashboard.view' as any)) {
    return (
      <main className="rounded-lg border border-[#d0d7de] bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="mt-2 text-sm text-[#656d76]">ليس لديك صلاحية.</p>
      </main>
    )
  }
  const teamId = session?.profile?.teamId ?? null

  if (!teamId) {
    return (
      <main className="space-y-4">
        <div className="rounded-lg border border-[#d0d7de] bg-white p-5 shadow-sm">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="mt-2 text-sm text-[#656d76]">لا يوجد فريق مرتبط بهذا الحساب.</p>
          <a className="mt-4 inline-flex rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-3 py-2 text-sm font-semibold" href="/create-team">
            Create Team
          </a>
        </div>
      </main>
    )
  }

  const [employees, departments, tasks, completed] = await Promise.all([
    prisma.workforceEmployee.count({ where: { teamId } }),
    prisma.workforceDepartment.count({ where: { teamId } }),
    prisma.workforceTask.count({ where: { teamId } }),
    prisma.workforceTask.count({ where: { teamId, status: 'COMPLETED' } }),
  ])

  const grouped = await prisma.workforceTask.groupBy({
    by: ['status'],
    where: { teamId },
    _count: { status: true },
  })

  const statusRows = ['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'].map((status) => ({
    status,
    count: grouped.find((g) => g.status === status)?._count.status ?? 0,
  }))

  return (
    <main className="space-y-4">
      <div className="rounded-lg border border-[#d0d7de] bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="mt-2 text-sm text-[#656d76]">إحصائيات عامة عن الفريق والمهام.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Stat label="Employees" value={String(employees)} />
        <Stat label="Departments" value={String(departments)} />
        <Stat label="Tasks" value={String(tasks)} />
        <Stat label="Completed" value={String(completed)} />
      </div>

      <div className="rounded-lg border border-[#d0d7de] bg-white p-5 shadow-sm">
        <div className="mb-2 text-sm font-semibold">Task status</div>
        <TaskStatusChart data={statusRows} />
      </div>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#d0d7de] bg-white p-5 shadow-sm">
      <div className="text-sm text-[#656d76]">{label}</div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
    </div>
  )
}

