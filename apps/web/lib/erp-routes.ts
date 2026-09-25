import type { LucideIcon } from 'lucide-react'
import { ClipboardList, FileText, LayoutDashboard, Settings, ShoppingCart, Users, Warehouse } from 'lucide-react'

import { canAccessSub, ERP_NAV } from '@/lib/erp-nav'

export type RouteLeaf = {
  href: string
  entityKey: string
  /** In-page tab. سجل العمليات stays a route reached from the header and settings. */
  tab: boolean
}

export type RouteGroup = {
  id: string
  label: string
  leaves: RouteLeaf[]
}

export type Destination = {
  id: string
  label: string
  icon: LucideIcon
  groups: RouteGroup[]
}

/**
 * Seven sidebar destinations. Every existing entityKey appears once.
 * Group labels follow the requested information architecture.
 * Leaf labels stay the current Arabic screen names.
 * Read-only tables (no create, edit, or approval — export at most) sit in
 * each major's التقارير group, so they open as that section's reports tab.
 * No receivables/payables pages exist, so الحسابات keeps its current screens.
 */
export const DESTINATIONS: Destination[] = [
  {
    id: 'home',
    label: 'الرئيسية',
    icon: LayoutDashboard,
    groups: [
      {
        id: 'home',
        label: 'لوحة التحكم',
        leaves: [{ href: '/', entityKey: 'dashboard', tab: false }],
      },
    ],
  },
  {
    id: 'stock',
    label: 'المخزون والإنتاج',
    icon: Warehouse,
    groups: [
      {
        id: 'materials',
        label: 'المواد الخام',
        leaves: [
          { href: '/inventory/raw-materials', entityKey: 'material', tab: true },
          { href: '/inventory/raw-materials/transfers', entityKey: 'stockTransfer', tab: true },
          { href: '/inventory/raw-materials/adjustments', entityKey: 'stockAdjustment', tab: true },
          { href: '/inventory/raw-materials/barcode', entityKey: 'barcode', tab: true },
        ],
      },
      {
        id: 'warehouses',
        label: 'المستودعات',
        leaves: [{ href: '/inventory/warehouses', entityKey: 'warehouse', tab: true }],
      },
      {
        id: 'production',
        label: 'التصنيع',
        leaves: [
          { href: '/inventory/manufacturing', entityKey: 'recipe', tab: true },
          { href: '/inventory/manufacturing/items', entityKey: 'recipeItem', tab: true },
          { href: '/inventory/manufacturing/orders', entityKey: 'productionOrder', tab: true },
        ],
      },
      {
        id: 'products',
        label: 'المنتجات',
        leaves: [{ href: '/inventory/products', entityKey: 'product', tab: true }],
      },
      {
        id: 'stock-reports',
        label: 'التقارير',
        leaves: [
          { href: '/inventory/raw-materials/batches', entityKey: 'materialBatch', tab: true },
          { href: '/inventory/raw-materials/balances', entityKey: 'inventoryBalance', tab: true },
          { href: '/inventory/raw-materials/ledger', entityKey: 'inventoryTransaction', tab: true },
          { href: '/inventory/raw-materials/value', entityKey: 'factoryStockValue', tab: true },
          { href: '/inventory/raw-materials/running-out', entityKey: 'factoryRunningOut', tab: true },
          { href: '/inventory/raw-materials/stagnant', entityKey: 'factoryStagnant', tab: true },
          { href: '/inventory/raw-materials/reserved', entityKey: 'factoryReserved', tab: true },
          { href: '/inventory/manufacturing/planned', entityKey: 'factoryPlanned', tab: true },
          { href: '/inventory/manufacturing/actual', entityKey: 'factoryActual', tab: true },
          { href: '/inventory/manufacturing/execution', entityKey: 'factoryExecution', tab: true },
          { href: '/inventory/manufacturing/waste', entityKey: 'factoryWaste', tab: true },
          { href: '/inventory/manufacturing/deviation', entityKey: 'factoryDeviation', tab: true },
          { href: '/inventory/manufacturing/stoppages', entityKey: 'factoryStoppages', tab: true },
        ],
      },
    ],
  },
  {
    id: 'sales',
    label: 'المبيعات',
    icon: ShoppingCart,
    groups: [
      {
        id: 'sales',
        label: 'المبيعات',
        leaves: [
          { href: '/sales', entityKey: 'salesInvoice', tab: true },
          { href: '/sales/withdrawals', entityKey: 'withdrawal', tab: true },
          { href: '/sales/collections', entityKey: 'salesPayment', tab: true },
        ],
      },
      {
        id: 'parties',
        label: 'العملاء والموردين',
        leaves: [
          { href: '/sales/parties', entityKey: 'customer', tab: true },
          { href: '/sales/parties/suppliers', entityKey: 'supplier', tab: true },
          { href: '/sales/parties/orders', entityKey: 'purchaseOrder', tab: true },
          { href: '/sales/parties/receipts', entityKey: 'goodsReceipt', tab: true },
        ],
      },
      {
        id: 'sales-reports',
        label: 'التقارير',
        leaves: [
          { href: '/sales/today', entityKey: 'factorySalesToday', tab: true },
          { href: '/sales/month', entityKey: 'factorySalesMonth', tab: true },
          { href: '/sales/open-orders', entityKey: 'factoryOpenOrders', tab: true },
        ],
      },
    ],
  },
  {
    id: 'accounting',
    label: 'الحسابات',
    icon: FileText,
    groups: [
      {
        id: 'accounting',
        label: 'الحسابات',
        leaves: [
          { href: '/accounting/expenses', entityKey: 'expense', tab: true },
          { href: '/accounting/tax', entityKey: 'taxSettings', tab: true },
        ],
      },
      {
        id: 'accounting-reports',
        label: 'التقارير',
        leaves: [
          { href: '/accounting', entityKey: 'account', tab: true },
          { href: '/accounting/journals', entityKey: 'journalEntry', tab: true },
          { href: '/accounting/vat', entityKey: 'vatReport', tab: true },
          { href: '/accounting/cost', entityKey: 'factoryCostPerTon', tab: true },
          { href: '/accounting/price', entityKey: 'factoryAvgPrice', tab: true },
          { href: '/accounting/margin', entityKey: 'factoryMargin', tab: true },
        ],
      },
    ],
  },
  {
    id: 'hr',
    label: 'الموارد البشرية',
    icon: Users,
    groups: [
      {
        id: 'hr',
        label: 'الموارد البشرية',
        leaves: [
          { href: '/hr', entityKey: 'employee', tab: true },
          { href: '/hr/attendance', entityKey: 'attendance', tab: true },
          { href: '/hr/payroll', entityKey: 'payroll', tab: true },
        ],
      },
      {
        id: 'hr-reports',
        label: 'التقارير',
        leaves: [{ href: '/hr/overtime', entityKey: 'overtime', tab: true }],
      },
    ],
  },
  {
    id: 'tasks',
    label: 'التقارير والمتابعة',
    icon: ClipboardList,
    groups: [
      {
        id: 'tasks',
        label: 'التقارير والمتابعة',
        leaves: [
          { href: '/tasks/material', entityKey: 'materialTrace', tab: true },
          { href: '/tasks/reports', entityKey: 'report', tab: true },
          { href: '/tasks/approvals', entityKey: 'approvals', tab: true },
        ],
      },
    ],
  },
  {
    id: 'settings',
    label: 'الإعدادات',
    icon: Settings,
    groups: [
      {
        id: 'settings',
        label: 'الإعدادات',
        leaves: [
          { href: '/settings', entityKey: 'companySettings', tab: true },
          { href: '/settings/users', entityKey: 'users', tab: true },
          { href: '/settings/audit', entityKey: 'auditLog', tab: false },
        ],
      },
    ],
  },
]

export const EXTRA_LEAVES: RouteLeaf[] = [{ href: '/notifications', entityKey: 'notification', tab: false }]

export type ResolvedRoute = {
  destination: Destination | null
  group: RouteGroup | null
  leaf: RouteLeaf
}

const ALL_LEAVES: RouteLeaf[] = [
  ...DESTINATIONS.flatMap((destination) => destination.groups.flatMap((group) => group.leaves)),
  ...EXTRA_LEAVES,
]

const HREF_TO_LEAF = new Map<string, RouteLeaf>()
const ENTITY_TO_HREF = new Map<string, string>()
for (const leaf of ALL_LEAVES) {
  if (HREF_TO_LEAF.has(leaf.href)) throw new Error(`مسار مكرر: ${leaf.href}`)
  if (ENTITY_TO_HREF.has(leaf.entityKey)) throw new Error(`شاشة مكررة: ${leaf.entityKey}`)
  HREF_TO_LEAF.set(leaf.href, leaf)
  ENTITY_TO_HREF.set(leaf.entityKey, leaf.href)
}

for (const main of ERP_NAV) {
  for (const sub of main.subs) {
    if (!ENTITY_TO_HREF.has(sub.entityKey)) throw new Error(`مسار مفقود: ${sub.entityKey}`)
  }
}

export function leafMeta(entityKey: string) {
  for (const main of ERP_NAV) {
    for (const sub of main.subs) {
      if (sub.entityKey === entityKey) return { label: sub.label, description: sub.description }
    }
  }
  return { label: entityKey, description: '' }
}

export function canSeeEntity(permissions: string[], entityKey: string) {
  if (entityKey === 'dashboard') return true
  for (const main of ERP_NAV) {
    for (const sub of main.subs) {
      if (sub.entityKey === entityKey && canAccessSub(permissions, sub, main)) return true
    }
  }
  return false
}

export function hrefForEntity(entityKey: string) {
  return ENTITY_TO_HREF.get(entityKey) ?? null
}

export function resolvePath(pathname: string): ResolvedRoute | null {
  const path = pathname.split('?')[0]?.replace(/\/$/, '') || '/'
  let best: ResolvedRoute | null = null
  for (const destination of DESTINATIONS) {
    for (const group of destination.groups) {
      for (const leaf of group.leaves) {
        const matches = path === leaf.href || (leaf.href !== '/' && path.startsWith(`${leaf.href}/`))
        if (!matches) continue
        if (!best || leaf.href.length > best.leaf.href.length) best = { destination, group, leaf }
      }
    }
  }
  if (best) return best
  const extra = EXTRA_LEAVES.find((leaf) => path === leaf.href)
  if (!extra) return null
  return { destination: null, group: null, leaf: extra }
}

export function visibleDestinations(permissions: string[]) {
  return DESTINATIONS.filter((destination) =>
    destination.groups.some((group) => group.leaves.some((leaf) => canSeeEntity(permissions, leaf.entityKey))),
  )
}

export function pageTabs(resolved: ResolvedRoute, permissions: string[]) {
  const destination = resolved.destination
  if (!destination) return { primary: [] as PageTab[], secondary: [] as PageTab[], activePrimary: '', activeSecondary: '' }
  const groups = destination.groups
    .map((group) => ({
      ...group,
      leaves: group.leaves.filter((leaf) => canSeeEntity(permissions, leaf.entityKey)),
    }))
    .filter((group) => group.leaves.some((leaf) => leaf.tab))
  if (groups.length === 0) return { primary: [] as PageTab[], secondary: [] as PageTab[], activePrimary: '', activeSecondary: '' }
  if (groups.length === 1) {
    const primary = groups[0]!.leaves
      .filter((leaf) => leaf.tab)
      .map((leaf) => ({ id: leaf.href, href: leaf.href, label: leafMeta(leaf.entityKey).label }))
    return { primary, secondary: [] as PageTab[], activePrimary: resolved.leaf.href, activeSecondary: '' }
  }
  const primary = groups.map((group) => {
    const first = group.leaves.find((leaf) => leaf.tab) ?? group.leaves[0]!
    return { id: group.id, href: first.href, label: group.label }
  })
  const activeGroup = groups.find((group) => group.id === resolved.group?.id) ?? groups[0]!
  const secondary = activeGroup.leaves
    .filter((leaf) => leaf.tab)
    .map((leaf) => ({ id: leaf.href, href: leaf.href, label: leafMeta(leaf.entityKey).label }))
  return { primary, secondary, activePrimary: activeGroup.id, activeSecondary: resolved.leaf.href }
}

export type PageTab = { id: string; href: string; label: string }

export type SidebarNode = { id: string; href: string; label: string; children: SidebarNode[] }

/** Same tabs shown on the page, nested for the sidebar. */
export function sidebarNodes(destination: Destination, permissions: string[]): SidebarNode[] {
  const groups = destination.groups
    .map((group) => ({
      ...group,
      leaves: group.leaves.filter((leaf) => leaf.tab && canSeeEntity(permissions, leaf.entityKey)),
    }))
    .filter((group) => group.leaves.length > 0)
  if (groups.length === 0) return []
  if (groups.length === 1) {
    const leaves = groups[0]!.leaves
    if (leaves.length < 2) return []
    return leaves.map((leaf) => ({
      id: leaf.href,
      href: leaf.href,
      label: leafMeta(leaf.entityKey).label,
      children: [],
    }))
  }
  return groups.map((group) => {
    const first = group.leaves[0]!
    const children =
      group.leaves.length > 1
        ? group.leaves.map((leaf) => ({
            id: leaf.href,
            href: leaf.href,
            label: leafMeta(leaf.entityKey).label,
            children: [] as SidebarNode[],
          }))
        : []
    return { id: group.id, href: first.href, label: group.label, children }
  })
}

export function breadcrumbs(resolved: ResolvedRoute, permissions: string[]) {
  const meta = leafMeta(resolved.leaf.entityKey)
  const crumbs: Array<{ href: string; label: string }> = [{ href: '/', label: 'الرئيسية' }]
  if (!resolved.destination || resolved.destination.id === 'home') {
    if (meta.label !== 'الرئيسية') crumbs.push({ href: resolved.leaf.href, label: meta.label })
    return crumbs
  }
  const entry = entryHref(resolved.destination, permissions)
  crumbs.push({ href: entry, label: resolved.destination.label })
  if (resolved.group && resolved.destination.groups.length > 1 && resolved.group.label !== crumbs[crumbs.length - 1]?.label) {
    const first = resolved.group.leaves.find((leaf) => leaf.tab) ?? resolved.group.leaves[0]!
    crumbs.push({ href: first.href, label: resolved.group.label })
  }
  if (meta.label !== crumbs[crumbs.length - 1]?.label) crumbs.push({ href: resolved.leaf.href, label: meta.label })
  return crumbs
}

export function entryHref(destination: Destination, permissions: string[]) {
  for (const group of destination.groups) {
    const leaf = group.leaves.find((item) => item.tab && canSeeEntity(permissions, item.entityKey))
    if (leaf) return leaf.href
  }
  for (const group of destination.groups) {
    const leaf = group.leaves.find((item) => canSeeEntity(permissions, item.entityKey))
    if (leaf) return leaf.href
  }
  return '/'
}
