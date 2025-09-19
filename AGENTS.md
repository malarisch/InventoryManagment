# Repository Guidelines

## Project Structure & Module Organization
- `inventorymanagement/`: Next.js (App Router) app in TypeScript.
  - `app/`: routes, layouts, and pages.
  - `components/`, `components/ui/`: shared UI and shadcn/ui primitives.
  - `lib/`: utilities (e.g., `lib/supabase/{client,server}.ts`).
  - Config: `next.config.ts`, `tailwind.config.ts`, `eslint.config.mjs`, `tsconfig.json`.
- `supabase/`: local config and SQL migrations (`migrations/*.sql`).
- Domain model (all business tables include a `company_id` FK and enforce RLS through `users_companies` membership):
  - `companies`: tenant boundary with `name`, `description`, optional `metadata`, and `owner_user_id` (FK to `auth.users`). Members listed in `users_companies` get read access; owners retain full CRUD rights.
  - `users_companies`: join table between `auth.users` and `companies`; owners can manage rows, members can list co-workers. All downstream RLS checks reference this table.
  - `articles`: product definitions scoped to a company; columns include `name`, `metadata`, optional `default_location` (FK `locations.id`), optional `asset_tag` (FK `asset_tags.id`), `created_by` (FK `auth.users.id`), and timestamps.
  - `asset_tag_templates`: JSON templates for printing asset labels; ties to `company_id` and optional `created_by`. Once an applied `asset_tags.printed_template` references a template, update/delete is blocked via dedicated RLS policies.
  - `asset_tags`: generated labels with `printed_code`, optional `printed_template` reference, `printed_applied` flag, `company_id`, and optional `created_by`. Referenced by `articles`, `equipments`, and `locations`.
  - `equipments`: physical inventory linked to an `article_id`, optional `asset_tag`, optional `current_location` (FK `locations.id`), `has_asset_sticker`, `added_to_inventory_at`, `metadata`, `created_by`, and `company_id`.
  - `locations`: canonical place names per company with `name`, optional `description`, optional `asset_tag`, `created_by`, and timestamps.
  - `cases`: groupings of gear with optional `case_equipment` (FK `equipments.id`), an array of contained equipment IDs, `company_id`, and `created_by`.
  - `customers`: contact records (`type`, personal/company details, address fields, `metadata`) tied to `company_id` and optional `created_by`.
  - `jobs`: scheduled work linked to `company_id`, optional `customer_id`, optional `created_by`, scheduling fields, `name`, `type`, `job_location`, and `meta` JSON.
  - `job_booked_assets` and `job_assets_on_job`: materialized reservations/assignments of equipment or cases to jobs; columns include `job_id`, optional `equipment_id`/`case_id`, `company_id`, optional `created_by`, and timestamps.
  - `history`: append-only audit trail storing `table_name`, `data_id`, `old_data`, optional `change_made_by`, and `company_id`; readable to company members.

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
- Cover: auth flows, Supabase queries, and location assignment flows (`equipments.current_location`, related history snapshots).

## Commit & Pull Request Guidelines
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`). Small and focused.
- PRs: clear description, linked issues, screenshots for UI changes.
- Before PR: `npm run lint && npm run build`; include migrations for schema changes and note RLS/policy updates.

## Security & Configuration Tips
- Secrets live in `inventorymanagement/.env.local` (see `.env.example`). Do not commit secrets.
- Required env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- RLS on tables: enforced per-company. Ensure queries always include/derive `company_id` and that policies restrict access to users who own the company.

### User Management & Privacy
- Nutze Supabase Auth als Quelle der Wahrheit:
  - Anzeigename/Pronomen als `user_metadata` Felder (`display_name`, `pronouns`).
  - Email/Passwort über `supabase.auth.updateUser` verwalten (E-Mail-Bestätigung beachten).
- Für serverseitige Anzeige anderer Nutzer (z. B. "Erstellt von") verwende den Admin-Client (`lib/supabase/admin.ts`) und lese `auth.users` (nur serverseitig!).
- Profilpflege in der App unter `/management/settings`.

### Seed Dump
- Button in `/management/company-settings` erzeugt via API (`POST /api/admin/dump-seed`) eine `supabase/seed.sql` mit Daten aus `auth.users`, `auth.identities` und allen `public`-Tabellen (FK-Reihenfolge, `truncate ... restart identity cascade` + `insert`).
- Server-seitig wird der Admin-Client (`SUPABASE_SERVICE_ROLE_KEY`) genutzt, nur für authentifizierte Owner einer Company.

## Agent Workflow & Logging
- After each major task, append a short summary to `agentlog.md` to track project status.
- Keep it concise (2–5 lines): include date/time, task name, key files/migrations/policies touched, and next step if any.
- Append entries chronologically; no need for elaborate formatting.
