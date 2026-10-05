# Development setup

Use Node 22 (`nvm use`) and pnpm 10.12.4 (declared in package.json).
Run all commands from the repository root. Never copy real secrets into source control.

## Local demo

```sh
pnpm install --frozen-lockfile
pnpm db:generate
APP_MODE=demo pnpm dev
```

Next loads `apps/web/.env`. If that file contains a database URL (including a supported alias), the application uses PostgreSQL even in demo mode. To use local file storage, remove database configuration from the development environment first. Do not change shared or production credentials.

Open http://localhost:3000/login. Demo accounts include `admin@factory.local`, `accounts@factory.local`, `ops@factory.local`, and `quality@factory.local`; the default demo password is `Admin123!` unless `DEMO_PASSWORD` is configured. Demo mode permits resetting data and resets seeded demo account credentials. Use it only for disposable data.

## Local PostgreSQL

1. Copy `.env.example` to `.env` if no root environment file exists. Set `POSTGRES_PASSWORD` to a local development password.
2. Run `docker compose up -d postgres`.
3. In `apps/web/.env`, set `APP_MODE=production`, `DATABASE_URL=postgresql://factory:YOUR_PASSWORD@localhost:5432/factory_erp`, a random `JWT_SECRET` of at least 32 characters, and a random `SETUP_TOKEN` of at least 16 characters. URL-encode special characters in the database password. Generate random values with `openssl rand -hex 32`.
4. Run `pnpm db:deploy`. Prisma reads the root `.env`; give it the same local database URL. Run `pnpm dev`.
5. Bootstrap once with your chosen email, password, and full name:

```sh
curl -X POST http://localhost:3000/api/setup/bootstrap \
  -H 'Content-Type: application/json' \
  -H "x-setup-token: $SETUP_TOKEN" \
  -d '{"email":"admin@factory.local","password":"YOUR_PASSWORD","fullName":"Administrator"}'
```

Set `SETUP_TOKEN` in your shell for the curl command; Next's environment file does not export shell variables. Verify `/api/health`, log in, and complete any required password change.

## Validation and changes

```sh
pnpm db:generate
pnpm check
pnpm build
pnpm test:smoke http://localhost:3000 --public-only
```

`lint` currently runs TypeScript, not ESLint. For environments that prevent tsx from opening its IPC socket, an equivalent test invocation is:

```sh
TSX_TSCONFIG_PATH=apps/web/tsconfig.json node --import tsx --test 'apps/web/**/*.test.ts'
```

Use `pnpm db:migrate --name your_change` only against a disposable development database when changing Prisma schema. Review generated SQL before deploying. The current schema has known migration drift; see `DB-MIGRATION-AUDIT.md` before generating migrations.

## Docker application

Set `POSTGRES_PASSWORD`, `JWT_SECRET`, and `SETUP_TOKEN` in root `.env`, then run `docker compose build`. Start PostgreSQL, apply migrations to its database with `pnpm db:deploy`, and run `docker compose up -d web`. Bootstrap through the same API. The container runs with `APP_MODE=production`; no demo credentials are supplied. Database and ERP file volumes hold operational data. The image excludes local environment files and data via `.dockerignore`.

See `DEVELOPMENT-READINESS.md` for remaining release gates.
