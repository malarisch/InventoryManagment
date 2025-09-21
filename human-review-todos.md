# Human Review Todos

- Configure E2E auth test credentials and flows in Playwright (seed test user, stable email link handling). Requires running Supabase locally and SMTP or magic-link interception.
- Decide whether E2E should run against `next start` in CI (build step) vs `next dev`. If CI, add `webServer` command to start production server and ensure ports/timeouts.
- Validate RLS policies comprehensively against `users_companies` membership for all tables (articles, equipments, locations, cases, customers, jobs, job_* tables, history). This needs a local Supabase instance and scenario scripts.
- Optional: Integrate Playwright MCP server in the workflow and document how to trigger it locally/CI.
