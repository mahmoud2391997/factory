# Phase 2 Audit Report — Factory ERP

**Auditor:** Senior Full-Stack + QA Engineer  
**Date:** 2026-10-04  
**Target:** Feed-Factory ERP (`apps/web`, `packages/database`)  
**Scope:** Table & selection components, locale & RTL mechanics, inventory architecture & routes, tab metrics, and selection bug root cause.

---

## 1. Table and Selection Components & Usage

### 1.1 `DataTable` (`apps/web/components/erp/live/bits.tsx`)
- **Current State:**
  - Implements an internal `selectedRows` state as `Set<number>` tracking array indices of the currently rendered rows.
  - Header renders a master checkbox to select/deselect currently visible page rows (`visibleIndexes`).
  - Each body row renders an individual checkbox bound to `selectedRows.has(originalIndex)`.
  - **Critical Flaw:** No action toolbar, action buttons, or callback handler are provided. When a user selects rows, the checkboxes toggle visually, but no action UI appears anywhere on screen.
  - **Index Instability:** Sorting (`sort`), filtering (`query`), or pagination (`page`) shifts array indices, causing checked states to map to completely unrelated data records.
- **Usages across the codebase:**
  - `screens-ops.tsx`: 20+ instances (materials, products, warehouses, transfers, adjustments, batches, ledger, purchase orders, receipts, sales invoices, deliveries, distributions).
  - `screens-factory.tsx`: 14+ instances (planned, actual, stoppages, execution, production orders, lots, waste, variance).
  - `screens-qc.tsx`: 4 instances (quality samples, supplier quality, lab tests, monthly metrics).
  - `screens-office.tsx`: 18+ instances (accounts, journals, bank transactions, expenses, VAT, utilities, obligations, vehicles, fuel, trips, machines, maintenance).
  - `lot-view.tsx`: 7 instances (traceability, customer deliveries, ingredient batches, cost lines).

### 1.2 `EntityPage` (`apps/web/components/erp/entity-page.tsx`)
- Generic CRUD page rendering a table for administrative entity views.
- Has individual row action buttons (`Pencil`, `Trash2`), search input, and single-record dialog form.
- **Current State:** Contains **no selection capability at all** (no checkboxes, no bulk operations).

---

## 2. Locale Mechanism and HTML Lang / Dir

### 2.1 Provider & Storage (`apps/web/lib/i18n/language-provider.tsx`)
- Supported languages:
  - `ar`: Arabic (Default), Direction: `rtl`
  - `en`: English, Direction: `ltr`
  - `hi`: Hindi, Direction: `ltr`
- Storage: `localStorage.getItem('erp-language')`. Defaults to `'ar'` when unset.
- Direction synchronization:
  - Dynamically mutates `document.documentElement.lang = language` and `document.documentElement.dir = directionFor(language)`.
  - No page refresh required; state is managed through React Context (`LanguageContext`).

### 2.2 Semantic Meaning of "Locale" in `erp-shell.tsx` and `live/*`
- In `erp-shell.tsx`: `useLanguage()` dictates topbar translations, sidebar workspace names, search placeholders, breadcrumb hierarchy, and user profile labels.
- In `live/*` and `format.ts`:
  - Currencies formatted via `moneyFmt(amount)` using Omani Rial (`OMR` / `ر.ع.`) formatted with 3 decimal places (e.g. `12.500 ر.ع.`).
  - Numbers and dates formatted via locale-aware formatters (`Intl.NumberFormat`, `Intl.DateTimeFormat`) or localized fallback strings.
  - `LocalizedContent` recursively translates raw Arabic string nodes into active language equivalents using the central translation dictionary (`translations.ts`).

---

## 3. Inventory Routes, Entities, and Engine Commands

### 3.1 Nav Configuration Group `inventory` ("المخازن")
Defined in `apps/web/lib/nav/config.ts` under workspace `inventory`:
1. **`materials` (المواد الخام والمنتجات):**
   - `/inventory/raw-materials` (`material`) — Raw materials catalog, min quantities, units.
   - `/inventory/products` (`product`) — Finished feed products, bag weights, base prices.
2. **`spares` (مخزن قطع الغيار):**
   - `/inventory/extensions?kind=spare` (`inventoryExtensions`) — Spare parts inventory and min thresholds.
3. **`packaging` (مخزن مواد التعبئة والتشغيل):**
   - `/inventory/extensions?kind=packaging` (`inventoryExtensions-packaging`) — Feed bags, sewing threads, tags, inks.
4. **`movement` (الحركات والجرد والتقارير):**
   - `/inventory/raw-materials/value` (`factoryStockValue`) — Total inventory valuation at cost.
   - `/inventory/raw-materials/running-out` (`factoryRunningOut`) — Near-depletion alerts based on minQty.
   - `/inventory/raw-materials/stagnant` (`factoryStagnant`) — Slow-moving materials (no movement in 7+ days).
   - `/inventory/raw-materials/reserved` (`factoryReserved`) — Reserved for production / in-process manufacturing warehouse.
   - `/inventory/warehouses` (`warehouse`) — Warehouse balances across Raw, Manufacturing, and Finished Goods.
   - `/inventory/warehouses/transfers` (`stockTransfer`) — Warehouse transfers between WH_RAW, WH_MFG, and WH_FG.
   - `/inventory/warehouses/adjustments` (`stockAdjustment`) — Stock adjustments with mandatory reason codes and manager approvals.
   - `/inventory/warehouses/barcode` (`barcode`) — Barcode scanner terminal and label printing.
   - `/inventory/raw-materials/batches` (`materialBatch`) — Material lot tracking, supplier batch codes, expiry dates.
   - `/inventory/raw-materials/balances` (`inventoryBalance`) — Real-time balances and weighted average cost.
   - `/inventory/raw-materials/ledger` (`inventoryTransaction`) — Immutable audit ledger of all stock transactions.
   - `/inventory/reports` (`inventoryReports`) — Stock valuation and movement reporting.

### 3.2 Related Cross-Workspace Inventory Routes
- **Purchasing:** `/sales/parties/receipts` (`goodsReceipt`), `/inventory/raw-materials/price-analysis` (`materialPriceAnalysis`).
- **Production:** `/inventory/manufacturing/scale` (`scaleReading`), `/tasks/material` (`materialTrace`).

### 3.3 Engine Commands (`apps/web/lib/erp/domain/engine.ts`)
- `createMaterial`, `updateMaterial`, `deleteMaterial` (validates active inventory balance and recipe usage).
- `createProduct`, `updateProduct`, `deleteProduct` (validates recipe and lot dependencies).
- `createStockTransfer` (moves stock atomically between warehouses, records ledger entry).
- `createStockAdjustment` (modifies quantities with mandatory reason, updates valuation ledger).
- `createGoodsReceipt` (receives PO materials into raw warehouse, increases stock).
- `addInventoryItem`, `consumeInventoryItem` (handles spare parts and packaging items).

---

## 4. Inner Tab Inventory and Tab Counts

Page tabs are defined per section in `NAV_CONFIG`:
| Workspace | Section | Page Count | Tabs Active | Overflow Behavior |
| :--- | :--- | :---: | :---: | :--- |
| **Home** | `owner` | 1 | 0 (tab=false) | Hidden |
| **Sales** | `customers` | 6 | 6 | All visible |
| **Sales** | `collections` | 2 | 2 | All visible |
| **Sales** | `distribution` | 3 | 3 | All visible |
| **Sales** | `delivery` | 1 | 1 | Hidden (count < 2) |
| **Sales** | `profitability` | 4 | 4 | All visible |
| **Purchasing**| `purchasing` | 4 | 4 | All visible |
| **Purchasing**| `communications` | 3 | 3 | All visible |
| **Purchasing**| `raw-prices` | 1 | 1 | Hidden (count < 2) |
| **Inventory** | `materials` | 2 | 2 | All visible |
| **Inventory** | `spares` | 1 | 1 | Hidden (count < 2) |
| **Inventory** | `packaging` | 1 | 1 | Hidden (count < 2) |
| **Inventory** | `movement` | **12** | **12** | **Overflows (Max 7 visible, 6 in "المزيد" dropdown)** |
| **Production**| `manufacturing` | **8** | **8** | **Overflows (Max 7 visible, 2 in "المزيد" dropdown)** |
| **Production**| `recipes` | 2 | 2 | All visible |
| **Production**| `customer-recipes` | 1 | 1 | Hidden (count < 2) |
| **Production**| `quality` | 2 | 2 | All visible |
| **Production**| `trace` | 2 | 2 | All visible |
| **Production**| `yield-variance`| 3 | 3 | All visible |
| **Fleet** | `vehicles` | 3 | 3 | All visible |
| **Fleet** | `maintenance` | 4 | 4 | All visible |
| **Finance** | `obligations` | 1 | 1 | Hidden (count < 2) |
| **Finance** | `bank` | 4 | 4 | All visible |
| **Finance** | `expenses` | 4 | 4 | All visible |
| **Finance** | `utilities` | 1 | 1 | Hidden (count < 2) |
| **People** | `employees` | 4 | 4 | All visible |
| **People** | `documents` | 1 | 1 | Hidden (count < 2) |
| **Admin** | `users` | 1 | 1 | Hidden (count < 2) |
| **Admin** | `approvals` | 1 | 1 | Hidden (count < 2) |
| **Admin** | `settings` | 2 | 2 | All visible |

**Key Finding:** `inventory.movement` (12 tabs) and `production.manufacturing` (8 tabs) cause horizontal overflow and menu collapsing under the current tab strip design.

---

## 5. Root Cause of the Selection Bug

1. **Missing Action UI:**
   In `apps/web/components/erp/live/bits.tsx`, `DataTable` renders row and header checkboxes, toggling items in `selectedRows: Set<number>`. However, there is zero UI component or toolbar rendered when `selectedRows.size > 0`. The user selects items, but the application provides no actions, feedback, or visual count.
2. **Volatile Keying (Index-based vs Stable-ID):**
   `selectedRows` stores the row's array index (`number`). Whenever the user sorts a column, searches with a query filter, or changes pages, the row indices shift, corrupting the selected set and pointing to arbitrary records.
3. **No Engine Action Integration:**
   There is no connection between selected table items and the ERP engine commands (`applyCommand`). Specifically, bulk deletion (e.g., deleting multiple unreferenced materials or customers) or bulk status updates were never wired up.
4. **No Pagination/Filter Distinction:**
   Selecting the header checkbox only selects visible items on the current page (`visibleIndexes`), with no capability or indication to select all matching items across all pages.
5. **No Partial-Failure Handling:**
   When an operation fails on a subset of selected records (e.g. attempting to delete materials where one is referenced by an active recipe or has stock balance), the system provides no per-item failure reporting or partial-selection retention.

---

## Next Steps for Task H Implementation
- Build a dedicated, reusable selection state hook/helper with stable string record IDs (`Set<string>`).
- Implement a responsive floating / sticky Selected Count Toolbar in `DataTable` and `EntityPage`.
- Provide "Select all on page" vs "Select all N matching results".
- Support bulk delete with confirmation modal and permission gating (`inventory.manage` / `users.manage`).
- Implement per-item engine command execution with rollback/error isolation: clear successfully deleted items from selection and leave failed items selected with descriptive error feedback.
- Add comprehensive test coverage in pure unit tests and engine integration tests.
