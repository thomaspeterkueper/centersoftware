"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type Mode = "sign-in" | "sign-up";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const result =
        mode === "sign-in"
          ? await authClient.signIn.email({ email, password })
          : await authClient.signUp.email({ name, email, password });

      if (result.error) {
        setError(result.error.message ?? "Anmeldung fehlgeschlagen.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Die Anmeldung konnte nicht abgeschlossen werden.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      {mode === "sign-up" ? (
        <label>
          Name
          <input
            autoComplete="name"
            minLength={2}
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
        </label>
      ) : null}

      <label>
        E-Mail
        <input
          autoComplete="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </label>

      <label>
        Passwort
        <input
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          minLength={8}
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <button className="button primary" disabled={pending} type="submit">
        {pending ? "Bitte warten …" : mode === "sign-in" ? "Anmelden" : "Initialkonto anlegen"}
      </button>

      <button
        className="text-button"
        onClick={() => {
          setMode(mode === "sign-in" ? "sign-up" : "sign-in");
          setError(null);
        }}
        type="button"
      >
        {mode === "sign-in"
          ? "Initiales Owner-Konto anlegen"
          : "Zurück zur Anmeldung"}
      </button>

      {mode === "sign-up" ? (
        <p className="form-hint">
          In dieser Aufbauphase akzeptiert die Registrierung ausschließlich die serverseitig
          konfigurierte Initial-Owner-Adresse.
        </p>
      ) : null}
    </form>
  );
}
