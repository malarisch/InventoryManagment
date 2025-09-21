"use client";

import { Button } from "@/components/ui/button";

export function ErrorState({
  title = "Etwas ist schiefgelaufen",
  description,
  retryLabel = "Erneut versuchen",
  onRetry,
}: {
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border bg-card p-6 text-center shadow-sm">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {onRetry ? (
        <Button type="button" onClick={onRetry}>{retryLabel}</Button>
      ) : null}
    </div>
  );
}
