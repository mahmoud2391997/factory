# Day 4 — Complete ✅

**Status:** Done  
**Scope:** Precise inventory balances + inventory ledger (no stock change without a trail)

## Acceptance checklist

| Item | Status |
|------|--------|
| Live balances per warehouse / item / batch | ✅ `balances` snapshot |
| Every stock movement writes a ledger row | ✅ `ledger` with prev/new qty |
| Add stock updates balance **and** ledger | ✅ receipt + positive adjustment |
| Issue stock updates balance **and** ledger | ✅ negative adjustment / transfer / sale / consumption |
| Negative stock blocked | ✅ engine rejects over-issue |
| Ledger ↔ balance integrity invariant | ✅ `inventoryIntegrity()` |
| Arabic ledger screen (type labels, before/after) | ✅ المخزون → دفتر الحركات |

## How the business owner verifies

1. Open **المخزون والمستودعات → أرصدة المخزون** — see current qty and cost.  
2. Open **دفتر الحركات** — every add/issue shows type, qty, balance before, balance after.  
3. Approve a stock adjustment (or receive goods) — both screens update together.

## What Day 4 is **not** (later days)

- Full purchase → receipt path as the primary workflow (Day 5)  
- Inter-warehouse transfer as the Day focus (Day 6)  
- Production consumption / sales confirm as the Day focus (Days 8–9)

Day 4 delivers the **ledger-first inventory core** those later days rely on.

## Tests

```bash
pnpm test:erp
```

Day 4 cases:

- `day 4: seeded stock balances reconcile with the inventory ledger`
- `day 4: every stock add and issue updates balance and ledger together`
- `day 4: goods receipt posts purchase ledger lines that match WH_RAW balances`

## Files

- `apps/web/lib/erp/domain/engine.ts` — `upsertBalance` / `addLedger` / `issueBatch` / `fifoIssue`
- `apps/web/lib/erp/domain/reports.ts` — `inventoryIntegrity`
- `apps/web/lib/erp/domain/engine.test.ts` — Day 4 acceptance tests
- `apps/web/components/erp/live/screens-ops.tsx` — balances + ledger screens
- `apps/web/components/erp/live/format.ts` — Arabic movement type labels
