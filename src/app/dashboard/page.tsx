import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { getServerSession } from "@/lib/auth/session";
import { ensureInitialOwner } from "@/lib/authorization/bootstrap";
import { hasPermissionForUser, listUserCenters } from "@/lib/authorization/access";

export default async function DashboardPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in");
  }

  await ensureInitialOwner({
    id: session.user.id,
    email: session.user.email,
  });

  const centerRows = await listUserCenters(session.user.id);
  const centers = Array.from(
    new Map(centerRows.map((center) => [center.id, center])).values(),
  );

  const centerAccess = await Promise.all(
    centers.map(async (center) => ({
      ...center,
      canRead: await hasPermissionForUser(session.user.id, center.id, "center.read"),
    })),
  );

  return (
    <main className="shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">CENTERSOFTWARE / SESSION</p>
          <h1 className="dashboard-title">{session.user.name}</h1>
          <p className="lead dashboard-lead">{session.user.email}</p>
        </div>
        <SignOutButton />
      </section>

      <section className="principle">
        <h2>Centerzugriff</h2>
        {centerAccess.length === 0 ? (
          <p>
            Dieses Konto ist noch keinem Center zugeordnet. Für das Initial-Owner-Konto wird die
            Zuordnung automatisch erstellt, sobald die konfigurierte E-Mail-Adresse übereinstimmt.
          </p>
        ) : (
          <div className="center-list">
            {centerAccess.map((center) => (
              <article className="center-row" key={center.id}>
                <div>
                  <strong>{center.name}</strong>
                  <span>{center.code}</span>
                </div>
                <span className={center.canRead ? "status-ok" : "status-denied"}>
                  {center.canRead ? "center.read ✓" : "kein Lesezugriff"}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
