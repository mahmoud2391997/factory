import { timingSafeEqual } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

import { emptyState } from '@/lib/erp/domain/seed'
import { getDb } from '@/server/db'

export const runtime = 'nodejs'
const DOC_ID = 'main'
const bodySchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  fullName: z.string().min(2, 'الاسم مطلوب'),
})

function assertSetupAllowed(req: NextRequest) {
  const expected = process.env.SETUP_TOKEN
  if (!expected) return { ok: false as const, status: 500, message: 'SETUP_TOKEN غير مضبوط على الخادم' }
  const provided = req.headers.get('x-setup-token') ?? ''
  const expectedBytes = Buffer.from(expected)
  const providedBytes = Buffer.from(provided)
  if (expectedBytes.length !== providedBytes.length || !timingSafeEqual(expectedBytes, providedBytes)) {
    return { ok: false as const, status: 401, message: 'غير مصرح' }
  }
  return { ok: true as const }
}

export async function POST(req: NextRequest) {
  const allowed = assertSetupAllowed(req)
  if (!allowed.ok) return NextResponse.json({ success: false, message: allowed.message }, { status: allowed.status })
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ success: false, message: 'بيانات غير صحيحة' }, { status: 400 })

  const db = await getDb()
  const existing = await db.erpDocument.findUnique({ where: { id: DOC_ID }, select: { id: true } })
  if (existing) return NextResponse.json({ success: false, message: 'تمت تهيئة النظام مسبقًا' }, { status: 410 })

  const email = parsed.data.email.toLowerCase().trim()
  const passwordHash = await bcrypt.hash(parsed.data.password, 12)
  const state = emptyState(passwordHash)
  state.users = [{ id: 'user-admin', email, fullName: parsed.data.fullName.trim(), role: 'GM', passwordHash, active: true, mustChangePassword: true, tokenVersion: 1 }]
  state.company.notifyEmail = email
  state.revision = 1
  await db.erpDocument.create({ data: { id: DOC_ID, version: 1, payload: JSON.parse(JSON.stringify(state)) } })
  return NextResponse.json({ success: true, data: { user: { email, fullName: parsed.data.fullName.trim() } }, message: 'تمت تهيئة النظام بنجاح. سجّل الدخول ثم غيّر كلمة المرور.' })
}
