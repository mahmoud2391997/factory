import { NextResponse, type NextRequest } from 'next/server'

import { prisma } from '@/server/db'
import { requirePermission } from '@/server/auth/require-permission'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, 'members.view')
  if (!auth.ok) return NextResponse.json({ success: false, message: auth.message }, { status: auth.status })
  const teamId = auth.user.profile!.teamId!

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

  return NextResponse.json({ success: true, data: { members, invitations, roles } })
}

