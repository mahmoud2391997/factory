import { getServerSession } from '@/server/auth/server-session'
import { prisma } from '@/server/db'
import { RolesContainer } from '@/components/dashboard/roles-container'

export default async function RolesPage() {
  const session = await getServerSession()
  if (!session?.permissions.includes('roles.manage' as any)) {
    return (
      <main className="rounded-lg border border-[#d0d7de] bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Roles</h1>
        <p className="mt-2 text-sm text-[#656d76]">ليس لديك صلاحية.</p>
      </main>
    )
  }
  const teamId = session?.profile?.teamId ?? null

  if (!teamId) {
    return (
      <main className="rounded-lg border border-[#d0d7de] bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Roles</h1>
        <p className="mt-2 text-sm text-[#656d76]">لا يوجد فريق مرتبط.</p>
      </main>
    )
  }

  const roles = await prisma.workforceCustomRole.findMany({
    where: { teamId },
    orderBy: [{ createdAt: 'asc' }],
  })

  return (
    <main className="space-y-4">
      <div className="rounded-lg border border-[#d0d7de] bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold">Roles</h1>
        <p className="mt-2 text-sm text-[#656d76]">إدارة الأدوار والصلاحيات.</p>
      </div>
      <RolesContainer initialRoles={roles as any} />
    </main>
  )
}

