# To-Do List

Diese To-Do List enthält Aufgaben, die an der Software zu bearbeiten sind. Sobald eine Aufgabe bearbeited wurde soll diese hier in der Datei unten in die Done-List eingefügt und aus der To-Do list entfernt werden.

## To-Do
- Kommentiere sämtlichen Code von dir im TSDoc Style (fortlaufend; neue Module sind dokumentiert).
- Räume das Repo auf - ungenutze Sachen entfernen, etc.
- Implementiere Tests
- Räume deinen Code auf - modifiziere ggf. Komponenten, das sie reusable sind soweit wie möglich.
- Überprüfe die Security Best Practices - schaue dass die Supabase Referenzen eingehalten werden!

### Fixes


## Done
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
