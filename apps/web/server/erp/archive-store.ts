import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { ArchivePlan } from '@/lib/erp/domain/archive'
import type { ErpState, WarehouseKey } from '@/lib/erp/domain/types'
import { prisma } from '@/server/db'

const WAREHOUSE_NAMES: Record<WarehouseKey, string> = {
  WH_RAW: 'مستودع المواد الخام',
  WH_MFG: 'مستودع التصنيع',
  WH_FG: 'مستودع المنتجات النهائية',
}

async function mergeArchiveFile(file: string, rows: unknown[]) {
  if (rows.length === 0) return
  let current: unknown[] = []
  try {
    current = JSON.parse(await readFile(file, 'utf8')) as unknown[]
    if (!Array.isArray(current)) current = []
  } catch {
    current = []
  }
  const byId = new Map<string, unknown>()
  for (const row of current) {
    if (row && typeof row === 'object' && 'id' in row) byId.set(String((row as { id: unknown }).id), row)
  }
  for (const row of rows) {
    if (row && typeof row === 'object' && 'id' in row) byId.set(String((row as { id: unknown }).id), row)
  }
  await writeFile(file, JSON.stringify([...byId.values()]))
}

export async function writeFileArchive(dir: string, plan: ArchivePlan) {
  await mkdir(dir, { recursive: true })
  await mergeArchiveFile(path.join(dir, 'ledger.json'), plan.ledger)
  await mergeArchiveFile(path.join(dir, 'journals.json'), plan.journals)
  await mergeArchiveFile(path.join(dir, 'audit-logs.json'), plan.auditLogs)
}

export async function writeRelationalArchive(state: ErpState, plan: ArchivePlan) {
  await prisma.$transaction(async (tx) => {
    const warehouses = new Map<string, string>()
    const materials = new Map<string, string>()
    const products = new Map<string, string>()
    const accounts = new Map<string, string>()

    async function warehouseId(key: WarehouseKey) {
      const cached = warehouses.get(key)
      if (cached) return cached
      const row = await tx.warehouse.upsert({
        where: { key },
        update: {},
        create: {
          key,
          nameAr: state.warehouses.find((item) => item.key === key)?.nameAr ?? WAREHOUSE_NAMES[key],
        },
      })
      warehouses.set(key, row.id)
      return row.id
    }

    async function materialId(itemId: string) {
      const cached = materials.get(itemId)
      if (cached) return cached
      const material = state.materials.find((item) => item.id === itemId)
      const code = material?.code ?? itemId
      const existing = await tx.material.findUnique({ where: { code } })
      if (existing) {
        materials.set(itemId, existing.id)
        return existing.id
      }
      const created = await tx.material.create({
        data: {
          id: material?.id ?? itemId,
          code,
          nameAr: material?.nameAr ?? code,
          category: material?.category || 'أرشيف',
          unit: material?.unit || 'كجم',
          minQty: material?.minQty ?? 0,
          vatTreatment: material?.vatTreatment ?? 'ZERO',
          barcode: material?.barcode || `arch-${code}`,
          active: material?.active ?? false,
        },
      })
      materials.set(itemId, created.id)
      return created.id
    }

    async function productId(itemId: string) {
      const cached = products.get(itemId)
      if (cached) return cached
      const product = state.products.find((item) => item.id === itemId)
      const code = product?.code ?? itemId
      const existing = await tx.product.findUnique({ where: { code } })
      if (existing) {
        products.set(itemId, existing.id)
        return existing.id
      }
      const created = await tx.product.create({
        data: {
          id: product?.id ?? itemId,
          code,
          nameAr: product?.nameAr ?? code,
          unit: product?.unit || 'كجم',
          salePrice: product?.salePrice ?? 0,
          vatTreatment: product?.vatTreatment ?? 'STANDARD',
          barcode: product?.barcode || `arch-${code}`,
          bagKg: product?.bagKg ?? 0,
          active: product?.active ?? false,
        },
      })
      products.set(itemId, created.id)
      return created.id
    }

    async function accountId(code: string) {
      const cached = accounts.get(code)
      if (cached) return cached
      const account = state.accounts.find((item) => item.code === code)
      const row = await tx.account.upsert({
        where: { code },
        update: {},
        create: { code, nameAr: account?.nameAr ?? code, type: account?.type ?? 'EXPENSE' },
      })
      accounts.set(code, row.id)
      return row.id
    }

    for (const entry of plan.ledger) {
      const existing = await tx.inventoryLedgerEntry.findUnique({ where: { id: entry.id } })
      if (existing) continue
      await tx.inventoryLedgerEntry.create({
        data: {
          id: entry.id,
          at: new Date(entry.at),
          type: entry.type,
          warehouseId: await warehouseId(entry.warehouse),
          itemType: entry.itemType,
          materialId: entry.itemType === 'MATERIAL' ? await materialId(entry.itemId) : null,
          productId: entry.itemType === 'PRODUCT' ? await productId(entry.itemId) : null,
          batchNo: entry.batchNo,
          qty: entry.qty,
          unitCost: entry.unitCost,
          prevQty: entry.prevQty,
          newQty: entry.newQty,
          refType: entry.refType,
          refId: entry.refId,
          userId: entry.userId,
          notes: entry.notes,
        },
      })
    }

    for (const entry of plan.journals) {
      const existing = await tx.journalEntry.findUnique({ where: { number: entry.number } })
      if (existing) continue
      await tx.journalEntry.create({
        data: {
          id: entry.id,
          number: entry.number,
          at: new Date(entry.at),
          memo: entry.memo,
          refType: entry.refType,
          refId: entry.refId,
          lines: {
            create: await Promise.all(
              entry.lines.map(async (line) => ({
                accountId: await accountId(line.accountCode),
                debit: line.debit,
                credit: line.credit,
              })),
            ),
          },
        },
      })
    }

    for (const entry of plan.auditLogs) {
      await tx.auditLog.upsert({
        where: { id: entry.id },
        update: {},
        create: {
          id: entry.id,
          at: new Date(entry.at),
          userId: entry.userId,
          userName: entry.userName,
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId,
          detail: entry.detail,
        },
      })
    }
  })
}
