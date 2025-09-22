## InventoryManagment — Copilot instructions (concise)

This file gives focused, repository-specific guidance for AI coding agents working in InventoryManagment. Keep entries short and factual; prefer local files as sources of truth.

- Project layout (big picture)
  - Next.js (App Router) TypeScript app in the repo root. Primary app code lives under `app/`, shared UI under `components/`, and utilities under `lib/`.
  - `supabase/` contains local Supabase config, SQL migrations and seed files. `database.types.ts` is the canonical DB types file generated from the schema.
  - Tenancy model: `companies` is the tenant boundary; all business tables have `company_id` and RLS policies rely on `users_companies` membership. See `AGENTS.md` and `supabase_ai_docs/` for RLS rules.

- Key files to consult before changing behavior
  - `database.types.ts` — authoritative DB types (run `npm run supabase-gen-types` after migrations).
  - `supabase/` folder — migrations and seeds. Update migrations, then regenerate types.
  - `components/forms/partials/company-metadata-form.tsx` — UI handling for company custom types (textareas). Important for newline/list behavior.
  - `components/*-create-form.tsx` — many create/edit forms parse JSON meta and cast to DB `Json`.
  - `lib/supabase/*` — Supabase clients (admin vs client) and helpers — use server admin client only from server routes.

- Build / test / dev workflows (practical commands)
  - Install: `npm install`
  - Dev server: `npm run dev` (Next dev on :3000)
  - Build: `npm run build`; Start: `npm run start`
  - Lint + typecheck: `npm run lint` and `npm run test:tsc`
  - Unit tests: `npm run test:unit` (Vitest)
  - E2E tests: `npm run test:e2e` (Playwright). CI downloads Playwright browsers during runs.
  - Full CI/local test run (what CI runs): `npm run test` → lint → tsc → vitest → playwright

- Patterns & conventions the agent should follow
  - TypeScript-first: prefer explicit types. Many files import `Json` from `database.types.ts`; avoid creating a conflicting global `Json` name (alias imports if needed). Example fix: `import type { Json as DBJson } from '@/database.types'`.
  - Use Next.js server components by default; only add `"use client"` when component needs client state or hooks (many form components are client components).
  - Metadata fields are JSON blobs stored in `*_metadata` columns; forms offer an "Advanced (JSON)" textarea or structured UI. When converting structured objects to DB metadata, cast using `as unknown as Json` to satisfy types.
  - Database changes: write migration SQL in `supabase/migrations`, run `supabase migrations up`, then `npm run supabase-gen-types` to regenerate `database.types.ts` before updating app code.

- Integration points & external dependencies
  - Supabase (local dev via `supabase start`) — auth and DB. Tests use an admin client for seed/dump operations under `app/api/admin/*`.
  - Playwright for browser E2E under `tests/e2e/` (CI downloads browser binaries automatically). Tests assume a running Next.js + Supabase stack unless specially mocked.
  - Vitest unit tests in `tests/vitest/` — prefer to use provided cleanup helpers (see `tests/vitest/utils/cleanup.ts`) when manipulating DB.

- Troubleshooting tips / frequent pitfalls
  - Duplicate `Json` type errors during `next build` may occur if multiple ambient or conflicting declarations exist; alias imports locally to fix quickly.
  - Newlines missing in company metadata lists were caused by `.filter(Boolean)` on textarea input arrays — preserve empty strings when storing line-based lists.
  - When adding endpoints that use the Supabase admin client, ensure the secret `SUPABASE_SERVICE_ROLE_KEY` is only used server-side and relevant checks (owner-only) are in place.

- Example snippets (safe, copyable patterns)
  - Parse advanced JSON safely in client forms:
    const mt = metadataText.trim();
    let metadata: DBJson | null = null;
    if (mt.length) { try { metadata = JSON.parse(mt) as DBJson; } catch { throw new Error('Invalid JSON'); } }

  - Regenerate DB types after migration:
    npm run supabase-gen-types

- Where to update this doc
  - Keep this file short. If a longer explanation is needed, add it to `AGENTS.md` or a `supabase_ai_docs/*` file and reference it here.

- Memories and Agent State (optional guidance)
  - Agents should persist short-lived, relevant observations (e.g., migration notes, completed tasks, CI quirks) to `agentlog.md` or `human-review-todos.md` as appropriate.
  - Before running broad searches, consult `agentlog.md` and `todos.md` to avoid duplicating work. Append new short entries to `agentlog.md` after substantial changes (2-4 lines: date/time, task, files touched, next step).
  - For longer-term knowledge, create/update entries in `supabase_ai_docs/*` and reference them from this doc.

If anything here is unclear or you'd like more examples (CI workflow, Playwright auth, or DB cleanup patterns), tell me which area to expand and I'll iterate. 
