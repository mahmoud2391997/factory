#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# MongoDB needs no schema generation or migrations; collections are created on first write.
echo "Building Next.js app..."
pnpm -C apps/web build
