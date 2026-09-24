import { getServerSession } from '@/server/auth/server-session'
import { prisma } from '@/server/db'
import { DepartmentsContainer } from '@/components/dashboard/departments-container'

export default async function DepartmentsPage() {
  const session = await getServerSession()
  if (!session?.permissions.includes('departments.view' as any)) {
    return (
      <main className="rounded-lg border border-[#d0d7de] bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Departments</h1>
        <p className="mt-2 text-sm text-[#656d76]">ليس لديك صلاحية.</p>
      </main>
    )
  }
  const teamId = session?.profile?.teamId ?? null

  if (!teamId) {
    return (
      <main className="rounded-lg border border-[#d0d7de] bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Departments</h1>
        <p className="mt-2 text-sm text-[#656d76]">لا يوجد فريق مرتبط.</p>
      </main>
    )
  }

  const [departments, profiles] = await Promise.all([
    prisma.workforceDepartment.findMany({ where: { teamId }, include: { manager: true }, orderBy: [{ createdAt: 'desc' }] }),
    prisma.workforceProfile.findMany({ where: { teamId }, select: { id: true, firstName: true, lastName: true, email: true }, orderBy: [{ createdAt: 'desc' }] }),
  ])

  return (
    <main className="space-y-4">
      <div className="rounded-lg border border-[#d0d7de] bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold">Departments</h1>
        <p className="mt-2 text-sm text-[#656d76]">إدارة الأقسام.</p>
      </div>
      <DepartmentsContainer initialDepartments={departments as any} profiles={profiles as any} permissions={session.permissions as any} />
    </main>
  )
}

