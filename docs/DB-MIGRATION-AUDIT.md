# Prisma schema and migration audit

Audited against `packages/database/prisma/schema.prisma` and the SQL files under `packages/database/prisma/migrations` on 2026-10-04.

## Runtime boundary

Application code persists ERP business data as one versioned JSON document (`ErpDocument`, id `main`) with optimistic revision checks. Archive data is written through `ArchiveRecord`. These are the only Prisma models referenced by the application runtime (`apps/web/server/erp/store.ts` and `apps/web/server/erp/archive-store.ts`). The other schema models are not used by the current ERP runtime. They have been retained; this audit does not propose deleting them.

## Schema models with no migration table

The following 17 models are present in `schema.prisma` but no migration creates their tables:

- `ProductionLot`
- `BatchMaterialLink`
- `QualitySample`
- `ProductionCostLine`
- `LotDelivery`
- `Vehicle`
- `VehicleMaintenance`
- `FuelLog`
- `TripLog`
- `FinancialObligation`
- `BankTransaction`
- `Machine`
- `MachineMaintenance`
- `CompanyDocument`
- `UtilityMeter`
- `UtilityReading`
- `SupplierCommunication`

All other 36 schema models currently have corresponding `CREATE TABLE` statements in the migration history. `ArchiveRecord` is created by `20261004100000_archive_record`; its migration includes the schema's JSONB payload, default `archivedAt`, and `(kind, at)` index.

## Verification status

- **UNVERIFIED:** `prisma migrate deploy` against a clean PostgreSQL database and `prisma migrate diff` for drift. This execution environment has neither `DATABASE_URL` nor `DATABASE_URL_UNPOOLED`, and no local PostgreSQL tools/service were available; no database migration was attempted.
- The 17 unmigrated models are not needed by the currently implemented runtime storage path, but choosing whether to add migrations for future/normalized storage is an owner decision. **No models were deleted or changed.**

With an empty disposable PostgreSQL database configured at `DATABASE_URL_UNPOOLED`, run from the repository root:

```bash
DATABASE_URL="$DATABASE_URL_UNPOOLED" pnpm --filter @erp/database migrate:deploy
```

For a migration-history/schema drift comparison, provide a separate disposable shadow database URL:

```bash
pnpm --filter @erp/database exec prisma migrate diff \
  --from-migrations prisma/migrations \
  --to-schema-datamodel prisma/schema.prisma \
  --shadow-database-url "$SHADOW_DATABASE_URL"
```

The database used for `DATABASE_URL_UNPOOLED` should be an empty throwaway database for the deployment test; do not run that instruction against production data.
