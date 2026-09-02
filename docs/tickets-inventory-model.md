# Ticketsystem und Inventarverwaltung – Datenbank-Zielbild

## Status und Zweck

**Planungsstand:** 2026-09-02  
**Prioritaet:** Akzeptanzkern / fruehe Fachmodule  
**Status:** [NEXT]

Ticketsystem und Inventarverwaltung sind keine spaeteren Zusatzmodule. Fuer die Grundakzeptanz der Centersoftware gehoeren sie zum fruehen operativen Kern.

Das gemeinsame Ziel lautet:

> Stoerungen, Aufgaben und Anforderungen sollen sich unmittelbar auf konkrete Assets, Standorte, Personen und Verantwortliche beziehen lassen – und umgekehrt muss ein Asset seine betriebliche Historie zeigen koennen.

Die beiden Module werden deshalb gemeinsam modelliert und erhalten von Beginn an stabile Querbeziehungen.

---

## 1. Einordnung in die Gesamtarchitektur

Das operative Startziel erweitert das bisherige Modell wie folgt:

```text
Authentication / Authorization
        |
        +-- People & Staff
        |
        +-- Tickets -------------------+
        |                              |
        +-- Inventory / Assets --------+
        |
        +-- Documents
        |
        +-- Appointments
```

Tickets und Assets muessen jeweils eigenstaendig funktionieren. Ihre Verknuepfung ist jedoch ein First-Class-Konzept und keine nachtraegliche Freitextloesung.

### 1.1 Neue Permission-Domaenen

Fuer die Implementierung sind mindestens folgende stabilen Berechtigungen vorgesehen:

- `tickets.read`
- `tickets.manage`
- `tickets.assign`
- `tickets.comment`
- `inventory.read`
- `inventory.manage`
- `inventory.assign`
- `inventory.audit`

Ob einzelne Rechte spaeter feiner aufgeteilt werden, wird erst anhand realer Rollen entschieden.

---

## 2. Ticketsystem [NEXT]

### 2.1 `app.ticket`

`ticket` ist das zentrale Arbeitsobjekt fuer Stoerungen, Serviceanfragen, Aufgaben und interne Anforderungen.

Geplante Kernfelder:

- `id`
- `center_id`
- fortlaufende, fuer Menschen lesbare Ticketnummer
- `ticket_type`
- `title`
- `description`
- `status`
- `priority`
- `requester_person_id` optional
- `requester_user_id` optional
- `assigned_staff_id` optional
- `assigned_membership_id` optional
- `created_by_user_id`
- `created_at`
- `updated_at`
- `due_at` optional
- `resolved_at` optional
- `closed_at` optional

### 2.2 Menschliche Ticketnummer

Neben der technischen UUID braucht ein Ticket eine kurze sichtbare Nummer, z. B.:

```text
T-2026-000123
```

Die Nummer muss innerhalb eines Centers eindeutig sein. Das Format darf spaeter konfigurierbar werden, die interne UUID bleibt davon unabhaengig.

### 2.3 Tickettypen

Der Typ soll strukturiert und centerbezogen konfigurierbar sein, beispielsweise:

- Stoerung
- Service Request
- Aufgabe
- Beschaffung
- Zugang/Berechtigung
- Wartung
- Sonstiges

Geplant ist `app.ticket_type` statt frei eingegebener Typtexte.

### 2.4 Ticketstatus

Der Workflow soll nicht als beliebiger Text gespeichert werden. Als Startmodell sind vorgesehen:

- `open`
- `in_progress`
- `waiting`
- `resolved`
- `closed`
- `cancelled`

Ob Center eigene Workflows oder Statuswerte definieren koennen, bleibt [OPEN]. Die erste Version sollte bewusst einfach bleiben.

### 2.5 Prioritaet

Prioritaet ist vom Status getrennt. Startwerte koennen sein:

- `low`
- `normal`
- `high`
- `critical`

SLA-Regeln werden nicht in die erste Migration gezwungen, das Modell soll sie aber spaeter aufnehmen koennen.

---

## 3. Ticketkommunikation und Historie

### 3.1 `app.ticket_comment`

Kommentare sind eigene Datensaetze und kein wachsendes Textfeld im Ticket.

Geplante Felder:

- `id`
- `ticket_id`
- `author_user_id`
- `body`
- Sichtbarkeit / intern-extern spaeter optional
- `created_at`
- `edited_at` optional

Kommentare sollen standardmaessig nicht physisch ueberschrieben werden, ohne Aenderungen nachvollziehbar zu machen.

### 3.2 `app.ticket_event`

Wichtige Zustandswechsel werden als strukturierte Ereignisse protokolliert, z. B.:

- Ticket erstellt
- Status geaendert
- Prioritaet geaendert
- Verantwortlichen geaendert
- Asset verknuepft/entfernt
- Frist geaendert
- Ticket geloest/geschlossen

Das Ticket-Event ersetzt nicht den globalen Security-Audit-Trail. Es bildet die fachliche Ticketchronik fuer Anwender ab.

### 3.3 Anhänge

Dateien werden ueber das allgemeine Dokumentmodell angebunden. Vorgesehen ist eine konkrete Relation:

- `app.ticket_document`

Damit wird kein zweites Datei-/Uploadsystem nur fuer Tickets aufgebaut.

---

## 4. Ticketzuordnung und Verantwortlichkeit

Ein Ticket kann unterschiedliche Beteiligte haben. Die erste Version soll zwischen folgenden Rollen unterscheiden:

- Anfragende Person / Requester
- erstellender Benutzer
- aktuell verantwortliche Person bzw. Mitarbeiter
- spaeter optional Beobachter/Watcher

### 4.1 Assignment-Historie

Nur `assigned_staff_id` am Ticket reicht fuer die aktuelle Ansicht, aber nicht fuer Historie und Kennzahlen. Deshalb soll jede Zuweisung zusaetzlich als Event nachvollziehbar sein.

Eine separate `ticket_assignment`-Tabelle wird erst eingefuehrt, wenn parallele Verantwortliche oder Teams benoetigt werden.

### 4.2 Teams [LATER]

Spaeter koennen Tickets an Teams/Queues statt einzelne Personen gehen. Das setzt ein stabiles Staff-Team-Modell voraus und wird nicht vorsorglich in die erste Migration aufgenommen.

---

## 5. Inventar / Asset Management [NEXT]

### 5.1 Begriff

Das kanonische Datenbankobjekt heisst `asset`. In der UI darf je nach Kontext von Inventar, Geraet, Ausstattung oder Gegenstand gesprochen werden.

Ein Asset ist ein individuell verwaltetes Objekt mit eigener Identitaet und Lebenszyklus. Verbrauchsmaterial und reine Lagerbestandsmengen sind ein anderes Modell und werden spaeter getrennt behandelt.

### 5.2 `app.asset`

Geplante Kernfelder:

- `id`
- `center_id`
- interne Asset-/Inventarnummer
- `asset_type_id`
- Hersteller optional
- Modell optional
- Seriennummer optional
- Anzeigename
- Beschreibung optional
- Status
- Anschaffungsdatum optional
- Inbetriebnahmedatum optional
- Ausmusterungsdatum optional
- Anschaffungswert optional
- Lieferant optional / spaeter strukturierte Relation
- Garantieende optional
- `location_id` optional
- `assigned_person_id` optional
- `assigned_staff_id` optional
- `created_at`
- `updated_at`

### 5.3 Assetnummer

Wie Tickets erhalten Assets eine lesbare centerlokale Kennung, beispielsweise:

```text
INV-000842
```

Sie ist nicht der Primaerschluessel und darf bei spaeteren Nummerierungsregeln nicht die technische Identitaet des Assets veraendern.

---

## 6. Assettypen und Kategorien

### 6.1 `app.asset_type`

Assettypen bilden die betriebliche Klassifikation, z. B.:

- Arbeitsplatz-PC
- Notebook
- Monitor
- Drucker
- Scanner
- Telefon
- Netzwerkkomponente
- medizinisches/technisches Geraet
- Moebel
- Schluessel
- sonstige Ausstattung

Geplante Felder:

- `id`
- `center_id`
- `key`
- `name`
- optionale uebergeordnete Kategorie
- Aktivstatus

### 6.2 Keine starre IT-Beschraenkung

Das Modell darf nicht auf Computerinventar zugeschnitten werden. Ein Asset kann IT, Mobiliar, technische Ausstattung oder spaeter ein anderes individuell verwaltetes Betriebsmittel sein.

Spezifische Eigenschaften gehoeren nicht als Dutzende nullable Spalten in `asset`.

### 6.3 Typabhaengige Attribute [LATER]

Fuer flexible Zusatzattribute ist spaeter ein kontrolliertes Schema moeglich, z. B.:

```text
asset_attribute_definition
asset_attribute_value
```

Dies soll erst eingefuehrt werden, wenn reale Zusatzfelder bekannt sind. Ein unkontrolliertes EAV-Modell wird vermieden.

---

## 7. Standorte und Raeume [NEXT]

Inventarverwaltung braucht stabile Standorte. Freitext wie "Zimmer 2 OG hinten" reicht langfristig nicht.

### 7.1 `app.location`

Ein hierarchisches Standortmodell ist vorgesehen:

```text
Center
  -> Gebaeude
      -> Etage
          -> Raum
              -> Bereich
```

Nicht jede Ebene muss genutzt werden.

Geplante Felder:

- `id`
- `center_id`
- `parent_location_id` optional
- `location_type`
- `code` optional
- `name`
- Aktivstatus

Damit koennen Assets, Tickets und spaeter Termine auf denselben kanonischen Ort verweisen.

---

## 8. Asset-Zuordnung und Historie

### 8.1 Aktuelle Zuordnung

Ein Asset kann aktuell einem Standort und optional einer Person/Mitarbeiterin zugeordnet sein.

Die aktuellen Bezuge duerfen fuer schnelle Abfragen direkt am Asset liegen.

### 8.2 `app.asset_assignment`

Die Historie von Ausgaben, Rueckgaben und Standortwechseln wird in einer eigenen Tabelle festgehalten.

Geplante Inhalte:

- `id`
- `asset_id`
- `assigned_person_id` optional
- `assigned_staff_id` optional
- `location_id` optional
- `assigned_at`
- `returned_at` optional
- `assigned_by_user_id`
- Kommentar optional

Mindestens ein fachliches Ziel – Person, Staff oder Standort – muss vorhanden sein.

### 8.3 Status

Vorgesehene Grundstatus:

- `available`
- `assigned`
- `in_service`
- `repair`
- `retired`
- `lost`
- `disposed`

Status und Standort/Zuweisung muessen konsistent gehalten werden; die Anwendungslogik darf z. B. ein entsorgtes Asset nicht neu vergeben.

---

## 9. Ticket ↔ Asset als Kernbeziehung

### 9.1 `app.ticket_asset`

Dies ist eine explizite n:m-Relation:

```text
TICKET ||--o{ TICKET_ASSET }o--|| ASSET
```

Ein Ticket kann mehrere Assets betreffen, und ein Asset kann im Laufe seines Lebens viele Tickets besitzen.

Geplante Felder:

- `ticket_id`
- `asset_id`
- `relation_type` optional
- `created_at`

Moegliche `relation_type`-Werte spaeter:

- betroffenes Asset
- Ersatzgeraet
- Ursache/Abhaengigkeit

### 9.2 Asset-Historie

Die Assetdetailseite soll spaeter direkt zeigen koennen:

- offene Tickets
- abgeschlossene Tickets
- Wartungen/Reparaturen
- Zuordnungshistorie
- Dokumente
- Anschaffungs-/Garantieinformationen

Das ist ein wesentliches Akzeptanzmerkmal der Inventarverwaltung.

---

## 10. Wartung und Lebenszyklus [NEXT/LATER]

### 10.1 Wartungsinformationen

In einer fruehen Version koennen Wartungen noch als Tickets des Typs Wartung/Reparatur abgebildet werden.

Damit vermeiden wir ein zweites paralleles Aufgabenmodell.

### 10.2 `app.asset_maintenance` [LATER]

Eine separate Wartungstabelle wird erst sinnvoll, wenn strukturierte Wartungsplaene, wiederkehrende Pruefungen, externe Dienstleister oder gesetzliche Pruefintervalle erforderlich sind.

### 10.3 Beschaffung [LATER]

Beschaffungsanfragen koennen zunaechst ebenfalls Tickets sein. Erst echte Bestell-, Liefer- oder Lagerprozesse rechtfertigen ein Procurement-Modul.

---

## 11. Lieferanten, Vertraege und Garantien [LATER]

Mittelfristig werden vermutlich folgende Objekte sinnvoll:

- `vendor`
- `asset_vendor`
- `contract`
- `contract_asset`
- `warranty`

Sie werden nicht in die erste Inventarmigration aufgenommen, solange die betrieblichen Prozesse nicht ausreichend konkret sind.

---

## 12. Inventur [NEXT/LATER]

Die Verwaltung von Assets ist nicht dasselbe wie eine Inventur. Dennoch muss die Datenstruktur eine spaetere physische Bestandspruefung ermoeglichen.

Geplant:

### `app.inventory_audit`

- Center
- Stichtag / Zeitraum
- Status
- verantwortliche Person

### `app.inventory_audit_item`

- Audit
- Asset
- erwartetet Standort
- gefundener Standort
- Ergebnis
- Pruefzeitpunkt
- Pruefer

Moegliche Ergebnisse:

- bestaetigt
- Standortabweichung
- nicht gefunden
- zusaetzlich gefunden
- Klaerung erforderlich

Barcode-/QR-Scanning kann spaeter direkt auf diesem Modell aufbauen.

---

## 13. Labels, QR und Barcode [NEXT]

Ein Asset soll eine scanbare Kennung erhalten koennen.

Die interne Assetnummer ist dafuer der primaere sichtbare Kandidat. Zusaetzlich kann eine technische Label-ID gespeichert werden, falls Labels ersetzt oder unterschiedliche Formate genutzt werden.

QR/Barcode-Inhalte sollen keine vertraulichen Assetdaten enthalten, sondern lediglich eine stabile Kennung bzw. sichere Anwendungs-URL.

---

## 14. Suche

Fuer die Grundakzeptanz ist schnelle Suche entscheidend.

### Ticket-Suche

Mindestens suchbar nach:

- Ticketnummer
- Titel
- Status
- Prioritaet
- Requester
- Verantwortlichem
- Assetnummer / Assetname

### Asset-Suche

Mindestens suchbar nach:

- Assetnummer
- Seriennummer
- Anzeigename
- Hersteller
- Modell
- Standort
- zugeordneter Person/Mitarbeiter
- Status

Fuer die erste Version reichen passende PostgreSQL-Indizes. Eine separate Search Engine ist nicht vorgesehen.

---

## 15. Benachrichtigungen [LATER]

Ticketereignisse koennen spaeter Benachrichtigungen erzeugen:

- neue Zuweisung
- Kommentar
- Statuswechsel
- Frist erreicht/ueberschritten

Dies wird ueber Domain Events / Transactional Outbox angebunden und nicht direkt als E-Mail-Versand aus Datenbanktriggern implementiert.

---

## 16. Kennzahlen und Dashboard

Die Datenstruktur soll folgende Kennzahlen ohne Sonderkonstruktionen ermoeglichen:

### Tickets

- offen nach Status
- offen nach Prioritaet
- neu pro Zeitraum
- durchschnittliche Bearbeitungsdauer
- offene Tickets je Mitarbeiter
- Tickets nach Assettyp
- wiederkehrende Stoerungen eines Assets

### Inventar

- Assets nach Status
- Assets nach Standort
- Assets je Person/Mitarbeiter
- nicht zugeordnete Assets
- Garantieablauf
- Assets mit offenen Tickets
- nicht bestaetigte Assets nach Inventur

Historische Kennzahlen duerfen spaeter nicht allein aus dem heutigen Endzustand rekonstruiert werden muessen. Ticketevents und Assetzuweisungen liefern dafuer die zeitliche Grundlage.

---

## 17. Datenschutz und Sicherheit

Auch Inventardaten koennen personenbezogene Bezuge enthalten, etwa durch Geraetezuweisungen.

Daher gelten dieselben Centergrenzen wie fuer andere Fachmodule:

- jedes Ticket und Asset hat `center_id`;
- Zugriff wird serverseitig geprueft;
- Tickettexte und Kommentare duerfen nicht ungefiltert centeruebergreifend durchsucht werden;
- Zuordnungen zu Personen sind explizite Fremdschluessel;
- Audit-/Eventdaten duplizieren nicht unnoetig sensible Freitexte.

---

## 18. Vorgeschlagene erste Tabellen

### Migration A – gemeinsame operative Grundlagen

1. `app.location`
2. `app.person`
3. `app.staff_member`
4. neue Ticket-/Inventar-Permissions

### Migration B – Inventar Minimum Viable Core

5. `app.asset_type`
6. `app.asset`
7. `app.asset_assignment`

### Migration C – Ticket Minimum Viable Core

8. `app.ticket_type`
9. `app.ticket`
10. `app.ticket_comment`
11. `app.ticket_event`
12. `app.ticket_asset`

### Migration D – Dokumentbeziehungen

13. `app.ticket_document`
14. `app.asset_document`

### Migration E – Inventur

15. `app.inventory_audit`
16. `app.inventory_audit_item`

Die genaue Aufteilung kann sich beim Implementieren noch aendern. Entscheidend ist die fachliche Reihenfolge, nicht die Nummer der Migration.

---

## 19. Minimum Viable Acceptance Scope

Fuer eine erste im Alltag ernsthaft nutzbare Centersoftware sollte mindestens Folgendes funktionieren:

### Tickets

- Ticket erstellen
- Ticketnummer automatisch vergeben
- Typ, Status und Prioritaet setzen
- Verantwortlichen zuweisen
- Kommentare schreiben
- Verlauf sehen
- Ticket suchen und filtern
- Ticket mit Asset verknuepfen
- Ticket schliessen

### Inventar

- Asset anlegen
- Assetnummer vergeben
- Typ, Hersteller, Modell und Seriennummer erfassen
- Standort zuordnen
- Mitarbeiter/Person zuordnen
- Zuordnungshistorie sehen
- Status aendern
- Assets suchen und filtern
- offene/alte Tickets eines Assets sehen
- QR-/Barcode-Label vorbereiten

Dieser Umfang soll vor komplexeren Workflow-, SLA-, Lager-, Vertrags- oder Beschaffungsfunktionen priorisiert werden.

---

## 20. Bewusst nicht im ersten Scope

Nicht Teil des ersten Akzeptanzkerns:

- komplexe ITIL-Workflows
- Change-Management
- Problem-Management als eigenes Modul
- CMDB mit frei modellierbaren Configuration Items
- Software-Lizenzmanagement
- automatische Netzwerk-/Endpoint-Discovery
- Lagerbestands- und Verbrauchsmaterialwirtschaft
- Einkauf/Bestellung
- Vertragsverwaltung
- umfangreiche SLA-Engine
- frei konfigurierbare Workflow-Designer

Diese Funktionen bleiben anschlussfaehig, sollen den nutzbaren Start aber nicht blockieren.

---

## 21. Architekturentscheidung

Ticketsystem und Inventarverwaltung werden ab jetzt als **Kernmodule der ersten fachlichen Ausbauphase** betrachtet.

Die Reihenfolge lautet funktional nicht mehr:

```text
People -> Staff -> Appointments -> Documents -> irgendwann Tickets/Inventar
```

sondern:

```text
People/Staff + Locations
        |
        +-> Inventory Core
        +-> Ticket Core
        |
        +-> Documents / Appointments
```

People, Staff und Locations liefern die gemeinsamen Referenzen. Tickets und Inventar erzeugen den unmittelbaren betrieblichen Nutzen und werden deshalb frueh vertikal bis zu einer benutzbaren Oberflaeche umgesetzt.
