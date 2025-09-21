"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/error-state";

export default function GlobalRootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="de">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-background p-4">
          <ErrorState
            title="Schwerer Fehler"
            description={error.message || "Bitte lade die Seite neu."}
            retryLabel="Zurück"
            onRetry={reset}
          />
        </main>
      </body>
    </html>
  );
}
