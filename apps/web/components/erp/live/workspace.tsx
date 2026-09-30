'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'

import { useLanguage } from '@/lib/i18n/language-provider'
import { translateUiText } from '@/lib/i18n/translations'

import type { LiveCtx } from './ctx'

const FactoryScreens = dynamic(() => import('./screens-factory').then((m) => m.FactoryScreens))
const QualityScreens = dynamic(() => import('./screens-qc').then((m) => m.QualityScreens))
const InventoryScreens = dynamic(() => import('./screens-ops').then((m) => m.InventoryScreens))
const ProductionScreens = dynamic(() => import('./screens-ops').then((m) => m.ProductionScreens))
const PurchasingScreens = dynamic(() => import('./screens-ops').then((m) => m.PurchasingScreens))
const SalesScreens = dynamic(() => import('./screens-ops').then((m) => m.SalesScreens))
const DashboardScreen = dynamic(() => import('./screens-office').then((m) => m.DashboardScreen))
const OfficeScreens = dynamic(() => import('./screens-office').then((m) => m.OfficeScreens))

const SCREEN_MAP: Record<string, typeof FactoryScreens> = {
  // Factory
  factoryPlanned: FactoryScreens,
  factoryActual: FactoryScreens,
  factoryExecution: FactoryScreens,
  factorySalesToday: FactoryScreens,
  factorySalesMonth: FactoryScreens,
  factoryOpenOrders: FactoryScreens,
  factoryCostPerTon: FactoryScreens,
  factoryAvgPrice: FactoryScreens,
  factoryMargin: FactoryScreens,
  factoryStockValue: FactoryScreens,
  factoryRunningOut: FactoryScreens,
  factoryStagnant: FactoryScreens,
  factoryReserved: FactoryScreens,
  factoryWaste: FactoryScreens,
  factoryDeviation: FactoryScreens,
  factoryStoppages: FactoryScreens,
  varianceReport: FactoryScreens,
  productionLot: FactoryScreens,
  lotTrace: FactoryScreens,
  // Quality
  qualitySample: QualityScreens,
  supplierQuality: QualityScreens,
  // Inventory
  material: InventoryScreens,
  product: InventoryScreens,
  inventoryExtensions: InventoryScreens,
  warehouse: InventoryScreens,
  stockTransfer: InventoryScreens,
  stockAdjustment: InventoryScreens,
  barcode: InventoryScreens,
  materialBatch: InventoryScreens,
  inventoryBalance: InventoryScreens,
  inventoryTransaction: InventoryScreens,
  materialTrace: InventoryScreens,
  inventoryReports: InventoryScreens,
  materialPriceAnalysis: InventoryScreens,
  // Purchasing
  supplier: PurchasingScreens,
  purchaseOrder: PurchasingScreens,
  goodsReceipt: PurchasingScreens,
  supplierRelations: PurchasingScreens,
  supplierTemplate: PurchasingScreens,
  supplierCommunication: PurchasingScreens,
  // Production
  recipe: ProductionScreens,
  recipeItem: ProductionScreens,
  productionOrder: ProductionScreens,
  customerRecipe: ProductionScreens,
  scaleReading: ProductionScreens,
  machine: ProductionScreens,
  maintenanceSchedule: ProductionScreens,
  maintenanceRecord: ProductionScreens,
  maintenance: ProductionScreens,
  productionReports: ProductionScreens,
  // Sales
  customer: SalesScreens,
  salesInvoice: SalesScreens,
  salesPayment: SalesScreens,
  withdrawal: SalesScreens,
  distributionPoint: SalesScreens,
  distributionClosing: SalesScreens,
  distribution: SalesScreens,
  invoiceDelivery: SalesScreens,
  salesReports: SalesScreens,
  profitability: SalesScreens,
  // Office
  account: OfficeScreens,
  journalEntry: OfficeScreens,
  expense: OfficeScreens,
  vatReport: OfficeScreens,
  taxSettings: OfficeScreens,
  utilitiesReading: OfficeScreens,
  bankTransaction: OfficeScreens,
  obligation: OfficeScreens,
  employee: OfficeScreens,
  attendance: OfficeScreens,
  overtime: OfficeScreens,
  payroll: OfficeScreens,
  report: OfficeScreens,
  notification: OfficeScreens,
  auditLog: OfficeScreens,
  companySettings: OfficeScreens,
  approvals: OfficeScreens,
  users: OfficeScreens,
  accountingReports: OfficeScreens,
  financialOps: OfficeScreens,
  documents: OfficeScreens,
}

export function LiveWorkspace({
  entityKey,
  title,
  description,
  crumbs,
  ctx,
}: {
  entityKey: string
  title: string
  description: string
  crumbs: Array<{ href: string; label: string }>
  ctx: LiveCtx
}) {
  const { language } = useLanguage()
  const ActiveScreen = entityKey === 'dashboard' ? DashboardScreen : (SCREEN_MAP[entityKey] ?? OfficeScreens)
  const body = <ActiveScreen entityKey={entityKey} ctx={ctx} />

  return (
    <div className="space-y-4">
      <nav aria-label={translateUiText(language, 'مسار الصفحة')} className="text-sm text-[#7c8c86]">
        <ol className="flex flex-wrap items-center gap-2">
          {crumbs.map((crumb, index) => {
            const last = index === crumbs.length - 1
            return (
              <li key={`${crumb.href}-${index}`} className="flex items-center gap-2">
                {index > 0 ? <span aria-hidden="true">/</span> : null}
                {last ? (
                  <span className="font-medium text-[#0d9488]" aria-current="page">
                    {crumb.label}
                  </span>
                ) : (
                  <Link href={crumb.href} className="hover:text-[#1f1f1f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488]">
                    {crumb.label}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
      {entityKey !== 'dashboard' ? (
        <div>
          <h2 className="text-2xl font-semibold">{title}</h2>
          {description ? <p className="mt-2 text-[#6b7280]">{description}</p> : null}
        </div>
      ) : null}
      {body ?? <div className="rounded-2xl bg-white p-6 text-sm text-[#53655e]">هذه الشاشة غير مربوطة بعد.</div>}
    </div>
  )
}
