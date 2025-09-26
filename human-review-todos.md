# Human Review Todos

- **TESTING NEEDED**: Asset Tag Template system completely overhauled - test template creation in `/management/company-settings?tab=templates`, verify SVG generation via `/api/asset-tags/[id]/render`, validate template preview functionality. System now supports comprehensive metadata (20+ fields) instead of basic 4-field structure.
- Validate RLS policies comprehensively against `users_companies` membership for all tables (articles, equipments, locations, cases, customers, jobs, job_* tables, history). This needs a local Supabase instance and scenario scripts.
- Optional: Integrate Playwright MCP server in the workflow and document how to trigger it locally/CI.
- Metadata UI: Replace free-form JSON textareas with typed subforms using `components/metadataTypes.types.ts` (article/equipment/customer/job/company). Keep JSON editor as advanced override. Define minimal required fields and validation. Align with DACH defaults from `lib/metadata/defaults.ts`.
- 2025-09-26: The commit for migrating `tests/helpers.ts` also included unrelated file deletions and a rename (`supabase/seed.ts` -> `lib/tools/seed.ts`) that were already staged locally. Please review these incidental changes to confirm they were intentional before pushing.
