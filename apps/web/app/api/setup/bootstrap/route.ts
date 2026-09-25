import { timingSafeEqual } from 'node:crypto'
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

const PERMISSIONS = [
  { key: 'users.read', nameAr: 'عرض المستخدمين' },
  { key: 'users.manage', nameAr: 'إدارة المستخدمين' },
  { key: 'roles.read', nameAr: 'عرض الأدوار' },
  { key: 'roles.manage', nameAr: 'إدارة الأدوار والصلاحيات' },
  { key: 'settings.read', nameAr: 'عرض الإعدادات' },
  { key: 'settings.update', nameAr: 'تعديل الإعدادات' },
  { key: 'warehouses.read', nameAr: 'عرض المستودعات' },
  { key: 'warehouses.manage', nameAr: 'إدارة المستودعات' },
  { key: 'inventory.read', nameAr: 'عرض المخزون' },
  { key: 'inventory.adjust', nameAr: 'تعديل المخزون' },
  { key: 'inventory.transfer.create', nameAr: 'إنشاء تحويل مخزون' },
  { key: 'inventory.ledger.read', nameAr: 'عرض دفتر المخزون' },
  { key: 'purchasing.read', nameAr: 'عرض المشتريات' },
  { key: 'purchasing.po.create', nameAr: 'إنشاء أمر شراء' },
  { key: 'purchasing.gr.create', nameAr: 'إنشاء استلام بضاعة' },
  { key: 'production.read', nameAr: 'عرض التصنيع' },
  { key: 'production.create', nameAr: 'إنشاء أمر إنتاج' },
  { key: 'production.complete', nameAr: 'إكمال أوامر الإنتاج' },
  { key: 'sales.read', nameAr: 'عرض المبيعات' },
  { key: 'sales.create', nameAr: 'إنشاء مبيعات' },
  { key: 'sales.confirm', nameAr: 'تأكيد المبيعات' },
  { key: 'accounting.read', nameAr: 'عرض الحسابات' },
  { key: 'accounting.manage', nameAr: 'إدارة الحسابات' },
  { key: 'tax.read', nameAr: 'عرض الضرائب' },
  { key: 'tax.manage', nameAr: 'إدارة الضرائب' },
  { key: 'employees.read', nameAr: 'عرض الموظفين' },
  { key: 'employees.manage', nameAr: 'إدارة الموظفين' },
  { key: 'attendance.read', nameAr: 'عرض الحضور' },
  { key: 'attendance.manage', nameAr: 'إدارة الحضور' },
  { key: 'overtime.read', nameAr: 'عرض الإضافي' },
  { key: 'overtime.manage', nameAr: 'إدارة الإضافي' },
  { key: 'reports.read', nameAr: 'عرض التقارير' },
  { key: 'audit.read', nameAr: 'عرض سجل العمليات' },
  { key: 'notifications.read', nameAr: 'عرض الإشعارات' },
] as const

const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: PERMISSIONS.map((p) => p.key),
  MANAGEMENT: [
    'users.read',
    'roles.read',
    'settings.read',
    'warehouses.read',
    'inventory.read',
    'inventory.ledger.read',
    'purchasing.read',
    'production.read',
    'sales.read',
    'accounting.read',
    'tax.read',
    'employees.read',
    'attendance.read',
    'overtime.read',
    'reports.read',
    'audit.read',
    'notifications.read',
  ],
  WAREHOUSE: [
    'warehouses.read',
    'inventory.read',
    'inventory.transfer.create',
    'inventory.ledger.read',
    'purchasing.read',
    'purchasing.gr.create',
    'notifications.read',
    'audit.read',
  ],
  PRODUCTION: [
    'warehouses.read',
    'inventory.read',
    'production.read',
    'production.create',
    'production.complete',
    'notifications.read',
    'audit.read',
  ],
  ACCOUNTANT: [
    'inventory.read',
    'purchasing.read',
    'sales.read',
    'accounting.read',
    'accounting.manage',
    'tax.read',
    'tax.manage',
    'reports.read',
    'audit.read',
  ],
  HR: [
    'employees.read',
    'employees.manage',
    'attendance.read',
    'attendance.manage',
    'overtime.read',
    'overtime.manage',
    'notifications.read',
  ],
  SALES: ['sales.read', 'sales.create', 'sales.confirm', 'purchasing.read', 'inventory.read', 'notifications.read'],
}

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
    })

    const permissions = await Promise.all(
      PERMISSIONS.map((p) =>
        tx.permission.create({
          data: { key: p.key, nameAr: p.nameAr },
        }),
      ),
    )
    const permissionByKey = Object.fromEntries(permissions.map((p) => [p.key, p]))

    const roles = await Promise.all([
      tx.role.create({ data: { key: 'SUPER_ADMIN', nameAr: 'مدير النظام (Super Admin)' } }),
      tx.role.create({ data: { key: 'MANAGEMENT', nameAr: 'الإدارة' } }),
      tx.role.create({ data: { key: 'WAREHOUSE', nameAr: 'موظف مستودع' } }),
      tx.role.create({ data: { key: 'PRODUCTION', nameAr: 'موظف إنتاج' } }),
      tx.role.create({ data: { key: 'ACCOUNTANT', nameAr: 'محاسب' } }),
      tx.role.create({ data: { key: 'HR', nameAr: 'الموارد البشرية' } }),
      tx.role.create({ data: { key: 'SALES', nameAr: 'مبيعات' } }),
    ])

    for (const role of roles) {
      const keys = ROLE_PERMISSIONS[role.key] ?? []
      await Promise.all(
        keys.map((key) => {
          const permission = permissionByKey[key]
          if (!permission) return Promise.resolve()
          return tx.rolePermission.create({
            data: { roleId: role.id, permissionId: permission.id },
          })
        }),
      )
    }

    const superAdminRole = roles.find((r) => r.key === 'SUPER_ADMIN')
    if (!superAdminRole) throw new Error('SUPER_ADMIN role missing')

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

    return {
      settingsId: settings.id,
      user,
      warehouses: [whRaw, whMfg, whFg].map((w) => ({ key: w.key, nameAr: w.nameAr })),
      permissionsCount: permissions.length,
      rolesCount: roles.length,
    }
  })

  return NextResponse.json({ success: true, data: result, message: 'تمت تهيئة النظام بنجاح' })
}
