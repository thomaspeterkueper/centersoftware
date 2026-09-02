# Activity Ledger – Tätigkeits- und Arbeitszeit-Zielbild

## Status

**Planungsstand:** 2026-09-02  
**Priorität:** Akzeptanzkern / Ticket Core  
**Status:** [NEXT]

Die Centersoftware soll aus Ticketarbeit automatisch eine belastbare Tätigkeitschronik ableiten können. Ziel ist nicht nur zu wissen, **was mit einem Ticket passiert ist**, sondern zugleich beantworten zu können:

> **Wer hat von wann bis wann für wen oder woran was getan?**

Diese Information soll nicht doppelt gepflegt werden. Deshalb wird eine Ticket-Aktion nicht als isolierter Ticketeintrag und zusätzlich als unabhängige zweite Personen-Aktion gespeichert. Stattdessen gibt es eine **kanonische Activity**, die mit dem Ticket und den beteiligten Personen/Objekten verknüpft wird und dadurch in mehreren Sichten erscheint.

---

## 1. Drei unterschiedliche Dinge

Die Architektur unterscheidet bewusst zwischen:

### 1.1 `ticket_event`

Technische/fachliche Chronik eines Tickets, zum Beispiel:

- Status geändert
- Queue gewechselt
- Bearbeiter geändert
- Asset verknüpft
- Ticket geschlossen

Ein Event ist zunächst **kein Arbeitszeitnachweis**.

### 1.2 `ticket_action`

Eine konkrete menschliche Bearbeitung am Ticket, zum Beispiel:

- Fehler analysiert
- Rückruf durchgeführt
- Gerät geprüft
- Arbeitsplatz eingerichtet
- Berechtigung angepasst
- Ersatzgerät ausgegeben

Eine Ticket Action besitzt fachlichen Inhalt und kann eine Zeitspanne haben.

### 1.3 `activity`

Die centerweite Tätigkeitschronik. Eine Ticket Action erzeugt bzw. referenziert genau **eine** Activity. Dieselbe Activity ist damit:

- im Ticket als Bearbeitungsschritt sichtbar;
- beim handelnden Mitarbeiter als Tätigkeit sichtbar;
- optional bei Reporter/betroffener Person als Kontext sichtbar;
- mit Asset, Standort oder später anderen Fachobjekten verknüpfbar.

Damit gibt es **eine Wahrheit über Zeit und Tätigkeit**, aber mehrere fachliche Ansichten.

---

## 2. `app.activity` [NEXT]

Geplante Kernfelder:

- `id`
- `center_id`
- `activity_type_id` optional
- `summary`
- `description` optional
- `started_at`
- `ended_at` optional
- `performed_by_staff_id` optional
- `performed_by_user_id` optional
- `created_by_user_id`
- `source` (`manual`, `ticket_action`, später weitere definierte Quellen)
- `created_at`
- `updated_at`

### 2.1 Zeitmodell

`started_at` bezeichnet den fachlichen Beginn der Tätigkeit.

`ended_at` kann während einer laufenden Tätigkeit `NULL` sein. Nach Abschluss gilt:

```text
duration = ended_at - started_at
```

Die Dauer wird zunächst **nicht redundant als führender Wert gespeichert**. So vermeiden wir Inkonsistenzen zwischen Beginn, Ende und Dauer.

Für punktuelle Tätigkeiten darf Beginn und Ende identisch sein oder die Activity als nicht-dauerhafte Aktion gekennzeichnet werden. UI und Reporting müssen zwischen einer Arbeitszeitspanne und einem reinen Ereignis unterscheiden können.

### 2.2 Handelnde Person

Für echte Arbeitszeitauswertung ist `performed_by_staff_id` der primäre fachliche Akteur.

`performed_by_user_id` hält zusätzlich fest, welches Login die Aktion ausgeführt hat. Beide Werte sind nicht zwangsläufig identisch: Ein Benutzer kann beispielsweise im Auftrag eines Mitarbeiters erfassen.

---

## 3. Ticket Action ↔ Activity [NEXT]

### 3.1 `app.ticket_action`

Geplante Kernfelder:

- `id`
- `ticket_id`
- `activity_id` **unique**
- `action_type` bzw. `ticket_action_type_id`
- `result` optional
- `created_at`

Kardinalität:

```text
TICKET 1 --- n TICKET_ACTION 1 --- 1 ACTIVITY
```

Eine Ticket Action darf nicht zwei unabhängige Zeitdatensätze erzeugen.

### 3.2 Transaktionale Erstellung

Beim Speichern einer Ticket Action werden in **einer Datenbanktransaktion** mindestens angelegt:

1. `activity`
2. `ticket_action`
3. erforderliche Activity-Relationen
4. optionales `ticket_event`, wenn die Aktion zugleich Ticketzustand verändert

Scheitert ein Teil, wird die gesamte Änderung zurückgerollt. Dadurch kann niemals eine Ticket Action ohne Activity oder eine verwaiste Activity entstehen.

---

## 4. Reporter- und Personenbezug

Die Anforderung lautet, dass Ticketarbeit zugleich erkennen lässt, **was der Reporter bzw. eine beteiligte Person zu diesem Zeitpunkt getan hat oder in welchem Kontext sie stand**.

Dafür wird Activity nicht nur dem Ticket, sondern explizit Personenrollen zugeordnet.

### 4.1 `app.activity_person`

Geplante Relation:

- `activity_id`
- `person_id`
- `role`

Vorgesehene Rollen:

- `performed_by`
- `reporter`
- `requested_for`
- `beneficiary`
- später weitere klar definierte Rollen

Ein Beispiel:

```text
09:12–09:18  Anna Becker
              meldet Druckerproblem
              für: Bernd Müller
              Objekt: Drucker INV-00842
              Ticket: T-2026-000123
```

Dieselbe Activity kann damit in der persönlichen Chronik von Anna als `reporter`, im Ticket und bei Bernd als `requested_for` referenziert werden, ohne den Datensatz zu duplizieren.

### 4.2 Externe Drittperson

Eine externe Drittperson ohne `app.person` bleibt über `app.ticket_reporter` dokumentiert.

Für sie wird kein künstlicher dauerhafter Personenstammsatz erzeugt. Die Activity kann zusätzlich über eine explizite Relation wie `app.activity_ticket_reporter` auf diesen Reporter-Snapshot verweisen.

Damit bleibt auch bei externen Meldungen nachvollziehbar, wer die Meldung ausgelöst hat, ohne Personendaten unnötig dauerhaft zu vervielfachen.

---

## 5. Objekt- und Zweckbezug

Eine Activity soll nicht nur beantworten **wer** und **wann**, sondern auch **für wen oder was**.

Kernbeziehungen werden ausdrücklich relational modelliert und nicht als freies `entity_type/entity_id`-Paar.

Vorgesehen:

- `app.activity_ticket`
- `app.activity_person`
- `app.activity_asset`
- später bei Bedarf `app.activity_appointment`
- später bei Bedarf `app.activity_document`

Beispiel:

```text
14:05–14:42
Mitarbeiter: Max Beispiel
Tätigkeit: Notebook neu eingerichtet
für Person: Erika Muster
Ticket: T-2026-000781
Asset: INV-001943
```

Damit kann die gleiche Tätigkeit aus Sicht des Mitarbeiters, des Tickets, der Person und des Assets angezeigt werden.

---

## 6. Automatische Activity beim Ticket

### 6.1 Ticketanlage

Bei der Ticketanlage wird mindestens ein Ticket-Event erzeugt. Zusätzlich kann eine Activity erzeugt werden, wenn die Anlage selbst als menschliche Tätigkeit relevant ist.

Wenn der Reporter eine bekannte Person ist, erhält die Activity den Rollenbezug `reporter`.

Beispiel:

```text
08:41  Frau A meldet für Herrn B eine Störung an INV-0042.
```

Diese Activity ist ein Kontext-/Tätigkeitshinweis. Sie ist nicht automatisch abrechenbare oder produktive Arbeitszeit.

### 6.2 Ticketbearbeitung

Jede echte Ticket Action erzeugt zwingend eine Activity.

Beispiele:

```text
09:00–09:17  Diagnose durchgeführt
09:17–09:24  Rücksprache mit Reporter
10:05–10:28  Ersatzgerät eingerichtet
10:31–10:35  Übergabe an betroffene Person
```

So entsteht ohne separate Zeiterfassung bereits eine fachlich aussagekräftige Tätigkeitschronik.

---

## 7. Keine automatische Gleichsetzung mit Arbeitszeitabrechnung

Activity liefert zunächst eine **operative Tätigkeitsdokumentation**.

Sie darf nicht ohne weitere Regeln automatisch gleichgesetzt werden mit:

- gesetzlicher Arbeitszeiterfassung;
- Lohnabrechnung;
- abrechenbarer Kundenzeit;
- SLA-Zeit;
- Anwesenheitszeit.

Später können dafür explizite Klassifikationen ergänzt werden, beispielsweise:

- `counts_as_work_time`
- `billable`
- `billing_category`
- `time_source`

Diese Felder werden erst kanonisch, wenn die tatsächlichen organisatorischen und rechtlichen Anforderungen feststehen.

---

## 8. Korrekturen und Nachvollziehbarkeit

Zeitangaben können falsch erfasst werden. Deshalb dürfen Korrekturen möglich sein, müssen aber nachvollziehbar bleiben.

Vorgesehen:

- ursprüngliche Activity bleibt über Audit/Event nachvollziehbar;
- Beginn/Ende dürfen mit entsprechender Berechtigung korrigiert werden;
- `updated_at` und Änderungsakteur werden gespeichert;
- kritische Korrekturen können einen `activity_event` bzw. Audit-Eintrag erzeugen.

Eine heimliche Überschreibung historischer Arbeitsdaten ist nicht vorgesehen.

---

## 9. Laufende Tätigkeiten

Für eine spätere komfortable UI ist eine laufende Activity zulässig:

```text
started_at = 14:03
ended_at   = NULL
```

Der Benutzer kann dann beispielsweise im Ticket auf **Bearbeitung starten** und später **Bearbeitung beenden** klicken.

Wichtige Regel: Mehrere parallele offene Activities desselben Mitarbeiters werden zunächst nicht hart in der Datenbank verboten, aber die Anwendung soll davor warnen. Reale Arbeit kann sich überschneiden; die Datenbank sollte daher keine fachlich falsche Exklusivität erzwingen.

---

## 10. Persönliche Tätigkeitschronik

Aus dem Activity-Modell kann ohne zusätzliches zweites Zeiterfassungssystem eine Tagesansicht entstehen:

```text
MAX BEISPIEL – 02.09.2026

08:10–08:22  Ticket T-2026-00102 · Drucker geprüft
              für: Empfang · Asset INV-0842

08:35–09:05  Ticket T-2026-00104 · Notebook eingerichtet
              für: Erika Muster · Asset INV-1931

09:12–09:18  Rückruf zu Ticket T-2026-00102
              Reporter: Anna Becker
```

Das erfüllt die Kernfrage:

> **Von wann bis wann hat wer für wen oder was gearbeitet?**

---

## 11. Reporting-Potenzial

Das Modell erlaubt später unter anderem:

- Tätigkeiten je Mitarbeiter und Zeitraum
- Zeit je Ticket
- Zeit je Queue/Abteilung
- Zeit je Asset
- Zeit für eine Person / Organisationseinheit
- Anzahl und Dauer von Ticket Actions
- Zeit zwischen Reporter-Meldung und erster Bearbeitung
- Anteil dokumentierter vs. nicht zeitlich erfasster Tätigkeiten

Diese Auswertungen entstehen aus denselben operativen Datensätzen und nicht aus einer parallel gepflegten Statistik.

---

## 12. Konsequenz für den Ticket Minimum Viable Core

Der Ticket Core wird erweitert um:

1. `app.activity`
2. `app.ticket_action`
3. `app.activity_ticket`
4. `app.activity_person`
5. `app.activity_asset`
6. bei externem Reporter eine explizite Reporter-Relation
7. Start-/Endzeit für echte Bearbeitungsschritte
8. Anzeige derselben Activity im Ticket und in der persönlichen Tätigkeitschronik

Damit wird **Activity** zu einer gemeinsamen fachlichen Infrastruktur der Centersoftware und nicht zu einer Sonderfunktion nur des Ticketsystems.
