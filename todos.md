# To-Do List

Diese To-Do List enthält Aufgaben, die an der Software zu bearbeiten sind. Sobald eine Aufgabe bearbeited wurde soll diese hier in der Datei unten in die Done-List eingefügt und aus der To-Do list entfernt werden. Denk daran für alles, was du tust, auch Tests zu implementieren! Vor dem Committen Tests ausführen und checken ob alles läuft, wenn nicht erst alles fixen und dann committen. Für jedes Todo ein Commit. Speichere so viel wie möglich in deine Memories, damit du schneller darauf zugreifen kannst.

## To-Do
- Es fehlen überall immer mal wieder beschriebene Metadaten Felder. Die Supplyer bei Artikeln fehlen, Preise, etc. etc.
- Implementiere einen Kameramodus. Dieser ist für Smartphones optimiert und scannt asset tags. Weitere Modi:
  - Equipments und Cases an eine Location "stellen" - also ein Knopf auf der Location seite den Scanner öffnet und alle folgenden gescannten Equipments und Artikel bekommen diese Location als aktuellen Standort.
  - Gleiches prinzip, aber A) einmal um Assets zu einem Job zu buchen und B) beim Packen auch in den Job zu kommissionieren. Dafür existiert die zweite Tabelle.
- Die Company Settings soll ein Upload Feld für Dateien bekommen. Pro Datei einstellbar ob öffentlich oder nicht. "Copy" button für ggf. öffentlichen Link. 
- Company logo oben Links beim Namen in der UI anzeigen. Wenn nicht gesetzt Fallback auf so wie es aktuell ist.
- Schaue wie du den Screen Space besser ausnutzen kannst auf Desktop mit hoher Auflösung.
- Equipments und Cases sollen wartungslogs bekommen. In dem Zuge implementiere das Konzept "Werkstatt" - locations können gemäß der Typendefiniton eine Werkstatt sein. Füge einen "Werkstatt todo hinzufügen" hinzu. Erstelle eine Werkstattübersicht. Da werden alle Todos angezeigt, sowie Equipments, die sich in der Werkstatt befinden. Also ähnlich wie das Dashboard, nur auf Equipmentwartung sepzialisiert!
- Jobs sollen eine Preisübersicht bekommen, anhand der zu ihnen gebuchten Assets. Ebenso Gewicht und Truckspace. Berechnet an den Werten der eingebuchten Assets.


### Fixes


## Done
- **Globale Apple Spotlight-style Suche implementiert**: Cmd+K öffnet floating Modal mit Echtzeit-Suche über alle Entitäten (Artikel, Kunden, Equipment, Jobs, Locations, Cases). Ersetzt die kaputte Header-Suche.
- **Dashboard Historie mit Diff-Anzeige**: ExpandableHistoryTable zeigt jetzt echte Änderungen (vorher/nachher) statt nur basic summaries. Feld-für-Feld Diff-Darstellung beim Aufklappen.
- **Kamera Asset-Tag Scanner**: QR/Barcode Scanner Modal für mobile Geräte. Scannt Asset-Tags und navigiert automatisch zu gefundenen Items (Equipments, Articles, Locations). Blitz-Support, Kamera-Wechsel, Erfolgs-/Fehlermeldungen.
- **Fix: Dashboard Table Header**: Die Titel im Tabellenheader auf dem Dashboard stimmen jetzt mit den angezeigten Daten überein.
- **Fix: Global Search**: Die Suchfunktion produziert keine 400 Bad Request Fehler mehr, wenn man mehr als einen Buchstaben eingibt.
- Räume deinen Code auf - modifiziere ggf. Komponenten, das sie reusable sind soweit wie möglich.
- Räume das UI auf - nutze den Platz auf großen bildschirmen besser, finde "spannende" design Entscheidungen und finde andere Lösungen für sie. Das UI soll sich so intuitiv wie möglich bedienen, sowohl auf Desktop als auch mobile. Check das explizit indem du mit vitest Screenshots anlegst und dir anschaust.
- Lege einen API Endpunkt an, der den im Asset Template definierten SVG Prototypen aus dem Bucket zieht und die entsprechenden Werte einsetzt und danach das SVG zurückgibt. Implementiere auch Renderfunktionen als lossless Bitmaps mit fest definierter Auflösung. Filetypes nur PNG, BMP und GIF.
- Lege ein rudimentäres Formular an, welches sich als Modal öffnet wenn man auf den neuen Knopf dafür auf der Detailseit klickt,  wo Asset Tags für das Item angelegt werden können. Prefille die ID daten gemäß den Regeln im Template.
- Implementiere die globale Suche über das Feld oben Rechts. Dort soll man ALLES suchen können.
- Implementiere RLS Policies für die S3 Bucket. Derzeit können keine Dateien hochgeladen werden weil "new row violates row-level security policy". Update den File Manager, sodass es für jede company einen Ordner im privaten S3 Bucket gibt. Auf den Inhalt dürfen nur user zugreifen, die Member der Company sind. Außerdem nutze zwei Buckets - einen public, einen nicht public. Im Public kommen wirklich öffentliche Assets, wie Logo der Firma und sowas. In den Privaten die ganzen Attachments.
- Validate RLS policies comprehensively against `users_companies` membership for all tables (articles, equipments, locations, cases, customers, jobs, job_* tables, history). Create Vitest for that.
- Implementiere eine weitere Asset Tag art in der Datenbank und im Datenbank Schema - NFC Tags.
- Lege ein rudimentäres Forumular an um Asset Tag Templates zu erstellen. Es muss ALLE parameter aus der Typendefinition enthalten! Außerdem braucht die Company dann Standardfelder für welches Template für jedes Asset Type.
- Lege einen API Endpunkt an, der den im Asset Template definierten SVG Prototypen aus dem Bucket zieht und die entsprechenden Werte einsetzt und danach das SVG zurückgibt. Implementiere auch Renderfunktionen als lossless Bitmaps mit fest definierter Auflösung. Filetypes nur PNG, BMP und GIF.
- Lege ein rudimentäres Formular an, welches sich als Modal öffnet wenn man auf den neuen Knopf dafür auf der Detailseit klickt,  wo Asset Tags für das Item angelegt werden können. Prefille die ID daten gemäß den Regeln im Template.
- Implementiere die globale Suche über das Feld oben Rechts. Dort soll man ALLES suchen können.
- Implementiere RLS Policies für die S3 Bucket. Derzeit können keine Dateien hochgeladen werden weil "new row violates row-level security policy". Update den File Manager, sodass es für jede company einen Ordner im privaten S3 Bucket gibt. Auf den Inhalt dürfen nur user zugreifen, die Member der Company sind. Außerdem nutze zwei Buckets - einen public, einen nicht public. Im Public kommen wirklich öffentliche Assets, wie Logo der Firma und sowas. In den Privaten die ganzen Attachments.
- Validate RLS policies comprehensively against `users_companies` membership for all tables (articles, equipments, locations, cases, customers, jobs, job_* tables, history). Create Vitest for that.
- Implementiere eine weitere Asset Tag art in der Datenbank und im Datenbank Schema - NFC Tags.
- Lege ein rudimentäres Forumular an um Asset Tag Templates zu erstellen. Es muss ALLE parameter aus der Typendefinition enthalten! Außerdem braucht die Company dann Standardfelder für welches Template für jedes Asset Type.



### Fixes


## Done
- Upgrade the project so that nextjs reads it's environment variables directly from supabase. Maybe create a npm script that reads the supabase status and outputs it to .env or something like that.
- Update deine Instructions so, dass du deine Erinnerungen gut nutzt! Speichere viel rein und schau ob du über etwas etwas weißt, bevor du die komplette Codebase durchsuchst.
- Kommentiere sämtlichen Code von dir im TSDoc Style (fortlaufend; neue Module sind dokumentiert).
- Überprüfe die Security Best Practices - schaue dass die Supabase Referenzen eingehalten werden!
- Metadata types + defaults: Added TSDoc to `components/metadataTypes.types.ts`. Introduced DACH defaults in `lib/metadata/defaults.ts` and prefilled metadata fields in create forms (company, equipment, customer, job). Company Settings now shows DACH defaults when metadata is empty.
- Repo-Cleanup: Landingpage entschlackt, Tutorial-Komponenten entfernt und Dashboard-Helfer in `app/management/_libs/dashboard-utils.ts` ausgelagert.
- Playwright E2E Setup (playwright.config.ts, Script `test:e2e`) + erster Test `tests/e2e/home.spec.ts` (Startseite sichtbar).
- Supabase Env-Variablen vereinheitlicht: Nutzung von `NEXT_PUBLIC_SUPABASE_ANON_KEY` statt `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` in Code und `.env(.example)`.
- TSDoc ergänzt für `lib/supabase/{client,server,admin}.ts`; kleinere Lint/Repo-Cleanup (unbenutzte Funktion entfernt, unnötige eslint-disable entfernt). 
- Dateien pro Objekt: `files jsonb[]` für Articles, Equipments, Locations, Cases, Customers, Jobs + UI FileManager (Upload/Liste) in Edit-Ansichten; Storage-Bucket `attachments`.
- Logging: `lib/log.ts` mit optionaler Weiterleitung an Logflare (env: `LOGFLARE_SOURCE`, `LOGFLARE_API_KEY`); Events bei Schnell-Buchung.
- Fixe die ganzen Linter Issues.
- Error Handling: Einheitliche Fehlerseiten (global/Management) mit Retry-Option.

- Fixes: Job-Detail befüllt Start-/Enddatum korrekt und reduziert redundante Metadaten auf der Seite.
- Fixes: Benutzerfreundlicher Date-Picker ersetzt native Date-Inputs projektweit.
- Fixes: Schnell-Buchen nutzt generalisierten Such-Picker; Modul auch in Job-Suche eingebunden.

- History: Kompakte Beschreibungen für Einträge (z.B. Case "Name" angelegt).
- Loading Screens: Konsistente Fallbacks für Management-Listen, Details und Formulare (loading.tsx + Skeleton-Komponenten).
- Dashboard unter /management/: responsive Übersicht mit Kennzahlen, kommenden Veranstaltungen und komprimierter Historientabelle.
- Fix: Artikel-Detailseite zeigt nur noch einen "Equipment hinzufügen"-Button.
- Übersicht von Jobs von Kunden (Liste in Kunden-Detail)
- Übersichtstabellen mit "Bearbeiten"-Buttons; Detailseiten mit Löschen + Undo
- Fix: Kunde in Jobübersicht ist jetzt anklickbar
- Job-Detail: Übersicht gebuchter Assets (Cases/Equipments) + schnelles Buchen (Artikel X Stück, Equipment-ID, Case).
- Fixes: History streamt live; Equipments-Auswahl (Case Create/Edit) paginiert und filtert Case-Equipment wie bereits eingebuchte; Cases haben Name/Beschreibung (Titel/Description Felder im Formular); "Von: dir" in History.
- Cases: Im Detail Items (Equipments/Artikel) nachträglich hinzufügen/entfernen.
- Fixes: Case Creator – Equipment-Auswahl als Tabelle mit Suche/Checkboxen; History zeigt Namen/"Du" statt UUID.
- Fixes: "Im Lager seit" hat nun Standard heute; History-Anzeige schöner (Operation + kompakte Werte, besserer Nutzer-Fallback); Case-Form zeigt Namen von Equipments/Artikeln; Redirect nach Case-Erstellung zur Case-Detailseite.
- Caseübersicht und Erstellen: Liste unter /management/cases, Create-Form inkl. Equipments und ungetrackter Artikel (articles jsonb[] mit {article_id, amount}).
- History: Trigger-Funktion + Triggers für Kern-Tabellen; Insert-Policy für history. UI-Karte auf Detailseiten (Articles, Equipments, Locations, Customers, Jobs).
- Company: "+ Neue Company" im Switcher; Create-Form unter /management/company/new (legt users_companies Mitgliedschaft an).
- Fixes: Next.js params Warnung behoben (alle Detailseiten nutzen await params). Equipment-Create-Knopf auf Artikelseite nun rechts oben in der Equipments-Liste.
- Equipment-Form-Verbesserungen: Leere Date-Picker senden keine Nulls (DB-Default greift), Button "Neues Equipment" in der Artikel-Detailseite (öffnet Create-Seite mit vorgewähltem Artikel), Bulk-Create (Anzahl) im Equipment-Create-Formular.
- Formulare um neue Artikel, Locations, Equipments, Cases, Kunden und Jobs zu erstellen 
- Seite für Kunden, sowie Kunden Detailview
- Seite für Jobs, sowie Job Detailview
- In der Header Leiste wird auf dem User-Icon ein Drop-Down Menü angezeigt mit:
  - Company Switcher (Subliste mit allen Companies, Auswahl wird gespeichert)
  - Profileinstellungen (Link zu `/management/profile/settings`)
  - Abmelden (Supabase Sign-Out)
