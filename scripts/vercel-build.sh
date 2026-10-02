#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

export DATABASE_URL="${DATABASE_URL:-${POSTGRES_URL_NON_POOLING:-${PRISMA_DATABASE_URL:-${DATABASE_URL_UNPOOLED:-${POSTGRES_PRISMA_URL:-${POSTGRES_URL:-}}}}}}"
if [[ -z "$DATABASE_URL" ]]; then
  export APP_MODE="${APP_MODE:-demo}"
  echo "No database URL configured; building in demo mode without migrations."
else
  export APP_MODE="${APP_MODE:-production}"
fi

export NEXT_PUBLIC_GIT_COMMIT_SHA="${NEXT_PUBLIC_GIT_COMMIT_SHA:-${VERCEL_GIT_COMMIT_SHA:-$(git rev-parse --short HEAD)}}"
export NEXT_PUBLIC_BUILD_DATE="${NEXT_PUBLIC_BUILD_DATE:-$(date -u +%Y-%m-%dT%H:%M:%SZ)}"

echo "Generating Prisma client..."
npx prisma generate --schema packages/database/prisma/schema.prisma

if [[ -n "$DATABASE_URL" ]]; then
  echo "Applying Prisma migrations..."
  pnpm db:deploy
else
  echo "Skipping Prisma migrations because demo mode has no database URL."
fi

echo "Building Next.js app..."
# Invoke the workspace script directly so Vercel's injected arguments cannot
# recursively append --workspace flags to the root build script.
npm --workspace=@erp/web run build
