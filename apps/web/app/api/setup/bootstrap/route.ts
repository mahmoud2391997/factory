import { timingSafeEqual } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import type { Prisma } from '@prisma/client'
import { z } from 'zod'

import { emptyState } from '@/lib/erp/domain/seed'
import { prisma } from '@/server/db'

export const runtime = 'nodejs'

const DOC_ID = 'main'

const bodySchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  fullName: z.string().min(2, 'الاسم مطلوب'),
})

function assertSetupAllowed(req: NextRequest) {
  const expected = process.env.SETUP_TOKEN
  if (!expected) {
    return { ok: false as const, status: 500, message: 'SETUP_TOKEN غير مضبوط على الخادم' }
  }

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

  const json = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: 'بيانات غير صحيحة',
        errors: parsed.error.issues.map((i) => ({ path: String(i.path[0] ?? ''), message: i.message })),
      },
      { status: 400 },
    )
  }

  const existingMarker = await prisma.systemInit.findUnique({ where: { id: 'primary' } })
  if (existingMarker) {
    return NextResponse.json({ success: false, message: 'تمت تهيئة النظام مسبقًا' }, { status: 410 })
  }

  const email = parsed.data.email.toLowerCase().trim()
  const passwordHash = await bcrypt.hash(parsed.data.password, 12)

  const result = await prisma.$transaction(async (tx) => {
    await tx.systemInit.create({ data: { id: 'primary' } })

    const settings = await tx.companySettings.create({
      data: {
        currencyCode: 'OMR',
        productionVarianceThresholdPct: '2.50',
        taxRatePct: '5.00',
        taxInclusivePricing: false,
      },
      select: { id: true },
    })

    const whRaw = await tx.warehouse.upsert({
      where: { key: 'WH_RAW' },
      update: { isActive: true, nameAr: 'مستودع المواد الخام' },
      create: { key: 'WH_RAW', nameAr: 'مستودع المواد الخام' },
      select: { id: true, key: true, nameAr: true },
    })
    const whMfg = await tx.warehouse.upsert({
      where: { key: 'WH_MFG' },
      update: { isActive: true, nameAr: 'مستودع التصنيع' },
      create: { key: 'WH_MFG', nameAr: 'مستودع التصنيع' },
      select: { id: true, key: true, nameAr: true },
    })
    const whFg = await tx.warehouse.upsert({
      where: { key: 'WH_FG' },
      update: { isActive: true, nameAr: 'مستودع المنتجات النهائية' },
      create: { key: 'WH_FG', nameAr: 'مستودع المنتجات النهائية' },
      select: { id: true, key: true, nameAr: true },
    })

    await tx.warehouseLocation.upsert({
      where: { warehouseId_code: { warehouseId: whRaw.id, code: 'A1' } },
      update: { isActive: true, nameAr: 'منطقة A1' },
      create: { warehouseId: whRaw.id, code: 'A1', nameAr: 'منطقة A1' },
      select: { id: true },
    })
    await tx.warehouseLocation.upsert({
      where: { warehouseId_code: { warehouseId: whMfg.id, code: 'M1' } },
      update: { isActive: true, nameAr: 'منطقة M1' },
      create: { warehouseId: whMfg.id, code: 'M1', nameAr: 'منطقة M1' },
      select: { id: true },
    })
    await tx.warehouseLocation.upsert({
      where: { warehouseId_code: { warehouseId: whFg.id, code: 'F1' } },
      update: { isActive: true, nameAr: 'منطقة F1' },
      create: { warehouseId: whFg.id, code: 'F1', nameAr: 'منطقة F1' },
      select: { id: true },
    })

    const state = emptyState(passwordHash)
    state.users = [
      {
        id: 'user-admin',
        email,
        fullName: parsed.data.fullName.trim(),
        role: 'GM',
        passwordHash,
        active: true,
        mustChangePassword: true,
        tokenVersion: 1,
      },
    ]
    state.company.notifyEmail = email
    state.revision = 1

    await tx.erpDocument.create({
      data: { id: DOC_ID, version: state.revision, payload: state as unknown as Prisma.InputJsonValue },
      select: { id: true },
    })

    return {
      settingsId: settings.id,
      user: { email, fullName: parsed.data.fullName.trim() },
      warehouses: [whRaw, whMfg, whFg].map((w) => ({ key: w.key, nameAr: w.nameAr })),
    }
  })

  return NextResponse.json({ success: true, data: result, message: 'تمت تهيئة النظام بنجاح. سجّل الدخول ثم غيّر كلمة المرور.' })
}
