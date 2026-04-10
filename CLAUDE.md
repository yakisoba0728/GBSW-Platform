# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GBSW Platform is a school mileage (reward/penalty points) management system for students and dormitory residents. It is a pnpm monorepo with two apps: `apps/web` (Next.js) and `apps/api` (NestJS), backed by PostgreSQL via Prisma.

**Requirements**: Node >= 22.0.0, pnpm 10.33.0

## Commands

### Root (run both apps + DB)
```bash
pnpm dev              # Start web + API + DB in dev mode
pnpm build            # Build both apps
pnpm lint             # Lint both apps
pnpm test             # Test both apps
pnpm db:up            # Start PostgreSQL and pgAdmin
pnpm db:down          # Stop DB containers
pnpm db:prepare       # Run migrations and prepare DB services
pnpm deploy:production # Deploy with Docker Compose
```

### API only (`apps/api`)
```bash
pnpm start:dev        # Watch mode (nest start --watch)
pnpm test             # vitest run --passWithNoTests
pnpm test:watch       # vitest (watch mode)
pnpm test:coverage    # vitest run --coverage
pnpm lint             # eslint src/**/*.ts
pnpm format           # prettier --write src/**/*.ts
# Run a single test file:
npx vitest run src/path/to/file.test.ts
```

### Web only (`apps/web`)
```bash
pnpm dev              # next dev --webpack (port 3000)
pnpm test             # vitest run --passWithNoTests
pnpm lint             # eslint
# Run a single test file:
npx vitest run lib/auth-session.test.ts
```

### Database
```bash
# Inside apps/api
npx prisma migrate dev      # Create and apply a new migration
npx prisma migrate deploy   # Apply pending migrations
npx prisma studio           # Open Prisma Studio (DB GUI)
npx prisma generate         # Regenerate Prisma client after schema changes
```

## Architecture

### Monorepo Layout
```
apps/web/     → Next.js 16 frontend (React 19, Tailwind CSS)
apps/api/     → NestJS 11 backend (Prisma 6, PostgreSQL 17)
scripts/      → Dev/deploy orchestration (Node ESM scripts)
docker/       → pgAdmin init scripts
deploy/nginx/ → Nginx reverse proxy example config
```

### API (`apps/api/src/`)

The API uses standard NestJS module architecture. Each domain has a dedicated module:

- **`auth/`** — Login/logout, session management, login throttle, password change
- **`admin/`** — Teacher/student account management, rule configuration
- **`teacher/`** — Teacher-specific endpoints (separate from admin)
- **`mileage/`** — Unified points system for both school and dorm scope; split into sub-services: `entries`, `rules`, `students`, `analytics`
- **`prisma/`** — `PrismaService` (global singleton, injected across modules)
- **`config/runtime-env.ts`** — Environment variable validation at startup
- **`common/`** — Shared auth/session guards (`auth-access.ts`), mileage analytics helpers, shared parsers, rule conflict detection (`rule-conflicts.ts`), internal API auth (`internal-api-auth.ts`)

**Auth flow**: Sessions are stored in the `AuthSession` DB table (not JWT). The web app calls `/api/*` Next.js route handlers which proxy to the NestJS API using `INTERNAL_API_SECRET` for server-to-server auth.

**Roles**: `Student`, `Teacher`, `SUPER_ADMIN` (super admin credentials are read from `SUPER_ADMIN_ID` / `SUPER_ADMIN_PASSWORD` runtime env vars; not stored in DB).

**Login throttle**: Max 5 failed attempts in a 10-minute window per key (stored in `LoginThrottle` table).

### Web (`apps/web/app/`)

Uses Next.js App Router. Role-based route groups mirror API roles:

- `/student/*` — Mileage history, rules list, personal stats
- `/teacher/*` — Grant/deduct mileage for students
- `/admin/*` — User management, rule configuration
- `/onboarding/*` — Change password, link email/phone flows (enforced before other pages)
- `/api/*` — Route handlers that proxy to NestJS API (adds `INTERNAL_API_SECRET` header)

**Key lib files (`apps/web/lib/`):**
- `api-proxy.ts` — HTTP client for NestJS calls with `INTERNAL_API_SECRET`
- `api-route-handlers.ts` — Helper factories (`createStaticProxyHandler`, `createMethodProxyHandler`, `createParamProxyHandler`) used by all `/api/*` route files
- `auth-session.ts` — Session resolve/revoke logic + onboarding redirect rules
- `scope-utils.ts` — Helpers for distinguishing school vs dorm scope
- `admin-api.ts`, `teacher-api.ts`, `student-api.ts` — Typed service clients for each role

### Database Models (Prisma)

Key tables (see `apps/api/prisma/schema.prisma`):
- `Student`, `Teacher` — User accounts with hashed passwords, onboarding flags (`mustChangePassword`, `hasLinkedEmail`, `hasLinkedPhone`), soft-deactivation via `isActive`
- `AuthSession` — Active sessions (CUID token, role, expiry, revocation)
- `MileageRule` — Unified rules for both scopes; fields: `scope` (SCHOOL/DORM), `type` (REWARD/PENALTY), `category`, `name`, `defaultScore`, `displayOrder`, `isActive`
- `MileageEntry` — Unified entries for both scopes; soft-deleted via `deletedAt`; tracks `createdByTeacherId`, `updatedByTeacherId`, `deletedByTeacherId` for audit trail
- `LoginThrottle` — Rate limiting (`failedCount`, `windowStartedAt`, `lockedUntil`)

**Enums**: `School` (GBSW, BYMS), `MileageScope` (SCHOOL, DORM), `MileageType` (REWARD, PENALTY), `AuthRole` (SUPER_ADMIN, STUDENT, TEACHER)

### Environment Variables

Copy `.env.example` to `.env` for development. Key variables:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `INTERNAL_API_SECRET` | Shared secret for Next.js → NestJS server calls |
| `SUPER_ADMIN_ID` / `SUPER_ADMIN_PASSWORD` | Runtime-managed super admin credentials |
| `API_INTERNAL_URL` | Primary API URL for server-side Next.js calls (Docker: `http://api:3001`) |
| `NEXT_PUBLIC_API_URL` | Public direct Nest API URL fallback. Do not point this to Next.js `/api`. |

### Styling Conventions

- Tailwind CSS with custom brand color tokens defined in `apps/web/tailwind.config.ts`
- Dark mode via `next-themes` (class-based)
- Animations: Framer Motion for UI transitions, Lottie for complex animations
- Icons: Lucide React

### Production Deployment

Docker Compose (`docker-compose.production.yml`) runs all services. The `scripts/deploy-production.mjs` script validates the env file and `NEXT_PUBLIC_API_URL`, checks the Compose config, syncs the DB password, and waits for health checks. Nginx example config in `deploy/nginx/` terminates TLS in front of the web app; the API stays on the internal Docker network by default.
