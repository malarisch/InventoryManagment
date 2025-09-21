"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/error-state";

export default function ManagementGlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="de">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-background p-6">
          <ErrorState
            title="Verwaltung nicht verfügbar"
            description={error.message || "Bitte versuche es erneut."}
            retryLabel="Neu laden"
            onRetry={reset}
          />
        </main>
      </body>
    </html>
  );
}
