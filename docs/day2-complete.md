# Day 2 — Complete ✅

**Status:** Done  
**Scope:** ERP shell (Arabic main/sub tabs) + schema-driven screens + demo mode + factory branding  

## Acceptance checklist

| Item | Status |
|------|--------|
| Arabic sidebar with main factory sections | ✅ |
| Subtabs for each main section | ✅ |
| Schema forms for all entity pages (create / edit / list) | ✅ 29/29 |
| Demo seed data on every entity screen | ✅ |
| Demo login when database is not connected | ✅ |
| Login + shell brand: **مصنع الخليج للأعلاف** (factory, not farms) | ✅ |
| Dashboard overview in Arabic | ✅ |

## What Day 2 delivers for the business owner

- Open the system and see all factory departments in Arabic  
- Open any screen (inventory, purchases, production, sales, accounts, HR, reports)  
- Add / edit records from forms that match the data model  
- Try the product even before the live database is fully wired (demo mode)

## What is **not** Day 2 (starts Day 3+)

- Real inventory ledger on the server (stock that cannot go negative)  
- Purchase → receipt → production → sales as one live chain  
- Automatic accounting postings  

## Files

- `apps/web/components/erp/erp-shell.tsx`
- `apps/web/components/erp/entity-page.tsx`
- `apps/web/components/erp/schema-form.tsx`
- `apps/web/lib/erp-nav.ts`
- `apps/web/lib/erp-schema.ts`
- `apps/web/app/login/page.tsx`
- `apps/web/server/demo.ts`
