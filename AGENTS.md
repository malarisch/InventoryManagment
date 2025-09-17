# Repository Guidelines

## Project Structure & Module Organization
- `inventorymanagement/`: Next.js (App Router) app in TypeScript.
  - `app/`: routes, layouts, and pages.
  - `components/`, `components/ui/`: shared UI and shadcn/ui primitives.
  - `lib/`: utilities (e.g., `lib/supabase/{client,server}.ts`).
  - Config: `next.config.ts`, `tailwind.config.ts`, `eslint.config.mjs`, `tsconfig.json`.
- `supabase/`: local config and SQL migrations (`migrations/*.sql`).
- Domain model:
  - `companies`: tenant boundary. All domain rows reference a `company_id`. Ownership enforced via RLS: only users owning the company can access data.
  - `articles`: product types (e.g., microphones, mixers); fields include `metadata`, optional `default_location`, and `company_id`.
  - `equipments`: physical items referencing an `article` (`article_id`); fields include `asset_tag`, `has_asset_sticker`, `metadata`, and `company_id`.
  - `locations`: canonical place names; fields include `name`, `description`, `metadata`, and `company_id`.
  - `article_location_history`: append-only history of equipment locations. Current location is determined by the newest entry per equipment.

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
- Cover: auth flows, Supabase queries, and location resolution (newest entry defines current location). Example SQL pattern: `SELECT DISTINCT ON (equipment_id) * FROM article_location_history ORDER BY equipment_id, created_at DESC`.

## Commit & Pull Request Guidelines
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`). Small and focused.
- PRs: clear description, linked issues, screenshots for UI changes.
- Before PR: `npm run lint && npm run build`; include migrations for schema changes and note RLS/policy updates.

## Security & Configuration Tips
- Secrets live in `inventorymanagement/.env.local` (see `.env.example`). Do not commit secrets.
- Required env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- RLS on tables: enforced per-company. Ensure queries always include/derive `company_id` and that policies restrict access to users who own the company.

### User Profiles & Privacy
- Verwende `public.profiles` für Anzeigenamen/Email/Pronomen (Migrationen `*_profiles.sql`, `*_profiles_pronouns.sql`).
- RLS:
  - select: authenticated only (nur Anzeigezwecke; keine Anon-Zugriffe).
  - insert/update: nur eigener Datensatz (`user_id = auth.uid()`).
- Profilpflege in der App unter `/management/settings`.
- Vermeide Zugriffe auf `auth.users` im App-Code.

## Agent Workflow & Logging
- After each major task, append a short summary to `agentlog.md` to track project status.
- Keep it concise (2–5 lines): include date/time, task name, key files/migrations/policies touched, and next step if any.
- Append entries chronologically; no need for elaborate formatting.
