import { NextResponse, type NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

import { prisma } from '@/server/db'
import { issueAccessToken, setAuthCookie } from '@/server/auth/jwt'

export const runtime = 'nodejs'

const bodySchema = z.object({
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
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.workforceUser.create({
      data: { email, passwordHash },
      select: { id: true, email: true },
    })
    const profile = await tx.workforceProfile.create({
      data: {
        email: created.email,
        firstName: parsed.data.firstName ?? null,
        lastName: parsed.data.lastName ?? null,
        role: 'EMPLOYEE',
        teamId: null,
      },
      select: { id: true },
    })
    await tx.workforceUser.update({
      where: { id: created.id },
      data: { profileId: profile.id },
    })
    return created
  })

  const token = await issueAccessToken({ sub: user.id, email: user.email })
  const res = NextResponse.json({ success: true })
  setAuthCookie(res, token)
  return res
}

