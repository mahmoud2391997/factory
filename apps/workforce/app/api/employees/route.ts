import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/server/db'

export const runtime = 'nodejs'

const createSchema = z.object({
  code: z.string().trim().min(1).optional(),
  nameAr: z.string().trim().min(1),
  department: z.string().trim().min(1),
  jobTitle: z.string().trim().min(1),
  active: z.boolean().optional(),
})

export async function GET() {
  const employees = await prisma.workforceEmployee.findMany({
    orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
  })
  return NextResponse.json({ success: true, data: employees })
}

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'بيانات غير صحيحة', errors: parsed.error.issues }, { status: 400 })
  }

  const count = await prisma.workforceEmployee.count()
  const code = parsed.data.code ?? `EMP-${String(count + 1).padStart(4, '0')}`

  const created = await prisma.workforceEmployee.create({
    data: {
      code,
      nameAr: parsed.data.nameAr,
      department: parsed.data.department,
      jobTitle: parsed.data.jobTitle,
      active: parsed.data.active ?? true,
    },
  })

  return NextResponse.json({ success: true, data: created })
}

