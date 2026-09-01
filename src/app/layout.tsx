import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Centersoftware",
  description: "Neue modulare Centersoftware auf PostgreSQL-Basis",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
