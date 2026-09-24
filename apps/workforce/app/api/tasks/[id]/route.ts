import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/server/db'

export const runtime = 'nodejs'

const statusEnum = z.enum(['OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED'])

const updateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  status: statusEnum.optional(),
  dueDate: z.string().trim().min(1).optional(),
  priority: z.number().int().min(1).max(5).optional(),
  teamId: z.string().trim().min(1).nullable().optional(),
  assigneeEmployeeId: z.string().trim().min(1).nullable().optional(),
})

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const json = await req.json().catch(() => null)
  const parsed = updateSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'بيانات غير صحيحة', errors: parsed.error.issues }, { status: 400 })
  }

  const dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined
  if (dueDate && Number.isNaN(dueDate.valueOf())) {
    return NextResponse.json({ success: false, message: 'dueDate غير صحيح' }, { status: 400 })
  }

  const updated = await prisma.workforceTask.update({
    where: { id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      status: parsed.data.status,
      dueDate: dueDate ?? undefined,
      priority: parsed.data.priority,
      teamId: parsed.data.teamId === undefined ? undefined : parsed.data.teamId,
      assigneeEmployeeId: parsed.data.assigneeEmployeeId === undefined ? undefined : parsed.data.assigneeEmployeeId,
    },
    include: { team: true, assignee: true },
  })

  return NextResponse.json({ success: true, data: updated })
}

