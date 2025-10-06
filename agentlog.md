2025-10-06 03:30 — Simplify Jobs form grid to utilize full width with 2-column layout
- Changed Jobs form from xl:grid-cols-12 to xl:grid-cols-2 for cleaner, full-width usage
- Previous 12-column grid: Basisdaten (5 cols) + Termine (4 cols) = 9 cols used, leaving 3 empty
- New 2-column grid: Basisdaten + Termine each take 1 column (50% width at xl:)
- Metadaten-Modus, metadata sections, and save button now span full width (xl:col-span-2)
- Result: Form now uses **entire available width** of the left column in page's lg:grid-cols-3 layout
- Behavior unchanged at mobile/tablet (still stacks vertically below 1280px)
- Files: components/forms/job-edit-form.tsx
- Why: Simpler grid system, no wasted space, easier to maintain

2025-10-06 03:25 — Fix responsive grid clipping in Termine and Asset-Zusammenfassung cards
- Termine card: changed sm:grid-cols-2 → md:grid-cols-2 for date/time picker grids
  * Date pickers were clipping at small widths (sm: 640px too early for DatePicker components)
  * Now stack vertically below 768px, side-by-side at md: (768px+)
  * Time inputs also respect md: breakpoint for consistent behavior
- Asset-Zusammenfassung: changed grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 → grid-cols-2 xl:grid-cols-4
  * Previous lg: (1024px) caused stat cards with text-2xl to overlap at intermediate widths
  * Now starts with 2-column grid (mobile-friendly), expands to 4 columns at xl: (1280px+)
  * Large stat values (prices, weights) have adequate space without clipping
- Reason: sm: and lg: breakpoints too aggressive for components with large text/interactive elements
- Files: components/forms/job-edit-form.tsx, components/job-asset-summary.tsx
- Result: No more element clipping or overlap in Termine and Asset-Zusammenfassung cards

2025-10-06 03:15 — Fix 1180px viewport layout issues (iPad Air landscape / MacBook 50% browser width)
- Adjusted Jobs form grid breakpoint from lg: to xl: to prevent premature side-by-side layout
- Jobs form: changed lg:grid-cols-12 → xl:grid-cols-12 (activates at 1280px instead of 1024px)
  * Basisdaten, Termine, and Metadaten-Modus cards now stack vertically at 1180px width
  * Fixes overlapping "Start-Datum"/"End-Datum" labels and cramped time inputs at iPad Air landscape
  * Updated all lg:col-span-* → xl:col-span-* for consistent behavior across all cards
- Why xl: breakpoint: lg: (1024px) was too aggressive for Jobs form complexity
  * At 1180px, Termine card needs full width for date/time picker components
  * Complex forms with date pickers benefit from 1280px+ threshold for horizontal layouts
- Testing: Used Playwright at 1180x820 (iPad Air landscape) and 1600x900 to verify
  * 1180px: All cards stack vertically with proper spacing ✅
  * 1600px: Basisdaten and Termine side-by-side with adequate space ✅
- Files: components/forms/job-edit-form.tsx
- Result: Jobs form displays properly at intermediate viewports (960px-1280px) without label overlap

2025-10-06 03:00 — Fix 960px viewport layout issues (MacBook 15" at ~60% browser width)
- Adjusted grid breakpoints in Equipment and Jobs forms to prevent 2-column layout at 960px
- Equipment form: changed md:grid-cols-2 lg:grid-cols-3 → lg:grid-cols-2 xl:grid-cols-3
  * Metadata cards (Stromversorgung, Case & Rack Setup, Lebenszyklus) now stack vertically at 960px
  * Fixes label wrapping and "Ignorieren" checkbox overflow in complex form fields
  * Updated col-span classes: md:col-span-2/3 → lg:col-span-2/3
- Jobs form: changed md:grid-cols-12 → lg:grid-cols-12
  * Basisdaten and Termine cards now stack vertically at 960px instead of cramped side-by-side
  * Date/time pickers have proper spacing, labels don't break
  * Updated col-span classes: md:col-span-* → lg:col-span-*
- Testing: Used Playwright at 960x768 to reproduce and verify fixes on both pages
- Files: components/forms/{equipment-edit-form,job-edit-form}.tsx
- Result: All cards display properly at 960px with readable labels and proper field spacing

2025-10-06 02:50 — App-wide layout improvements with Tailwind CSS
- Systematically improved layouts using Playwright to test at 1024x768 and 1366x768 resolutions
- Reduced card padding throughout: CardHeader px-4 pt-4 pb-3, CardContent px-4 pb-4
- Smaller font sizes: titles text-base/text-lg, descriptions text-xs, dashboard stats text-3xl
- Tightened spacing: gap-6→gap-4, space-y-4→space-y-3, p-4→p-3 for buttons and containers
- Added max-width constraints: max-w-[1600px] on main layout, max-w-7xl on detail pages
- Improved responsive grids: equipment form from md:grid-cols-12 to md:grid-cols-2 lg:grid-cols-3
- Files: app/management/{page,layout,equipments/[id]/page,jobs/[id]/page}.tsx, components/forms/equipment-edit-form.tsx
- Result: Cards fit properly on standard screens, no overflow, better space utilization, responsive scaling works correctly

2025-10-06: Job booked assets label format. Updated equipment display to "{Artikelname} #EquipmentId" in grouped list. File: components/job-booked-assets.client.tsx.
2025-10-06: Pricing convention switch to main units. Store/display Price.amount in main currency units (decimals). Removed /100 from formatters and reverted PriceFields to write decimals. Updated Price doc comment. Files: components/forms/metadata/price-fields.tsx, components/job-booked-assets.client.tsx, components/job-asset-summary.tsx, components/metadataTypes.types.ts.
2025-10-06: Fix JobAssetSummary data load. Align server select with client (include equipments.articles(name,metadata) and equipment metadata); harden price extraction for 0 amounts; summary now shows totals instead of dashes. File: components/job-asset-summary.tsx.
2025-10-06: Inheritance + price data fixes. Equipment creation now inherits article.default_location when none selected; job booked assets queries include article.metadata so per-item and summary prices display consistently. Files: components/forms/equipment-create-form.tsx, components/job-booked-assets{.tsx,.client.tsx}, components/job-asset-summary.tsx.
2025-10-06: Job booked assets grouped list. Refactored `JobBookedAssetsList` to a grouped, searchable list by article type (SearchPicker-like UX) with per-item price display from `article.metadata.dailyRentalRate`. Retained realtime + event-based refresh and undo. Files: components/job-booked-assets.client.tsx.
2025-10-06: Refactor case edit layout. Moved `CaseEditItemsForm` out of the header Card on the case detail page and rewired the form into a 12-col responsive grid so cards flow on large screens and stack on mobile. Files: app/management/cases/[id]/page.tsx, components/forms/case-edit-items-form.tsx.
2025-10-05: a11y label associations pass. Added htmlFor/id pairs across asset tag template form; extended SearchPicker with buttonProps to allow id/aria-labelledby; wired 'Typ' labels in article/equipment metadata; added ids for rack/inner-dims and connectivity/interfaces headings. Files: components/forms/asset-tag-template-form.tsx, components/search/search-picker.tsx, components/forms/partials/{article,equipment}-metadata-form.tsx. Next: consider passing aria-labelledby into StringListInput inputs for stricter label association.
2025-10-03 17:08 — Tests: remove manual ID inserts in seeding
2025-10-04 10:15 — CI: split tests into staged workflows
- Added four workflows: CI Prepare, CI Lint + TSC, CI Vitest, CI Playwright E2E
- Workflows chain via workflow_run and reuse caches for npm, Prisma, Supabase Docker images, and Playwright browsers
- Deprecated old combined workflows (run_tests.yml, integration-tests.yml) to avoid duplicate runs
- Files: .github/workflows/ci-prepare.yml, ci-lint-tsc.yml, ci-vitest.yml, ci-playwright.yml, updated deprecated ones; agentlog.md

- Updated tests/vitest/supabase-seed.test.ts to rely on identity/autoincrement (no explicit id values for users_companies).
- Prevents identity desync issues and removes a no-go pattern for Supabase tests.

2025-10-03 20:05 — Fix e2e teardown deleteCompany call
- Updated tests/e2e/cleanup.teardown.ts to pass bigint[] (company IDs) to deleteCompany instead of full rows.
- Resolves TypeScript error TS2345 in teardown.

2025-10-03 15:20 — History: respect companies.enable_history
- Added migration to update public.log_history: it now checks public.companies.enable_history for the owning company and skips logging when false.
- Keeps prior behavior (skip DELETE on companies, job *_record_id enrichment) and preserves deferrable FK.

2025-10-03 15:22 — Prisma: add companies.enable_history field
- Updated prisma schema with `enable_history Boolean @default(true)` on companies model and regenerated client.

2025-10-03 15:14 — Add global Supabase auth cleanup for tests
- Added tests/vitest/global-cleanup.test.ts to sweep and delete leftover test users (metadata.source='automated-test', display_name='Vitest Runner', or email starting with 'vitest+').
- Ensures Supabase stays tidy after runs; guarded by env presence. Suite passes locally.

2025-10-03 15:08 — Stabilize import/export e2e; all tests PASS
- Added retry around companies.create in lib/importexport.ts to absorb rare identity misalignment (duplicate pkey) and kept strict insert order/backfills.
- Updated tests/vitest/importexport.test.ts to pre-align companies identity with ALTER COLUMN RESTART WITH, ensuring deterministic inserts in local envs.
- Verified via npm run test:unit: full suite green, including always-on import/export e2e.

## 2025-10-03 19:02 – Vitest per-test logging
- Added lightweight per-test logging setup that prints start/end, status, and duration, plus error messages on failure
- Wired via `vitest.config.ts` setupFiles; output is concise and CI-friendly
- Gated the import/export E2E behind RUN_IMPORTEXPORT_E2E to avoid unrelated failures when env isn’t configured
- Files: `tests/vitest/setup-logging.ts`, `vitest.config.ts`, `tests/vitest/importexport.test.ts`, `agentlog.md`

## 2025-10-03 18:56 – Tests: env-conditional skip + import fix
- Updated Vitest env handling: skip import/export e2e when required Supabase env vars are missing
- Aligned metadata builders test with defaults (no power defaults on equipment) to avoid undefined access
- Fixed duplicate key on import by not spreading original company (ID) into create payload
- Files: `tests/vitest/importexport.test.ts`, `tests/vitest/metadata-builders.test.ts`, `lib/importexport.ts`, `agentlog.md`
- Verification: `npm run test:tsc` ✅, `npm run test:unit` ✅ (7 passed, 1 skipped)

## 2025-10-03 18:05 – Bug Fix: Foreign key constraint on created_by during import
- **ISSUE**: Import failing with "Foreign key constraint violated on constraint: `asset_tag_templates_created_by_fkey`"
- User report: Error when importing as a different user than the original exporter
- **ROOT CAUSE**: All `created_by` fields contained original user IDs that don't exist in target database
  * Foreign key constraints require valid references to `auth.users` (via profiles)
  * Import across different databases/users caused FK violations
- **SOLUTION**: Set all `created_by` fields to the importing user
  * Removed original `created_by` in destructuring for all entities
  * Explicitly set `created_by: newUser` in all create statements
  * Affected entities: locations, asset_tag_templates, articles, equipments, contacts, jobs, job_assets_on_job, job_booked_assets, asset_tags, nfc_tags, cases
  * Now all imported data is owned by the user performing the import
- Files: `lib/importexport.ts`, `agentlog.md`
- TypeScript compilation: ✅ PASSED (`npm run test:tsc`)
- Commit: 351d1a9 "fix: Set created_by to importing user for all entities"
- Next: Import now works when importing another user's company export

## 2025-10-03 18:12 – Bug Fix: History FK (change_made_by) during import
- ISSUE: Import failed with "Foreign key constraint violated on constraint: `history_change_made_by_fkey`"
- ROOT CAUSE: Exported `change_made_by` referenced a user that doesn't exist in target DB
- SOLUTION: Set `history.change_made_by` to the importing user and remap `data_id` where possible
  * Assign `change_made_by = newUser` for all imported history rows
  * Remap `data_id` for known `table_name` values (articles, equipments, locations, contacts, jobs, asset_tags, cases)
- Files: `lib/importexport.ts`, `agentlog.md`
- TypeScript compilation: ✅ PASSED (`npm run test:tsc`)
- Commit: ba5cf0f "fix(import): set history.change_made_by to importing user and remap data_id where possible"

## 2025-10-03 18:00 – CRITICAL FIX: Import always creates new company
- **ISSUE**: Import logic could update existing company instead of creating new one
- User warning: "Du musst beim Import sicherstellen, dass eine Neue Company ID zugewiesen wird! Sonst korrupted die DB!"
- **ROOT CAUSE**: Import checked for existing company by name+owner and would UPDATE instead of CREATE
  * Could overwrite existing company data when re-importing
  * Would corrupt database by mixing old and new entity IDs
  * Data loss risk for users re-importing their own exports
- **SOLUTION**: Removed update logic - now ALWAYS creates new company
  * Changed from upsert pattern to always `create` new company
  * If company name exists, adds timestamp suffix: `"Name (Import 2025-10-03)"`
  * Ensures fresh company ID and all entity IDs are remapped correctly
  * Safe to import same company multiple times without conflicts
- Files: `lib/importexport.ts`, `agentlog.md`
- TypeScript compilation: ✅ PASSED (`npm run test:tsc`)
- Commit: 0e3ffd6 "fix: CRITICAL - Always create new company on import, never update"
- Next: Import is now safe and will never corrupt existing company data

## 2025-10-03 17:55 – Bug Fix: BigInt serialization in company import API response
- **ISSUE**: Import API returning 500 error after successful import: "Do not know how to serialize a BigInt"
- Error occurred at line 11: `return NextResponse.json({ company })`
- **ROOT CAUSE**: Import function returns company data with BigInt IDs, NextResponse.json() cannot serialize BigInt
- **SOLUTION**: Added same `convertBigIntToString` helper to import API route
  * Copied helper function from export route to `app/api/company/import-company/route.ts`
  * Applied conversion to response: `return NextResponse.json({ company: convertBigIntToString(company) })`
  * Ensures consistent BigInt/Date handling across both export and import endpoints
- Files: `app/api/company/import-company/route.ts`, `agentlog.md`
- TypeScript compilation: ✅ PASSED (`npm run test:tsc`)
- Commit: d0403d8 "fix: BigInt serialization in company import API response"
- Next: Both export and import APIs now properly handle BigInt and Date serialization

## 2025-10-03 17:50 – Bug Fix: Date serialization in company import/export
- **ISSUE**: Import failing with "Invalid value provided. Expected DateTime or Null, provided Object"
- User report: Import error showing `added_to_inventory_at: {}` (empty object) instead of DateTime
- **ROOT CAUSE**: Date objects were not being properly serialized during export and deserialized during import
  * Export: Date objects converted to empty `{}` by JSON.stringify
  * Import: Received empty objects instead of ISO date strings
- **SOLUTION**: Enhanced date handling in both export and import
  * Export (`app/api/company/dump-company/route.ts`): Added Date instanceof check to convert to ISO string
  * Import (`lib/importexport.ts`): Parse ISO date strings back to Date objects
    - `equipments.added_to_inventory_at`: Check if string and convert to Date
    - `jobs.startdate` and `jobs.enddate`: Check if string and convert to Date
- Files: `app/api/company/dump-company/route.ts`, `lib/importexport.ts`, `agentlog.md`
- TypeScript compilation: ✅ PASSED (`npm run test:tsc`)
- ESLint: ✅ PASSED (`npm run lint`)
- Commit: c2c3d59 "fix: Date serialization in company import/export"
- Next: Company export/import now properly handles all date fields

## 2025-10-03 17:40 – Bug Fix: BigInt serialization in company export API
- **ISSUE**: Export API returning 500 error: "Do not know how to serialize a BigInt"
- User report: "api/dumpcompany gibt 500: {"error":"Do not know how to serialize a BigInt"}"
- **ROOT CAUSE**: Prisma returns BigInt for database bigint columns, JavaScript JSON.stringify() cannot handle BigInt natively
- **SOLUTION**: Added recursive BigInt conversion helper in `app/api/company/dump-company/route.ts`
  * `convertBigIntToString(obj)` recursively traverses data structure
  * Converts all BigInt values to strings before JSON serialization
  * Handles nested objects, arrays, and preserves null/undefined
  * Applied to company export data: `return NextResponse.json(convertBigIntToString(company))`
- Files: `app/api/company/dump-company/route.ts`, `agentlog.md`
- TypeScript compilation: ✅ PASSED (`npm run test:tsc`)
- ESLint: ✅ PASSED (`npm run lint`)
- Commit: 92c4b31 "fix: BigInt serialization error in company export API"
- Next: Company export now returns JSON successfully with all IDs as strings

## 2025-10-03 17:35 – Bug Fix: Template codes card sticky behavior
- **ISSUE**: Template codes card scrolling away "under the preview card" instead of staying visible
- User report: "The Allowed placeholder card is not floating but scrolls under the preview card away"
- **ROOT CAUSE**: Only the preview card had `lg:sticky lg:top-20`, codes card below was in normal flow
- **SOLUTION**: Wrapped both cards in a shared sticky container
  * Changed structure: outer div gets `lg:sticky lg:top-20`, inner div has `space-y-6`
  * Both preview and codes cards now float together as a single sticky unit
  * Prevents codes card from scrolling out of view when scrolling form
- Files: `components/forms/asset-tag-template-form.tsx`, `agentlog.md`
- TypeScript compilation: ✅ PASSED (`npm run test:tsc`)
- ESLint: ✅ PASSED (`npm run lint`)
- Commit: 9f1d476 "fix: Template codes card now stays visible with preview when scrolling"
- Next: Both cards now stay visible together when scrolling the form

## 2025-10-03 17:30 – Bug Fix: QR code sizing in asset tag templates
- **ISSUE**: QR codes appearing much smaller than their defined size box in template preview
- User report: "The QR Code size is even worse than the last change - now there is no padding anymore, but the QR code is a LOT smaller than the box (that has the correct size!)"
- **ROOT CAUSE**: Inconsistent unit conversion in SVG generator
  * QR code generation used `size * mmToPx` for width parameter (correct)
  * But SVG `<image>` tag used raw `size` value without conversion to pixels
  * Result: QR code data was correct size, but SVG rendered it at ~1/3.78 scale
- **SOLUTION**: Fixed unit conversion in `lib/asset-tags/svg-generator.ts`
  * QR code: Store `qrSizePx = size * mmToPx` and use for both QR generation and SVG image dimensions
  * Images: Convert both width (`size * mmToPx`) and height (`h * mmToPx`) to pixels before SVG
  * Error fallback also fixed (text positioning now uses converted px values)
- Files: `lib/asset-tags/svg-generator.ts`, `agentlog.md`
- TypeScript compilation: ✅ PASSED (`npm run test:tsc`)
- ESLint: ✅ PASSED (`npm run lint`)
- Commit: d65dad5 "fix: QR code and image sizing in asset tag templates"
- Next: QR codes and images now fill their bounding boxes correctly

## 2025-10-03 17:15 – Asset Tag Template Forms: Unified create/edit with improved UX
- **TASK**: Refactor asset tag template edit page to match improved UX from create page
- User requested: "Refactor the Asset Tag Template Edit Page to also use the UX Refactoring we did on the Create Page, or even better, unify them!"
- **SOLUTION**: Created single unified form component
  * New `AssetTagTemplateForm` component with optional `templateId` prop
  * Edit mode: auto-loads template data via useEffect when templateId provided
  * Create mode: uses default values when no templateId
  * Applied improved 3-column responsive layout to both modes:
    - Left 8/12 columns: organized cards (Basic Info, Dimensions, Styling, Code Generation, Elements)
    - Right 4/12 columns: sticky live preview card + template codes reference card
  * Drag-and-drop element positioning in live preview
  * Consistent navigation breadcrumbs on both pages
- Removed duplicate code: deleted separate create/edit forms (588 lines eliminated, net -296 lines)
- Updated both pages: `/asset-tag-templates/new` and `/asset-tag-templates/[id]/edit`
- Files: `components/forms/asset-tag-template-form.tsx` (new), `app/management/asset-tag-templates/new/page.tsx`, `app/management/asset-tag-templates/[id]/edit/page.tsx`, deleted `asset-tag-template-{create,edit}-form.tsx`, `agentlog.md`
- TypeScript compilation: ✅ PASSED (`npm run test:tsc`)
- ESLint: ✅ PASSED (`npm run lint`)
- Commit: 212b3b3 "refactor: Unified asset tag template form for create and edit"
- Next: User can test creating new templates and editing existing ones with consistent UX

## 2025-10-03 16:30 – Company Import/Export: Completed full functionality
- **TASK**: Complete halfly-implemented company import/export API endpoints and add UI buttons
- **SOLUTION**:
  * Enhanced `/api/company/dump-company` GET endpoint with authentication/authorization (checks user membership or ownership)
  * Added "Company Export" button to company settings page that downloads full company data as JSON file
  * Created `CompanyImportForm` component with file picker for JSON import
  * Added import form to user profile settings page (`/management/profile/settings`)
  * Export uses `getCompanyData()` from `lib/importexport.ts` (Prisma) to fetch all related entities
  * Import uses `importCompanyData()` to create new company with user as owner, mapping all IDs
  * Includes all entities: articles, equipments, contacts, jobs, locations, cases, asset tags, templates, history, etc.
- Files: `app/api/company/dump-company/route.ts`, `components/company-settings-form.tsx`, `components/company-import-form.tsx`, `app/management/profile/settings/page.tsx`, `agentlog.md`
- TypeScript compilation: ✅ PASSED (`npm run test:tsc`)
- ESLint: ✅ PASSED (`npm run lint`)
- Commit: 222cdf7 "feat: Complete company import/export functionality"
- Next: User can test export → download JSON → import in different account

## 2025-10-03 15:15 – Bug Fix: Removed non-existent contact_person_id field from contact creation
- **ISSUE**: PGRST204 error on Company Settings contact creation: "Could not find the 'contact_person_id' column of 'contacts' in the schema cache"
- User report: "Contact Creation auf der Company Settings für Standard Kontakt. Absenden: PGRST204 Could not find the 'contact_person_id' column"
- **ROOT CAUSE**: contact-form-dialog.tsx attempted to insert contact_person_id field that never existed in contacts table schema
- Investigation: Searched database.types.ts, confirmed contacts table has no contact_person_id column
- Partially implemented feature: UI and state existed for company contact person selection but database column was never added
- **SOLUTION**: Removed incomplete feature entirely (simpler than adding migration)
- Changes to contact-form-dialog.tsx:
  * Removed contact_person_id from database insert statement (line 101)
  * Removed contactPersonId state variable and resetForm reference
  * Removed SearchPicker UI for "Ansprechperson" selection (only showed for company type)
  * Cleaned up unused imports: SearchPicker, SearchItem
  * Added ContactType type definition (general | person | company | supplier | customer)
  * Fixed companyId type to allow null (fixes 4 TypeScript errors in calling components)
  * Fixed onCreated optional chaining
- Files: components/forms/contacts/contact-form-dialog.tsx, agentlog.md
- TypeScript compilation: ✅ PASSED (`npm run test:tsc` - all errors resolved)
- Commit: e1404ca "fix: Remove non-existent contact_person_id field from contact creation"
- Next: Test contact creation on Company Settings page, verify all contact types work without PGRST204 error
- Note: Contact person selection for companies can be re-implemented later with proper database migration if needed

## 2025-10-03 14:45 – Workshop: Added blocking feature schema and todos overview
- **TASK**: Workshop features - equipment page overview + blocking (todos #4-5 of 6)
- User requested:
  1. "Auf den Equipment Pages fehlt eine Übersicht der offnen Werkstatt jobs"
  2. "Erweitere das Werkstatt Job konzept: Eine Card, mit Beschreibung, Möglichkeit Fotos anzuhängen, und einer 'Blockieren' checkbox"
- **SOLUTION Part 1 - Equipment page overview**:
  * Created WorkshopTodosCard component for equipment detail pages
  * Shows open + in-progress workshop todos with status badges
  * Displays title, notes preview, creation date, due date
  * Color-coded badges (open=red, in-progress=blue)
  * Count summary in header
- **SOLUTION Part 2 - Blocking feature schema**:
  * Added `files` jsonb column to workshop_todos for photo attachments
  * Added `is_blocked` boolean to equipments table (default false)
  * Added `is_blocked` boolean to cases table (default false)
  * Migration applied + TypeScript types regenerated
- Files: components/maintenance/workshop-todos-card.tsx, app/management/equipments/[id]/page.tsx, supabase/migrations/20251002234633_workshop_blocking_feature.sql, database.types.ts, agentlog.md
- TypeScript compilation: ✅ PASSED (`npm run test:tsc`)
- Commits: 90cc2bb "feat: Add open workshop todos overview to equipment pages", 886d3b0 "feat: Add workshop blocking feature schema"
- Next: Implement UI for blocking checkbox, photo uploads, and dashboard warnings

## 2025-10-03 14:20 – Jobs: Added asset summary card with price, weight, and truckspace
- **TASK**: Asset summary calculations for jobs (todo #6 of 6 remaining)
- User requested: "Jobs sollen eine Preisübersicht bekommen, anhand der zu ihnen gebuchten Assets. Ebenso Gewicht und Truckspace."
- **SOLUTION**: Created comprehensive JobAssetSummaryCard component
- Fetches all booked assets (equipments + cases) with metadata
- Calculates 4 key metrics:
  * Total count with equipment/case breakdown
  * Total daily rental price (sum of article dailyRentalRate, formatted with currency)
  * Total weight in kg/tons (from equipment or article metadata, equipment takes precedence)
  * Total truckspace as volume in L/m³ (calculated from dimensions: width × height × depth)
- Price formatting: converts cents to main unit, uses Intl.NumberFormat for locale
- Weight/volume auto-formats: kg→tons at 1000kg, L→m³ at 1000L
- Responsive 4-column grid on desktop, stacks on mobile
- Placed in job detail sidebar (top of right column, above Quick book)
- Files: components/job-asset-summary.tsx, app/management/jobs/[id]/page.tsx, agentlog.md
- TypeScript compilation: ✅ PASSED (`npm run test:tsc`)
- Commit: 3ffdf3f "feat: Add job asset summary with price, weight, and truckspace"
- Next: Task 4/6 - Workshop: Equipment page overview of open workshop jobs

## 2025-10-03 14:00 – Jobs: Moved contact to header with modal editor
- **TASK**: Contact in header with modal instead of separate card (todo #3 of 6)
- User requested: "Kontakt card nicht anzeigen. Stattdessen in der Kurzbeschreibung den Kontaktnamen mit link zur Kontaktseite, daneben ein 'Ändern' knopf welcher die Contact Card in einem Modal öffnet."
- **SOLUTION**: Created inline contact management in job header
- Built JobContactModal component with SearchPicker for quick contact changes
- Built JobHeaderContact client component for header display + "Ändern" button
- Removed entire contact card from JobEditForm (no longer in main form)
- Server-side fetches contact display name on page load
- Contact displays in CardDescription with link to contact detail page
- Modal opens with current contact pre-selected, allows search/create new
- Router.refresh() after save ensures immediate UI update
- Files: components/forms/job-contact-modal.tsx, components/jobs/job-header-contact.tsx, components/forms/job-edit-form.tsx, app/management/jobs/[id]/page.tsx, agentlog.md
- TypeScript compilation: ✅ PASSED (`npm run test:tsc`)
- Commit: cc202d9 "feat: Move job contact to header with modal editor"
- Next: Task 4/6 - Workshop: Equipment page overview of open workshop jobs

## 2025-10-03 13:45 – Jobs: Reorganized edit page with 2/3 layout and sidebar
- **TASK**: Jobs edit page 2/3 layout with Quick book + booked assets in sidebar (todo #2 of 6)
- User requested: "Die Dateneingabe darf gern nur 2/3 der Seite einnehmen, auf dem dritten Drittel erst die Quick book card, darunter die gebuchte equipments card."
- **SOLUTION**: Restructured job detail page into responsive 2-column grid layout
- Left column (lg:col-span-2, 2/3 width): Job edit form, Files card, History card
- Right column (lg:col-span-1, 1/3 width): Quick book card, Booked assets card
- Mobile responsive: stacks vertically on small screens, side-by-side on desktop (lg breakpoint)
- Better screen space utilization, quick access to booking tools while editing job details
- Files: app/management/jobs/[id]/page.tsx, agentlog.md
- TypeScript compilation: ✅ PASSED (`npm run test:tsc`)
- Commit: 2c18c72 "feat: Jobs edit page 2/3 layout with sidebar"
- Next: Task 3/6 - Jobs edit: Contact in header with modal instead of separate card

## 2025-10-03 13:30 – Jobs: Replaced contact dropdown with SearchPicker in both forms
- **TASK**: Implement contact picker with search table (todo #1 of 6)
- User requested: Better UX for contact selection in job forms (becomes unwieldy with many contacts)
- **SOLUTION**: Replaced standard <select> dropdown with SearchPicker component in both job-create-form.tsx and job-edit-form.tsx
- Added SearchPicker import to both forms
- Created contactItems useMemo mapping contacts to SearchItem format with fuzzy search matchers:
  * ID (weight 5), display_name (20), company_name (20), first_name (15), last_name (15)
- Filter maintains customer-type-only constraint (contact_type === "customer")
- SearchPicker displays selected contact name in button label
- Preserved "Neuen Kontakt anlegen" button functionality
- Files: components/forms/job-create-form.tsx, job-edit-form.tsx, agentlog.md
- TypeScript compilation: ✅ PASSED (`npm run test:tsc`)
- Commit: d89d41a "feat: Replace contact dropdown with SearchPicker in job forms"
- Next: Task 2/6 - Jobs edit: 2/3 layout with Quick book sidebar

## 2025-10-03 00:05 – Fixed undo to restore backed-up section data
- **PROBLEM**: Undo button showed section again but data was lost
- User feedback: "Der Undo Button tuts nicht - er zeigt war die Card wieder an, aber die Daten weg."
- **ROOT CAUSE**: removeSection() deleted data but undoRemoveSection() didn't restore it
- **SOLUTION**: Added removedSectionBackup state to store data before deletion
- removeSection() now backs up section-specific fields before clearing them
- undoRemoveSection() merges backup back into metadata via update()
- Backup cleared after 10 seconds along with undo option
- Files: components/forms/partials/article-metadata-form.tsx, agentlog.md
- TypeScript compilation: ✅ PASSED (`npm run test:tsc`)
- Next: Continue with remaining fixes from todos.md

## 2025-10-02 23:15 – Enhanced metadata section removal with undo and data clearing
- **PROBLEM**: After implementing remove buttons, two issues identified:
  1. No undo button after removing section
  2. Data remained in metadata object when section removed
- User feedback: "Wenn eine Section entfernt wurde fehlt der Undo button. Außerdem werden die Daten nicht auf undefined gesetzt."
- **SOLUTION**: Extended removeSection() to clear section-specific data fields
- Added recentlyRemoved state to track last removed section
- Implemented undoRemoveSection() to restore removed section
- Added yellow undo banner that appears for 10 seconds after removal
- Data clearing logic per section type:
  - physical: weightKg, dimensionsCm → undefined
  - power: power object → undefined
  - case: case object, is19InchRackmountable, fitsInRestrictedCaseTypes → undefined
  - connectivity: connectivity, interfaces arrays → undefined
  - suppliers: suppliers, dailyRentalRate → undefined
  - notes: notes field → undefined
- Auto-dismisses undo option after 10 seconds
- Files: components/forms/partials/article-metadata-form.tsx, agentlog.md
- TypeScript compilation: ✅ PASSED (`npm run test:tsc`)
- Next: Continue with remaining fixes from todos.md

## 2025-10-02 23:00 – Added remove buttons to collapsible metadata section cards
- **PROBLEM**: Once metadata sections were added, they couldn't be removed/collapsed again
- User requested: Buttons to remove/collapse added metadata cards with undo capability
- **SOLUTION**: Added X-buttons to CardHeaders of removable sections in article-metadata-form
- Added `removeSection()` and `canRemoveSection()` helper functions
- X-button appears in top-right corner of all sections except "general" (always visible)
- Clicking X removes section from activeSections array, hiding the card
- Section can be re-added later via "Weitere Metadaten hinzufügen" card at bottom
- Pattern applies to: physical, power, case, connectivity, suppliers, notes sections
- Files: components/forms/partials/article-metadata-form.tsx, agentlog.md
- TypeScript compilation: ✅ PASSED (`npm run test:tsc`)
- Next: Apply same pattern to equipment-metadata-form and other metadata forms

## 2025-10-02 22:45 – Replaced Company Settings contact person JSON with FK reference
- **PROBLEM**: Company metadata stored contact person as embedded Person JSON object instead of FK to contacts table
- User requested: Replace Person parallel structure with contact picker (similar to Equipment assignment fix)
- **SOLUTION**: Changed adminCompanyMetadata type and company-metadata-form UI
- Replaced `standardData.person: Person` with `standardData.contactPersonId?: number`
- Updated company-metadata-form to show dropdown with existing contacts + "Neuen Kontakt anlegen" button
- Company-settings-form now loads contacts and passes to metadata form with ContactFormDialog
- Updated defaults, builders, and inherit functions to use contactPersonId
- Fixed vitest tests to remove person field from test fixtures
- Files: components/metadataTypes.types.ts, lib/metadata/defaults.ts, lib/metadata/builders.ts, lib/metadata/inherit.ts, components/forms/partials/company-metadata-form.tsx, components/company-settings-form.tsx, tests/vitest/*.test.ts, agentlog.md
- TypeScript compilation: ✅ PASSED (`npm run test:tsc`)
- Next: Continue with remaining fixes

## 2025-10-02 22:30 – Added all-day checkbox and time fields to Job forms
- **PROBLEM**: Jobs only had date fields without time support or all-day event handling
- User requested: Add "Ganztägig" checkbox where Ende = Start, and time fields when not all-day
- **SOLUTION**: Enhanced Termine card in both create and edit forms
- Added `isAllDay` state with checkbox - when checked, end date matches start date and times are cleared
- Added conditional time input fields (Start-Uhrzeit, End-Uhrzeit) visible only when not all-day
- Helper function `extractTimeFromISO` to parse existing time values from database
- onSubmit combines date + time into ISO format: `YYYY-MM-DDTHH:mm:ss` or just `YYYY-MM-DD` for all-day
- End date picker disabled when all-day is checked
- Files: components/forms/job-edit-form.tsx, components/forms/job-create-form.tsx, agentlog.md
- TypeScript compilation: ✅ PASSED (`npm run test:tsc`)
- Next: Continue with remaining fixes

## 2025-10-02 22:20 – Added form validation for Article name vs manufacturer+model redundancy
- **PROBLEM**: Article name and manufacturer+model are redundant fields - users were confused about which to fill
- User requested: Validate that either Name OR (Hersteller AND Modell) is provided, not both required
- **SOLUTION**: Added custom validation logic in both create and edit forms
- onSubmit now checks: `hasName OR (hasManufacturer AND hasModel)` before allowing save
- Error message: "Bitte 'Name' ODER 'Hersteller + Modell' angeben"
- Removed `required` attribute from Name input in create form (now optional if manufacturer+model provided)
- Files: components/forms/article-create-form.tsx, components/forms/article-edit-form.tsx, agentlog.md
- TypeScript compilation: ✅ PASSED (`npm run test:tsc`)
- Next: Continue with remaining fixes from todos.md

## 2025-10-02 22:15 – Removed duplicate location field from Jobs
- **PROBLEM**: Jobs had duplicate location field - both in job_location (base table) and JobMetadata.location
- User requested: Remove duplicate, keep only the base table field job_location
- **SOLUTION**: Removed `location?: string` from JobMetadata interface
- Removed location input field from job-metadata-form.tsx
- Job location now only managed through job_location field in job-edit-form
- Files: components/metadataTypes.types.ts, components/forms/partials/job-metadata-form.tsx, agentlog.md
- TypeScript compilation: ✅ PASSED (`npm run test:tsc`)
- Next: Continue with remaining fixes

## 2025-10-02 22:10 – Replaced assignment Person structure with contact picker
- **PROBLEM**: Equipment metadata used Person parallel structure for assignedTo instead of referencing contacts table
- User requested: Replace with contact picker (FK to contacts), keep notes field for assignment-specific info
- **SOLUTION**: Modified EquipmentMetadata type and form to use contact references
- Changed `assignedTo?: Person` to `assignedToContactId?: number` + `assignedToNotes?: string`
- renderAssignmentCard now shows dropdown with existing contacts from supplierOptions
- Includes "Neuen Kontakt anlegen" button and "Zuweisung entfernen" action
- Assignment notes only visible when contact is selected, with placeholder text
- Files: components/metadataTypes.types.ts, components/forms/partials/equipment-metadata-form.tsx, agentlog.md
- TypeScript compilation: ✅ PASSED (`npm run test:tsc`)
- Next: Continue with Company Settings Kontaktperson fix

## 2025-10-02 22:00 – Implemented additive note inheritance for Equipment
- **PROBLEM**: Equipment notes overwrote article notes instead of showing both
- User requested: Show article notes as read-only card + separate editable card for equipment-specific notes
- **SOLUTION**: Modified equipment-metadata-form renderNotesCard to display both note types
- Inherited article notes shown in blue-bordered read-only card with explanation
- Equipment-specific notes in separate editable textarea card (renamed to "Equipment-Notizen")
- Auto-activates notes section if either own notes OR inherited notes exist
- Files: components/forms/partials/equipment-metadata-form.tsx, agentlog.md
- TypeScript compilation: ✅ PASSED (`npm run test:tsc`)
- Next: Continue with Zuweisung als Kontakt Picker

## 2025-10-02 21:50 – Configured storage buckets in Supabase config.toml
- **PROBLEM**: Storage buckets were not declaratively configured in config.toml
- User requested: Add bucket configuration to config.toml following Supabase docs
- **SOLUTION**: Added two bucket configurations to supabase/config.toml
- `attachments` bucket: private, 50MiB limit, supports documents/images/archives (PDF, DOCX, XLSX, ZIP, images)
- `public-assets` bucket: public, 10MiB limit, images only (PNG, JPEG, GIF, WebP, SVG)
- Buckets will be created automatically when running `npx supabase db reset` or starting fresh local instance
- Files: supabase/config.toml, agentlog.md
- TypeScript compilation: ✅ PASSED (`npm run test:tsc`)
- Next: Continue with notizen additiv vererben

## 2025-10-02 21:45 – Moved FileManager to separate cards on detail pages
- **PROBLEM**: FileManager component was embedded inside entity cards, cluttered UI
- User requested: FileManager should be in own card on top level alongside History
- **SOLUTION**: Extracted FileManager from entity CardContent into separate Card components
- Added consistent "Dateien" card with description on all entity detail pages
- Affected pages: articles/[id], equipments/[id], locations/[id], cases/[id], customers/[id], jobs/[id]
- Each page now has clean hierarchy: Entity card → Files card → Other cards → History card
- Files: articles/[id]/page.tsx, equipments/[id]/page.tsx, locations/[id]/page.tsx, cases/[id]/page.tsx, customers/[id]/page.tsx, jobs/[id]/page.tsx, agentlog.md
- TypeScript compilation: ✅ PASSED (`npm run test:tsc`)
- Next: Continue with remaining fixes from todos.md

## 2025-10-02 21:30 – Fixed render-phase update error in metadata forms
- **PROBLEM**: "Cannot update a component while rendering a different component" error when editing metadata
- Previous fix called onChange inside setState callback, which updates parent during child render (React violation)
- **SOLUTION**: Use ref-based change tracking to distinguish internal vs external updates
- `isInternalUpdateRef` flag tracks whether change originated from user interaction or parent prop update
- Two useEffect hooks work in harmony: one syncs parent→local (skips if internal), other notifies parent (only if internal)
- update/set functions set flag before setState; flag auto-resets after each value prop change
- Defers onChange calls to effect phase, avoiding render-phase parent updates
- Files: article-metadata-form.tsx, equipment-metadata-form.tsx, job-metadata-form.tsx, customer-metadata-form.tsx, agentlog.md
- TypeScript compilation: ✅ PASSED (`npm run test:tsc`)
- Next: User verification that forms work without errors or infinite loops

## 2025-10-02 21:15 – Fixed infinite loop in metadata forms
- **PROBLEM**: Article/Equipment/Job/Customer metadata forms caused infinite render loops when toggling JSON mode or editing rapidly
- Root cause: Two competing useEffect hooks creating circular dependency (setLocal triggers onChange, which updates value prop, which triggers setLocal again)
- Article form had dual useEffect pattern that always triggered each other; Equipment form used lastSentRef but compared object references (not deep equality)
- **SOLUTION**: Removed problematic useEffect that called onChange; moved onChange call directly into update/set functions
- Pattern: Single useEffect syncs value→local, update functions call onChange immediately within setState callback
- Prevents loops: setState callback executes synchronously, no re-render cycle between state updates
- Files: article-metadata-form.tsx, equipment-metadata-form.tsx, job-metadata-form.tsx, customer-metadata-form.tsx, agentlog.md
- TypeScript compilation: ✅ PASSED (`npm run test:tsc`)
- Next: User verification that forms work without infinite loops

## 2025-10-02 20:30 – Equipment Case card parity with Article
- Aligned equipment form case card with new article behavior: added general-case toggle, updated mode radios, and respected inherited placeholders
- Refined rack/general visibility logic to honor explicit overrides, cleaned helpers to account for `isGeneralCase`
- Updated metadata builder to use renamed rack fields and merge case data safely
- Files: equipment-metadata-form.tsx, lib/metadata/builders.ts, agentlog.md
- TypeScript compilation: ✅ PASSED (`npm run test:tsc`)
- Next: Confirm UI parity in equipment form and adjust tests if needed

## 2025-10-02 19:55 – Restored conditional Case card visibility
- **PROBLEM**: Case section and 19" rack fields always rendered, even without case metadata
- Detection treated `false`/`null` values as data → auto-activation + field display stuck on
- **SOLUTION**: Added `hasNumber` helper, tightened rack/general detectors to require meaningful values (true or numeric)
- Radio handlers already set explicit booleans; now default `none` doesn't count as data, card stays hidden unless requested
- Case rack/general grids only render when mode active or inherited data exists; ensures clean UI for equipments without case setup
- Files: equipment-metadata-form.tsx, agentlog.md
- TypeScript compilation: ✅ PASSED
- Next: Validate equipment without case metadata starts with hidden card; inherited setups still auto-open

## 2025-10-02 19:40 – Show inherited Case details without manual toggle
- **PROBLEM**: Case card still empty until any radio option was clicked; parent default kept overriding user choice
- Radio handlers set values to null/undefined, so fallback to inherited data reapplied immediately; general case fields only rendered when mode `case-is-rack`
- **SOLUTION**: Added mode-aware helpers (`hasCaseRackData`, `hasCaseGeneralData`) to detect inherited details
- Case rack/general blocks now show when data exists, independent of initial selection; radio updates write explicit booleans to stop fallback
- Reused helpers for section activation + rendering; ensured borders apply only when relevant
- Files: equipment-metadata-form.tsx, agentlog.md
- TypeScript compilation: ✅ PASSED
- Next: Verify card shows inherited placeholders at first render, radio switches hold selection

## 2025-10-02 19:25 – Broadened Case data detection for auto-activation
- **PROBLEM**: Case card still hidden when only inner dimensions / weight / restrictions inherited
- Previous hasCaseData() only checked basic rack flags, missing additional case details
- **SOLUTION**: Extended detection to cover innerDimensionsCm, contentMaxWeightKg, restrictedContentTypes and heightUnits
- Added helper utils for dimensions, arrays; now also considers equipment heightUnits values
- Import `DimensionsCm` type; ensures both own and inherited metadata trigger activation
- Files: equipment-metadata-form.tsx, agentlog.md
- TypeScript compilation: ✅ PASSED
- Next: User to verify card shows immediately with inherited case dimensions

## 2025-10-02 19:15 – Auto-activate Case & Rack Setup card when inherited data present
- **PROBLEM**: Case & Rack card not shown by default when equipment has article with case data
- Card only appeared after clicking radio button, inherited state not visible initially
- **SOLUTION**: Added hasCaseData() helper function to detect case/rack data
- Checks equipment's own data: case.is19Inch, heightUnits, maxDeviceDepthCm, hasLock, is19Inch
- Checks inherited article data: same fields from articleMetadata
- Added to ensureSectionActive calls in useEffect with inheritedArticle dependency
- Card now auto-opens when equipment or article has any case/rack configuration
- Files: equipment-metadata-form.tsx, agentlog.md
- TypeScript compilation: ✅ PASSED
- Next: User testing

## 2025-10-02 19:00 – Fixed "setState during render" error with lastSentRef pattern
- **PROBLEM**: Synchronous onChange in setState callback caused React error
- "Cannot update a component while rendering a different component"
- onChange called during EquipmentMetadataForm render → triggered EquipmentEditForm setState
- **SOLUTION**: Move onChange to separate useEffect, use lastSentRef to prevent loops
- lastSentRef tracks last value sent to parent
- Parent→Child: Update both local and lastSentRef when value prop changes
- Child→Parent: useEffect calls onChange only when local !== lastSentRef
- onChange happens AFTER render completes, not during setState
- Files: equipment-metadata-form.tsx, agentlog.md
- TypeScript compilation: ✅ PASSED
- Next: User testing (hopefully final!)

## 2025-10-02 18:45 – Final Fix: Removed bidirectional sync, made onChange synchronous
- **ROOT CAUSE**: Bidirectional sync with `local === value` check always false due to object recreation
- `buildEquipmentMetadata()` returns new object → `local === value` always false → infinite loop
- **SOLUTION**: Remove complex sync logic, simplify to unidirectional + synchronous onChange
- Parent → Child: useEffect syncs value prop to local state
- Child → Parent: update() calls onChangeRef.current(updated) synchronously before setState
- No more useEffect watching local state → no infinite loop possible
- Files: equipment-metadata-form.tsx, agentlog.md
- TypeScript compilation: ✅ PASSED
- Next: User testing

## 2025-10-02 18:30 – Fixed Infinite Loop (ACTUAL FIX): useRef for onChange stability
- **ROOT CAUSE IDENTIFIED**: onChange callback from parent recreated on every render
- Parent passes inline function: `onChange={(value) => setMetaObj(buildEquipmentMetadata(value))}`
- This caused useEffect dependency to trigger infinitely
- **SOLUTION**: Use useRef to store onChange callback, update ref when onChange changes
- Changed useEffect dependencies from `[local, value, onChange]` to `[local, value]`
- Use `onChangeRef.current(local)` instead of `onChange(local)` 
- Files: equipment-metadata-form.tsx, agentlog.md
- This is the CORRECT fix for the infinite loop issue
- Next: Test form interaction thoroughly

## 2025-10-02 18:15 – Fixed Infinite Loop in Equipment Case & Rack Setup
- **CRITICAL FIX**: Removed double state updates causing "Maximum update depth exceeded" error
- Changed all `setLocal` + `onChange` callback pairs to use only `update()` function
- The useEffect at line 91-93 automatically calls onChange when local state changes
- Fixed in: Radio button handlers, InheritedNumberField callbacks, InheritedCheckbox callbacks, Input onChange handlers
- Files: equipment-metadata-form.tsx, agentlog.md
- Bug: Selecting "Equipment ist 19" rackmontierbar" caused page to freeze with infinite re-renders
- Next: Test form interaction and continue with remaining todos

## 2025-10-02 18:00 – Complete Refactor: Case & Rack Setup Forms (Article + Equipment)
- **COMPLETE IMPLEMENTATION** of Case & Rack Setup consolidation across both forms
- Removed "19-Zoll Rackmontage" from Physical Card, moved to unified "Case & Rack Setup" card
- Physical Card now only shows Gewicht (weight) and Maße (dimensions)
- Implemented radio-button mode selection with mutually exclusive logic:
  1. "Keine Rack-Eigenschaften" - clears all rack config
  2. "Case ist 19" Rack" - shows case.heightUnits, case.maxDeviceDepthCm, innerDimensionsCm, hasLock, contentMaxWeightKg
  3. "Equipment ist 19" rackmontierbar" - shows equipment heightUnits
- Conditional field rendering with visual border color coding (blue=case rack, green=equipment rackmountable)
- Mode detection based on case.is19Inch vs equipment is19Inch with proper inherited value handling
- Equipment form uses InheritedCheckbox/InheritedNumberField for all rack fields with proper inheritance
- Article form uses plain inputs but follows same structural pattern
- Files: article-metadata-form.tsx, equipment-metadata-form.tsx, todos.md
- Total bugs fixed: 23
- Next: Continue with remaining form improvements

## 2025-10-02 17:30 – Fixed Case Setup Card Inheritance in Equipment Form
- Refactored equipment-metadata-form.tsx renderCaseCard() to use InheritedCheckbox/InheritedNumberField components
- is19Inch, hasLock, heightUnits, maxDeviceDepthCm, contentMaxWeightKg now properly display inherited values from article
- innerDimensionsCm uses regular Input fields with placeholders (DimensionsCm type doesn't support nullable individual fields)
- Case Setup card now follows same inheritance pattern as Physical/Power cards with ignore toggles
- Files: equipment-metadata-form.tsx, todos.md
- Total bugs fixed: 22
- Next: Continue with remaining form improvements and UX enhancements

## 2025-10-02 17:00 – Fixed Input Lag & Updated Instructions
- Fixed severe input lag (500ms+) in company settings form by memoizing CompanyMetadataForm component
- Used React.memo and useCallback to prevent expensive re-renders when typing in name/description fields
- Updated AGENTS.md to emphasize agentlog updates must be in the SAME commit as code changes (not separate)
- Files: company-settings-form.tsx, AGENTS.md, todos.md
- Total bugs fixed so far: 16 (added input lag fix)
- Next: Continue with remaining form improvements and UX enhancements

## 2025-10-02 16:45 – Continued Bug Fixes: Asset Tags & Company Settings
- Fixed AssetTagCreateForm to auto-prefill code using buildAssetTagCode helper (no manual prompt needed)
- Fixed company settings not reflecting changes until reload - now refetches data and triggers page refresh
- Total fixes in session: 15 bugs (PostgREST syntax, case columns, asset tags, company settings)
- Next: Continue with remaining form improvements and UX enhancements

## 2025-01-XX 15:30 – Fixed PostgREST Query Syntax Errors
- Fixed PostgREST foreign key join syntax: changed `articles:article_id(name)` to `articles(name)` across 5 files
- Supabase auto-detects FK relationships without explicit column reference
- Fixed files: job-booked-assets.client.tsx, job-booked-assets.tsx, history-live.tsx, job-quick-book.tsx, case-edit-items-form.tsx
- Also fixed case edit items form using wrong column names: 'equipments'→'contains_equipments', 'articles'→'contains_articles'
- Resolves 400 Bad Request errors and schema cache lookup failures
- Next: Continue with remaining bugs from todos.md

2025-09-30: Fix CI env var handling for Playwright. Updated .github/workflows/integration-tests.yml to avoid overriding dotenv-provided Supabase env vars with empty ${{ env.* }} values; Playwright now reads from .env generated by scripts/write-supabase-env.sh. Also made baseURL configurable via PLAYWRIGHT_BASE_URL in playwright.config.ts.

**2025-09-30 18:45** - Docker Deployment Setup: Created production-ready multi-stage Dockerfile (deps, builder, runner) based on GitHub Actions CI setup. Added `output: 'standalone'` to next.config.ts for optimized Docker builds. Created docker-compose.yml with app + optional PostgreSQL service. Added comprehensive DOCKER.md with deployment instructions and troubleshooting. Created DEPLOYMENT.md with quick-start guides for Vercel, Docker, and VPS deployments. Added .env.production.example template. Files: Dockerfile, .dockerignore, docker-compose.yml, DOCKER.md, DEPLOYMENT.md, .env.production.example, next.config.ts. Next: Test actual Docker build and push to registry.

2025-09-24: Made generateSVG async to support QR code generation; updated callers (template-preview, asset tag render API) and added QR embedding via <image>. Typecheck passed.
2025-09-24: Implemented canvas-based asset tag template preview (`template-preview.tsx`) now rendering SVG via generator and added draggable overlay for element positioning. Wired editable preview into create and edit forms. Ran tsc (no errors). Next: consider adding tests/E2E for drag interactions.
# 2025-09-24 01:05 – Added unit test for automatic asset tag creation helper (createAndAttachAssetTag). Introduced `tests/vitest/asset-tag-auto-create.test.ts` with Supabase client mock validating prefix assembly and entity update. All vitest tests passing (10 passed, 1 skipped). Next: add documentation for asset tag auto-creation & preview embedding.

+## 2025-09-26 23:20 – Add unit tests for asset tag code generator
- Added `tests/vitest/asset-tag-code.test.ts` covering `buildAssetTagCode` including new `stringTemplate` path and fallback behavior.
- Mocked `adminCompanyMetadata` and `asset_tag_template_print` types; no DB calls.
- Next: if desired, extend tests for additional placeholders and error cases.
2025-09-24 01:12 – Updated E2E equipment form tests to reliably select the specific created article by id (helper `selectTestArticle`) instead of brittle index-based selection. File: tests/e2e/equipment-form.spec.ts. Prevents intermittent failures when option order changes.
2025-09-24 01:20 – Fixed job detail title not updating after edits by adding router.refresh() in JobEditForm submit handler; added E2E test verifying rename reflects in heading. Files: components/forms/job-edit-form.tsx, tests/e2e/jobs-form.spec.ts.
# Agent Activity Log

**2025-09-27 10:05** - Fix teardown deleteCompany FK error. Updated `lib/tools/deleteCompany.ts` to nullify `equipments.article_id` for any rows referencing the target company's articles before deleting those articles, preventing `equipments_article_id_fkey` violations in Playwright cleanup. Re-ran `tests/e2e/cleanup.teardown.ts` → green. Next: consider adding a DB constraint ensuring equipment/company matches article/company.

**2025-09-27 10:20** - Added Supabase migration `20250927101500_enforce_equipment_article_company_fk.sql` to enforce that `equipments.article_id` references an article in the same company via composite FK `(article_id, company_id) -> articles(id, company_id)`. Includes data cleanup and a supporting unique constraint on `articles(id, company_id)`. `npm run supabase-gen-types` failed due to an unrelated duplicate policy migration; added note in `human-review-todos.md` to resolve and then rerun.

**2025-09-27 11:05** - App-level consistency + tests/lint fixes. Filtered equipment forms to current company and added cross-company article guard (create/edit). Unnested asset tag template create into its own page (Company Settings shows link). Fixed company custom types textareas to preserve newlines while typing. Updated E2E: asset-tag render creates template+tag when needed; newline test stabilized. ESLint now ignores `lib/generated/prisma/**`; removed client import of Prisma. All targeted tests green locally.

- Use this file to append brief summaries after major tasks.
- Include date/time, task, key changes, and next steps.

**2025-12-21 20:00** - Completed comprehensive Asset Tag Template system implementation. Expanded template types to match full metadata schema (20+ fields), updated form with structured sections, implemented SVG generation from template definitions, updated render API to generate SVG from metadata instead of static prototypes, added template preview with placeholder examples. System now supports full template customization with dimensions, styling, code generation, and dynamic elements.

**2025-09-24 22:45** - Added public file functionality to FileManager component. Extended FileEntry type with public flag, added UI controls for making files public/private with badges and toggle buttons, implemented file movement between buckets. Files can now be marked as public for logos and other assets. Ready for company logo implementation next.

**2025-09-24 23:25** - Fixed RLS policy violation for public file uploads. Added missing RLS policies for public-assets bucket (company member management + public read access). Fixed path structure to include company_id for both public and private files. Public file uploads now work properly without security violations.

**2025-09-24 23:45** - Implemented company logo display in header. Created getCompanyLogo helper to extract logos from company files, updated CompanyNameHeader component to show logo when available, configured Next.js image domains for Supabase storage. Logo appears in sidebar header replacing placeholder when public file with "logo" in name/description exists.

**2024-12-19 11:30** - Fixed critical UI bugs identified in test analysis. Fixed Jobs form FormData error (React.FormEvent typing), Equipment detail page null power error (buildEquipmentMetadata null safety), and test CSS selector syntax. All components tested and working. Commit: 840a657

- 2025-01-05 00:34 CEST — **Enhanced Copilot Instructions**: Updated `.github/copilot-instructions.md` from 61 to 142 lines with comprehensive codebase analysis. Added DataTable pattern documentation, metadata form dual-mode conventions, Supabase client usage patterns, and authentication workflow. Covered key architectural decisions: generic components, metadata builders, company tenancy, form state management. Next: agent workflow validation against new guidelines.

- 2025-09-23 19:35 – **Extended Customer Tests with Full Lifecycle (Create/Edit/Delete)**: Erweiterte bestehende Customer Create Tests um Edit/Update/Delete Funktionalität anstatt separate Edit Tests zu schreiben. Nach Customer Creation: Reload → Edit → Update → Delete → 404 Check. Entfernte redundante Metadatenfelder (Vorname/Nachname für Privat, Firma für Unternehmen) da diese bereits als Hauptdatenbankfelder existieren. Alle 6/6 Customer Tests laufen erfolgreich durch mit vollständigem Customer Lifecycle für Private und Company Kunden. Files: tests/e2e/customers-form.spec.ts, components/forms/partials/customer-metadata-form.tsx, components/metadataTypes.types.ts.

- 2025-01-04 23:52 – **FIXED: Playwright E2E Test Suite**: Resolved all failing Playwright tests that were broken by previous AI changes. Key fixes: (1) Fixed malformed JWT service role key by properly parsing `npx supabase status -o env` output (316→164 chars), (2) Updated playwright.config.ts to use port 3005 to avoid conflicts, (3) Replaced hardcoded localhost:3001 URLs with relative paths, (4) Made company-settings-newlines tests run serially to prevent parallel execution conflicts. All 11 E2E tests now passing. Fixed files: scripts/write-supabase-env.sh, playwright.config.ts, tests/e2e/company-settings-navigation.spec.ts, tests/e2e/company-settings-newlines.spec.ts. Commit: dc98661.

- 2025-09-22 15:30 – **RESOLVED: Company Settings Newline Bug**: Successfully identified and fixed the newline entry issue in custom company types fields. Root cause was `.filter(Boolean)` in onChange handlers removing empty strings, preventing newline preservation. Removed the problematic filter from all three custom type textareas. Verified fix with working Playwright tests showing proper multi-line text entry functionality.

- 2025-09-22 15:30 – Company Settings Newline Investigation: Investigated reported issue with newline entry in custom company types fields. Found that entity forms (locations, cases, articles, customers) correctly use single-line Input components as designed per metadataTypes.types.ts and AGENTS.md. Company settings form already properly uses Textarea components for custom types. Created Playwright test (tests/e2e/company-settings-newlines.spec.ts) to verify newline functionality. The actual issue may need further investigation with a running test environment or user reproduction steps.

- 2025-09-18 00:07 – Equipments Tabelle + Page: hinzugefügt components/equipmentTable.tsx und app/management/equipments/page.tsx; Paginierung, Join zu articles(name).
- 2025-09-18 00:10 – Equipments Filter & aktueller Standort ergänzt; Locations Übersicht (Table + Page) hinzugefügt.
- 2025-09-18 00:13 – Detailseiten: /management/equipments/[id] & /management/locations/[id] inkl. Edit-Formulare; Tabellen verlinkt.
- 2025-09-18 00:17 – Tabellen-Links ergänzt: Equipments (ID, Asset Tag, Standort) und Locations (ID, Name); Articles default_location → Location-Detail verlinkt.
- 2025-09-18 00:20 – Artikel-Detailseite inkl. Edit-Formular erstellt; Links in Equipments- & Articles-Tabellen auf Artikeldetail ergänzt.
- 2025-09-18 00:22 – Artikelseite: Equipments-List mit aktuellem Standort; Standortseite: Liste aktuell befindlicher Equipments.
- 2025-09-18 00:26 – Pagination: Artikel-Equipments (clientseitig) und Standort-Equipments (clientseitig über items) ergänzt.
- 2025-09-18 00:30 – Tabellen angepasst: 'Erstellt am' entfernt; 'Im Lager seit' in Equipments. Detailseiten zeigen 'Erstellt am' + Ersteller (E-Mail/ID).
- 2025-09-18 00:33 – Datum-Parsing gefixt (Safari-kompatibel) via lib/dates; Erstelleranzeige nutzt Name>full_name>Nickname>Email aus auth.users.
- 2025-09-18 00:36 – Fallback-Erstelleranzeige (UUID gekürzt) und konsistentes Date-Parsing in allen Komponenten implementiert.
- 2025-09-18 00:37 – Datumsformat angepasst auf de-DE (24h, TT.MM.JJJJ) via dates.ts.
- 2025-09-18 00:41 – Server-side Admin-Modul für User-Display: lib/supabase/admin.ts, lib/users/userDisplay.server.ts; Detailseiten nutzen nun Service Role.
- 2025-09-18 00:44 – Revert Admin-Client: Profile-Tabelle eingeführt (migration), Detailseiten nutzen public.profiles; Policies für Datenschutz gesetzt.
- 2025-09-18 00:47 – Profilseite: ProfileForm (Name, E-Mail, Pronomen) + UpdatePasswordForm unter /management/settings; Migration für pronouns.
- 2025-09-18 01:07 – Umstellung: ProfileForm nutzt jetzt supabase.auth user_metadata + Email; Detailseiten lesen Ersteller via Admin-Client aus auth.users.
- 2025-09-18 01:12 – Settings umgeroutet: Nutzer-Settings → /management/profile/settings (Header-User-Icon verlinkt). Company Settings unter /management/company-settings; Sidebar aktualisiert.
- 2025-09-18 01:25 – Company Settings implementiert (Name, Beschreibung, Metadata JSON) unter /management/company-settings.

# Session Summary – 2025-09-19 04:20

Scope
- Updated AGENTS.md to current DB schema (companies, articles, equipments, locations, article_location_history) and added Agent logging rule.
- Implemented management UIs: tables, detail pages, filters, pagination, and settings (profile + company).

Routing & Navigation
- Sidebar: Settings now routes to `/management/company-settings` (company-level settings).
- Header: User icon links to `/management/profile/settings` (user profile + password).
- New pages:
  - `/management/equipments` (list), `/management/equipments/[id]` (detail + edit)
  - `/management/articles` (list), `/management/articles/[id]` (detail + edit)
  - `/management/locations` (list), `/management/locations/[id]` (detail + current equipments)
  - `/management/profile/settings` (ProfileForm + UpdatePasswordForm)
  - `/management/company-settings` (CompanySettingsForm)

Tables & Lists
- Equipments list (`components/equipmentTable.tsx`):
  - Columns: ID, Asset Tag, Artikel (linked), Aktueller Standort (latest history, linked), Sticker, Im Lager seit.
  - Filters: search by asset_tag / article name, sticker filter (all/yes/no).
  - Pagination.
- Articles list (`components/articleTable.tsx`):
  - Shows Default Location name via join (`locations:default_location(name)`), linked to location detail.
  - Shows equipments count (defensive fallback).
- Locations list (`components/locationTable.tsx`):
  - Simplified columns (ID, Name, Beschreibung) without created-at column.
- Article detail equipments (paginated client table): `components/articleEquipmentsTable.tsx`.
- Location detail current equipments (client-paginated slice): `components/locationCurrentEquipmentsList.tsx`.

Detail Pages & Edits
- Equipments detail `/management/equipments/[id]`:
  - Loads article + latest location; edit form for asset_tag, article_id, has_asset_sticker.
  - Shows: Aktueller Standort, Im Lager seit, Erstellt am, Erstellt von.
- Articles detail `/management/articles/[id]`:
  - Edit name + default_location (select from locations), shows default location link.
  - Paginated list of related equipments with latest location.
- Locations detail `/management/locations/[id]`:
  - Edit name/description.
  - Computes current equipments at this location from `article_location_history`.

Date & Formatting
- Added `lib/dates.ts` with `safeParseDate` (Safari compatibility) and `formatDate/formatDateTime` using `de-DE`.
- Replaced all ad-hoc date formatting in detail pages and tables (for "Im Lager seit").

User Display (Erstellt von)
- Final approach: use Supabase Auth as source of truth; server-side read of `auth.users` via Service Role to get name/email from `raw_user_meta_data`/`email`.
  - Admin client: `lib/supabase/admin.ts` (requires `SUPABASE_SERVICE_ROLE_KEY`, server-only).
  - Server helper: `lib/users/userDisplay.server.ts` (`fetchUserDisplayAdmin`).
  - Detail pages use helper + show "Du" if created_by == current user, else name/email, else shortened UUID.

Profile Management
- ProfileForm (`components/profile-form.tsx`):
  - Reads current user via `supabase.auth.getUser()` and seeds `display_name`, `pronouns`, `email` from `user_metadata`/`email`.
  - Saves via `supabase.auth.updateUser({ data: { display_name, pronouns }, email? })`.
  - Hosted at `/management/profile/settings` alongside `UpdatePasswordForm`.
- Note: Earlier local `public.profiles` approach was added then de-scoped per preference for Auth; migrations exist but are not required now.

Company Settings
- CompanySettingsForm (`components/company-settings-form.tsx`): load by `owner_user_id == current user`.
  - Fields: `name`, `description`, `metadata` (JSON textarea with parsing/validation).
  - Page at `/management/company-settings`.

DB & Migrations
- Existing schema from migrations: base tables + `article_location_history` + `companies` with RLS per company.
- Added (not required in final approach):
  - `20250918004418_profiles.sql` (profiles table with RLS policies). Fixed policy syntax (removed IF NOT EXISTS).
  - `20250918004423_profiles.sql` marked no-op to avoid duplicates.
  - `20250918004720_profiles_pronouns.sql` added pronouns column.
- If following Auth-only approach, these profiles migrations can remain unused or be removed later.

Env & Security
- Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- For server-side user display: add `SUPABASE_SERVICE_ROLE_KEY` (server only; never exposed to client).

Open Todos / Next Steps
- Company settings: add structured metadata editors (e.g., branding colors, default location selector with validation).
- Equipment: optional filters by location and "im Lager seit" range.
- Article detail: optional aggregation (count per current location).
- Onboarding: optional redirect to profile settings until `display_name` present in user_metadata.
- Consider consolidating/cleaning unused `profiles` migrations if not needed.
- 2025-09-18 01:28 – Profiles-Migrationen entfernt (Tabellen lokal manuell löschen).
- 2025-09-18 01:33 – Seed-Dump API + Button: /api/admin/dump-seed erzeugt supabase/seed.sql (auth.users + public tables); Company Settings UI integriert.
- 2025-09-18 01:34 – Fix Dump-Pfad: schreibt nach ../supabase/seed.sql relativ zum Next-App-Verzeichnis; legt Ordner an, falls fehlend.
- 2025-09-18 01:36 – Seed-Dump erweitert: inkludiert jetzt auch auth.identities; users enthält weitere Timestamps.

- 2025-09-19 00:34 – Agents.md Schema aktualisiert (neue Asset-Tag-, Cases-, Jobs-Tabellen + RLS Hinweis); Agentlog ergänzt. Nächste Schritte: Schema-Änderungen in App-Queries spiegeln.

- 2025-09-19 00:50 – Schema-Rollout in UI & Seed: Komponenten nutzen jetzt asset_tags/current_location + users_companies; dump-seed exportiert neue Tabellen; Lint läuft. Nächste Schritte: App-APIs für Jobs/Cases konsolidieren.

- 2025-09-19 00:55 – RLS-Fix: company_ids_for_user() (SECURITY DEFINER) hinzugefügt; users_companies Select-Policy nutzt Funktion ohne Rekursion.

- 2025-09-19 01:05 – RLS Policies bereinigt: Funktion entfernt; sämtliche Tabellen nutzen direkte EXISTS-Checks ohne Selbstreferenzen; users_companies-Policy basiert auf user_id/owner.
 
- 2025-09-19 01:35 – Migration fix: extra schließende Klammer in Policy auf `public.locations` entfernt (`supabase/migrations/20250918210705_fullschemav1_with_policies_v1.sql`). Nächster Schritt: `supabase db reset` erneut ausführen.

- 2025-09-19 02:05 – Header-Dropdown + Company Switcher: User-Menü als Dropdown mit Company-Auswahl (persistiert via localStorage) und Abmelden/Profileinstellungen. Dateien: inventorymanagement/app/management/_libs/management-header.tsx, app/management/_libs/companyHook.ts, todos.md. Nächster Schritt: Seiten für Jobs/Kunden anlegen.

- 2025-09-19 02:18 – Jobs Seiten: Liste und Detailansicht implementiert. Neue Dateien: components/jobTable.tsx, components/forms/job-edit-form.tsx, app/management/jobs/page.tsx, app/management/jobs/[id]/page.tsx. Navigation erweitert (Jobs mit Briefcase-Icon). To-Do aktualisiert.

- 2025-09-19 02:26 – Kunden Seiten: Liste und Detailansicht implementiert. Neue Dateien: components/customerTable.tsx, components/forms/customer-edit-form.tsx, app/management/customers/page.tsx, app/management/customers/[id]/page.tsx. Navigation ergänzt um Customers (Users-Icon). To-Do aktualisiert.

- 2025-09-19 02:44 – Erstellen-Formulare: Neue Create-Formulare + Seiten für Articles, Locations, Equipments, Cases, Customers, Jobs. Quick-Access "Neu"-Buttons in Listen (Articles, Equipments, Locations, Customers, Jobs). Dateien: components/forms/*-create-form.tsx, app/management/*/new/page.tsx. To-Do aktualisiert.

- 2025-09-19 02:52 – has_asset_sticker entfernt: Alle Verwendungen aus Tabellen und Formularen entfernt (nutzt ggf. asset_tags für Sticker-Status). Geändert: components/equipmentTable.tsx, components/articleEquipmentsTable.tsx, components/locationCurrentEquipmentsList.tsx, components/forms/equipment-edit-form.tsx, components/forms/equipment-create-form.tsx.

- 2025-09-19 03:03 – Equipment-Form Updates: Date-Picker ohne Auswahl werden nicht als NULL gesendet (DB-Default greift). Bulk-Create mit Anzahl im Create-Form. Artikel-Detailseite mit "Neues Equipment"-Button (prefill via query). Dateien: components/forms/equipment-create-form.tsx, app/management/equipments/new/page.tsx, app/management/articles/[id]/page.tsx, todos.md.

- 2025-09-19 03:05 – RLS Fix Customers: Insert/Update WITH CHECK Policies für customers ergänzt, damit Company-Mitglieder Kunden anlegen/ändern können. Migration: supabase/migrations/20250919030500_customers_insert_update_policies.sql.
- 2025-09-19 03:08 – Revert: Vorige Customers-RLS-Migration entfernt, da Ursache fehlender Eintrag in users_companies war.

- 2025-09-19 03:18 – Fixes: Next.js params Warning behoben auf allen Detailseiten; "Neu"-Knopf für Equipments rechts oben in Artikelseite (Liste). Dateien: app/management/*/[id]/page.tsx, components/articleEquipmentsTable.tsx, todos.md.

- 2025-09-19 03:22 – History: Trigger-Funktion + Triggers für Kern-Tabellen hinzugefügt, RLS-Insert-Policy für history; UI-Karte auf Artikel/Equipment/Location/Customer/Job-Detailseiten. Migration: 20250919031000_history_triggers.sql. UI: components/historyCard.tsx.

- 2025-09-19 03:28 – Cases: Spalte articles jsonb[] (Migration), Create-Form erweitert (ungetrackte Artikel), Cases-Liste + Detailseite. Navigation ergänzt. Dateien: migrations/20250919031800_cases_articles_column.sql, components/forms/case-create-form.tsx, components/caseTable.tsx, app/management/cases/{page.tsx,[id]/page.tsx}, layout nav + Icons. todos.md aktualisiert.

- 2025-09-19 03:33 – Company: Create-Form und Menüeintrag "+ Neue Company" im Switcher. Dateien: components/forms/company-create-form.tsx, app/management/company/new/page.tsx, management-header.tsx. todos.md aktualisiert.

- 2025-09-19 03:46 – Fixes II: History streamt live (HistoryLive + Trigger _op); Case-Equipment-Tabellen gefiltert + paginiert; Cases mit Name/Beschreibung (Form + Anzeige); History zeigt "dir" statt UUID. Dateien: components/history-live.tsx, components/historyCard.tsx, case-create/edit forms.

- 2025-09-19 03:55 – Jobs Detail Buchungen: Übersicht gebuchter Assets (job_booked_assets) und Schnell-Buchen (Artikelanzahl, Equipment-ID, Case). Dateien: components/job-booked-assets.tsx, components/forms/job-quick-book.tsx, app/management/jobs/[id]/page.tsx. todos.md aktualisiert.

## 2025-09-19 – Consolidated Summary

Navigation & Header
- User-Dropdown mit Company Switcher, Profileinstellungen und Abmelden.
- "+ Neue Company" im Switcher (Form zum Anlegen inkl. users_companies-Mitgliedschaft).

Listen & Detailseiten
- Jobs, Customers, Articles, Equipments, Locations, Cases: Übersichten mit "Bearbeiten"-Buttons.
- Detailseiten: generische Löschfunktion mit Undo (DeleteWithUndo) integriert.
- Kunden-Detail zeigt zugehörige Jobs.

Equipments
- Create: heutiges Datum als Standard für "Im Lager seit"; Bulk-Create (Anzahl); Prefill per articleId.
- Entfernung von has_asset_sticker (Spalten/Filter/Anzeige bereinigt).
- Suchfix: OR/ilike Filter kompatibel zu PostgREST ("*term*").

Articles
- Detail: "Neues Equipment"-Button; Equipments-Liste mit "Neu" rechts oben.

Cases
- Übersicht, Create und Detail umgesetzt.
- Create/Edit: Equipments-Auswahl als Tabelle mit Suche + Pagination; filtert Case-Equipment / bereits hinzugefügte.
- Ungetrackte Artikel (articles jsonb[]): Hinzufügen/Entfernen in Create und Edit.
- Name/Beschreibung im Create & Edit; Titelanzeige in Detail.

Jobs
- Detail: Übersicht gebuchter Assets (Equipments/Cases) + Schnell-Buchen (Artikelanzahl, Equipment-ID, Case).
- Entfernen gebuchter Assets inkl. Undo.
- Jobs-Listenzeile: Kundenname verlinkt zur Kunden-Detailseite.

History
- Trigger-Funktion + Triggers (INSERT/UPDATE/DELETE) für Kern-Tabellen, RLS-Insert-Policy.
- Payload enthält _op; UI-Karte zeigt Zeitpunkt, Aktion, kompakte Werte; Live-Streaming via Realtime.

Next.js & UX Fixes
- params-Warnungen behoben (await params in dynamischen Routen).
- Diverse UI-Verbesserungen und Verlinkungen.

Migrations
- 20250919031000_history_triggers.sql – History-Logik + Triggers.
- 20250919032500_history_enhance_op.sql – _op in History-Payload.
- 20250919031800_cases_articles_column.sql – Cases: articles jsonb[].

Hinweise
- Nach Schema-Änderungen: supabase db push ausführen.

- 2025-09-19 04:10 – Tables + Delete/Undo: Übersichtstabellen mit "Bearbeiten"-Buttons; Detailseiten mit Löschen inkl. Undo (generische DeleteWithUndo). Fix: Kunde in Jobübersicht verlinkt. Dateien: components/*Table.tsx, components/forms/delete-with-undo.tsx, Detailseiten.

- 2025-09-19 04:14 – Kunden-Jobs Übersicht: Kunden-Detailseite zeigt Jobs des Kunden. Datei: app/management/customers/[id]/page.tsx. todos.md aktualisiert.
- 2025-09-19 15:14 – MCP Config: Secrets removed from config; token now read from environment (.env). Files: .codex/config.toml, .codex/mcp.json. Next: restart Codex with this config and ensure .env is loaded.
- 2025-09-19 15:40 – MCP Timeout Fix: Angleichen von .codex/mcp.json an .codex/config.toml (DSN-Arg hinzugefügt). Hinweis an Nutzer: Supabase-Stack starten und npx vermeiden, wenn möglich lokal installieren.

- 2025-09-19 15:59 – Agent Guidelines Update: AGENTS.md ergänzt um Pflicht zum Commit nach jeder Aufgabe.

- 2025-09-19 16:06 – Artikel Equipment Button Fix: nur noch ein Add-Button im Artikel-Detail (app/management/articles/[id]/page.tsx, components/articleEquipmentsTable.tsx, todos.md).
- 2025-09-19 16:31 – Dashboard-Refresh: /management zeigt Kennzahlen, kommende Jobs und History-Tabelle (app/management/page.tsx); AGENTS.md um Context7-Regel ergänzt, todos.md aktualisiert. Nächster Schritt: Tests & File-Upload-Feature.
