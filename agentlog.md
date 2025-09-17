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

# Session Summary – $(date '+%Y-%m-%d %H:%M')

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
