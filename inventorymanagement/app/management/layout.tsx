import type { Metadata } from "next";
import { Sidebar } from "@/components/app/management-sidebar";
import { Header } from "@/components/app/management-header";

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
  { label: "Equipments", href: "/management/equipments", icon: "package" },
  { label: "Articles", href: "/management/articles", icon: "box" },
  { label: "Locations", href: "/management/locations", icon: "map-pin" },
  { label: "Settings", href: "/management/settings", icon: "settings" },
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

