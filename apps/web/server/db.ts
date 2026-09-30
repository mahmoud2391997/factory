import { MongoClient, type Db } from 'mongodb'

import { resolveDatabaseUrl } from '@/server/db-url'

declare global {
  // eslint-disable-next-line no-var
  var __erpMongoClient: Promise<MongoClient> | undefined
}

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
export type WarehouseRow = { _id: string; key: string; nameAr: string; isActive: boolean; createdAt: Date; updatedAt: Date }
export type WarehouseLocationRow = {
  _id: string
  warehouseId: string
  code: string
  nameAr: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export function getMongoClient(): Promise<MongoClient> {
  const url = resolveDatabaseUrl()
  if (!url) throw new Error('MONGODB_URI is not configured')
  global.__erpMongoClient ??= new MongoClient(url, {
    serverSelectionTimeoutMS: 8000,
    appName: 'factory-erp',
  })
    .connect()
    .catch((error) => {
      global.__erpMongoClient = undefined
      throw error
    })
  return global.__erpMongoClient
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient()
  return client.db(process.env.MONGODB_DB?.trim() || 'factory_erp')
}
