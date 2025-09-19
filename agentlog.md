# Agent Activity Log

- Use this file to append brief summaries after major tasks.
- Include date/time, task, key changes, and next steps.

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
