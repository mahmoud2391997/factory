import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/server/db'

export const runtime = 'nodejs'

const createSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1).optional(),
  dueDate: z.string().trim().min(1).optional(), // ISO date or datetime
  priority: z.number().int().min(1).max(5).optional(),
  teamId: z.string().trim().min(1).optional(),
  assigneeEmployeeId: z.string().trim().min(1).optional(),
})

export async function GET() {
  const tasks = await prisma.workforceTask.findMany({
    include: {
      team: true,
      assignee: true,
    },
    orderBy: [{ createdAt: 'desc' }],
  })
  return NextResponse.json({ success: true, data: tasks })
}

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'بيانات غير صحيحة', errors: parsed.error.issues }, { status: 400 })
  }

  const dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null
  if (dueDate && Number.isNaN(dueDate.valueOf())) {
    return NextResponse.json({ success: false, message: 'dueDate غير صحيح' }, { status: 400 })
  }

  const created = await prisma.workforceTask.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      dueDate: dueDate ?? undefined,
      priority: parsed.data.priority ?? 2,
      teamId: parsed.data.teamId,
      assigneeEmployeeId: parsed.data.assigneeEmployeeId,
    },
    include: { team: true, assignee: true },
  })
  return NextResponse.json({ success: true, data: created })
}

