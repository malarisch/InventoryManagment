---
mode: agent
---
# Repository Guidelines
> Always follow the Supabase-official SQL and coding standards documented here; treat them as mandatory for every change.

## Project Structure & Module Organization
- Next.js (App Router) app in TypeScript.
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
- Install: `npm install`.
- Dev: `npm run dev` (http://localhost:3000).
- Build/Start: `npm run build` then `npm run start`.
- Lint: `npm run lint` (Next.js + TypeScript rules).
- Supabase: `supabase start`; reset/apply migrations with `supabase db reset`; create migration: `supabase migration new <name>`.

## Supabase Coding Style (Mandatory)
- Mirrors Supabase's recommended application conventions; do not deviate.
- TypeScript strict; 2-space indent; named exports preferred.
- Names: PascalCase components, camelCase vars/functions, kebab-case route segments.
- Next.js: default Server Components; add `"use client"` only when required.
- Styling: Tailwind CSS; use `clsx` and `tailwind-merge` for class composition.

### Supabase AI Docs (Source of Truth)
- Use the local docs in `supabase_ai_docs/` as the authoritative reference for Supabase-related work. Do not rely on Serena/MCP content.
- Before writing or reviewing any of the following, open the matching doc:
  - RLS policies: `supabase_ai_docs/database_rls_policies.md`
  - Declarative schema + migrations: `supabase_ai_docs/declarative_database_schema.md`
  - Database functions: `supabase_ai_docs/database_functions.md`
  - Next.js + Supabase Auth (SSR/CSR): `supabase_ai_docs/nextjs-supabase-auth-rules.md`
  - Realtime usage and patterns: `supabase_ai_docs/supabase_realtime_rules.md`
  - Edge Functions: `supabase_ai_docs/edge-functions.md`
  - General style and conventions: `supabase_ai_docs/style_and_conventions.md`
- When AGENTS.md and a doc disagree, follow the doc in `supabase_ai_docs/` and add a short note to `agentlog.md`.
- After schema changes, follow the project rule to run `npm run supabase-gen-types` to update `database.types.ts` before writing app code.

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
- Whenever you are planning to implement a feature you have heared about in the `todos.md`, read it again to make sure you have the correct understanding of what the user wants. When writing to it read it first so you don't overwrite any changes made by the user while you were working. The same is true for `human-review-todos.md`.
- When doing database schema updates, update the run_seed api call if necessary, then run `npm run supabase-gen-types` to apply the migration and update the database.types.ts BEFORE writing any additional code.
- After each major task, append a short summary to `agentlog.md` to track project status.
- Keep it concise (2–5 lines): include date/time, task name, key files/migrations/policies touched, and next step if any.
- Append entries chronologically; no need for elaborate formatting.
- Always consult Context7 for external library usage (writing, updating, or reviewing code) before making changes.
- When unsure if changes in the repo are accidential while commiting, do NOT revert them. Instead, add a Human Review Todo to `human-review-todos.md`. Do not modify the files you are unsure about! Its more likely they are edits made by the user.
- After each completed task, create a git commit that captures the changes you made.





# Postgres SQL Style Guide

This section captures the official Supabase SQL writing guidelines and is non-optional.

## General

- Use lowercase for SQL reserved words to maintain consistency and readability.
- Employ consistent, descriptive identifiers for tables, columns, and other database objects.
- Use white space and indentation to enhance the readability of your code.
- Store dates in ISO 8601 format (`yyyy-mm-ddThh:mm:ss.sssss`).
- Include comments for complex logic, using '/* ... */' for block comments and '--' for line comments.

## Naming Conventions

- Avoid SQL reserved words and ensure names are unique and under 63 characters.
- Use snake_case for tables and columns.
- Prefer plurals for table names
- Prefer singular names for columns.

## Tables

- Avoid prefixes like 'tbl_' and ensure no table name matches any of its column names.
- Always add an `id` column of type `identity generated always` unless otherwise specified.
- Create all tables in the `public` schema unless otherwise specified.
- Always add the schema to SQL queries for clarity.
- Always add a comment to describe what the table does. The comment can be up to 1024 characters.

## Columns

- Use singular names and avoid generic names like 'id'.
- For references to foreign tables, use the singular of the table name with the `_id` suffix. For example `user_id` to reference the `users` table
- Always use lowercase except in cases involving acronyms or when readability would be enhanced by an exception.

## Functions

- Default to `security invoker`; only use `security definer` with a documented justification.
- Always set `search_path = ''` inside functions and reference objects with fully qualified names (e.g., `public.table_name`).
- Specify parameter and return types explicitly, and choose the correct volatility (`immutable`, `stable`, or `volatile`).
- Minimize side effects; prefer returning data unless the function backs a trigger or intentional mutation.
- When authoring trigger functions, include the matching `create trigger` statement alongside the function definition.

#### Examples:

```sql
create table books (
  id bigint generated always as identity primary key,
  title text not null,
  author_id bigint references authors (id)
);
comment on table books is 'A list of all the books in the library.';
```


## Queries

- When the query is shorter keep it on just a few lines. As it gets larger start adding newlines for readability
- Add spaces for readability.

Smaller queries:


```sql
select *
from employees
where end_date is null;

update employees
set end_date = '2023-12-31'
where employee_id = 1001;
```

Larger queries:

```sql
select
  first_name,
  last_name
from
  employees
where
  start_date between '2021-01-01' and '2021-12-31'
and
  status = 'employed';
```


### Joins and Subqueries

- Format joins and subqueries for clarity, aligning them with related SQL clauses.
- Prefer full table names when referencing tables. This helps for readability.

```sql
select
  employees.employee_name,
  departments.department_name
from
  employees
join
  departments on employees.department_id = departments.department_id
where
  employees.start_date > '2022-01-01';
```

## Aliases

- Use meaningful aliases that reflect the data or transformation applied, and always include the 'as' keyword for clarity.

```sql
select count(*) as total_employees
from employees
where end_date is null;
```


## Complex queries and CTEs

- If a query is extremely complex, prefer a CTE.
- Make sure the CTE is clear and linear. Prefer readability over performance.
- Add comments to each block.

```sql
with department_employees as (
  -- Get all employees and their departments
  select
    employees.department_id,
    employees.first_name,
    employees.last_name,
    departments.department_name
  from
    employees
  join
    departments on employees.department_id = departments.department_id
),
employee_counts as (
  -- Count how many employees in each department
  select
    department_name,
    count(*) as num_employees
  from
    department_employees
  group by
    department_name
)
select
  department_name,
  num_employees
from
  employee_counts
order by
  department_name;
```
