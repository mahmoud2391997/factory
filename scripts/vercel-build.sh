#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Keep the real URL (if any) for migrations. An empty string still fails Prisma validation.
REAL_DATABASE_URL="${DATABASE_URL-}"

# prisma generate validates schema and only needs a non-empty URL (no DB connection).
if [[ -z "${REAL_DATABASE_URL}" ]]; then
  echo "DATABASE_URL is empty — skipping migrate deploy; using placeholder URL for prisma generate."
  export DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public"
else
  export DATABASE_URL="$REAL_DATABASE_URL"
  echo "Running prisma migrate deploy..."
  pnpm -C packages/database prisma migrate deploy --schema prisma/schema.prisma
fi

echo "Running prisma generate..."
pnpm -C packages/database prisma generate --schema prisma/schema.prisma

echo "Building Next.js app..."
pnpm -C apps/web build
