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
2025-09-19 16:44 CEST Onboarding
Captured project overview, conventions, and suggested commands in Serena memories for Next.js/Supabase stack.
Next: ready for feature work.
2025-09-19 17:11 CEST Loading Screens
Skeleton-Komponenten + loading.tsx für Management-Listen/Details; Todos aktualisiert.
Next: Offene Lint-Fehler in Legacy-Komponenten adressieren.

2025-09-20 09:50 CEST History Summaries
History-UI zeigt nun pro Event kompakte Beschreibungen (Helper + UI-Update).
Next: Optional weitere Tabellen um spezifische Texte erweitern.
2025-09-21 18:41 CEST
Task: Update AGENTS.md with Supabase style mandates
Files: AGENTS.md
Next: Ensure future edits conform to documented standards.
2025-09-21 22:05 CEST
Task: Job-Fixes – Date Prefill, DatePicker, Quick-Book Search
Files: app/management/jobs/[id]/page.tsx; components/forms/{job-edit-form,job-create-form,equipment-create-form,job-quick-book}.tsx; components/ui/{calendar,date-picker}.tsx; components/search/search-picker.tsx; components/jobTable.tsx; todos.md; package.json/package-lock.json
Next: Monitor SearchPicker adoption across remaining search inputs; add tests around booking flows.
2025-09-21 23:05 CEST
Task: Job Booking Sync + History formatting
Files: components/job-booked-assets{.tsx,.client.tsx}; components/forms/job-quick-book.tsx; components/history{Card,live}.tsx; lib/dates.ts; supabase/migrations/20250921221000_history_job_bookings_use_job_id.sql; app/management/jobs/[id]/page.tsx
Next: Extend history coverage to additional related tables if needed; consider adding automated tests for realtime updates.
2025-09-21 23:30 CEST
Task: History detail cleanup for job bookings
Files: components/history-live.tsx; components/historyCard.tsx
Next: Optional – enrich history summaries with Job-Titeln, falls verfügbar.
2025-09-21 23:45 CEST
Task: Fix company history trigger company_id lookup
Files: supabase/migrations/20250921233500_history_companies_fix.sql
Next: Run supabase db push to apply migration.
2025-09-22 00:05 CEST
Task: History diff guards for mixed job tables
Files: components/history-live.tsx; components/historyCard.tsx
Next: Consider batching realtime detail lookups for performance if dataset grows.
2025-09-22 00:20 CEST
Task: UI error handling foundations
Files: components/error-state.tsx; app/error.tsx; app/global-error.tsx; app/management/error.tsx; app/management/global-error.tsx; todos.md
Next: Consider route-specific error copy if future modules need custom actions.
2025-09-22 00:34 CEST
Task: CI – lint workflow
Files: .github/workflows/lint.yml
Next: Optionally add a separate type-check job if needed.
2025-09-22 00:48 CEST
Task: Files feature + Logflare hooks
Files: supabase/migrations/20250922004500_add_files_columns.sql; components/files/file-manager.tsx; lib/files.ts; app/management/*/[id]/page.tsx; lib/log.ts; components/forms/job-quick-book.tsx; todos.md
Next: Run `supabase db push` to add `files` columns and `attachments` bucket; configure LOGFLARE_SOURCE/LOGFLARE_API_KEY to enable remote logging.
2025-09-21 22:09 CEST — test/e2e + env cleanup
- Changed env var to NEXT_PUBLIC_SUPABASE_ANON_KEY across code; updated .env and .env.example.
- Added Playwright (playwright.config.ts, tests/e2e/home.spec.ts) and script `test:e2e`; first test passes.
- Fixed lint issues (removed unused function in components/files/file-manager.ts; removed unused eslint-disable) and added TSDoc to supabase clients.
2025-09-21 22:24 CEST — fix TypeScript build
- Added `test:tsc` script and ran type checks; resolved errors across management header, company hook, company settings, calendar, history live, and auth user display.
- Removed unused `components/dev/*` (react-buddy previews) and normalized Next.js 15 `searchParams` typing.
- Type guards for PostgREST relation shapes (object vs array) and stringified company IDs for UI radios.

2025-09-21 22:31 CEST — lint cleanup
- Added `lib/companies.ts` helper to normalize relation payloads; removed lingering `any` casts.
- Updated Supabase auth user fetches to use typed `maybeSingle`, dropped unused calendar icon imports.
- Lint now passes via `npm run lint`.
2025-09-21 23:47 CEST — Landing cleanup & dashboard docs
- Simplified `/` route to Supabase setup guidance + auth redirect; removed template tutorial components.
- Added shared dashboard utils with TSDoc, documented date/user helpers, and refreshed env guard comment.
- Lint, type-check, and build all green via `npm run lint`, `npm run test:tsc`, `npm run build`.
2025-09-22 00:01 CEST — Doc pass for recent maintenance
- Added TSDoc for landing env requirements and dashboard helper types.
- Lint + type-check re-run via `npm run lint` and `npm run test:tsc`.
2025-09-22 00:14 CEST — Testing scaffolding
- Added Vitest config + Supabase seeding test (skips without service-role env).
- Updated Playwright specs for new landing page and added authenticated dashboard flow with Supabase admin seeding helper.
- Added npm scripts (`test:unit`) and ensured lint/type checks stay green.
2025-09-22 00:30 CEST — CI integration setup
- Added GitHub workflow to launch Supabase locally, export env vars, run Vitest and Playwright suites against Next.js dev server.
2025-09-22 01:05 CEST — Supabase CLI compatibility
- Trimmed unsupported keys from `supabase/config.toml` (removed network restrictions/web3, normalized migrations block).
- Pinned GitHub Actions Supabase CLI install to `version: latest` to match updated config schema.
2025-09-22 02:11 CEST — Supabase status retrieval fix
- Updated CI workflow to query `supabase status --json` for API credentials instead of reading legacy status file.
2025-09-22 02:15 CEST — Supabase env export alignment
- Switched CI to parse `supabase status -o env` output and source it for API/anon/service keys.
2025-09-22 03:05 CEST — AGENTS.md docs source update
- Updated AGENTS.md to reference local Supabase docs in supabase_ai_docs/ and deprecate Serena/MCP reliance.
- Reinforced rule to consult these docs before RLS, schema, auth, realtime, and functions; reminded to run supabase-gen-types after migrations.
2025-09-23 19:25 CEST — Customer form validation + conditional metadata
- FIXED customer form validation bug: Added type-based validation (company requires company_name, private requires forename+surname) and conditional field display.
- Enhanced CustomerMetadataForm with conditional field display based on customerType prop (company shows business fields, private shows personal fields).
- Updated both customer-create-form.tsx and customer-edit-form.tsx to pass customerType to metadata component.
- All 6/6 customer E2E tests now passing. Form prevents empty submissions and shows only relevant fields based on customer type.

2025-09-22 03:22 CEST — Metadata types + defaults
- Added TSDoc to components/metadataTypes.types.ts; created lib/metadata/defaults.ts with DACH presets.
- Prefill metadata JSON in create forms (company, equipment, customer, job); Company Settings shows defaults when empty.
- Updated todos.md and human-review-todos.md for typed subforms follow-up.
2025-09-22 03:42 CEST — Typed metadata subforms + tests
- Added CustomerMetadataForm and EquipmentMetadataForm; integrated into create forms with Advanced JSON toggle.
- Introduced lib/metadata/builders with unit tests (Vitest).
- Lint, type-check and unit tests pass.
2025-09-22 03:55 CEST — Article/Job typed metadata + inherit utils
- Added Article/Job metadata partials with company-default placeholders; integrated into create+edit forms with Advanced JSON toggles.
- Added inherit util to normalize company metadata; added unit tests.
- Updated Equipment/Customer edit forms to use typed metadata as well.

2025-09-22 06:30 CEST — Camera-based QR Asset Tag Scanning
- Implemented QrScannerModal with qr-scanner library for real-time camera scanning of asset tags.
- Added scanning functionality to Articles, Equipments, and Locations pages with asset tag lookup.
- Created useQrScanner hook and integrated modal with custom overlay design (no shadcn Dialog dependency).
- Mobile-friendly interface with flash toggle, camera switching, success/error feedback, and auto-navigation to found items.
- Builds successfully, ready for field testing on mobile devices.

**2025-09-24 01:40 CET** - Complete Asset Tag Template System Overhaul. Fixed broken template creation (now saves to database), added missing foreign key constraint (asset_tags.printed_template → asset_tag_templates.id), moved template management to company settings as requested, fixed asset tag table query using correct relationship. Live tested via Playwright: user creation, authentication, multi-element template creation (text + QR code). Template "Equipment Label v2" successfully created and verified in database. All original issues resolved.
2025-09-26 10:20 – Fix: Asset Tag Render API (/api/asset-tags/[id]/render)
- Root cause: Invalid PostgREST reverse-join select string left parser artifacts in file, causing TS error and runtime query parser errors.
- Change: Simplified query to fetch template via FK only; loaded equipments/articles/locations/cases via separate safe queries; cleaned duplicate/stray lines.
- Validation: TypeScript check for route passed; follow-up E2E recommended to validate PNG/BMP/GIF conversions.
2025-09-26 17:05 — Switch tests/helpers.ts to Prisma; replaced Supabase ORM calls with PrismaClient for companies/customers/equipments/profiles lookups. Adjusted return types to satisfy TS. Next: if tests need more seed helpers, extend Prisma usage accordingly.
2025-09-26 17:12 — Clarified data access policy in AGENTS.md: use Prisma for non-user-interactive functions (background/internal/test helpers) and Supabase for user-facing RLS-bound flows.
2025-09-26 17:20 — Added RLS policies for public.profiles: select co-members via users_companies; allow users to insert/update/delete only their own profile. Migration: supabase/migrations/20250926171500_profiles_rls.sql.
2025-09-26 17:33 — Fixed Prisma schema mismatches: added cases.equipments bigint[]; made locations.created_by nullable with optional relation; removed erroneous self-relation on profiles; renamed cases.case_equipment relation field to avoid name clash. Regenerated Prisma client and ran `npm run supabase-gen-types`.
2025-09-26 23:32 — Align cases.contains_equipments with UI/domain
- Added migration `supabase/migrations/20250926233000_cases_contains_equipments_array.sql` converting `cases.contains_equipments` from bigint FK to `bigint[]` with default `{}` and dropping FK.
- Updated `prisma/schema.prisma` to `BigInt[]?` and removed the obsolete relation on both `cases` and `equipments`.
- Updated `database.types.ts` to `number[] | null` and removed the FK mapping under Relationships.
- Purpose: resolve linter/type error where `selectedIds: number[]` was assigned to a 1:1 FK column; matches domain model (multi-equipment cases).
[2025-09-27T01:46:35Z] fix: robust deleteCompany tool; add test to verify cleanup order and FKs.
Files: lib/tools/deleteCompany.ts, tests/vitest/delete-company.test.ts. Next: run DB (Supabase) and execute vitest.
2025-09-28  — Widen management pages to full width
- Replaced `max-w-7xl/5xl/3xl` with `max-w-none` across management pages and loading states to use full screen width like the dashboard.
- Files touched: multiple `app/management/**/page.tsx`, `_libs/management-loading.tsx`, plus normalized `articles/new/page.tsx` wrapper.
- Next: visually verify grids/cards at 2K+ and extend remaining forms to 12-col layout where missing.

2025-09-28  — Refactor forms into Cards (metadata isolated)
- Updated forms to 12-col grids with dedicated Metadaten-Karte where applicable.
- Files: components/forms/equipment-edit-form.tsx, customer-create-form.tsx, customer-edit-form.tsx, job-create-form.tsx, job-edit-form.tsx, location-create-form.tsx, location-edit-form.tsx, case-create-form.tsx.
- Ran `npm run test:tsc` and `npm run lint` — both clean.

2025-09-28  — Add seed script for test data
- Extended `lib/tools/seed.ts`: creates admin test user, company + membership, locations, articles, asset tag template + tags, equipments, case, customers, job, and job asset relations.
- Added script `npm run seed:dev` using `tsx`; added `tsx` devDependency.
- TypeScript + ESLint green.

**2025-09-30 19:15** - GitHub Actions Docker Build Workflow: Created `.github/workflows/docker-build.yml` that automatically builds and pushes Docker images to GitHub Container Registry after successful Integration Tests. Workflow triggers on completed test runs for `main` branch, builds multi-stage Docker image, tags with `latest`, branch name, git SHA, and semantic versions. Uses GitHub Actions cache for faster builds. Updated DEPLOYMENT.md and DOCKER.md with pre-built image pull instructions (`ghcr.io/malarisch/inventorymanagment:latest`). Enhanced README.md with comprehensive project overview, features list, tech stack, and quick start guide. Files: .github/workflows/docker-build.yml, DEPLOYMENT.md, DOCKER.md, README.md. Next: Push to trigger first automated build.

**2025-09-30 19:45** - Dependency Kategorisierung Fix: Verschob build-kritische Dependencies von `devDependencies` zu `dependencies` um Vercel/Cloud Production Builds zu fixen. Build-Tools (prisma, typescript, tailwindcss, autoprefixer, postcss), TypeScript Types (@types/node, @types/react*, @types/qrcode) und sharp (Next.js Image Optimization) sind jetzt in dependencies. Test-Tools (playwright, vitest), Linting (eslint) und Dev-Tools (tsx, supabase CLI, pg) bleiben in devDependencies. Vercel führt `npm install --production` aus und braucht diese Packages für Build. Docker Multi-Stage Build profitiert auch davon. File: package.json.

**2025-09-30 20:15** - Vercel Build Configuration: Created complete Vercel deployment setup with `vercel.json` specifying `build:vercel` script and optimized install command. Added `build:vercel` npm script that runs `prisma generate && next build`. Created `tsconfig.build.json` to exclude test files from production TypeScript compilation (used via `next.config.ts`). Moved ESLint to dependencies as Next.js build requires it. Tested build locally with `npm run build:vercel` - successful ✅. Files: vercel.json, package.json (build:vercel script), tsconfig.build.json, next.config.ts (typescript.tsconfigPath). Ready for Vercel deployment - just push and set env vars in dashboard.

2025-10-02 18:45 — Metadaten-UI & Kontakte-Flow
- Segmentierte Article/Equipment-Metadaten mit dynamischen Karten, Vererbungs-Platzhaltern und Supplier-Editor (components/forms/**, metadataTypes).
- Neue contacts-Tabelle + jobs.contact_id Migrationen, Prisma/Types aktualisiert, Job-Formulare & Supplier-UI mit Kontakt-Auswahl/Neuanlage (supabase/migrations/**, prisma/schema.prisma, job*/article*/equipment* forms).
- Regenerierte database.types.ts via supabase-gen-types.

2025-10-02 20:25 — Merge customers into contacts
- Added contacts migration (merge + data copy, job FK swap) and Prisma/types regen; dropped customers schema.
- Updated UI/forms, search, dashboards, import/export, seeding, and tests to use contacts API + contact picker.
2025-10-02 23:10 — Kameramodus & Wartungslogs
- Neuer /management/scanner mit kontinuierlichem QR-Scan, Standort-/Job-Modi und Buttons auf Location/Job-Detailseiten (components/scanner/scanner-screen.tsx, components/camera/continuous-qr-scanner.tsx, app/management/scanner/page.tsx, app/management/{locations,jobs}/[id]/page.tsx).
- Cases unterstützen Standorte + Maintenance Logs: Migrationen 20251002093000/20251002094500, Prisma update, MaintenanceLog Cards + Inline-Formulare (supabase/migrations/**, prisma/schema.prisma, components/forms/maintenance-log-create-inline.tsx, components/maintenance/maintenance-logs-card.tsx, app/management/cases/[id]/page.tsx, app/management/equipments/[id]/page.tsx).
- Werkstatt-Übersicht ergänzt letzte Wartungen, Cases erhalten Werkstatt-Todo, Typen regeneriert und Lint/tsc erfolgreich (app/management/workshop/page.tsx, database.types.ts, npm run lint, npm run test:tsc).

2025-01-25 10:04 — **Fix: Article Form UX Improvements**: Collapsed Physical/Power cards by default (SECTION_DEFINITIONS), removed power pre-fill from defaultArticleMetadataDE (now shows placeholders). Fixes UX complaint about passive equipment. Files: article-metadata-form.tsx, lib/metadata/defaults.ts, todos.md.

2025-01-25 10:15 — **Fix: Case Create Equipment Selection**: Added chip list above table showing selected equipments with remove (×) buttons. Updated card description to show count. Made table rows clickable. Fixed disappearing equipment issue (was hidden by filter). Files: case-create-form.tsx, todos.md.

2025-01-25 10:30 — **Fix: Case Edit Page Reorganization**: Split CaseEditItemsForm into 4 separate cards (Basisdaten, Case-Equipment, Equipments im Case, Ungetrackte Artikel). Added case equipment picker. Equipment/Article IDs now clickable links. Added creator display name and created_at timestamp in page header CardDescription. Files: case-edit-items-form.tsx, cases/[id]/page.tsx, todos.md.

2025-01-25 10:45 — **Fix: DataTable Search Bug**: Removed problematic `id.eq.0` filter that was applied when search term type didn't match searchable field types. Bug caused empty tables when typing text in number-only search fields or vice versa. Now gracefully shows all results when search doesn't match. Affects all DataTable instances (cases, articles, equipments, etc.). Files: data-table.tsx, todos.md.

2025-01-25 11:00 — **Fix: Equipment Form Case Setup Card**: Added "case" section to EquipmentMetadataForm SECTION_DEFINITIONS. Includes 19" rack checkbox, lock checkbox, conditional rack fields (heightUnits, maxDeviceDepthCm), inner dimensions (width/height/depth), max content weight. Inherits from article metadata where available. Files: equipment-metadata-form.tsx, todos.md.
