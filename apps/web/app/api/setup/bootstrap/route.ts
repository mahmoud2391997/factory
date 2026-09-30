import { timingSafeEqual } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

import { emptyState } from '@/lib/erp/domain/seed'
import {
  COLLECTIONS,
  getDb,
  getMongoClient,
  type ErpDocumentRow,
  type WarehouseLocationRow,
  type WarehouseRow,
} from '@/server/db'

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

  const db = await getDb()
  const systemInit = db.collection<{ _id: string; createdAt: Date }>(COLLECTIONS.systemInit)
  const existingMarker = await systemInit.findOne({ _id: 'primary' })
  if (existingMarker) {
    return NextResponse.json({ success: false, message: 'تمت تهيئة النظام مسبقًا' }, { status: 410 })
  }

  const email = parsed.data.email.toLowerCase().trim()
  const passwordHash = await bcrypt.hash(parsed.data.password, 12)

  const warehousesCol = db.collection<WarehouseRow>(COLLECTIONS.warehouses)
  const locationsCol = db.collection<WarehouseLocationRow>(COLLECTIONS.warehouseLocations)
  await Promise.all([
    warehousesCol.createIndex({ key: 1 }, { unique: true }),
    locationsCol.createIndex({ warehouseId: 1, code: 1 }, { unique: true }),
  ])

  const client = await getMongoClient()
  const session = client.startSession()
  try {
    const result = await session.withTransaction(async () => {
      const now = new Date()
      await systemInit.insertOne({ _id: 'primary', createdAt: now }, { session })

      const settingsId = randomUUID()
      await db.collection<{ _id: string } & Record<string, unknown>>(COLLECTIONS.companySettings).insertOne(
        {
          _id: settingsId,
          currencyCode: 'OMR',
          productionVarianceThresholdPct: '2.50',
          taxRatePct: '5.00',
          taxInclusivePricing: false,
          createdAt: now,
          updatedAt: now,
        },
        { session },
      )

      const seeds = [
        { key: 'WH_RAW', nameAr: 'مستودع المواد الخام', code: 'A1' },
        { key: 'WH_MFG', nameAr: 'مستودع التصنيع', code: 'M1' },
        { key: 'WH_FG', nameAr: 'مستودع المنتجات النهائية', code: 'F1' },
      ]
      const warehouses: Array<{ key: string; nameAr: string }> = []
      for (const seed of seeds) {
        const warehouse = await warehousesCol.findOneAndUpdate(
          { key: seed.key },
          {
            $set: { isActive: true, nameAr: seed.nameAr, updatedAt: now },
            $setOnInsert: { _id: randomUUID(), key: seed.key, createdAt: now },
          },
          { upsert: true, returnDocument: 'after', session },
        )
        if (!warehouse) throw new Error(`Failed to seed warehouse ${seed.key}`)
        await locationsCol.updateOne(
          { warehouseId: warehouse._id, code: seed.code },
          {
            $set: { isActive: true, nameAr: `منطقة ${seed.code}`, updatedAt: now },
            $setOnInsert: { _id: randomUUID(), warehouseId: warehouse._id, code: seed.code, createdAt: now },
          },
          { upsert: true, session },
        )
        warehouses.push({ key: warehouse.key, nameAr: warehouse.nameAr })
      }

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

      await db.collection<ErpDocumentRow>(COLLECTIONS.erpDocuments).insertOne(
        {
          _id: DOC_ID,
          version: state.revision,
          payload: JSON.parse(JSON.stringify(state)) as unknown,
          updatedAt: now,
        },
        { session },
      )

      return {
        settingsId,
        user: { email, fullName: parsed.data.fullName.trim() },
        warehouses,
      }
    })

    return NextResponse.json({ success: true, data: result, message: 'تمت تهيئة النظام بنجاح. سجّل الدخول ثم غيّر كلمة المرور.' })
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: unknown }).code === 11000) {
      return NextResponse.json({ success: false, message: 'تمت تهيئة النظام مسبقًا' }, { status: 410 })
    }
    throw error
  } finally {
    await session.endSession()
  }
}
