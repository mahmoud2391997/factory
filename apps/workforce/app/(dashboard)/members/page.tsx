import { getServerSession } from '@/server/auth/server-session'
import { prisma } from '@/server/db'
import { MembersContainer } from '@/components/dashboard/members-container'

export default async function MembersPage() {
  const session = await getServerSession()
  if (!session?.permissions.includes('members.view' as any)) {
    return (
      <main className="rounded-lg border border-[#d0d7de] bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Members</h1>
        <p className="mt-2 text-sm text-[#656d76]">ليس لديك صلاحية.</p>
      </main>
    )
  }
  const teamId = session?.profile?.teamId ?? null

  if (!teamId) {
    return (
      <main className="rounded-lg border border-[#d0d7de] bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Members</h1>
        <p className="mt-2 text-sm text-[#656d76]">لا يوجد فريق مرتبط.</p>
      </main>
    )
  }

  const [members, invitations, roles] = await Promise.all([
    prisma.workforceTeamMember.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: { select: { id: true, email: true, firstName: true, lastName: true, role: true, teamId: true } },
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    }),
    prisma.workforceInvitation.findMany({
      where: { teamId, acceptedAt: null },
      include: { invitedBy: { select: { id: true, email: true, firstName: true, lastName: true } } },
      orderBy: [{ createdAt: 'desc' }],
    }),
    prisma.workforceCustomRole.findMany({ where: { teamId }, select: { name: true, label: true }, orderBy: [{ createdAt: 'asc' }] }),
  ])

  return (
    <main className="space-y-4">
      <div className="rounded-lg border border-[#d0d7de] bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold">Members</h1>
        <p className="mt-2 text-sm text-[#656d76]">Team members and invitations.</p>
      </div>
      <MembersContainer
        initialMembers={members as any}
        initialInvitations={invitations as any}
        roles={roles as any}
        permissions={session.permissions as any}
      />
    </main>
  )
}

