# Inventory Management

Multi-tenant inventory management system for equipment rental and event companies. Built with Next.js 15, Supabase, and TypeScript.

## Features

- 🏢 Multi-tenant architecture with company-based access control
- 📦 Equipment, articles, and location tracking
- 🏷️ Asset tagging with printable QR/barcode labels
- 📋 Job management with asset booking and commissioning
- 👥 Customer management
- 📝 Comprehensive audit logging
- 🔐 Row-Level Security (RLS) via Supabase

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start Supabase (requires Docker)
npx supabase start

# Generate environment variables
./scripts/write-supabase-env.sh > .env.local

# Generate Prisma client
npx prisma generate

# Run development server
npm run dev
```

Open http://localhost:3000

### Testing

```bash
# Run all tests (lint, typecheck, unit, e2e)
npm run test

# Individual test suites
npm run test:unit      # Vitest unit tests
npm run test:e2e       # Playwright E2E tests
npm run test:tsc       # TypeScript compilation check
npm run lint           # ESLint
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment guides:

- **Vercel** (recommended, easiest)
- **Docker** (self-hosted, see [DOCKER.md](./DOCKER.md))
- **Node.js VPS** (manual)

### Quick Deploy with Docker

```bash
# Pull pre-built image from GitHub Container Registry
docker pull ghcr.io/malarisch/inventorymanagment:latest

# Run with your production env vars
docker run -p 3000:3000 --env-file .env.production \
  ghcr.io/malarisch/inventorymanagment:latest
```

Docker images are automatically built and pushed after successful tests on `main`.

## Documentation

- [AGENTS.md](./AGENTS.md) - Architecture, domain model, and coding guidelines
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment options and setup
- [DOCKER.md](./DOCKER.md) - Docker-specific deployment guide
- [supabase_ai_docs/](./supabase_ai_docs/) - Supabase implementation details

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database:** PostgreSQL via Supabase
- **ORM:** Prisma (for server-side operations)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **Styling:** Tailwind CSS + shadcn/ui
- **Testing:** Playwright (E2E), Vitest (unit)

## Project Structure

```
app/              # Next.js routes and pages
components/       # React components (tables, forms, UI primitives)
lib/              # Utilities, Supabase clients, metadata builders
prisma/           # Prisma schema and migrations
supabase/         # Supabase migrations and config
tests/            # E2E and unit tests
```

## License

ISC
