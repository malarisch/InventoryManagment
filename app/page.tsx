import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";

/**
 * Public Supabase environment variables required for a functional local setup.
 */
const REQUIRED_ENV_VARS = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const;

/**
 * Landing page for the application. When Supabase credentials are configured,
 * the user is forwarded straight to the management dashboard or login screen.
 * Otherwise we render setup instructions so local developers know what to do.
 */
export default async function HomePage() {
  if (!hasEnvVars) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
        <div className="mx-auto w-full max-w-xl space-y-6 text-center">
          <h1 className="text-3xl font-semibold">Supabase-Konfiguration benötigt</h1>
          <p className="text-muted-foreground">
            Lege eine `.env.local` im Verzeichnis `inventorymanagement/` an und setze folgende Variablen:
          </p>
          <ul className="space-y-3 rounded-md border border-dashed border-foreground/20 bg-muted/30 p-4 text-left text-sm">
            {REQUIRED_ENV_VARS.map((name) => (
              <li key={name}>
                <code className="rounded bg-background/80 px-2 py-1 text-xs font-semibold">{name}</code>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            Du findest die Werte im Supabase Dashboard unter <strong>Project Settings &rarr; API</strong>. Anschließend
            starte den Dev-Server neu.
          </p>
          <div className="flex items-center justify-center gap-3 text-sm">
            <a
              className="underline"
              href="https://supabase.com/docs/guides/getting-started/quickstarts/nextjs"
              target="_blank"
              rel="noreferrer"
            >
              Supabase Next.js Quickstart
            </a>
            <span aria-hidden="true">&bull;</span>
            <Link className="underline" href="/management">
              Management Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/management" : "/auth/login");
  return null;
}
