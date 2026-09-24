import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'

import { prisma } from '@/server/db'
import { requirePermission } from '@/server/auth/require-permission'

export const runtime = 'nodejs'

const bodySchema = z.object({
  email: z.string().email(),
  role: z.string().trim().min(1).optional(),
})

function originFor(req: NextRequest) {
  const configured = process.env.SITE_URL?.trim()
  if (configured) return configured.replace(/\/+$/g, '')
  return req.nextUrl.origin
}

async function generateUniqueToken() {
  // Extremely low collision probability, but we still guard by retrying on unique constraint.
  return crypto.randomBytes(24).toString('hex')
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, 'members.invite')
  if (!auth.ok) return NextResponse.json({ success: false, message: auth.message }, { status: auth.status })
  const teamId = auth.user.profile!.teamId!
  const invitedById = auth.user.profile!.id

  const json = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ success: false, message: 'بيانات غير صحيحة' }, { status: 400 })

  const email = parsed.data.email.toLowerCase().trim()
  const role = parsed.data.role?.trim() || 'EMPLOYEE'

  const existingUser = await prisma.workforceUser.findUnique({ where: { email }, select: { id: true } })
  if (existingUser) {
    const existingMember = await prisma.workforceTeamMember.findUnique({
      where: { userId_teamId: { userId: existingUser.id, teamId } },
      select: { id: true, isActive: true },
    })
    if (existingMember?.isActive) {
      return NextResponse.json({ success: false, message: 'هذا المستخدم عضو بالفعل' }, { status: 409 })
    }
  }

  const pending = await prisma.workforceInvitation.findFirst({
    where: { teamId, email, acceptedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    select: { id: true },
  })
  if (pending) return NextResponse.json({ success: false, message: 'تم إرسال دعوة مسبقاً لهذا البريد' }, { status: 409 })

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const origin = originFor(req)

  for (let attempt = 0; attempt < 3; attempt++) {
    const token = await generateUniqueToken()
    try {
      const created = await prisma.workforceInvitation.create({
        data: { teamId, email, role, token, expiresAt, invitedById },
        include: { invitedBy: { select: { id: true, email: true, firstName: true, lastName: true } } },
      })
      return NextResponse.json({
        success: true,
        data: {
          invitation: created,
          inviteUrl: `${origin}/invite/${created.token}`,
        },
      })
    } catch (e: any) {
      // Retry on unique token constraint.
      const msg = String(e?.message ?? '')
      if (msg.includes('WorkforceInvitation_token_key') || msg.toLowerCase().includes('unique constraint')) continue
      throw e
    }
  }

  return NextResponse.json({ success: false, message: 'تعذر إنشاء الدعوة، حاول مرة أخرى' }, { status: 500 })
}

