import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/server/db'
import { requirePermission } from '@/server/auth/require-permission'
import { ALL_PERMISSIONS } from '@/lib/permissions'

export const runtime = 'nodejs'

const RESERVED = new Set(['ADMIN', 'MANAGER', 'EMPLOYEE'])

const patchSchema = z.object({
  label: z.string().trim().min(2).optional(),
  permissions: z.array(z.string()).optional(),
})

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, 'roles.manage')
  if (!auth.ok) return NextResponse.json({ success: false, message: auth.message }, { status: auth.status })
  const teamId = auth.user.profile!.teamId!

  const { id } = await ctx.params
  const json = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ success: false, message: 'بيانات غير صحيحة' }, { status: 400 })

  const existing = await prisma.workforceCustomRole.findFirst({ where: { id, teamId }, select: { id: true, name: true } })
  if (!existing) return NextResponse.json({ success: false, message: 'غير موجود' }, { status: 404 })
  if (RESERVED.has(existing.name)) return NextResponse.json({ success: false, message: 'لا يمكن تعديل هذا الدور' }, { status: 400 })

  const allowed = new Set(ALL_PERMISSIONS as readonly string[])
  const permissions = parsed.data.permissions ? parsed.data.permissions.filter((p) => allowed.has(p)) : undefined

  const updated = await prisma.workforceCustomRole.update({
    where: { id },
    data: {
      label: parsed.data.label,
      permissions: permissions ? (permissions as any) : undefined,
    },
  })
  return NextResponse.json({ success: true, data: updated })
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, 'roles.manage')
  if (!auth.ok) return NextResponse.json({ success: false, message: auth.message }, { status: auth.status })
  const teamId = auth.user.profile!.teamId!

  const { id } = await ctx.params
  const existing = await prisma.workforceCustomRole.findFirst({ where: { id, teamId }, select: { id: true, name: true } })
  if (!existing) return NextResponse.json({ success: false, message: 'غير موجود' }, { status: 404 })
  if (RESERVED.has(existing.name)) return NextResponse.json({ success: false, message: 'لا يمكن حذف هذا الدور' }, { status: 400 })

  await prisma.workforceCustomRole.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

