# Architektur der Centersoftware

## Status

Foundation v0.3. Diese Datei beschreibt die technischen Grenzen, die beim Neuaufbau nicht versehentlich aufgeweicht werden sollen.

Das detaillierte fachliche Datenbank-Zielbild wird separat gepflegt: [`docs/database-model.md`](./database-model.md).

Das Akzeptanzkern-Modell fuer Ticketsystem und Inventarverwaltung wird vertieft in [`docs/tickets-inventory-model.md`](./tickets-inventory-model.md).

## 1. Leitentscheidung

Die Anwendung ist PostgreSQL-zentriert. Neon ist der initiale Betreiber der Datenbank, aber kein Bestandteil der Facharchitektur.

```text
Browser
  |
Next.js
  |
Application / Domain Logic
  |              \
Authorization     Better Auth
  |                 |
Drizzle ORM --------+
  |
PostgreSQL
  |
Neon (austauschbare Infrastruktur)
```

Ein spaeterer Wechsel von Neon zu einem anderen PostgreSQL-Betrieb darf keine Neuentwicklung der Fachmodule verlangen.

## 2. Authentication und Authorization

Authentication und Authorization sind getrennte Verantwortlichkeiten.

**Better Auth** verwaltet Identitaet, Login, Sessions und spaeter bei Bedarf weitere Anmeldeverfahren.

**Centersoftware Authorization** verwaltet Center-Mitgliedschaften, Rollen und fachliche Berechtigungen.

Eine gueltige Session allein berechtigt daher zu keinem fachlichen Datenzugriff.

## 3. PostgreSQL-Schemas

Wir trennen bereits auf Datenbankebene:

- `auth.*`: Better-Auth-Tabellen
- `app.*`: fachliche und organisatorische Tabellen

Spaetere Fachbereiche koennen bei ausreichender Groesse in weitere Schemas zerlegt werden. Das ist keine Voraussetzung fuer den Start.

## 4. Mandantenfaehigkeit

`center` ist eine kanonische Entitaet und keine spaeter nachgeruestete Spalte. Benutzer erhalten Zugriff ueber `membership`.

Das verhindert, dass spaetere Multi-Center-Nutzung einen Umbau aller fachlichen Tabellen erzwingt.

Fachobjekte mit Center-Bezug muessen kuenftig einen eindeutigen `center_id`-Bezug besitzen. Queries duerfen Center-Grenzen nicht implizit ableiten.

## 5. Rollen und Rechte

Das Grundmodell lautet:

```text
user
  -> membership (user <-> center)
       -> membership_role
            -> role
                 -> role_permission
                      -> permission
```

Permission Keys sind stabile fachliche Bezeichner wie `people.read`, `tickets.manage` oder `inventory.read`. UI-Texte oder Menuepunkte sind keine Berechtigungen.

## 6. Migrationen

Datenbankschemaaenderungen werden als Drizzle-Migrationen versioniert. Direkte manuelle Produktionsaenderungen sollen vermieden werden.

Der vorgesehene Ablauf ist:

```text
Schema in TypeScript aendern
 -> npm run db:generate
 -> SQL-Migration pruefen
 -> Migration committen
 -> auf Testbranch anwenden und verifizieren
 -> kontrolliert auf Produktion anwenden
```

## 7. Validierung

Nicht vertrauenswuerdige Eingaben werden an der Anwendungsgrenze mit Zod validiert. Datenbanktypen ersetzen keine Eingabevalidierung.

## 8. Sicherheitsgrenzen

- Secrets gehoeren nie ins Repository.
- Fachliche APIs muessen Session und Berechtigung pruefen.
- Center-Zugriff wird serverseitig erzwungen.
- Clientseitig ausgeblendete Buttons gelten nicht als Sicherheitsmassnahme.
- Besonders schutzbeduerftige personenbezogene Daten werden erst produktiv verarbeitet, wenn Hostingregion, AV-Vertrag, Backup, Logging, Aufbewahrung und Zugriffskontrollen geklaert sind.

PostgreSQL RLS kann spaeter als zusaetzliche Defense-in-Depth-Schicht eingesetzt werden; die Fachautorisierung bleibt trotzdem expliziter Anwendungscode.

## 9. Akzeptanzkern

Die erste fachliche Ausbauphase wird nicht nur nach Datenmodell-Abhaengigkeiten, sondern nach betrieblichem Nutzen priorisiert.

**Grundakzeptanz entsteht durch drei eng gekoppelte Bereiche:**

1. **People / Staff / Locations** als gemeinsame Referenzdaten.
2. **Inventarverwaltung** fuer reale Betriebsmittel, Standorte und Zuordnungen.
3. **Ticketsystem** fuer Stoerungen, Aufgaben und Anforderungen mit direkter Asset-Verknuepfung.

Damit kann die Centersoftware frueh einen vollstaendigen betrieblichen Ablauf abbilden:

```text
Mitarbeiter meldet Problem
  -> Ticket
  -> betroffenes Asset
  -> Standort / Verantwortlicher
  -> Bearbeitung + Kommentare + Historie
  -> Loesung
  -> Assethistorie bleibt erhalten
```

Appointments und Documents bleiben wichtige Kernmodule, sollen den ersten sichtbaren Nutzen von Ticketing und Inventar aber nicht blockieren.

## 10. Aktueller Stand und naechste technische Schritte

Bereits umgesetzt:

1. Neon/PostgreSQL-Foundation und produktive Initialmigration.
2. Better Auth mit Login/Logout und Session-Guard.
3. Initiales Center und Owner-Mitgliedschaft.
4. Serverseitige Permission-Pruefung.
5. Geplanter Datenbankausbau als separates Zielbild dokumentiert.
6. Ticketing- und Inventarmodell als Akzeptanzkern konkretisiert.

Naechste fachliche Reihenfolge:

1. **People / Staff / Locations – Minimum Core**
2. **Inventory – Minimum Viable Core**
3. **Tickets – Minimum Viable Core**
4. gemeinsame Ticket-/Asset-Oberflaechen und Suche
5. **Documents**
6. **Appointments**
7. Inventur, Wartung und weitere betriebliche Erweiterungen

Die ersten drei Schritte sollen bewusst nicht als isolierte Datenbankmigrationen enden, sondern jeweils bis zu einer nutzbaren UI vertikal umgesetzt werden.
