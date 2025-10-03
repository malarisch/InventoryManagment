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

- 2025-01-23 19:45 – Fix #10: Kontakt-System vereinheitlicht. Entfernt: customer-spezifische Logik, parallele Felder (forename/first_name, surname/last_name, company_name/organization, address/street, postal_code/zip_code, customer_type). Umbenannt: /management/customers → /management/contacts, CustomerEditForm → ContactEditForm. Hinzugefügt: contact_type Dropdown (general, person, company, supplier, customer), contact_person_id für Firmen-Kontakte. Dateien: components/forms/contact-edit-form.tsx (komplett refactored), components/forms/contacts/contact-form-dialog.tsx, app/management/contacts/*, components/{jobTable,customerTable,search/*}, app/management/{layout,search/page,_libs/dashboard-utils}.tsx, tests/e2e/*. TypeScript kompiliert sauber. Nächster Fix: #6 (Company Settings Cards DOM-Umstrukturierung).

- 2025-01-23 20:10 – Fix #6: Company Settings Metadata Cards Umstrukturierung. Aufgelöst: Metadaten-Sections (Allgemein, Steuer & Finanzen, Unternehmen, Benutzerdefinierte Typen, Standardwerte, Asset Tag Einstellungen) jetzt als individuelle Cards auf oberster Ebene statt verschachtelt in einer großen Card. Dateien: components/forms/partials/company-metadata-form.tsx (Cards statt Border-Box), components/company-settings-form.tsx (Layout angepasst, Metadata Cards auf Ebene 1). TypeScript kompiliert sauber. Nächster Fix: #7 oder höher.

- 2025-01-23 20:45 – Asset Tag Template Improvements (5 fixes): 1) Layout auf 3 Spalten (Form 8col, Preview 4col sticky rechts), 2) Template Codes Übersicht Card hinzugefügt (alle Platzhalter), 3) Debouncing für Preview (300ms delay, verhindert Request-Storm beim Dragging), 4) Drag-Box Text-Höhe korrigiert (actualBoundingBox für präzise Rahmen), 5) QR Code Padding entfernt (margin: 0 Option). Dateien: components/forms/asset-tag-template-create-form.tsx (Layout + debouncing + codes card), lib/asset-tags/svg-generator.ts (QR margin), components/asset-tag-templates/template-preview.tsx (measureElement für Text/QR). TypeScript kompiliert sauber.

- 2025-01-23 21:00 – Asset Tag Template Preview auf clientseitig umgestellt. Entfernt: Server-Request für Preview (verhindert lag), Debouncing (machte dragging laggy). Jetzt: Direkte clientseitige SVG-Generierung via generateSVG() ohne API-Call. Preview updates instant beim Dragging. Dateien: components/asset-tag-templates/template-preview.tsx (Server-Request entfernt), components/forms/asset-tag-template-create-form.tsx (Debouncing entfernt, zurück zu direktem form.watch()). TypeScript kompiliert sauber.

- 2025-01-23 21:15 – Asset Tag Template Preview Skalierung + Modal. Canvas skaliert jetzt automatisch auf maxWidth (default 400px) mit korrekter Aspect Ratio. Große Templates gehen nicht mehr über Bildschirmrand hinaus. Hinzugefügt: "Vergrößern" Button öffnet Modal mit Full-Size Preview (actual size in px). Maus-Koordinaten beim Dragging an Skalierung angepasst (division by scale). Dateien: components/asset-tag-templates/template-preview.tsx (scale calculation, CSS width/height, Modal mit Dialog component, scaled pointer events). TypeScript kompiliert sauber.

## 2025-10-03 00:15 – Modal size increased to 90% viewport width
- **PROBLEM**: "Vergrößern" modal showed same small size as preview
- User feedback: "Sadly, the 'Make it bigger' modal is just as small. It should easily use 50% screensize."
- **SOLUTION**: Changed DialogContent from max-w-4xl to max-w-[90vw] w-full
- Modal now uses 90% of viewport width instead of fixed 56rem
- Added centering with flex items-center justify-center to content area
- Added gray background to distinguish canvas from modal
- File: components/asset-tag-templates/template-preview.tsx
- TypeScript compilation: ✅ PASSED

## 2025-10-03 00:25 – Added !important to force modal max-width override
- **PROBLEM**: Modal size didn't actually change after previous fix
- User feedback: "Die größe vom Modal selber hat sich nicht geändert"
- **ROOT CAUSE**: shadcn/ui DialogContent has default sm:max-w-lg that overrode max-w-[90vw]
- Tailwind specificity: responsive variants (sm:) can override custom values
- **SOLUTION**: Added ! (important) prefix to force override: !max-w-[90vw]
- This ensures 90vw width takes precedence over default sm:max-w-lg (512px)
- File: components/asset-tag-templates/template-preview.tsx
- TypeScript compilation: ✅ PASSED

## 2025-10-03 00:35 – Scaled modal canvas to 3x size for better visibility
- **PROBLEM**: Modal was bigger but canvas still showed template in tiny original size
- User feedback: "Das Modal ist jetzt größer, das Tag canvas wird aber nicht skaliert"
- **SOLUTION**: Applied 3x CSS scaling to modal canvas display
- Changed canvas style: width/height from ${widthPx}px to ${widthPx * 3}px
- Canvas internal resolution stays at original size, only display size scaled
- Updated title: "Template Preview (Full Size)" → "Template Preview (Vergrößert)"
- Updated description: Added "(3x scaled for viewing)" note
- Template now visible at comfortable size in large modal
- File: components/asset-tag-templates/template-preview.tsx
- TypeScript compilation: ✅ PASSED

## 2025-10-03 00:45 – Optimized Asset Tag Template form layout with two-column grid
- **PROBLEM**: All form cards had full width, wasting horizontal space
- User feedback: "Alle haben grade volle breite, ist aber garnicht notwendig. Da passen auch zwei nebeneinander, außer die elements, die brauchen platz."
- **SOLUTION**: Restructured form layout with responsive grid
- Basic Information + Dimensions: Two columns side-by-side (md:grid-cols-2)
- Styling + Code Generation: Full width but internal 3-column grid for compact fields
- Available Template Codes: Full width (needs space for reference table)
- Elements: Full width (needs space for complex configuration)
- Layout changes:
  * Wrapped first two cards in grid grid-cols-1 md:grid-cols-2
  * Adjusted Dimensions card internal grid for better fit
  * Changed Styling grid to 3 columns on medium+ screens
  * Changed Code Generation grid to 3 columns on medium+ screens
  * Elements and Template Codes remain full width
- Better use of horizontal space on desktop screens
- Mobile view remains single column (responsive)
- File: components/forms/asset-tag-template-create-form.tsx
- TypeScript compilation: ✅ PASSED

## 2025-10-03 00:55 – Moved Template Codes card to right column under preview
- **PROBLEM**: Template Codes card took full width in left column
- User feedback: "Die Template Codes dürfen rüberrutschen unter die preview"
- **SOLUTION**: Moved Available Template Codes card to right column
- Now appears below Live Preview in same sticky column
- Added space-y-6 to right column wrapper for spacing between cards
- Changed grid from 2 columns to single column for better fit in narrow sidebar
- Reduced font size to text-xs for more compact display
- Benefits:
  * Better space utilization - codes visible alongside preview
  * Reference material close to where it's needed (elements section)
  * Left column has more room for complex forms
  * Sidebar now contains both preview and reference codes
- File: components/forms/asset-tag-template-create-form.tsx
- TypeScript compilation: ✅ PASSED

## 2025-10-03 01:05 – Enhanced preview mock data with realistic values for all template codes
- **PROBLEM**: Preview only showed 4 basic placeholders with simple mock values
- User feedback: "Fülle die Codes nun im Preview mit angemessenen Mock Values"
- **SOLUTION**: Extended previewData with all 8 available template codes
- Added realistic German business context mock values:
  * printed_code: EQ-2024-0815 (realistic asset tag format)
  * equipment_name: Sony FX6 Cinema Camera (detailed equipment)
  * article_name: Professional Cinema Camera (product category)
  * location_name: Studio A - Rack 3 (specific location)
  * case_name: Camera Case 1 (transport case)
  * company_name: EventTech Solutions GmbH (German company format)
  * current_date: Dynamic date in German format (de-DE locale)
  * qr_url: https://app.example.com/equipment/EQ-2024-0815 (app link)
- Updated sample placeholders list to show all 8 codes with values
- Reduced list font to text-xs for better fit
- Preview now demonstrates all available template functionality
- Users can see realistic output before creating elements
- File: components/asset-tag-templates/template-preview.tsx
- TypeScript compilation: ✅ PASSED

## 2025-10-03 01:15 – Moved mock values to Template Codes card, removed from Preview
- **PROBLEM**: Mock values shown in Preview card, codes reference in separate card redundant
- User feedback: "Pack die Mock values mit in die Template Codes. Entferne die codes direkt in der Preview card"
- **SOLUTION**: Restructured to show code + mock value together in Template Codes card
- Removed sample placeholders list from Preview component
- Changes to template-preview.tsx:
  * Removed list display from component JSX
  * Made previewData optional prop with default
  * Exported DEFAULT_PREVIEW_DATA for use in form
  * Moved mock data to top-level constant
- Changes to asset-tag-template-create-form.tsx:
  * Imported DEFAULT_PREVIEW_DATA
  * Restructured Template Codes card to show both code and example
  * Each entry now shows: code placeholder, description, and "→ mock value"
  * Used flex-col layout for better readability
  * Text size: text-xs for compact display
- Benefits:
  * Single source of truth for reference codes and examples
  * Cleaner Preview card (just canvas and controls)
  * Better information hierarchy - codes with examples in one place
  * Easier to understand what each placeholder will render
- Files: template-preview.tsx, asset-tag-template-create-form.tsx
- TypeScript compilation: ✅ PASSED
