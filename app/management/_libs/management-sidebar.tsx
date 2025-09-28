"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Box,
  MapPin,
  Settings,
  Briefcase,
  Users,
  Archive,
  Wrench,
} from "lucide-react";
import { CompanyNameHeader } from "@/app/management/_libs/company-name-header";
import React from "react";

type NavItem = {
  label: string;
  href: string;
  icon: string; // lucide icon name
};

const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  "layout-dashboard": LayoutDashboard,
  package: Package,
  box: Box,
  "map-pin": MapPin,
  briefcase: Briefcase,
  users: Users,
  archive: Archive,
  settings: Settings,
  wrench: Wrench,
};

export function Sidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <CompanyNameHeader />

      <nav className="flex-1 overflow-y-auto p-2">
        <div className="px-2 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Main</div>
        <div className="space-y-1">
          {items.map((item) => {
            const Icon = iconMap[item.icon] ?? Box;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "mx-2 flex items-center gap-2 rounded-md px-2 py-2 text-sm",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t p-3 text-xs text-muted-foreground">
        <div>v0.1 • Local</div>
      </div>
    </div>
  );
}
