import Link from "next/link";

const foundation = [
  ["Datenbank", "PostgreSQL auf Neon"],
  ["ORM", "Drizzle + versionierte Migrationen"],
  ["Authentifizierung", "Better Auth im eigenen PostgreSQL-Schema"],
  ["Autorisierung", "Centerbezogene Rollen und Berechtigungen"],
  ["Validierung", "Zod"],
  ["Deployment", "Vercel als initiales Ziel"],
];

export default function Home() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">FOUNDATION / 0.2</p>
        <h1>Centersoftware</h1>
        <p className="lead">
          Neu aufgebaut als portable, PostgreSQL-zentrierte Anwendung. Neon liefert die
          Infrastruktur; Datenmodell, Authentifizierung und Fachlogik bleiben unter unserer
          Kontrolle.
        </p>
        <div className="actions">
          <Link className="button primary" href="/sign-in">
            Anmelden
          </Link>
          <Link className="button" href="/dashboard">
            Dashboard
          </Link>
        </div>
      </section>

      <section className="grid" aria-label="Technische Grundlage">
        {foundation.map(([label, value]) => (
          <article className="card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <section className="principle">
        <h2>Architekturregel</h2>
        <p>
          Better Auth stellt fest, wer angemeldet ist. Die Centersoftware entscheidet separat,
          auf welches Center und welche Funktionen diese Person zugreifen darf.
        </p>
      </section>
    </main>
  );
}
