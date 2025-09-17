"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  Menu,
  Search,
  Bell,
  User,
  X,
  LayoutDashboard,
  Package,
  Box,
  MapPin,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  icon: string; // lucide icon name
};

const iconMap: Record<string, React.ComponentType<any>> = {
  "layout-dashboard": LayoutDashboard,
  package: Package,
  box: Box,
  "map-pin": MapPin,
  settings: Settings,
};

export function Header({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-3 px-3 md:px-5">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open navigation"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="hidden sm:inline">Inventory</span>
          <span className="hidden sm:inline">/</span>
          <span className="font-medium text-foreground">Management</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="w-[180px] pl-8"
                placeholder="Search…"
                aria-label="Search"
              />
            </div>
          </div>
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex" aria-label="Notifications">
            <Bell className="h-5 w-5 text-muted-foreground" />
          </Button>
          <ThemeSwitcher />
          <UserMenu />
        </div>
      </div>

      {/* Mobile drawer */}
      {open ? (
        <MobileDrawer items={items} onClose={() => setOpen(false)} />
      ) : null}
    </header>
  );
}

function MobileDrawer({ items, onClose }: { items: NavItem[]; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <div className="fixed inset-0 z-40 md:hidden">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute inset-y-0 left-0 w-72 bg-background border-r shadow-xl flex flex-col">
        <div className="flex h-14 items-center justify-between px-3 border-b">
          <span className="font-semibold">Navigation</span>
          <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          {items.map((item) => {
            const ActiveIcon = iconMap[item.icon] ?? Box;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-2 text-sm",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <ActiveIcon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function UserMenu() {
  // Minimal placeholder avatar
  return (
    <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
      <User className="h-4 w-4" />
    </div>
  );
}

