#!/usr/bin/env sh
set -eu
npx prisma generate --schema packages/database/prisma/schema.prisma
npx prisma db push --schema packages/database/prisma/schema.prisma
