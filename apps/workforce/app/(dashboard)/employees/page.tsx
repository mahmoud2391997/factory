import { getServerSession } from '@/server/auth/server-session'
import { prisma } from '@/server/db'
import { EmployeesContainer } from '@/components/dashboard/employees-container'

export default async function EmployeesPage() {
  const session = await getServerSession()
  if (!session?.permissions.includes('employees.view' as any)) {
    return (
      <main className="rounded-lg border border-[#d0d7de] bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Employees</h1>
        <p className="mt-2 text-sm text-[#656d76]">ليس لديك صلاحية.</p>
      </main>
    )
  }
  const teamId = session?.profile?.teamId ?? null

  if (!teamId) {
    return (
      <main className="rounded-lg border border-[#d0d7de] bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Employees</h1>
        <p className="mt-2 text-sm text-[#656d76]">لا يوجد فريق مرتبط.</p>
      </main>
    )
  }

  const [employees, departments, profiles] = await Promise.all([
    prisma.workforceEmployee.findMany({
      where: { teamId },
      include: { profile: true, department: true, manager: true },
      orderBy: [{ createdAt: 'desc' }],
    }),
    prisma.workforceDepartment.findMany({ where: { teamId }, select: { id: true, name: true }, orderBy: [{ createdAt: 'desc' }] }),
    prisma.workforceProfile.findMany({ where: { teamId }, select: { id: true, firstName: true, lastName: true, email: true }, orderBy: [{ createdAt: 'desc' }] }),
  ])

  return (
    <main className="space-y-4">
      <div className="rounded-lg border border-[#d0d7de] bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold">Employees</h1>
        <p className="mt-2 text-sm text-[#656d76]">Employees directory مع صلاحيات.</p>
      </div>
      <EmployeesContainer
        initialEmployees={employees as any}
        departments={departments as any}
        profiles={profiles as any}
        permissions={session.permissions as any}
      />
    </main>
  )
}

