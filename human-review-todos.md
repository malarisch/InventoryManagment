# Human Review Todos

- Validate RLS policies comprehensively against `users_companies` membership for all tables (articles, equipments, locations, cases, customers, jobs, job_* tables, history). This needs a local Supabase instance and scenario scripts.
- Optional: Integrate Playwright MCP server in the workflow and document how to trigger it locally/CI.
- Metadata UI: Replace free-form JSON textareas with typed subforms using `components/metadataTypes.types.ts` (article/equipment/customer/job/company). Keep JSON editor as advanced override. Define minimal required fields and validation. Align with DACH defaults from `lib/metadata/defaults.ts`.
