# To-Do List

Diese To-Do List enthält Aufgaben, die an der Software zu bearbeiten sind. Sobald eine Aufgabe bearbeited wurde soll diese hier in der Datei unten in die Done-List eingefügt und aus der To-Do list entfernt werden. Denk daran für alles, was du tust, auch Tests zu implementieren! Vor dem Committen Tests ausführen und checken ob alles läuft, wenn nicht erst alles fixen und dann committen. Für jedes Todo ein Commit. Speichere so viel wie möglich in deine Memories, damit du schneller darauf zugreifen kannst.

## To-Do
- Jobs sollen eine Preisübersicht bekommen, anhand der zu ihnen gebuchten Assets. Ebenso Gewicht und Truckspace. Berechnet an den Werten der eingebuchten Assets.


### Fixes
- Unspezifisch: Formulare haben manchmal "Input lag" wenn man tippt. In der Konsole kommt dann [Violation] 'input' handler took 298ms
- Allgemein: Die Dateien Component sollte in einer eigenen Card auf oberster Ebene mit History zusammen angezeigt werden, nicht in der Entity card.
- Editiere die supabase config.toml, damit die Storage Buckets angelegt werden. Konsultiere dazu die Doku von Supabase um zu sehen, wie das geht.
- Notizen sollen Additiv vererbt werden, nicht überschrieben. Also auf einem Equipment sollen die Notizen von seinem Artikel als "Read Only" card angezeigt werden, sowie die normale Card für die eigenen Assets.
- Metadaten: "Zuweisung" darf gern ein Kontakt Picker enthalten und keine parallelstruktur. Das eigene Notizfeld hiervon darf aber gern bleiben.
- Cases:
  - Beim einfügen von Equipments in ein Case im create formular verschwinden die Equipments einfach, werden aber in keine "Hinzugefügt" tabelle oder so eingefgt
  - Die Case Edit seite ist sehr unaufgräumt. Unterteile sie in mehrere Cards.
  - Case Edit: Bei Equipments im Case wird nur die ID angezeigt aber nicht der Name des Artikels. In der Plan text ansicht oben das Gleiche, außerdem fehlen Created By und Created At. Ein Picker, um das Case Equipment zu ändern fehlt.
  - Beim Hinzufügen ungetrackter Artikel in ein Case: Could not find the 'articles' column of 'cases' in the schema cache
  - Beim Entfernen von Equipments aus einem Case: Could not find the 'equipments' column of 'cases' in the schema cache
  - Case Edit Table: Die Tabelle ist leer, suche gibt keine Ergebnisse. Im Request log vom Browser ist ein 400: fetch.ts:15  GET http://127.0.0.1:54321/rest/v1/equipments?select=*%2Carticles%3Aarticle_id%28name%29&order=created_at.desc&limit=500 400 (Bad Request)
- Company Settings:
  - Änderungen werden erst nach Reoad ins UX übernommen
  - Führe die "Kontaktperson" sektion als Kontakt Entität aus, nicht als JSON Parallelstruktur.
  - Zerlege auch hier die Metadaten in einzelne Cards, die auf oberster Ebene angezeigt werden.
- Asset Tag Templates: Page Layout kleiner Anpassungsbedarf. Update das Layout auf drei Spalten, während der Form Content in den ersten zwei Fließt, die Preview ist "Floating", damit man sie immer sieht (nur Desktop!!!!)

  - Füge eine Übersicht über alle nutzbaren Template codes an.
  - Die Preview wird server side gerendet - deswegen wird bei jeder kleinsten Änderung ne request gesendet. Wenn man was dragged bricht die Hölle aus, jede kleinste Mausbewegung löst eine riesige Welle requests aus.
  - Preview: Die Dragging Box über Text ist unter dem Text und fasst ihn nicht ein
  - Der QR Code füllt seine Dragging Box nicht voll aus - der generierte Code hat viel Padding! Zu viel!
- New Article
  - Irgendwie sind "Artikelname" und "Hersteller" + "Modell" redundant - überleg dir was. Eventuell in die Richtung zum Form validieren musst du Name oder Hersteller + Modell angeben.
  - Die Karten "Physische Eigenschaften" und "Stromversorgung" können gern standardmäßig geschlossen sein
  - Die Standardwerte in der Stromversorgung dürfen gern als Placeholder drin sein, aber nicht vorausgefüllt. Ist sonst super nervig, da vieles Zeug garkeinen direkten Stromanschluss hat (passive Lautsprecher, etc.)
  - Es Fehlen Buttons um hinzugefügte Metadatenkarten wieder zu löschen. Wenn er geklickt wird "klappe die Karte zusammen" mit einem "Undo" button für diese Aktion.
  - Die Optionen "Ist 19" Rack" und "19" Rackmontage" schließen sich logisch aus. "Case hat schloss" als Checkbox ausführen. Führe die Caseoptionen in einer Karte zusammen, also Höheneinheiten und "19-Zoll Rackmontage" mit ins Case Setup, die Felder für ein Rack nur Anzeigen wenn "Case ist 19" Rack" und andersrum die anderen nur wenn "Ist 19 Zoll Montagefähig". 
- Edit Pages:
  - Bei "Asset Tag hinzufügen" wenn keiner besteht wird ein user Prompt angezeigt, bei dem der Code manuell eintragbar ist. Macht keinen Sinn, zu Codegenerierung gibts inzwischen ne super Helper funktion. Direkt prefillen, keine Nachfragen.
- New Equipment:
  - Auswählbarkeit der Case Setup Karte fehlt.
- Contacts 
  - Das Contact creation form heißt noch Customers und lässt nur Kunden zu. Außerdem fehlen in dem aktuellen Formular Unternehmen die Ansprechperson.
  - Edit hat eine komplete parallelstruktur in den Metadaten. Implementiere die neue Datenstruktur in dem Formular.
- Jobs:
  - Doppeltes "Ort" feld in Metadaten und Basisdaten
  - Die Termine Card darf ein "Ganztägig" checkbox bekommen, dann verschwindet das Ende (wird intern = start gesetzt).
  - Wenn nicht ganztägig fehlen die Uhrzeiten!
  - Kontaktauswahl ist ein Standard-Dropdown. Das wird sehr schnell sehr lang. Implementiere auch hier deine schicke Dropdown-Search-Table.
  - Edit page: Gebuchte assets zeigt statt der Tabelle Fehler beim Laden: Could not find a relationship between 'equipments' and 'article_id' in the schema cache
  - Edit page: Die Dateneingabe darf gern nur 2/3 der Seite einnehmen, auf dem dritten Drittel erst die Quick book card, darunter die gebuchte equipments card.
  - Edit Page: Kontakt card nicht anzeigen. Stattdessen in der Kurzbeschreibung den Kontaktnamen mit link zur Kontaktseite, daneben ein "Ändern" knopf welcher die Contact Card in einem Modal öffnet. 

- Werkstatt
  - Auf den Equipment Pages fehlt eine Übersicht der offnen Werkstatt jobs
  - Erweitere das Werkstatt Job konzept: Eine Card, mit Beschreibung, Möglichkeit Fotos anzuhängen, und einer "Blockieren" checkbox, die verhindert, dass das Equip auf neue Jobs gebucht wird. Wenn ein kommender Job Equipmens gebucht hat, die geblockt sind, zeige eine Warnung im Dashboard und der Job tabelle an.
  -  
## Done
- Kameramodus für Smartphones mit eigenem /management/scanner implementiert: kontinuierlicher QR-Scan, Standort-, Job-Buchen- und Pack-Modi inklusive Buttons auf Location- und Job-Detailseiten sowie Cases-Standort-Unterstützung.
- Wartungslogs für Equipments und Cases inklusive neuer Datenbanktabelle, Inline-Erfassung, Anzeige auf Detailseiten und erweiterter Werkstattübersicht mit letzten Wartungen und Werkstatt-Todos für Cases.
- Überarbeite die Implementierung des Metadaten-Konzzepts. Metadaten-Karten sind jetzt modular, optional einblendbar, zeigen geerbte Werte als Platzhalter und erlauben Ignorieren via Checkbox. Alle typisierten Felder (Physik, Strom, Maße, Supplier, etc.) sind im UI verfügbar.
- Implementiere das Konzept "Kontakte" inkl. Datenbanktabelle, RLS, Supabase/Prisma-Typen. Jobs besitzen nun ein `contact_id`-Feld mit Picker und Dialog zur Anlage. Artikel- und Equipment-Metadaten referenzieren Supplier-Kontakte über Auswahlkarten.
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
- **Fix: Company Settings Types with Spaces**: Fixed custom types (articleTypes, caseTypes, locationTypes) by filtering out empty strings after trim, allowing spaces within type names and line breaks between types while removing blank lines.
- **Fix: Infinite Loop on Table Pages**: Fixed DataTable component causing constant refresh loop on table pages (e.g. /management/equipments) by serializing array dependencies (filters, searchableFields) in useEffect. Array references were being recreated on every render causing infinite re-fetches (~40 requests/second).
- **Fix: Infinite Loop on Overview Pages (History)**: Fixed history-live component causing ~40 requests/second by removing equipmentDetails and caseDetails from useEffect dependencies.
- **Fix: Duplicate HTML IDs in Dimension Inputs**: Fixed all dimension input fields having the same HTML id by adding idPrefix prop to DimensionsFieldset component.
- **Fix: Link Copy Feedback**: Added checkmark visual feedback when clicking "Link kopieren" button in FileManager.
- **Fix: History Log undefined Display**: Fixed history log showing "undefined -> value" - now shows only "[attribute]: [value]" when something changes from undefined.
- **Fix: Edit Location Title**: Changed location detail page title from "Standort #id" to "Standort: [name]" with ID shown below.
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
