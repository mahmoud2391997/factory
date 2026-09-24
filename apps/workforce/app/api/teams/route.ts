import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/server/db'

export const runtime = 'nodejs'

const createSchema = z.object({
  key: z.string().trim().min(1).optional(),
  nameAr: z.string().trim().min(1),
  description: z.string().trim().min(1).optional(),
  isActive: z.boolean().optional(),
})

function slugKey(nameAr: string) {
  const raw = nameAr
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${raw || 'team'}-${suffix}`
}

export async function GET() {
  const teams = await prisma.workforceTeam.findMany({
    include: {
      members: { include: { employee: true } },
    },
    orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
  })
  return NextResponse.json({ success: true, data: teams })
}

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'بيانات غير صحيحة', errors: parsed.error.issues }, { status: 400 })
  }

  const key = parsed.data.key ?? slugKey(parsed.data.nameAr)
  const created = await prisma.workforceTeam.create({
    data: {
      key,
      nameAr: parsed.data.nameAr,
      description: parsed.data.description,
      isActive: parsed.data.isActive ?? true,
    },
  })
  return NextResponse.json({ success: true, data: created })
}

