# Vercel-Umgebungsvariablen

Die Centersoftware benoetigt fuer einen produktiven Vercel-Deploy zwei zwingende Secrets und einige optionale Bootstrap-Werte.

## Zwingend

- `DATABASE_URL`: PostgreSQL-Connection-String der produktiven Neon-Datenbank.
- `BETTER_AUTH_SECRET`: stabiler, zufaelliger Better-Auth-Schluessel mit mindestens 32 Zeichen.

Diese Werte duerfen nie ins Repository committed werden.

## Automatisch bzw. optional

- `BETTER_AUTH_URL`: kann explizit gesetzt werden. Wenn leer oder nicht vorhanden, verwendet die Anwendung auf Vercel zuerst `VERCEL_PROJECT_PRODUCTION_URL`, danach `VERCEL_URL`; lokal faellt sie auf `http://localhost:3000` zurueck.
- `INITIAL_OWNER_EMAIL`: optional. Wenn gesetzt, darf dieses Konto beim ersten Login das Initial-Center als Owner bootstrapen.
- `INITIAL_CENTER_CODE`: optional; leer/nicht gesetzt => `main`.
- `INITIAL_CENTER_NAME`: optional; leer/nicht gesetzt => `Centersoftware`.

## Zielumgebungen

`DATABASE_URL` und `BETTER_AUTH_SECRET` muessen mindestens fuer **Production** gesetzt sein. Fuer Preview-Deployments sollten eigene, nicht-produktive Werte verwendet werden; insbesondere darf ein Preview-Deployment nicht versehentlich gegen die Produktionsdatenbank arbeiten.

## Sicherheitsregel

GitHub Actions und Vercel verwalten Secrets getrennt. Ein GitHub Actions Secret wird nicht automatisch zu einer Vercel Environment Variable. Dieselbe Datenbank-URL muss daher, falls gewollt, separat in Vercel hinterlegt werden.
