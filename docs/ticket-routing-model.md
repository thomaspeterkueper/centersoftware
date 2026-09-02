# Ticketgeber, Abteilungen und Ticket-Pools – Routing-Zielbild

## Status

**Planungsstand:** 2026-09-02  
**Prioritaet:** Akzeptanzkern / Ticket Core  
**Status:** [NEXT]

Dieses Dokument praezisiert die Ticketarchitektur der Centersoftware in zwei fuer den Alltag wesentlichen Punkten:

1. **Ticketgeber und betroffene Person sind nicht dasselbe.** Ein Ticket kann fuer eine andere Person gemeldet werden.
2. **Abteilungstickets landen zuerst in einem Pool.** Sie muessen nicht bereits bei Erstellung einer einzelnen Mitarbeiterin oder einem einzelnen Mitarbeiter zugewiesen sein.

Diese Regeln sind Bestandteil des Ticket Minimum Viable Core und keine spaetere Komfortfunktion.

---

## 1. Beteiligte Rollen an einem Ticket

Ein Ticket benoetigt mindestens drei voneinander getrennte Rollenbegriffe:

### 1.1 Erstellender Benutzer

`created_by_user_id` bezeichnet das technische Login, das den Datensatz in der Centersoftware angelegt hat.

Beispiel: Eine Mitarbeiterin am Empfang nimmt einen telefonischen Hinweis entgegen und erfasst ihn im System. Sie ist der **erstellende Benutzer**, aber nicht automatisch die Ticketgeberin und nicht automatisch die betroffene Person.

### 1.2 Ticketgeber / meldende Person

Der Ticketgeber ist die Person, von der die Meldung fachlich stammt. Diese Person kann:

- der betroffene Mitarbeiter selbst sein;
- ein anderer Mitarbeiter sein;
- eine andere im Center bekannte Person sein;
- eine externe bzw. dritte Person ohne Login sein.

Daher darf `auth.user` nicht als Ticketgebermodell verwendet werden.

Vorgesehen ist `app.ticket_reporter` als eigener, ticketbezogener Datensatz.

Geplante Felder:

- `id`
- `ticket_id`
- `person_id` optional
- `name_snapshot` optional
- `email_snapshot` optional
- `phone_snapshot` optional
- `organization_snapshot` optional
- `reporting_channel` optional
- `created_at`

Wenn die meldende Person bereits als `app.person` existiert, wird `person_id` verwendet. Fuer eine einmalige externe Meldung darf ein minimaler Reporter-Snapshot gespeichert werden, ohne deshalb zwangsweise einen dauerhaften Personenstammsatz anzulegen.

Der Snapshot ist absichtlich ticketbezogen: Er dokumentiert, wer bei der Meldung als Ansprechpartner angegeben wurde, auch wenn sich spaeter Stammdaten aendern.

### 1.3 Betroffene bzw. beguenstigte Person

Das Ticket kann fuer eine andere Person erstellt worden sein. Dafuer ist am Ticket ein eigener Bezug vorgesehen:

- `requested_for_person_id` optional

Beispiele:

```text
Mitarbeiter A meldet: Drucker von Mitarbeiter B funktioniert nicht.

created_by_user      = A, falls A selbst eingeloggt erfasst
reporter             = A
requested_for_person = B
asset                = Drucker B
```

oder:

```text
Externer Anrufer meldet eine Stoerung fuer Mitarbeiter B.

created_by_user      = Empfang / Service Desk
reporter             = externe Drittperson
requested_for_person = B
```

Damit bleibt eindeutig, **wer gemeldet hat**, **wer das Ticket technisch erfasst hat** und **fuer wen das Ticket bearbeitet wird**.

---

## 2. Abteilungen [NEXT]

Fuer Ticket-Pools braucht die Centersoftware eine stabile organisatorische Abteilungsstruktur.

### 2.1 `app.department`

Geplante Kernfelder:

- `id`
- `center_id`
- `parent_department_id` optional
- `code` optional
- `name`
- `status`
- `created_at`
- `updated_at`

Abteilungen koennen hierarchisch sein, muessen es aber nicht.

Beispiel:

```text
Center
  -> Verwaltung
  -> IT
       -> Infrastruktur
       -> Anwendungen
  -> Haustechnik
```

### 2.2 `app.staff_department`

Mitarbeiter und Abteilung werden nicht als starre 1:n-Beziehung modelliert. Ein Mitarbeiter kann mehreren organisatorischen Einheiten zugeordnet sein.

Geplante Relation:

- `staff_id`
- `department_id`
- `is_primary`
- optional Funktion/Rolle innerhalb der Abteilung
- `valid_from` optional
- `valid_until` optional

Damit bleibt auch eine spaetere Matrixorganisation moeglich.

---

## 3. Ticket-Pool / Queue [NEXT]

### 3.1 Warum der Pool eine eigene Entitaet ist

Ein Ticket soll nicht zwingend sofort einer konkreten Person zugewiesen werden.

Beispiel:

```text
Ticket -> Pool "IT Service"
              |
              +-> noch unzugewiesen
              +-> sichtbar fuer berechtigte Pool-Mitglieder
              +-> wird spaeter von Mitarbeiter X uebernommen
```

Der Pool ist **nicht identisch mit der Abteilung**. Eine Abteilung kann mehrere Pools besitzen, z. B.:

```text
IT
  -> IT Service
  -> Anwendungen
  -> Infrastruktur
```

Dadurch vermeiden wir spaeter einen Schemaumbau, wenn eine Abteilung unterschiedliche Eingangskanaele oder Verantwortungsbereiche braucht.

### 3.2 `app.ticket_queue`

Geplante Kernfelder:

- `id`
- `center_id`
- `department_id` optional
- `key`
- `name`
- `description` optional
- `is_default` optional
- `status`
- `created_at`
- `updated_at`

Die Kombination `(center_id, key)` muss eindeutig sein.

Eine Queue darf spaeter auch ohne feste Abteilung existieren, beispielsweise als centerweiter Eingangspool oder bereichsuebergreifende Queue.

### 3.3 Queue-Bezug am Ticket

`app.ticket` erhaelt:

- `queue_id`
- `assigned_staff_id` optional

Fachliche Regel:

> **Queue und persoenliche Zuweisung sind zwei getrennte Dimensionen.**

Ein Ticket bleibt einem Pool zugeordnet, auch wenn ein Mitarbeiter es uebernimmt. Dadurch bleiben Listen, Kennzahlen, Vertretung und Rueckgabe in den Pool sauber moeglich.

Beispiel:

```text
queue_id          = IT Service
assigned_staff_id = NULL
```

bedeutet: im IT-Pool, noch von niemandem uebernommen.

```text
queue_id          = IT Service
assigned_staff_id = Mitarbeiter X
```

bedeutet: weiterhin IT-Service-Ticket, aktuell von X bearbeitet.

---

## 4. Routing und Uebernahme

Der minimale Workflow lautet:

```text
Ticket erfassen
   -> Zielabteilung / Queue bestimmen
   -> Ticket erscheint im Pool
   -> berechtigter Mitarbeiter sieht es
   -> Mitarbeiter uebernimmt Ticket
   -> Bearbeitung
   -> ggf. Rueckgabe oder Transfer in anderen Pool
   -> Loesung / Abschluss
```

### 4.1 Unzugewiesene Tickets sind ein Normalzustand

`assigned_staff_id = NULL` ist kein Fehlerzustand. Solange `queue_id` gesetzt ist, befindet sich das Ticket regulär im Arbeitsvorrat des Pools.

### 4.2 Poolwechsel

Ein Ticket kann zwischen Pools transferiert werden, zum Beispiel:

```text
IT Service -> Infrastruktur
```

Der Poolwechsel wird als `ticket_event` dokumentiert. Dadurch kann spaeter nachvollzogen werden, wie lange ein Ticket in welchem Verantwortungsbereich lag.

### 4.3 Persoenliche Uebernahme

Eine Uebernahme bzw. Zuweisung veraendert `assigned_staff_id`, nicht automatisch `queue_id`.

Auch diese Aenderung wird als Ticket-Event protokolliert.

---

## 5. Pool-Sichtbarkeit und Berechtigungen

In der ersten Version soll ein Benutzer Tickets eines Pools sehen koennen, wenn seine Center-Mitgliedschaft und fachliche Rolle dies erlauben und er dem entsprechenden organisatorischen Bereich zugeordnet ist.

Die genaue Berechtigungsregel wird vor der Migration festgelegt. Architekturziel ist jedoch:

- keine clientseitige Sicherheitsentscheidung;
- `center_id` bleibt die harte Mandantengrenze;
- Queue-/Abteilungszugriff wird serverseitig geprueft;
- Owner/Admin duerfen je nach Permission centerweit arbeiten;
- normale Staff-Benutzer erhalten den fuer ihre Arbeitsbereiche vorgesehenen Poolzugriff.

Falls spaeter Pool-Mitglieder von der Abteilungszugehoerigkeit abweichen muessen, kann eine explizite `ticket_queue_member`-Relation ergaenzt werden, ohne das Ticketmodell zu veraendern.

---

## 6. Suche und Arbeitslisten

Fuer den Akzeptanzkern sind mindestens folgende Pool-Ansichten erforderlich:

- meine Tickets
- unzugewiesene Tickets meines Pools
- alle offenen Tickets meines Pools
- nach Prioritaet
- nach Status
- nach Ticketgeber
- nach betroffener Person
- nach Asset
- ueberfaellige Tickets spaeter nach Frist/SLA

Eine typische operative Startseite kann daher beispielsweise zeigen:

```text
IT SERVICE
  12 unzugewiesen
   8 in Bearbeitung
   2 hohe Prioritaet
```

---

## 7. Kennzahlen

Das Modell soll spaeter ohne Rekonstruktion aus Freitexten unter anderem liefern koennen:

- offene Tickets je Pool
- unzugewiesene Tickets je Pool
- Tickets je Abteilung
- durchschnittliche Zeit bis zur ersten Uebernahme
- Bearbeitungszeit je Pool
- Anzahl Poolwechsel
- Tickets je Bearbeiter
- Tickets fuer Drittpersonen / im Auftrag anderer

Queue-Wechsel und persoenliche Zuweisungen gehoeren deshalb in die fachliche Ticketchronik.

---

## 8. Konsequenz fuer den Minimum Viable Ticket Core

Der erste ernsthaft nutzbare Ticketumfang umfasst damit mindestens:

1. Ticket fuer sich selbst oder eine andere Person erstellen.
2. Drittperson als Ticketgeber erfassen koennen.
3. Ticketgeber und betroffene Person getrennt anzeigen.
4. Ticket an eine Queue bzw. einen Abteilungspool routen.
5. Unzugewiesene Tickets im Pool anzeigen.
6. Ticket aus dem Pool uebernehmen bzw. einem Mitarbeiter zuweisen.
7. Ticket in einen anderen Pool transferieren.
8. Queue- und Assignment-Wechsel in der Chronik anzeigen.
9. Nach Pool, Ticketgeber, betroffener Person, Bearbeiter, Status und Prioritaet filtern.
10. Die bereits geplante Asset-Verknuepfung parallel nutzen.

Damit ist der Pool kein spaeteres Team-Feature mehr, sondern Bestandteil der ersten Ticketmigration.
