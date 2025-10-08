# Human Review Todos

- **🚨 CRITICAL SECURITY BUG - Phase 2 Required**: Multi-Company Data Isolation incomplete! Phase 1 added cookie infrastructure, but **ALL database queries must be fixed**. Affected files (29+ queries):
  - **Server Components**: app/management/{page.tsx, articles/[id]/page.tsx, equipments/page.tsx, locations/[id]/page.tsx, contacts/[id]/page.tsx, cases/[id]/page.tsx, jobs/[id]/page.tsx, workshop/page.tsx, scanner/page.tsx, search/page.tsx}
  - **Client Components**: All forms (equipment-create-form, article-create-form, etc.), SearchPicker components, DataTable queries
  - **Required Changes**: Add `const activeCompanyId = await getActiveCompanyId()` + `.eq('company_id', activeCompanyId)` to EVERY query
  - **Test Plan**: Create test user with 2 companies, switch between them, verify data isolation in all tables
  - **Priority**: MUST FIX BEFORE PRODUCTION - Data leak across company boundaries!

- **TESTING NEEDED**: Asset Tag Template system completely overhauled - test template creation in `/management/company-settings?tab=templates`, verify SVG generation via `/api/asset-tags/[id]/render`, validate template preview functionality. System now supports comprehensive metadata (20+ fields) instead of basic 4-field structure.
- Validate RLS policies comprehensively against `users_companies` membership for all tables (articles, equipments, locations, cases, customers, jobs, job_* tables, history). This needs a local Supabase instance and scenario scripts.
- Optional: Integrate Playwright MCP server in the workflow and document how to trigger it locally/CI.
- Metadata UI: Replace free-form JSON textareas with typed subforms using `components/metadataTypes.types.ts` (article/equipment/customer/job/company). Keep JSON editor as advanced override. Define minimal required fields and validation. Align with DACH defaults from `lib/metadata/defaults.ts`.
- 2025-09-26: The commit for migrating `tests/helpers.ts` also included unrelated file deletions and a rename (`supabase/seed.ts` -> `lib/tools/seed.ts`) that were already staged locally. Please review these incidental changes to confirm they were intentional before pushing.
- 2025-09-27: `npm run supabase-gen-types` failed due to an existing migration re-applying a duplicate policy (`allow delete` on `public.history`). Please review migration `20250926235430_allow.sql`: either remove/guard duplicate policy lines or run `supabase db reset` to rebase. After resolving, re-run `npm run supabase-gen-types` to apply the new composite FK migration and refresh `database.types.ts`.
