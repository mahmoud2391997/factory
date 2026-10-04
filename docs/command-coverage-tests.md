# Engine Command Coverage Tests

This matrix audits the command discriminants declared by `Command` in `apps/web/lib/erp/domain/types.ts`. This repository does **not** export a runtime `COMMAND_ACTIONS` array; the typed `Command['action']` union is the source of truth.

A happy-path reference is listed only when that action is invoked through the successful `must(...)` helper. Permission denial requires a permission-focused test that invokes the exact action through `applyCommand` and asserts failure. Business-validation failures and unrelated denied actions in the same test do not count. `MISSING` means this exact coverage was not found.

**Inventory:** 134 command actions; 179 domain test blocks scanned.

| Command action | Happy-path test | Permission-denied test |
|---|---|---|
| `createMaterial` | `cost.test.ts: lot cost includes bags and rates, manual lines win, and the invoice price sets the margin` | **MISSING** |
| `createProduct` | `bank.test.ts: a credit naming a customer auto-matches their open invoice` | **MISSING** |
| `createSupplier` | `cost.test.ts: lot cost includes bags and rates, manual lines win, and the invoice price sets the margin` | **MISSING** |
| `createCustomer` | `bank.test.ts: a credit naming a customer auto-matches their open invoice` | **MISSING** |
| `createEmployee` | `alerts.test.ts: vehicle papers fire the 90/60/30/7 ladder and an expired alert` | **MISSING** |
| `updateEmployee` | `alerts.test.ts: employee residence and contract papers alert the GM and the accountant` | **MISSING** |
| `createRecipe` | `cost.test.ts: lot cost includes bags and rates, manual lines win, and the invoice price sets the margin` | **MISSING** |
| `setVarianceThresholds` | `variance.test.ts: product threshold takes precedence over recipe and company` | **MISSING** |
| `updateCompany` | `cost-allocation.test.ts: utilities use the month reading (ACTUAL) and fall back to the company rate (ESTIMATED)` | **MISSING** |
| `fundBank` | `flow-audit.test.ts: Flow Chain 7: Financial obligations, bank reconciliation, expense approvals, and payroll processing` | **MISSING** |
| `createPurchaseRequest` | `flow-audit.test.ts: Flow Chain 1: Procure-to-Pay lifecycle` | **MISSING** |
| `addSupplierQuotation` | `flow-audit.test.ts: Flow Chain 1: Procure-to-Pay lifecycle` | **MISSING** |
| `selectSupplierQuotation` | `flow-audit.test.ts: Flow Chain 1: Procure-to-Pay lifecycle` | **MISSING** |
| `decidePurchaseRequest` | `flow-audit.test.ts: Flow Chain 1: Procure-to-Pay lifecycle` | **MISSING** |
| `convertRequestToPurchaseOrder` | `flow-audit.test.ts: Flow Chain 1: Procure-to-Pay lifecycle` | **MISSING** |
| `createPurchaseOrder` | `cost.test.ts: lot cost includes bags and rates, manual lines win, and the invoice price sets the margin` | **MISSING** |
| `decidePurchaseOrder` | `cost.test.ts: lot cost includes bags and rates, manual lines win, and the invoice price sets the margin` | **MISSING** |
| `receiveGoods` | `cost.test.ts: lot cost includes bags and rates, manual lines win, and the invoice price sets the margin` | **MISSING** |
| `transferStock` | `cost.test.ts: lot cost includes bags and rates, manual lines win, and the invoice price sets the margin` | `engine.test.ts: inventory permissions are enforced inside applyCommand` |
| `requestAdjustment` | `engine.test.ts: day 4: every stock add and issue updates balance and ledger together` | **MISSING** |
| `decideAdjustment` | `engine.test.ts: day 4: every stock add and issue updates balance and ledger together` | **MISSING** |
| `createProductionOrder` | `cost.test.ts: lot cost includes bags and rates, manual lines win, and the invoice price sets the margin` | **MISSING** |
| `completeProduction` | `cost-approval.test.ts: pending line is excluded from totals and journals until approval updates the margin` | **MISSING** |
| `decideProductionCost` | `cost-approval.test.ts: pending line is excluded from totals and journals until approval updates the margin` | **MISSING** |
| `recalculateLotCosts` | `cost-allocation.test.ts: completion snapshots the cost; month-close recalculation replaces ESTIMATED with ACTUAL` | **MISSING** |
| `createInvoice` | `bank.test.ts: a credit naming a customer auto-matches their open invoice` | **MISSING** |
| `confirmInvoice` | `cost-allocation.test.ts: invoice trip cost is distributed by delivered lot quantity, requires independent approval, and is posted once` | **MISSING** |
| `recordPayment` | `flow-audit.test.ts: Flow Chain 5: Order-to-Cash, delivery stages, and customer payment collection` | **MISSING** |
| `createWithdrawal` | `flow-audit.test.ts: Flow Chain 5: Order-to-Cash, delivery stages, and customer payment collection` | **MISSING** |
| `createExpense` | `flow-audit.test.ts: Flow Chain 7: Financial obligations, bank reconciliation, expense approvals, and payroll processing` | **MISSING** |
| `decideExpense` | `flow-audit.test.ts: Flow Chain 7: Financial obligations, bank reconciliation, expense approvals, and payroll processing` | **MISSING** |
| `recordAttendance` | `flow-audit.test.ts: Flow Chain 7: Financial obligations, bank reconciliation, expense approvals, and payroll processing` | **MISSING** |
| `importAttendance` | **MISSING** | **MISSING** |
| `createPayroll` | `cost-allocation.test.ts: production payroll is spread over the month tons and corrected at month close` | **MISSING** |
| `decidePayroll` | `cost-allocation.test.ts: production payroll is spread over the month tons and corrected at month close` | **MISSING** |
| `payPayroll` | `flow-audit.test.ts: Flow Chain 7: Financial obligations, bank reconciliation, expense approvals, and payroll processing` | **MISSING** |
| `markNotificationRead` | **MISSING** | **MISSING** |
| `scanBarcode` | **MISSING** | **MISSING** |
| `setRolePermissions` | `plan-acceptance.test.ts: days 5–13: supplier to sale on one balanced mill path` | **MISSING** |
| `createUser` | **MISSING** | **MISSING** |
| `setUserPassword` | **MISSING** | **MISSING** |
| `archiveHistory` | **MISSING** | **MISSING** |
| `createQualitySample` | `e2e-flow.test.ts: seeded mill: quality, lot, invoice, traces, journals, and dashboard agree` | **MISSING** |
| `updateQualityResult` | `e2e-flow.test.ts: seeded mill: quality, lot, invoice, traces, journals, and dashboard agree` | **MISSING** |
| `setQcLimits` | `e2e-flow.test.ts: seeded mill: quality, lot, invoice, traces, journals, and dashboard agree` | **MISSING** |
| `addQualitySampleAttachment` | `qc.test.ts: pending sample results block use and lab report attachments are audited` | **MISSING** |
| `holdLot` | `qc.test.ts: manual holds, release reasons, and recalls are permission-checked and audited` | **MISSING** |
| `releaseLot` | `qc.test.ts: manual holds, release reasons, and recalls are permission-checked and audited` | **MISSING** |
| `recallLot` | `flow-audit.test.ts: Flow Chain 4: Quality controls, raw quarantine, finished lot recall, and forward/backward trace` | **MISSING** |
| `holdRawBatch` | `qc.test.ts: manual holds, release reasons, and recalls are permission-checked and audited` | **MISSING** |
| `releaseRawBatch` | `qc.test.ts: manual holds, release reasons, and recalls are permission-checked and audited` | **MISSING** |
| `createSparePart` | `alerts.test.ts: spare parts and packaging below their minimum raise low-stock alerts` | **MISSING** |
| `recordSparePartUsage` | `flow-audit.test.ts: Flow Chain 6: Fleet management and trip delivery cost allocation to production lots` | **MISSING** |
| `createPackagingMaterial` | `alerts.test.ts: spare parts and packaging below their minimum raise low-stock alerts` | **MISSING** |
| `recordPackagingConsumption` | `flow-audit.test.ts: Flow Chain 3: Production manufacturing, scale hopper idempotency, and cost approval` | **MISSING** |
| `recordPackagingCount` | `packaging-count.test.ts: a packaging count records the variance and waits for approval` | **MISSING** |
| `decidePackagingCount` | `packaging-count.test.ts: approving a count posts a ledger adjustment and records the waste value` | **MISSING** |
| `createLeaveRequest` | `flow-audit.test.ts: Flow Chain 7: Financial obligations, bank reconciliation, expense approvals, and payroll processing` | **MISSING** |
| `decideLeaveRequest` | `flow-audit.test.ts: Flow Chain 7: Financial obligations, bank reconciliation, expense approvals, and payroll processing` | **MISSING** |
| `createSupplierTemplate` | **MISSING** | **MISSING** |
| `sendSupplierCommunication` | **MISSING** | **MISSING** |
| `approveSupplierCommunication` | **MISSING** | **MISSING** |
| `markSupplierCommunicationDelivered` | **MISSING** | **MISSING** |
| `markSupplierCommunicationFailed` | **MISSING** | **MISSING** |
| `recordScaleReading` | `e2e-flow.test.ts: seeded mill: quality, lot, invoice, traces, journals, and dashboard agree` | **MISSING** |
| `createDistributionPoint` | `units.test.ts: distribution closing reconciles money against money and goods against goods` | **MISSING** |
| `closeDistributionDay` | `units.test.ts: distribution closing reconciles money against money and goods against goods` | **MISSING** |
| `advanceInvoiceDelivery` | `flow-audit.test.ts: Flow Chain 5: Order-to-Cash, delivery stages, and customer payment collection` | **MISSING** |
| `recordUtilitiesReading` | `cost-allocation.test.ts: utilities use the month reading (ACTUAL) and fall back to the company rate (ESTIMATED)` | **MISSING** |
| `createMachine` | `alerts.test.ts: machine maintenance due date comes from the earliest schedule and alerts on the ladder` | **MISSING** |
| `createMaintenanceSchedule` | `alerts.test.ts: machine maintenance due date comes from the earliest schedule and alerts on the ladder` | **MISSING** |
| `recordMaintenance` | `alerts.test.ts: hours-based schedules alert once reported run hours pass the interval` | **MISSING** |
| `recordBankTransaction` | `bank.test.ts: recordBankTransaction stores a valid transaction unmatched and blocks duplicate ids` | **MISSING** |
| `matchBankTransaction` | `bank.test.ts: matchBankTransaction rejects a target that does not exist` | **MISSING** |
| `createCustomerRecipe` | **MISSING** | **MISSING** |
| `setCustomerPricing` | **MISSING** | **MISSING** |
| `setAlternativeBagWeights` | **MISSING** | **MISSING** |
| `createVehicle` | `alerts.test.ts: vehicle papers fire the 90/60/30/7 ladder and an expired alert` | **MISSING** |
| `updateVehicle` | `alerts.test.ts: vehicle papers fire the 90/60/30/7 ladder and an expired alert` | **MISSING** |
| `addFuelLog` | `fleet.test.ts: addFuelLog requires valid input and updates odometer` | **MISSING** |
| `addVehicleService` | `alerts.test.ts: vehicle upcoming service fires the ladder off the latest service of that kind` | **MISSING** |
| `createTrip` | `cost-allocation.test.ts: inbound trip cost is allocated to lots on input tonnage` | **MISSING** |
| `requestTripCostAllocation` | `cost-allocation.test.ts: invoice trip cost is distributed by delivered lot quantity, requires independent approval, and is posted once` | **MISSING** |
| `decideTripCostAllocation` | `flow-audit.test.ts: Flow Chain 6: Fleet management and trip delivery cost allocation to production lots` | **MISSING** |
| `createObligation` | `flow-audit.test.ts: Flow Chain 7: Financial obligations, bank reconciliation, expense approvals, and payroll processing` | **MISSING** |
| `decideObligation` | `obligations.test.ts: decideObligation approves or cancels obligation` | **MISSING** |
| `payObligationInstallment` | `flow-audit.test.ts: Flow Chain 7: Financial obligations, bank reconciliation, expense approvals, and payroll processing` | **MISSING** |
| `createCompanyDocument` | `documents.test.ts: createCompanyDocument stores the document and audits it` | **MISSING** |
| `renewCompanyDocument` | `documents.test.ts: renewCompanyDocument moves the dates and clears the old alerts` | **MISSING** |
| `addCompanyDocumentAttachment` | `documents.test.ts: document attachments are permission checked, validated and kept with their issue-date version` | **MISSING** |
| `updateMaterial` | **MISSING** | **MISSING** |
| `deleteMaterial` | **MISSING** | **MISSING** |
| `updateProduct` | **MISSING** | **MISSING** |
| `deleteProduct` | **MISSING** | **MISSING** |
| `updateSupplier` | **MISSING** | **MISSING** |
| `deleteSupplier` | **MISSING** | **MISSING** |
| `updateCustomer` | **MISSING** | **MISSING** |
| `deleteCustomer` | **MISSING** | **MISSING** |
| `deleteEmployee` | **MISSING** | **MISSING** |
| `deleteVehicle` | **MISSING** | **MISSING** |
| `updateMachine` | **MISSING** | **MISSING** |
| `deleteMachine` | **MISSING** | **MISSING** |
| `updateSparePart` | **MISSING** | **MISSING** |
| `deleteSparePart` | **MISSING** | **MISSING** |
| `updatePackagingMaterial` | **MISSING** | **MISSING** |
| `deletePackagingMaterial` | **MISSING** | **MISSING** |
| `updateDistributionPoint` | **MISSING** | **MISSING** |
| `deleteDistributionPoint` | **MISSING** | **MISSING** |
| `updateRecipe` | **MISSING** | **MISSING** |
| `deleteRecipe` | **MISSING** | **MISSING** |
| `updateUser` | **MISSING** | **MISSING** |
| `deleteUser` | **MISSING** | **MISSING** |
| `deleteMaintenanceSchedule` | **MISSING** | **MISSING** |
| `updateSupplierTemplate` | **MISSING** | **MISSING** |
| `deleteSupplierTemplate` | **MISSING** | **MISSING** |
| `deleteCompanyDocument` | **MISSING** | **MISSING** |
| `updateCompanyDocument` | **MISSING** | **MISSING** |
| `deleteObligation` | **MISSING** | **MISSING** |
| `updateObligation` | **MISSING** | **MISSING** |
| `deleteCustomerRecipe` | **MISSING** | **MISSING** |
| `updateCustomerRecipe` | **MISSING** | **MISSING** |
| `updateMaintenanceSchedule` | **MISSING** | **MISSING** |
| `updateMaintenanceRecord` | **MISSING** | **MISSING** |
| `deleteMaintenanceRecord` | **MISSING** | **MISSING** |
| `deleteQualitySample` | **MISSING** | **MISSING** |
| `updateExpense` | **MISSING** | **MISSING** |
| `deleteExpense` | **MISSING** | **MISSING** |
| `deletePurchaseRequest` | **MISSING** | **MISSING** |
| `deletePurchaseOrder` | **MISSING** | **MISSING** |
| `deleteProductionOrder` | **MISSING** | **MISSING** |
| `deleteInvoice` | **MISSING** | **MISSING** |
| `deleteFuelLog` | **MISSING** | **MISSING** |
| `deleteVehicleService` | **MISSING** | **MISSING** |
| `deleteAttendance` | **MISSING** | **MISSING** |

## Reading the gaps

- Direct authorization coverage is intentionally stricter than checking role-permission arrays: it exercises the command through `applyCommand`.
- The seven `flow-audit.test.ts` chains now assert concrete stock, journal, costing, QC, delivery, fleet, maintenance/spares, packaging, obligations, bank, expense, utilities, attendance, leave, and payroll values.
- `deleteMaterial` has a regression test proving a material referenced by a recipe cannot be deleted; happy-path deletion of an unreferenced material remains `MISSING`.
- No dedicated customer sales-return command exists in the `Command` union. `closeDistributionDay` accepts aggregate return quantities but does not restock an invoice lot or reverse receivables/VAT/COGS. Stock-after-customer-return is therefore **MISSING** and needs an agreed credit-note/accounting policy before adding behavior.
- This is a point-in-time matrix. When adding a command, update the matrix and provide success and authorization-denial tests where applicable.
