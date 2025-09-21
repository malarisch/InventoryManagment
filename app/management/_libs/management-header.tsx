"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ComponentType, type SVGProps } from "react";
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
  Briefcase,
  Users,
  Archive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/database.types";
import { useRouter } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  icon: string; // lucide icon name
};

const iconMap: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  "layout-dashboard": LayoutDashboard,
  package: Package,
  box: Box,
  "map-pin": MapPin,
  briefcase: Briefcase,
  users: Users,
  archive: Archive,
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

type Company = Tables<"companies">;

function UserMenu() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  // Load companies for the current user
  useEffect(() => {
    let active = true;
    async function load() {
      setLoadingCompanies(true);
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) {
        if (active) {
          setCompanies([]);
          setLoadingCompanies(false);
        }
        return;
      }

      const desired = (typeof window !== "undefined" && localStorage.getItem("active_company_id")) || null;

      const list: Company[] = [];
      const { data: memberships, error: mErr } = await supabase
        .from("users_companies")
        .select("companies(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (mErr && mErr.code !== "PGRST116") {
        // ignore not found, but keep going to owned
      }
      if (memberships?.length) {
        for (const row of memberships) {
          const comp = (row as any).companies as unknown;
          const picked = (Array.isArray(comp) ? comp[0] : comp) as Company | undefined;
          if (picked) list.push(picked);
        }
      }

      // Fallback: also include companies owned by the user (in case membership rows are missing)
      const { data: owned, error: ownedErr } = await supabase
        .from("companies")
        .select("*")
        .eq("owner_user_id", userId)
        .order("created_at", { ascending: true });
      if (!ownedErr && owned?.length) {
        for (const c of owned as Company[]) {
          if (!list.find((x) => x.id === c.id)) list.push(c);
        }
      }

      if (!active) return;
      setCompanies(list);
      setSelectedCompanyId(desired ?? (list[0] ? String(list[0].id) : null));
      setLoadingCompanies(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [supabase]);

  const onSelectCompany = async (id: string) => {
    setSelectedCompanyId(id);
    if (typeof window !== "undefined") {
      localStorage.setItem("active_company_id", id);
    }
    // Refresh UI so components reading company update
    router.refresh();
  };

  const onLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Benutzermenü"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground hover:bg-muted/80"
        >
          <User className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Menü</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Company Switcher</DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56">
            {loadingCompanies ? (
              <DropdownMenuItem disabled>Lädt…</DropdownMenuItem>
            ) : companies.length ? (
              <DropdownMenuRadioGroup value={selectedCompanyId ?? undefined} onValueChange={onSelectCompany}>
                {companies.map((c) => (
                  <DropdownMenuRadioItem key={c.id} value={String(c.id)}>
                    <span className="truncate">{c.name ?? c.id}</span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            ) : (
              <DropdownMenuItem disabled>Keine Company gefunden</DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/management/company/new">+ Neue Company…</Link>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem asChild>
          <Link href="/management/profile/settings">Profileinstellungen</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout}>Abmelden</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
