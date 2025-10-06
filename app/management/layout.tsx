import type { Metadata } from "next";
import { ManagementShell } from "@/app/management/_libs/management-shell";

export const metadata: Metadata = {
  title: "Management | Inventory",
};

type NavItem = {
  label: string;
  href: string;
  icon: string; // lucide icon name (used client-side)
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/management", icon: "layout-dashboard" },
  { label: "Scanner", href: "/management/scanner", icon: "scan" },
  { label: "Equipments", href: "/management/equipments", icon: "package" },
  { label: "Articles", href: "/management/articles", icon: "box" },
  { label: "Locations", href: "/management/locations", icon: "map-pin" },
  { label: "Contacts", href: "/management/contacts", icon: "users" },
  { label: "Cases", href: "/management/cases", icon: "archive" },
  { label: "Jobs", href: "/management/jobs", icon: "briefcase" },
  { label: "Workshop", href: "/management/workshop", icon: "wrench" },
  { label: "Asset Tags", href: "/management/asset-tags", icon: "tag" },
  { label: "Settings", href: "/management/company-settings", icon: "settings" },
  { label: "Asset Tag Templates", href: "/management/asset-tag-templates/new", icon: "file-plus" },
];

export default function ManagementLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ManagementShell items={navItems}>{children}</ManagementShell>;
}
