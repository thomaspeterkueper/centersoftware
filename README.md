# Centersoftware

Neubau der Centersoftware mit einer portablen, PostgreSQL-zentrierten Architektur.

## Architektur

- Next.js (App Router) + TypeScript
- PostgreSQL auf Neon
- Drizzle ORM + SQL-Migrationen im Repository
- Better Auth fuer Authentifizierung
- Eigene Rollen- und Berechtigungslogik fuer Autorisierung
- Zod fuer Eingabevalidierung
- Vercel als initiales Deployment-Ziel

Neon ist bewusst nur Infrastruktur. Fachlogik, Datenmodell und Berechtigungen bleiben im Repository und sollen ohne grundlegenden Umbau auf eine andere PostgreSQL-Infrastruktur migrierbar sein.

## Erste Schritte

1. Repository klonen.
2. `npm install` ausfuehren.
3. `.env.example` nach `.env.local` kopieren.
4. Neon-Projekt anlegen und `DATABASE_URL` setzen.
5. Einen langen zufaelligen Wert fuer `BETTER_AUTH_SECRET` setzen.
6. `npm run db:generate` und danach `npm run db:migrate` ausfuehren.
7. `npm run dev` starten.

## Architekturregel

Authentifizierung und Autorisierung werden getrennt behandelt:

- Better Auth beantwortet: Wer ist angemeldet?
- Die Centersoftware beantwortet: Auf welches Center und welche Funktionen darf diese Person zugreifen?

Siehe `docs/architecture.md` fuer die grundlegenden Architekturentscheidungen.
