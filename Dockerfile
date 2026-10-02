FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/database/package.json packages/database/package.json
RUN npm ci

FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate --schema packages/database/prisma/schema.prisma
RUN npm run build:web

FROM base AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app ./
EXPOSE 3000
CMD ["npm", "run", "start:web"]
