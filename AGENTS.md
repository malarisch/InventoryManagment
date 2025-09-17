# Repository Guidelines

## Project Structure & Module Organization
- `inventorymanagement/`: Next.js (App Router) app in TypeScript.
  - `app/`: routes, layouts, and pages.
  - `components/`, `components/ui/`: shared UI and shadcn/ui primitives.
  - `lib/`: utilities (e.g., `lib/supabase/{client,server}.ts`).
  - Config: `next.config.ts`, `tailwind.config.ts`, `eslint.config.mjs`, `tsconfig.json`.
- `supabase/`: local config and SQL migrations (`migrations/*.sql`).
- Domain model:
  - `articles`: product types (e.g., microphones, mixers); may include `default_location`.
  - `equipments`: physical items referencing an `article` (one row per asset).
  - `locations`: canonical place names. Current location is resolved by the newest location entry per equipment (append-only history table to be added, e.g., `equipment_locations`).

## Build, Test, and Development Commands
- Install: `cd inventorymanagement && npm install`.
- Dev: `npm run dev` (http://localhost:3000).
- Build/Start: `npm run build` then `npm run start`.
- Lint: `npm run lint` (Next.js + TypeScript rules).
- Supabase: `supabase start`; reset/apply migrations with `supabase db reset`; create migration: `supabase migration new <name>`.

## Coding Style & Naming Conventions
- TypeScript strict; 2-space indent; named exports preferred.
- Names: PascalCase components, camelCase vars/functions, kebab-case route segments.
- Next.js: default Server Components; add `"use client"` only when required.
- Styling: Tailwind CSS; use `clsx` and `tailwind-merge` for class composition.

## Testing Guidelines
- Add when needed: RTL + Vitest/Jest for UI/logic; Playwright for E2E.
- Name tests `*.test.ts(x)` colocated or under `__tests__/`.
- Cover: auth flows, Supabase queries, and location resolution (newest entry defines current location). Example SQL pattern: `SELECT DISTINCT ON (equipment_id) * FROM equipment_locations ORDER BY equipment_id, created_at DESC`.

## Commit & Pull Request Guidelines
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`). Small and focused.
- PRs: clear description, linked issues, screenshots for UI changes.
- Before PR: `npm run lint && npm run build`; include migrations for schema changes and note RLS/policy updates.

## Security & Configuration Tips
- Secrets live in `inventorymanagement/.env.local` (see `.env.example`). Do not commit secrets.
- Required env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- RLS on tables: validate authenticated access when adjusting policies or queries.

