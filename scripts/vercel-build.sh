#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

export NODE_ENV=production
if [[ -z "${DATABASE_URL:-}" ]]; then
  for key in \
    NEON_POSTGRES_PRISMA_URL NEON_DATABASE_URL NEON_POSTGRES_URL \
    NEON_DATABASE_URL_UNPOOLED NEON_POSTGRES_URL_NON_POOLING \
    POSTGRES_PRISMA_URL PRISMA_DATABASE_URL POSTGRES_URL \
    POSTGRES_URL_NON_POOLING DATABASE_URL_UNPOOLED; do
    value="${!key:-}"
    if [[ -n "$value" ]]; then
      export DATABASE_URL="$value"
      break
    fi
  done
fi
export NEXT_PUBLIC_GIT_COMMIT_SHA="${NEXT_PUBLIC_GIT_COMMIT_SHA:-${VERCEL_GIT_COMMIT_SHA:-$(git rev-parse --short HEAD 2>/dev/null || echo deploy)}}"
export NEXT_PUBLIC_BUILD_DATE="${NEXT_PUBLIC_BUILD_DATE:-$(date -u +%Y-%m-%dT%H:%M:%SZ)}"

node scripts/check-env.mjs
pnpm --filter @erp/database generate

DIRECT_DATABASE_URL="${DATABASE_URL_UNPOOLED:-${NEON_DATABASE_URL_UNPOOLED:-${NEON_POSTGRES_URL_NON_POOLING:-${POSTGRES_URL_NON_POOLING:-}}}}"
if [[ -n "$DIRECT_DATABASE_URL" ]]; then
  DATABASE_URL="$DIRECT_DATABASE_URL" pnpm --filter @erp/database migrate:deploy
elif [[ -n "${DATABASE_URL:-}" ]]; then
  pnpm --filter @erp/database migrate:deploy
else
  echo '[vercel-build] DATABASE_URL not set; skipping Prisma migrations.'
fi

pnpm --filter @erp/web build
