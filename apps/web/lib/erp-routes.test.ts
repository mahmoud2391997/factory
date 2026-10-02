import assert from 'node:assert/strict'
import { test } from 'node:test'

import { DEFAULT_ROLE_PERMISSIONS } from './erp/domain/permissions'
import {
  canSeeEntity,
  hrefForEntity,
  hrefForPageId,
  pageTabs,
  resolvePath,
  searchNavigation,
  visibleSections,
  visibleWorkspaces,
} from './erp-routes'
import { ALL_NAV_PAGES, MAX_VISIBLE_PAGE_TABS, NAV_CONFIG, canonicalPages } from './nav/config'

// Snapshot of every entity key and URL in the previous navigation catalog.
const LEGACY_ROUTES = [
  {
    "entityKey": "dashboard",
    "href": "/"
  },
  {
    "entityKey": "factoryPlanned",
    "href": "/inventory/manufacturing/planned"
  },
  {
    "entityKey": "factoryActual",
    "href": "/inventory/manufacturing/actual"
  },
  {
    "entityKey": "factoryExecution",
    "href": "/inventory/manufacturing/execution"
  },
  {
    "entityKey": "factorySalesToday",
    "href": "/sales/today"
  },
  {
    "entityKey": "factorySalesMonth",
    "href": "/sales/month"
  },
  {
    "entityKey": "factoryOpenOrders",
    "href": "/sales/open-orders"
  },
  {
    "entityKey": "factoryCostPerTon",
    "href": "/accounting/cost"
  },
  {
    "entityKey": "factoryAvgPrice",
    "href": "/accounting/price"
  },
  {
    "entityKey": "factoryMargin",
    "href": "/accounting/margin"
  },
  {
    "entityKey": "factoryStockValue",
    "href": "/inventory/raw-materials/value"
  },
  {
    "entityKey": "factoryRunningOut",
    "href": "/inventory/raw-materials/running-out"
  },
  {
    "entityKey": "factoryStagnant",
    "href": "/inventory/raw-materials/stagnant"
  },
  {
    "entityKey": "factoryReserved",
    "href": "/inventory/raw-materials/reserved"
  },
  {
    "entityKey": "factoryWaste",
    "href": "/inventory/manufacturing/waste"
  },
  {
    "entityKey": "factoryDeviation",
    "href": "/inventory/manufacturing/deviation"
  },
  {
    "entityKey": "varianceReport",
    "href": "/inventory/manufacturing/variance"
  },
  {
    "entityKey": "factoryStoppages",
    "href": "/inventory/manufacturing/stoppages"
  },
  {
    "entityKey": "material",
    "href": "/inventory/raw-materials"
  },
  {
    "entityKey": "product",
    "href": "/inventory/products"
  },
  {
    "entityKey": "inventoryExtensions",
    "href": "/inventory/extensions"
  },
  {
    "entityKey": "warehouse",
    "href": "/inventory/warehouses"
  },
  {
    "entityKey": "stockTransfer",
    "href": "/inventory/warehouses/transfers"
  },
  {
    "entityKey": "stockAdjustment",
    "href": "/inventory/warehouses/adjustments"
  },
  {
    "entityKey": "barcode",
    "href": "/inventory/warehouses/barcode"
  },
  {
    "entityKey": "materialBatch",
    "href": "/inventory/raw-materials/batches"
  },
  {
    "entityKey": "inventoryBalance",
    "href": "/inventory/raw-materials/balances"
  },
  {
    "entityKey": "inventoryTransaction",
    "href": "/inventory/raw-materials/ledger"
  },
  {
    "entityKey": "inventoryReports",
    "href": "/inventory/reports"
  },
  {
    "entityKey": "materialPriceAnalysis",
    "href": "/inventory/raw-materials/price-analysis"
  },
  {
    "entityKey": "supplier",
    "href": "/sales/parties/suppliers"
  },
  {
    "entityKey": "supplierRelations",
    "href": "/sales/parties/relations"
  },
  {
    "entityKey": "supplierTemplate",
    "href": "/sales/parties/templates"
  },
  {
    "entityKey": "supplierCommunication",
    "href": "/sales/parties/communications"
  },
  {
    "entityKey": "purchaseRequest",
    "href": "/sales/parties/requests"
  },
  {
    "entityKey": "purchaseOrder",
    "href": "/sales/parties/orders"
  },
  {
    "entityKey": "goodsReceipt",
    "href": "/sales/parties/receipts"
  },
  {
    "entityKey": "recipe",
    "href": "/inventory/manufacturing"
  },
  {
    "entityKey": "recipeItem",
    "href": "/inventory/manufacturing/recipe-items"
  },
  {
    "entityKey": "customerRecipe",
    "href": "/inventory/manufacturing/customer-recipes"
  },
  {
    "entityKey": "productionOrder",
    "href": "/inventory/manufacturing/orders"
  },
  {
    "entityKey": "scaleReading",
    "href": "/inventory/manufacturing/scale"
  },
  {
    "entityKey": "productionLot",
    "href": "/inventory/manufacturing/lots"
  },
  {
    "entityKey": "lotTrace",
    "href": "/inventory/manufacturing/lot-trace"
  },
  {
    "entityKey": "qualitySample",
    "href": "/inventory/manufacturing/quality"
  },
  {
    "entityKey": "supplierQuality",
    "href": "/inventory/manufacturing/supplier-quality"
  },
  {
    "entityKey": "maintenance",
    "href": "/inventory/manufacturing/maintenance"
  },
  {
    "entityKey": "machine",
    "href": "/inventory/manufacturing/maintenance/machines"
  },
  {
    "entityKey": "maintenanceSchedule",
    "href": "/inventory/manufacturing/maintenance/schedules"
  },
  {
    "entityKey": "maintenanceRecord",
    "href": "/inventory/manufacturing/maintenance/records"
  },
  {
    "entityKey": "productionReports",
    "href": "/inventory/manufacturing/reports"
  },
  {
    "entityKey": "customer",
    "href": "/sales/parties"
  },
  {
    "entityKey": "salesInvoice",
    "href": "/sales"
  },
  {
    "entityKey": "withdrawal",
    "href": "/sales/withdrawals"
  },
  {
    "entityKey": "salesPayment",
    "href": "/sales/collections"
  },
  {
    "entityKey": "distribution",
    "href": "/sales/distribution"
  },
  {
    "entityKey": "distributionPoint",
    "href": "/sales/distribution/points"
  },
  {
    "entityKey": "distributionClosing",
    "href": "/sales/distribution/closing"
  },
  {
    "entityKey": "invoiceDelivery",
    "href": "/sales/delivery"
  },
  {
    "entityKey": "salesReports",
    "href": "/sales/reports"
  },
  {
    "entityKey": "profitability",
    "href": "/sales/profitability"
  },
  {
    "entityKey": "fleet",
    "href": "/fleet/vehicles"
  },
  {
    "entityKey": "fleetFuel",
    "href": "/fleet/fuel"
  },
  {
    "entityKey": "fleetTrips",
    "href": "/fleet/trips"
  },
  {
    "entityKey": "account",
    "href": "/accounting"
  },
  {
    "entityKey": "journalEntry",
    "href": "/accounting/journals"
  },
  {
    "entityKey": "expense",
    "href": "/accounting/expenses"
  },
  {
    "entityKey": "taxSettings",
    "href": "/accounting/tax"
  },
  {
    "entityKey": "vatReport",
    "href": "/accounting/vat"
  },
  {
    "entityKey": "financialOps",
    "href": "/accounting/financial-ops"
  },
  {
    "entityKey": "utilitiesReading",
    "href": "/accounting/financial-ops/utilities"
  },
  {
    "entityKey": "bankTransaction",
    "href": "/accounting/financial-ops/bank-transactions"
  },
  {
    "entityKey": "obligation",
    "href": "/accounting/obligations"
  },
  {
    "entityKey": "documents",
    "href": "/accounting/documents"
  },
  {
    "entityKey": "accountingReports",
    "href": "/accounting/reports"
  },
  {
    "entityKey": "employee",
    "href": "/hr"
  },
  {
    "entityKey": "attendance",
    "href": "/hr/attendance"
  },
  {
    "entityKey": "overtime",
    "href": "/hr/overtime"
  },
  {
    "entityKey": "payroll",
    "href": "/hr/payroll"
  },
  {
    "entityKey": "report",
    "href": "/tasks/reports"
  },
  {
    "entityKey": "materialTrace",
    "href": "/tasks/material"
  },
  {
    "entityKey": "companySettings",
    "href": "/settings"
  },
  {
    "entityKey": "approvals",
    "href": "/tasks/approvals"
  },
  {
    "entityKey": "users",
    "href": "/settings/users"
  },
  {
    "entityKey": "notification",
    "href": "/notifications"
  },
  {
    "entityKey": "auditLog",
    "href": "/settings/audit"
  }
]
const LEGACY_ENTITY_KEYS = LEGACY_ROUTES.map((route) => route.entityKey)
const ALL_REGISTERED_PERMISSIONS = [...new Set(ALL_NAV_PAGES.flatMap((page) => page.permission))]

const allPagesForEveryRole = [...ALL_REGISTERED_PERMISSIONS, ...DEFAULT_ROLE_PERMISSIONS.GM]

test('all 86 legacy screens have one canonical config page and preserve their route', () => {
  const canonical = canonicalPages().filter((page) => LEGACY_ENTITY_KEYS.includes(page.entityKey))
  assert.equal(canonical.length, 86)
  assert.deepEqual([...canonical.map((page) => page.entityKey)].sort(), [...LEGACY_ENTITY_KEYS].sort())
  assert.equal(new Set(canonical.map((page) => page.entityKey)).size, 86)

  for (const { entityKey, href: oldHref } of LEGACY_ROUTES) {
    const href = hrefForEntity(entityKey)
    assert.ok(href, `${entityKey} has a canonical route`)
    const resolved = resolvePath(href!)
    assert.ok(resolved, `${href} resolves`)
    assert.equal(resolved.page.entityKey, entityKey)
    assert.ok(canSeeEntity(allPagesForEveryRole, entityKey), `${entityKey} has an access rule`)
    if (entityKey === 'inventoryExtensions') {
      assert.equal(href, '/inventory/extensions?kind=spare')
      assert.equal(resolvePath(oldHref)?.redirectTo, href, 'the old extension URL redirects to the spare-parts view')
    } else {
      assert.equal(href, oldHref, `${entityKey} retains its former URL`)
      assert.equal(resolvePath(oldHref)?.page.entityKey, entityKey)
    }
  }
})

test('navigation has nine workspaces, a single-page home, and bounded page labels', () => {
  assert.equal(NAV_CONFIG.workspaces.length, 9)
  const home = NAV_CONFIG.workspaces.find((workspace) => workspace.id === 'home')!
  assert.equal(home.sections.length, 1)
  assert.equal(home.sections[0]!.pages.length, 1)
  assert.ok(ALL_NAV_PAGES.every((page) => page.label.length <= 24 && page.label.trim().split(/\s+/).length <= 3), 'labels stay within three words and about 24 characters')
  assert.ok(NAV_CONFIG.workspaces.some((workspace) => workspace.sections.some((section) => section.pages.length > MAX_VISIBLE_PAGE_TABS)), 'at least one section exercises the overflow tab menu')
  assert.ok(NAV_CONFIG.workspaces.flatMap((workspace) => workspace.sections).some((section) => section.pages.length === 1), 'single-page sections are represented without extra page levels')
})

test('the general manager sees every workspace; the driver only sees trip and fuel pages', () => {
  assert.deepEqual(visibleWorkspaces(DEFAULT_ROLE_PERMISSIONS.GM).map((workspace) => workspace.id), NAV_CONFIG.workspaces.map((workspace) => workspace.id))
  const driverWorkspaces = visibleWorkspaces(DEFAULT_ROLE_PERMISSIONS.DRIVER)
  assert.deepEqual(driverWorkspaces.map((workspace) => workspace.id), ['fleet'])
  const vehicleSections = visibleSections(driverWorkspaces[0]!, DEFAULT_ROLE_PERMISSIONS.DRIVER)
  assert.deepEqual(vehicleSections.map((section) => section.id), ['vehicles'])
  assert.deepEqual(vehicleSections[0]!.pages.filter((page) => canSeeEntity(DEFAULT_ROLE_PERMISSIONS.DRIVER, page.entityKey)).map((page) => page.entityKey).sort(), ['fleetFuel', 'fleetTrips'])
})

test('quality roles can access the quality pages without granting unrelated restricted pages', () => {
  const qualityPermissions = DEFAULT_ROLE_PERMISSIONS.QUALITY
  assert.equal(canSeeEntity(qualityPermissions, 'qualitySample'), true)
  assert.equal(canSeeEntity(qualityPermissions, 'supplierQuality'), true)
  assert.equal(canSeeEntity(qualityPermissions, 'users'), false)
})

test('each tabbed page is available in its own section row and packaging query selects its own page', () => {
  for (const page of ALL_NAV_PAGES.filter((item) => item.tab)) {
    const resolved = resolvePath(page.href)
    assert.ok(resolved, `${page.href} resolves`)
    assert.ok(pageTabs(resolved, allPagesForEveryRole).primary.some((tab) => tab.id === page.id), `${page.id} appears in its section tabs`)
  }
  const packagingHref = hrefForPageId('inventoryExtensions-packaging')
  assert.equal(packagingHref, '/inventory/extensions?kind=packaging')
  assert.equal(resolvePath(packagingHref!)?.page.id, 'inventoryExtensions-packaging')
  assert.equal(resolvePath('/inventory/extensions', 'kind=packaging')?.page.id, 'inventoryExtensions-packaging')
  assert.equal(resolvePath('/inventory/extensions', 'kind=spare')?.page.id, 'inventoryExtensions')
})

test('search finds diesel, scale, and spare-parts synonyms and returns grouped navigation targets', () => {
  const searchFor = (query: string) => searchNavigation(query, DEFAULT_ROLE_PERMISSIONS.GM)
  assert.ok(searchFor('ديزل').some((result) => result.type === 'page' && result.page?.entityKey === 'fleetFuel'))
  assert.ok(searchFor('ميزان').some((result) => result.type === 'page' && result.page?.entityKey === 'scaleReading'))
  assert.ok(searchFor('قطع غيار').some((result) => result.type === 'page' && result.page?.entityKey === 'inventoryExtensions'))
  assert.ok(searchFor('العملاء والفواتير').some((result) => result.type === 'section' && result.workspace?.id === 'sales'))
  assert.ok(searchFor('دليل البنود').some((result) => result.href === '/guide'))
})
