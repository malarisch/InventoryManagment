import type { Metadata } from "next";
import { Sidebar } from "@/app/management/_libs/management-sidebar";
import { Header } from "@/app/management/_libs/management-header";

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
  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="hidden md:fixed md:inset-y-0 md:z-20 md:flex md:w-64 md:flex-col border-r bg-background">
        <Sidebar items={navItems} />
      </aside>

      <div className="md:pl-64">
        <Header items={navItems} />
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
