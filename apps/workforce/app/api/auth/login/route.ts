import { NextResponse, type NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

export const runtime = 'nodejs'

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'بيانات غير صحيحة' }, { status: 400 })
  }

  const { prisma } = await import('@/server/db')
  const { issueAccessToken, setAuthCookie } = await import('@/server/auth/jwt')

  const email = parsed.data.email.toLowerCase().trim()
  const user = await prisma.workforceUser.findUnique({ where: { email } })
  if (!user) return NextResponse.json({ success: false, message: 'بيانات الدخول غير صحيحة' }, { status: 401 })

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash)
  if (!ok) return NextResponse.json({ success: false, message: 'بيانات الدخول غير صحيحة' }, { status: 401 })

  const token = await issueAccessToken({ sub: user.id, email: user.email })
  const res = NextResponse.json({ success: true })
  setAuthCookie(res, token)
  return res
}

