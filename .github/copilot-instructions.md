## InventoryManagment — Copilot instructions (comprehensive)

This file provides focused, repository-specific guidance for AI coding agents working in InventoryManagment. Keep entries actionable and factual; prefer local files as sources of truth.

### Project Architecture & Layout

**Core Structure:**
- Next.js 15.5.3 (App Router) TypeScript app in the repo root. Primary app code lives under `app/`, shared UI under `components/`, and utilities under `lib/`.
- `supabase/` contains local Supabase config, SQL migrations and seed files. `database.types.ts` is the canonical DB types file generated from the schema.
- Tenancy model: `companies` is the tenant boundary; all business tables have `company_id` and RLS policies rely on `users_companies` membership. See `AGENTS.md` and `supabase_ai_docs/` for RLS rules.

**Component Patterns:**
- **Generic DataTable:** `components/data-table.tsx` is the standardized table component used across all entity tables. Takes TypeScript generics, accepts `columns`, `searchableFields`, and `renderRowActions`. Provides consistent search, pagination, and row actions.
- **Entity Tables:** All `*Table.tsx` files (`articleTable.tsx`, `equipmentTable.tsx`, `customerTable.tsx`, etc.) follow the same pattern: define column configuration, specify searchable fields, implement row actions (view/edit/delete).
- **Form Architecture:** Create/edit forms follow a dual-mode pattern: structured metadata UI vs "Advanced (JSON)" textarea toggle. All use metadata builders from `lib/metadata/builders.ts` and default values from `lib/metadata/defaults.ts`.

### Key Files & Dependencies

**Critical Files to Consult Before Changes:**
- `database.types.ts` — authoritative DB types (run `npm run supabase-gen-types` after migrations).
- `supabase/` folder — migrations and seeds. Update migrations, then regenerate types.
- `components/metadataTypes.types.ts` — TypeScript definitions for all metadata shapes.
- `lib/metadata/{defaults,builders}.ts` — metadata default values and merge functions.
- `lib/supabase/{client,server,admin}.ts` — Supabase client patterns (see Authentication section).
- `supabase_ai_docs/` — authoritative Supabase implementation rules (RLS, auth, style).

**Metadata & Form System:**
- All entities use JSON `*_metadata` columns with typed interfaces from `metadataTypes.types.ts`.
- Forms provide both structured UI (via `*MetadataForm` partials) and raw JSON textarea ("Advanced" mode).
- Metadata builders (`buildCustomerMetadata`, `buildEquipmentMetadata`, etc.) merge partial input with project defaults.
- Company-level defaults cascade to individual entities (tax rates, currencies, power specs).

### Build, Test & Development Workflows

**Commands:**
- Install: `npm install`
- Dev server: `npm run dev` (Next dev on :3000)
- Build: `npm run build`; Start: `npm run start`
- Lint + typecheck: `npm run lint` and `npm run test:tsc`
- Unit tests: `npm run test:unit` (Vitest)
- E2E tests: `npm run test:e2e` (Playwright). CI downloads Playwright browsers during runs.
- Full CI/local test run (what CI runs): `npm run test` → lint → tsc → vitest → playwright

**Database Workflow:**
1. Write migration SQL in `supabase/migrations/`
2. Run `npx supabase db reset` or `npx supabase migrations up`
3. Run `npm run supabase-gen-types` to update `database.types.ts`
4. Update app code with new types

### Authentication & Supabase Patterns

**CRITICAL:** Always follow `supabase_ai_docs/nextjs-supabase-auth-rules.md` exactly. Never use deprecated `auth-helpers-nextjs` patterns.

**Client Types:**
- **Browser Client:** `lib/supabase/client.ts` — use in client components, returns fresh instance per call
- **Server Client:** `lib/supabase/server.ts` — use in server components/routes, bound to request cookies
- **Admin Client:** `lib/supabase/admin.ts` — server-only, uses `SUPABASE_SERVICE_ROLE_KEY`, for privileged operations

**Usage Patterns:**
- Server components: `const supabase = await createClient(); const { data: auth } = await supabase.auth.getUser();`
- Client components: `const supabase = useMemo(() => createClient(), []);`
- User display server-side: `await fetchUserDisplayAdmin(userId)` (from `lib/users/userDisplay.server.ts`)
- Admin operations: Only in API routes under `app/api/admin/`, require owner-level checks

### TypeScript & Styling Conventions

**Type Safety:**
- TypeScript strict mode enabled. Prefer explicit types over `any`.
- Many files import `Json` from `database.types.ts` — avoid creating conflicting global `Json` types. Use `import type { Json as DBJson }` if needed.
- Metadata casting pattern: `metadata = metaObj as unknown as Json` when storing structured objects.

**Component Architecture:**
- Default to Server Components; only add `"use client"` when component needs client state or hooks.
- Form components are typically client components due to state management.
- Use shadcn/ui primitives from `components/ui/` for consistent styling.
- Styling: Tailwind CSS with `clsx` and `tailwind-merge` for class composition.

### Integration Points & External Dependencies

**Supabase:**
- Local dev via `npx supabase start` (never install Supabase CLI via agents)
- Tests use admin client for seed/dump operations under `app/api/admin/*`
- Always use `npx supabase ...` for CLI commands — never attempt direct installation

**Testing:**
- Playwright for browser E2E under `tests/e2e/` (CI downloads browser binaries automatically)
- Tests assume running Next.js + Supabase stack unless specially mocked
- Vitest unit tests in `tests/vitest/` — use provided cleanup helpers from `tests/vitest/utils/cleanup.ts`

### Common Patterns & Code Examples

**Metadata Form Pattern:**
```typescript
// Client component with dual mode (structured vs JSON)
const [metaText, setMetaText] = useState(() => toPrettyJSON(defaultEquipmentMetadataDE));
const [metaObj, setMetaObj] = useState(defaultEquipmentMetadataDE);
const [advanced, setAdvanced] = useState(false);

// In form submission:
let metadata: Json | null = null;
if (advanced) {
  const mt = metaText.trim();
  if (mt.length) {
    try { metadata = JSON.parse(mt) as Json; } catch { throw new Error("Invalid JSON"); }
  }
} else {
  metadata = buildEquipmentMetadata(metaObj) as unknown as Json;
}
```

**DataTable Implementation:**
```typescript
// Define columns with proper typing
const columns: ColumnDef<Equipment>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "name", header: "Name" },
  // ... more columns
];

// Use generic DataTable
<DataTable
  data={equipments}
  columns={columns}
  searchableFields={["name", "description"]}
  renderRowActions={(equipment) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost">⋯</Button></DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem asChild><Link href={`/management/equipments/${equipment.id}`}>View</Link></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )}
/>
```

### Troubleshooting & Common Pitfalls

**Type Issues:**
- Duplicate `Json` type errors during `next build` — alias imports locally to fix
- Metadata type mismatches — ensure builders from `lib/metadata/builders.ts` are used consistently

**Data Issues:**
- Newlines missing in company metadata lists — preserve empty strings when storing line-based lists (avoid `.filter(Boolean)`)
- RLS policy failures — ensure all queries include/derive `company_id` and user has proper membership

**Auth Issues:**
- Random logouts — follow `supabase_ai_docs/nextjs-supabase-auth-rules.md` exactly
- Admin operations in client code — move to API routes under `app/api/admin/`

### Agent Workflow & State Management

**Before Starting Work:**
- Consult `todos.md` and `agentlog.md` to understand current project state
- Read relevant `supabase_ai_docs/` files for Supabase-related changes
- After schema changes, always run `npm run supabase-gen-types` before writing code

**After Completing Tasks:**
- Append 2-4 line summary to `agentlog.md` (date/time, task, files touched, next step)
- Create git commit capturing changes
- Update `human-review-todos.md` for items requiring user review

**Documentation Hierarchy:**
- This file: concise, actionable guidance
- `AGENTS.md`: comprehensive project rules and domain model
- `supabase_ai_docs/`: authoritative Supabase implementation rules
- Add new patterns here; move detailed explanations to appropriate docs

If anything here is unclear or you need examples for specific patterns (auth flows, testing, metadata handling), ask for clarification on that specific area. 
