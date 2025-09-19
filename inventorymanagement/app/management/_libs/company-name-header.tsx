"use client"

import { useCompany } from "@/app/management/_libs/companyHook";

export function CompanyNameHeader() {
  const { company } = useCompany();

  return (
    <div className="flex h-14 items-center gap-2 border-b px-4">
      <div className="h-6 w-6 rounded-sm bg-emerald-500" />
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-semibold">{company?.name ?? "—"}</span>
        <span className="text-xs text-muted-foreground">{company?.description ?? ""}</span>
      </div>
    </div>
  );
}
