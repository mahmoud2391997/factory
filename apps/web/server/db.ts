import { prisma } from '@erp/database/client'

export const COLLECTIONS = {
  erpDocuments: 'erp_documents',
  systemInit: 'system_init',
  companySettings: 'company_settings',
  warehouses: 'warehouses',
  warehouseLocations: 'warehouse_locations',
  archiveLedger: 'archive_inventory_ledger',
  archiveJournals: 'archive_journal_entries',
  archiveAuditLogs: 'archive_audit_logs',
} as const

export type ErpDocumentRow = { _id: string; version: number; payload: unknown; updatedAt: Date }

export async function getDb() {
  return prisma
}
