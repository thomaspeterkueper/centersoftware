import { redirect } from "next/navigation";
import { AuthForm } from "./auth-form";
import { getServerSession } from "@/lib/auth/session";

export default async function SignInPage() {
  const session = await getServerSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="shell auth-shell">
      <section className="auth-panel">
        <p className="eyebrow">CENTERSOFTWARE / ACCESS</p>
        <h1 className="auth-title">Anmelden</h1>
        <p className="lead auth-lead">
          Authentifizierung und Center-Berechtigungen sind getrennt. Nach der Anmeldung wird der
          Zugriff serverseitig gegen die Center-Rollen geprüft.
        </p>
        <AuthForm />
      </section>
    </main>
  );
}
