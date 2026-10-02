#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Generating Prisma client..."
npx prisma generate --schema packages/database/prisma/schema.prisma

echo "Building Next.js app..."
# Invoke the workspace script directly so Vercel's injected arguments cannot
# recursively append --workspace flags to the root build script.
npm --workspace=@erp/web run build
