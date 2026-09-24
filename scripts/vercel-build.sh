#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Prefer DATABASE_URL; fall back to common Vercel/Neon/Supabase names.
if [[ -z "${DATABASE_URL:-}" ]]; then
  for candidate in \
    "${POSTGRES_PRISMA_URL:-}" \
    "${PRISMA_DATABASE_URL:-}" \
    "${POSTGRES_URL:-}" \
    "${POSTGRES_URL_NON_POOLING:-}" \
    "${DATABASE_URL_UNPOOLED:-}"
  do
    if [[ -n "$candidate" ]]; then
      export DATABASE_URL="$candidate"
      echo "Using fallback database URL from hosting provider env."
      break
    fi
  done
fi

REAL_DATABASE_URL="${DATABASE_URL:-}"

# Prisma generate only needs a non-empty URL. Keep migrations out of the deployment
# critical path unless they are explicitly enabled; a slow or unreachable database
# must not leave every Vercel deployment pending.
if [[ -z "${REAL_DATABASE_URL}" ]]; then
  echo "DATABASE_URL is empty — using placeholder URL for prisma generate."
  export DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public"
else
  export DATABASE_URL="$REAL_DATABASE_URL"
fi

if [[ "${RUN_DB_MIGRATIONS:-false}" == "true" ]]; then
  echo "RUN_DB_MIGRATIONS=true; running prisma migrate deploy..."
  pnpm -C packages/database prisma migrate deploy --schema prisma/schema.prisma
else
  echo "Skipping prisma migrate deploy (set RUN_DB_MIGRATIONS=true to enable)."
fi

echo "Running prisma generate..."
pnpm -C packages/database prisma generate --schema prisma/schema.prisma

echo "Building Next.js app..."
pnpm -C apps/web build
