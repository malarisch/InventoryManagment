"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/error-state";

export default function ManagementError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] w-full items-center justify-center p-6">
      <ErrorState
        title="Verwaltungsbereich nicht erreichbar"
        description={error.message || "Bitte aktualisiere oder versuche es später erneut."}
        retryLabel="Erneut laden"
        onRetry={reset}
      />
    </main>
  );
}
