import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/server/db'

export const runtime = 'nodejs'

const addSchema = z.object({
  employeeId: z.string().min(1),
  role: z.string().trim().min(1).optional(),
})

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: teamId } = await ctx.params
  const json = await req.json().catch(() => null)
  const parsed = addSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'بيانات غير صحيحة', errors: parsed.error.issues }, { status: 400 })
  }

  const member = await prisma.workforceTeamMember.upsert({
    where: { teamId_employeeId: { teamId, employeeId: parsed.data.employeeId } },
    update: { role: parsed.data.role ?? 'MEMBER' },
    create: { teamId, employeeId: parsed.data.employeeId, role: parsed.data.role ?? 'MEMBER' },
  })
  return NextResponse.json({ success: true, data: member })
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: teamId } = await ctx.params
  const employeeId = req.nextUrl.searchParams.get('employeeId')?.trim()
  if (!employeeId) return NextResponse.json({ success: false, message: 'employeeId مطلوب' }, { status: 400 })
  await prisma.workforceTeamMember.delete({
    where: { teamId_employeeId: { teamId, employeeId } },
  })
  return NextResponse.json({ success: true })
}

