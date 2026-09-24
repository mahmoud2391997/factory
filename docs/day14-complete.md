# Day 14 — Complete ✅

**Status:** Done  
**Scope:** Full mill path (days 5–13) plus handover: backup, Arabic manual, and a single acceptance test

## Acceptance checklist

| Item | Status |
|------|--------|
| Supplier → purchase order → manager approval → goods receipt into `WH_RAW` | ✅ |
| Receipt refused before approval or above the order | ✅ |
| Transfer changes both warehouses and writes ledger lines | ✅ |
| Stock adjustment needs a reason and manager approval | ✅ |
| Recipe calculates expected quantities on a production order | ✅ |
| Completing production consumes `WH_MFG`, records waste, and posts output to `WH_FG` | ✅ |
| Variance above the company threshold requires a reason | ✅ |
| Closed orders show expected-vs-actual difference and waste | ✅ |
| Sales confirmation and withdrawals reduce finished goods and block overselling | ✅ |
| Receipt, production, sale, and payment post balanced journals | ✅ |
| Oman VAT rate is configurable and stays in OMR | ✅ |
| Product trace shows supplier, purchase order, receipt, production, and invoice | ✅ |
| Operations cannot see journals or the audit log | ✅ |
| JSON backup from company settings | ✅ `/api/erp/backup` |
| Arabic operating manual | ✅ `docs/user-manual-ar.md` |

## How to verify

```bash
pnpm test:erp
```

The path from a blank factory through sale and collection is `days 5–13: supplier to sale on one balanced mill path` in `apps/web/lib/erp/domain/plan-acceptance.test.ts`.

## What the business owner opens

1. **المشتريات** — supplier, purchase order, goods receipt.  
2. **المخزون** — transfer and stock adjustment.  
3. **التصنيع** — recipe, production order, complete (output and variance).  
4. **المبيعات** — invoice, confirm, withdrawal, collection.  
5. **التقارير والنظام → التقارير** — product trace from supplier to invoice.  
6. **إعدادات الشركة** — OMR, VAT rate, and **تنزيل نسخة احتياطية**.

Daily use is written in `docs/user-manual-ar.md`. Hosting notes are in `docs/hosting-oman.md`.
