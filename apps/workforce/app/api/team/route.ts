import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/server/db'
import { getSessionUser } from '@/server/auth/session'
import { DEFAULT_ROLES } from '@/lib/permissions'

export const runtime = 'nodejs'

const bodySchema = z.object({
  name: z.string().trim().min(2),
})

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user?.profile) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })
  if (user.profile.teamId) return NextResponse.json({ success: false, message: 'الحساب مرتبط بفريق بالفعل' }, { status: 409 })

  const json = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ success: false, message: 'بيانات غير صحيحة' }, { status: 400 })

  const created = await prisma.$transaction(async (tx) => {
    const team = await tx.workforceTeam.create({
      data: { name: parsed.data.name, ownerId: user.id },
      select: { id: true },
    })

    await tx.workforceProfile.update({
      where: { id: user.profile!.id },
      data: { teamId: team.id, role: 'ADMIN' },
    })

    await tx.workforceTeamMember.create({
      data: { userId: user.id, teamId: team.id, role: 'ADMIN', isActive: true },
    })

    await tx.workforceCustomRole.createMany({
      data: Object.entries(DEFAULT_ROLES).map(([name, def]) => ({
        teamId: team.id,
        name,
        label: def.label,
        permissions: def.permissions as unknown as any,
      })),
      skipDuplicates: true,
    })

    return team
  })

  return NextResponse.json({ success: true, data: created })
}

