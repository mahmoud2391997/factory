#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

export NODE_ENV=production
export DATABASE_URL="${DATABASE_URL:-${POSTGRES_URL_NON_POOLING:-${PRISMA_DATABASE_URL:-${DATABASE_URL_UNPOOLED:-${POSTGRES_PRISMA_URL:-${POSTGRES_URL:-}}}}}}"
export NEXT_PUBLIC_GIT_COMMIT_SHA="${NEXT_PUBLIC_GIT_COMMIT_SHA:-${VERCEL_GIT_COMMIT_SHA:-$(git rev-parse --short HEAD 2>/dev/null || echo deploy)}}"
export NEXT_PUBLIC_BUILD_DATE="${NEXT_PUBLIC_BUILD_DATE:-$(date -u +%Y-%m-%dT%H:%M:%SZ)}"

node scripts/check-env.mjs
pnpm --filter @erp/database generate
if [[ -n "${DATABASE_URL_UNPOOLED:-${DATABASE_URL:-}}" ]]; then
  pnpm --filter @erp/database migrate:deploy
fi
pnpm --filter @erp/web build
