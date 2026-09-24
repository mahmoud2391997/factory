import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/server/db'
import { requirePermission } from '@/server/auth/require-permission'
import { ALL_PERMISSIONS } from '@/lib/permissions'

export const runtime = 'nodejs'

const RESERVED = new Set(['ADMIN', 'MANAGER', 'EMPLOYEE'])

const createSchema = z.object({
  name: z.string().trim().min(2),
  label: z.string().trim().min(2),
  permissions: z.array(z.string()).optional(),
})

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, 'roles.manage')
  if (!auth.ok) return NextResponse.json({ success: false, message: auth.message }, { status: auth.status })
  const teamId = auth.user.profile!.teamId!

  const roles = await prisma.workforceCustomRole.findMany({
    where: { teamId },
    orderBy: [{ createdAt: 'asc' }],
  })
  return NextResponse.json({ success: true, data: roles })
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, 'roles.manage')
  if (!auth.ok) return NextResponse.json({ success: false, message: auth.message }, { status: auth.status })
  const teamId = auth.user.profile!.teamId!

  const json = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ success: false, message: 'بيانات غير صحيحة' }, { status: 400 })

  const name = parsed.data.name.toUpperCase().replace(/\s+/g, '_')
  if (RESERVED.has(name)) return NextResponse.json({ success: false, message: 'لا يمكن استخدام هذا الاسم' }, { status: 400 })

  const allowed = new Set(ALL_PERMISSIONS as readonly string[])
  const permissions = (parsed.data.permissions ?? []).filter((p) => allowed.has(p))

  try {
    const created = await prisma.workforceCustomRole.create({
      data: { teamId, name, label: parsed.data.label, permissions: permissions as any },
    })
    return NextResponse.json({ success: true, data: created })
  } catch {
    return NextResponse.json({ success: false, message: 'تعذر إنشاء الدور (قد يكون الاسم مستخدم)' }, { status: 409 })
  }
}

