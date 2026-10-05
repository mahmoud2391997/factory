'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'

import { PageTabs } from '@/components/erp/page-tabs'
import { NAV_CONFIG } from '@/lib/nav/config'
import { canSeeEntity } from '@/lib/erp-routes'
import { useLanguage } from '@/lib/i18n/language-provider'
import { LocalizedContent } from '@/lib/i18n/localized-content'
import { translateUiText } from '@/lib/i18n/translations'

import type { LiveCtx } from './ctx'
import type { PageTab } from '../page-tabs'

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
  inventoryOverview: InventoryScreens,
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
  purchaseRequest: PurchasingScreens,
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
  fleet: OfficeScreens,
  fleetFuel: OfficeScreens,
  fleetTrips: OfficeScreens,
}

type Breadcrumb = { href: string; label: string }
type RelatedLink = { entityKey: string; label: string; href: string }

export function LiveWorkspace({
  entityKey,
  pageId,
  title,
  description,
  crumbs,
  tabs,
  activeTabId,
  secondaryTabs,
  activeSecondaryId,
  tabLayout,
  relatedLinks,
  ctx,
}: {
  entityKey: string
  pageId: string
  title: string
  description: string
  crumbs: Breadcrumb[]
  tabs: PageTab[]
  activeTabId: string
  secondaryTabs: PageTab[]
  activeSecondaryId: string
  tabLayout: 'tabs' | 'sidebar'
  relatedLinks: RelatedLink[]
  ctx: LiveCtx
}) {
  const { language } = useLanguage()
  const ActiveScreen = entityKey === 'dashboard' ? DashboardScreen : (SCREEN_MAP[entityKey] ?? OfficeScreens)
  const screen = entityKey === 'navigationGuide'
    ? <NavigationGuide permissions={ctx.permissions} />
    : entityKey === 'inventoryExtensions'
      ? <InventoryScreens entityKey={entityKey} ctx={ctx} viewKind={pageId === 'inventoryExtensions-packaging' ? 'packaging' : 'spare'} />
      : <ActiveScreen entityKey={entityKey} ctx={ctx} />
  const body = <LocalizedContent>{screen}</LocalizedContent>

  return (
    <div className="space-y-4">
      <nav aria-label={translateUiText(language, 'مسار الصفحة')} className="text-sm text-[#5b6b64] dark:text-[#a1a1aa]">
        <ol className="flex flex-wrap items-center gap-2">
          {crumbs.map((crumb, index) => {
            const last = index === crumbs.length - 1
            return (
              <li key={`${crumb.href}-${index}`} className="flex items-center gap-2">
                {index > 0 ? <span aria-hidden="true">/</span> : null}
                <Link href={crumb.href} aria-current={last ? 'page' : undefined} className={`rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488] ${last ? 'font-semibold text-[#134e4a] dark:text-[#ccfbf1]' : 'hover:text-[#134e4a] dark:hover:text-[#ccfbf1]'}`}>
                  {crumb.label}
                </Link>
              </li>
            )
          })}
        </ol>
      </nav>

      <div className={tabLayout === 'sidebar' ? 'grid min-w-0 items-start gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]' : 'min-w-0 space-y-4'}>
        <PageTabs
          label="الأقسام الرئيسية"
          primaryTabs={tabs}
          secondaryTabs={secondaryTabs}
          activePrimaryId={activeTabId}
          activeSecondaryId={activeSecondaryId}
          layout={tabLayout}
        />
        <div className="min-w-0 space-y-4">
          <header className="space-y-2">
            <h2 className="text-2xl font-semibold text-[#1f2937] dark:text-[#f4f4f5]">{title}</h2>
            {description ? <p className="text-[#4b5563] dark:text-[#d4d4d8]">{description}</p> : null}
            {relatedLinks.length ? (
              <div className="flex flex-wrap items-center gap-2 pt-1" aria-label={translateUiText(language, 'روابط ذات صلة')}>
                {relatedLinks.map((link) => (
                  <Link key={link.entityKey} href={link.href} className="inline-flex min-h-10 items-center rounded-full border border-[#99d4cb] bg-[#f0fdfa] px-3 text-sm font-medium text-[#134e4a] hover:bg-[#ccfbf1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488] dark:border-[#285c56] dark:bg-[#193b37] dark:text-[#ccfbf1] dark:hover:bg-[#134e4a]">
                    {translateUiText(language, link.label)}
                  </Link>
                ))}
              </div>
            ) : null}
          </header>
          {body}
        </div>
      </div>
    </div>
  )
}

function NavigationGuide({ permissions }: { permissions: string[] }) {
  const { language } = useLanguage()
  const workspaces = NAV_CONFIG.workspaces.map((workspace) => ({
    ...workspace,
    sections: workspace.sections.map((section) => ({
      ...section,
      pages: section.pages.filter((page) => canSeeEntity(permissions, page.entityKey)),
    })).filter((section) => section.pages.length > 0),
  })).filter((workspace) => workspace.sections.length > 0)

  return (
    <div className="space-y-5">
      <p className="text-[#4b5563] dark:text-[#d4d4d8]">{translateUiText(language, 'فهرس مساحات العمل والأقسام والشاشات المتاحة حسب صلاحيتك.')}</p>
      {workspaces.map((workspace) => (
        <section key={workspace.id} className="rounded-xl border border-[#e5e7eb] bg-white p-4 dark:border-[#3f3f46] dark:bg-[#18181b]">
          <h3 className="mb-3 text-lg font-semibold text-[#134e4a] dark:text-[#ccfbf1]">{translateUiText(language, workspace.label)}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {workspace.sections.map((section) => (
              <div key={section.id} className="rounded-lg bg-[#f9fafb] p-3 dark:bg-[#202024]">
                <h4 className="mb-2 font-semibold text-[#1f2937] dark:text-[#f4f4f5]">{translateUiText(language, section.label)}</h4>
                <ul className="space-y-1">
                  {section.pages.map((page) => (
                    <li key={page.id}>
                      <Link href={page.href} className="group flex min-h-10 items-center justify-between gap-3 rounded-md px-2 text-sm text-[#374151] hover:bg-[#e9f7f4] hover:text-[#134e4a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0d9488] dark:text-[#e4e4e7] dark:hover:bg-[#193b37] dark:hover:text-[#ccfbf1]">
                        <span className="min-w-0 flex-1 truncate font-medium">{translateUiText(language, page.label)}</span>
                        <span className="hidden truncate text-xs text-[#6b7280] group-hover:block dark:text-[#a1a1aa]">{translateUiText(language, page.description)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
