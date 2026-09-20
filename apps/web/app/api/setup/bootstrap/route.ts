import { NextResponse, type NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

import { prisma } from '@/server/db'

export const runtime = 'nodejs'

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
  if (provided !== expected) {
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
      { success: false, message: 'بيانات غير صحيحة', errors: parsed.error.issues.map((i) => ({ path: String(i.path[0] ?? ''), message: i.message })) },
      { status: 400 },
    )
  }

  const existingUsers = await prisma.user.count()
  if (existingUsers > 0) {
    return NextResponse.json({ success: false, message: 'تمت تهيئة النظام مسبقًا' }, { status: 409 })
  }

  const email = parsed.data.email.toLowerCase().trim()
  const passwordHash = await bcrypt.hash(parsed.data.password, 12)

  const result = await prisma.$transaction(async (tx) => {
    const settings = await tx.companySettings.create({
      data: {
        currencyCode: 'OMR',
        productionVarianceThresholdPct: '2.50',
        taxRatePct: '0.00',
        taxInclusivePricing: false,
      },
    })

    // Minimal permissions for foundation (will expand later).
    const permissionKeys = [
      { key: 'users.manage', nameAr: 'إدارة المستخدمين' },
      { key: 'roles.manage', nameAr: 'إدارة الأدوار والصلاحيات' },
      { key: 'settings.update', nameAr: 'تعديل الإعدادات' },
      { key: 'inventory.read', nameAr: 'عرض المخزون' },
      { key: 'inventory.adjust', nameAr: 'تعديل المخزون' },
      { key: 'production.complete', nameAr: 'إكمال أوامر الإنتاج' },
      { key: 'sales.confirm', nameAr: 'تأكيد المبيعات' },
      { key: 'reports.read', nameAr: 'عرض التقارير' },
    ]

    const permissions = await Promise.all(
      permissionKeys.map((p) =>
        tx.permission.create({
          data: { key: p.key, nameAr: p.nameAr },
        }),
      ),
    )

    const roles = await Promise.all([
      tx.role.create({ data: { key: 'SUPER_ADMIN', nameAr: 'مدير النظام (Super Admin)' } }),
      tx.role.create({ data: { key: 'MANAGEMENT', nameAr: 'الإدارة' } }),
      tx.role.create({ data: { key: 'WAREHOUSE', nameAr: 'موظف مستودع' } }),
      tx.role.create({ data: { key: 'PRODUCTION', nameAr: 'موظف إنتاج' } }),
      tx.role.create({ data: { key: 'ACCOUNTANT', nameAr: 'محاسب' } }),
      tx.role.create({ data: { key: 'HR', nameAr: 'الموارد البشرية' } }),
      tx.role.create({ data: { key: 'SALES', nameAr: 'مبيعات' } }),
    ])

    const superAdminRole = roles.find((r) => r.key === 'SUPER_ADMIN')
    if (!superAdminRole) throw new Error('SUPER_ADMIN role missing')

    // Attach all current permissions to Super Admin role.
    await Promise.all(
      permissions.map((perm) =>
        tx.rolePermission.create({
          data: { roleId: superAdminRole.id, permissionId: perm.id },
        }),
      ),
    )

    // Seed required warehouses.
    const whRaw = await tx.warehouse.create({ data: { key: 'WH_RAW', nameAr: 'مستودع المواد الخام' } })
    const whMfg = await tx.warehouse.create({ data: { key: 'WH_MFG', nameAr: 'مستودع التصنيع' } })
    const whFg = await tx.warehouse.create({ data: { key: 'WH_FG', nameAr: 'مستودع المنتجات النهائية' } })

    await Promise.all([
      tx.warehouseLocation.create({ data: { warehouseId: whRaw.id, code: 'A1', nameAr: 'منطقة A1' } }),
      tx.warehouseLocation.create({ data: { warehouseId: whMfg.id, code: 'M1', nameAr: 'منطقة M1' } }),
      tx.warehouseLocation.create({ data: { warehouseId: whFg.id, code: 'F1', nameAr: 'منطقة F1' } }),
    ])

    const user = await tx.user.create({
      data: {
        email,
        fullName: parsed.data.fullName.trim(),
        passwordHash,
        isActive: true,
        roles: { create: [{ roleId: superAdminRole.id }] },
      },
      select: { id: true, email: true, fullName: true },
    })

    return { settingsId: settings.id, user, warehouses: [whRaw, whMfg, whFg].map((w) => ({ key: w.key, nameAr: w.nameAr })) }
  })

  return NextResponse.json({ success: true, data: result, message: 'تمت تهيئة النظام بنجاح' })
}

