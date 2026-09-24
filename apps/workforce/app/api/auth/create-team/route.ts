import { NextResponse, type NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

import { prisma } from '@/server/db'
import { issueAccessToken, setAuthCookie } from '@/server/auth/jwt'
import { DEFAULT_ROLES } from '@/lib/permissions'

export const runtime = 'nodejs'

const bodySchema = z.object({
  teamName: z.string().trim().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
})

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'بيانات غير صحيحة', errors: parsed.error.issues }, { status: 400 })
  }

  const email = parsed.data.email.toLowerCase().trim()
  const existing = await prisma.workforceUser.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ success: false, message: 'البريد مستخدم بالفعل' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12)
  const created = await prisma.$transaction(async (tx) => {
    const user = await tx.workforceUser.create({
      data: { email, passwordHash },
      select: { id: true, email: true },
    })

    const team = await tx.workforceTeam.create({
      data: { name: parsed.data.teamName, ownerId: user.id },
      select: { id: true },
    })

    const profile = await tx.workforceProfile.create({
      data: {
        email: user.email,
        firstName: parsed.data.firstName ?? null,
        lastName: parsed.data.lastName ?? null,
        role: 'ADMIN',
        teamId: team.id,
      },
      select: { id: true },
    })

    await tx.workforceUser.update({
      where: { id: user.id },
      data: { profileId: profile.id },
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

    return { user, team }
  })

  const token = await issueAccessToken({ sub: created.user.id, email: created.user.email })
  const res = NextResponse.json({ success: true, data: { teamId: created.team.id } })
  setAuthCookie(res, token)
  return res
}

