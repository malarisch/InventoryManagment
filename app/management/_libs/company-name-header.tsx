"use client"

import Image from "next/image";
import { useCompany } from "@/app/management/_libs/companyHook";
import { getCompanyLogo } from "@/lib/company-logo";

export function CompanyNameHeader() {
  const { company } = useCompany();
  const logoUrl = company ? getCompanyLogo(company) : null;

  return (
    <div className="flex h-14 items-center gap-2 border-b px-4">
      {logoUrl ? (
        <div className="relative h-6 w-6 rounded-sm overflow-hidden">
          <Image 
            src={logoUrl} 
            alt={`${company?.name ?? "Company"} Logo`} 
            fill
            className="object-cover"
            sizes="24px"
          />
        </div>
      ) : (
        <div className="h-6 w-6 rounded-sm bg-emerald-500" />
      )}
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-semibold">{company?.name ?? "—"}</span>
        <span className="text-xs text-muted-foreground">{company?.description ?? ""}</span>
      </div>
    </div>
  );
}
