import { getServerSession } from '@/server/auth/server-session'
import { prisma } from '@/server/db'
import { TasksContainer } from '@/components/dashboard/tasks-container'

export default async function TasksPage() {
  const session = await getServerSession()
  if (!session?.permissions.includes('tasks.view' as any)) {
    return (
      <main className="rounded-lg border border-[#d0d7de] bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Tasks</h1>
        <p className="mt-2 text-sm text-[#656d76]">ليس لديك صلاحية.</p>
      </main>
    )
  }
  const teamId = session?.profile?.teamId ?? null

  if (!teamId) {
    return (
      <main className="rounded-lg border border-[#d0d7de] bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Tasks</h1>
        <p className="mt-2 text-sm text-[#656d76]">لا يوجد فريق مرتبط.</p>
      </main>
    )
  }

  const [tasks, departments, profiles] = await Promise.all([
    prisma.workforceTask.findMany({
      where: { teamId },
      include: { department: true, assignee: true, creator: true },
      orderBy: [{ createdAt: 'desc' }],
    }),
    prisma.workforceDepartment.findMany({ where: { teamId }, select: { id: true, name: true }, orderBy: [{ createdAt: 'desc' }] }),
    prisma.workforceProfile.findMany({ where: { teamId }, select: { id: true, firstName: true, lastName: true, email: true }, orderBy: [{ createdAt: 'desc' }] }),
  ])

  return (
    <main className="space-y-4">
      <div className="rounded-lg border border-[#d0d7de] bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold">Tasks</h1>
        <p className="mt-2 text-sm text-[#656d76]">Kanban board مع صلاحيات.</p>
      </div>
      <TasksContainer
        initialTasks={tasks as any}
        departments={departments as any}
        profiles={profiles as any}
        currentProfileId={session.profile?.id ?? ''}
        permissions={session.permissions as any}
      />
    </main>
  )
}

