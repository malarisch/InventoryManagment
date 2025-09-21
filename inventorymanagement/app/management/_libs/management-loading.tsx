import { Loader2 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

export type ManagementListLoadingProps = {
  heading: string;
  hint?: string;
  showActionButton?: boolean;
  rows?: number;
};

export function ManagementListLoading({
  heading,
  hint = "Übersicht lädt …",
  showActionButton = true,
  rows = 6,
}: ManagementListLoadingProps) {
  return (
    <main className="min-h-screen w-full flex flex-col items-center p-5">
      <div className="w-full max-w-5xl flex-1 flex flex-col gap-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{heading}</h1>
            <p className="text-sm text-muted-foreground">{hint}</p>
          </div>
          {showActionButton ? <Skeleton className="h-9 w-28" aria-hidden="true" /> : null}
        </div>
        <div className="rounded-lg border border-border/60 bg-card/40 p-6">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
            <p className="text-sm">Daten werden geladen …</p>
          </div>
          <div className="mt-6 space-y-3">
            {Array.from({ length: rows }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" aria-hidden="true" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export type ManagementDetailLoadingProps = {
  heading: string;
  hint?: string;
  showPrimaryAction?: boolean;
  sections?: number;
};

export function ManagementDetailLoading({
  heading,
  hint = "Formular wird geladen …",
  showPrimaryAction = true,
  sections = 3,
}: ManagementDetailLoadingProps) {
  return (
    <main className="min-h-screen w-full flex flex-col items-center p-5">
      <div className="w-full max-w-5xl flex-1 flex flex-col gap-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{heading}</h1>
            <p className="text-sm text-muted-foreground">{hint}</p>
          </div>
          {showPrimaryAction ? <Skeleton className="h-9 w-32" aria-hidden="true" /> : null}
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            {Array.from({ length: sections }).map((_, index) => (
              <Skeleton key={index} className="h-28 w-full" aria-hidden="true" />
            ))}
          </div>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" aria-hidden="true" />
            <Skeleton className="h-32 w-full" aria-hidden="true" />
          </div>
        </div>
      </div>
    </main>
  );
}

export function ManagementDashboardLoading() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Überblick über kommende Einsätze und die letzten Änderungen deiner Companies.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full" aria-hidden="true" />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-80 w-full lg:col-span-2" aria-hidden="true" />
        <Skeleton className="h-80 w-full" aria-hidden="true" />
      </div>

      <Skeleton className="h-80 w-full" aria-hidden="true" />
    </div>
  );
}

export type ManagementFormLoadingProps = {
  showBackLink?: boolean;
  backLinkWidthClass?: string;
  titleWidthClass?: string;
  fieldRows?: number;
  actions?: number;
};

export function ManagementFormLoading({
  showBackLink = true,
  backLinkWidthClass = "w-40",
  titleWidthClass = "w-48",
  fieldRows = 6,
  actions = 2,
}: ManagementFormLoadingProps) {
  return (
    <main className="min-h-screen w-full flex flex-col items-center p-5">
      <div className="w-full max-w-3xl flex-1 space-y-4">
        {showBackLink ? <Skeleton className={`h-4 ${backLinkWidthClass}`} aria-hidden="true" /> : null}
        <div className="space-y-4 rounded-lg border border-border/60 bg-card/40 p-6">
          <Skeleton className={`h-6 ${titleWidthClass}`} aria-hidden="true" />
          <div className="space-y-3 pt-2">
            {Array.from({ length: fieldRows }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" aria-hidden="true" />
            ))}
          </div>
          <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
            {Array.from({ length: actions }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-24" aria-hidden="true" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
