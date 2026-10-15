FROM node:22-bookworm-slim AS base
ENV COREPACK_HOME=/opt/corepack
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY packages/database/package.json packages/database/package.json
RUN pnpm install --frozen-lockfile

FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/ ./
COPY . .
RUN pnpm --filter @erp/database generate
RUN pnpm check && APP_MODE=production pnpm build:web

FROM base AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=builder --chown=node:node /opt/corepack /opt/corepack
COPY --from=builder --chown=node:node /app ./
RUN mkdir -p /app/data && chown node:node /app/data
USER node
EXPOSE 3000
CMD ["pnpm", "start:web"]
