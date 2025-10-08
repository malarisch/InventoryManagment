"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  Menu,
  Search,
  Bell,
  User,
  PanelLeftOpen,
  PanelLeftClose,
} from "lucide-react";
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
import type { CompanyRecord } from "@/lib/companies";
import { normalizeCompanyRelation } from "@/lib/companies";
import { GlobalSearchModal } from "@/components/search/global-search-modal";
import { useGlobalSearch } from "@/components/search/use-global-search";
import { useRouter } from "next/navigation";

type HeaderProps = {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  sidebarId?: string;
};

export function Header({ onToggleSidebar, isSidebarOpen = false, sidebarId }: HeaderProps) {
  const { isOpen: searchOpen, openSearch, closeSearch } = useGlobalSearch();

  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-3 px-3 md:px-5">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={isSidebarOpen ? "Navigation schließen" : "Navigation öffnen"}
            aria-controls={sidebarId}
            aria-expanded={isSidebarOpen}
            onClick={() => onToggleSidebar?.()}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {onToggleSidebar ? (
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex"
              aria-label={isSidebarOpen ? "Navigation einklappen" : "Navigation ausklappen"}
              aria-controls={sidebarId}
              aria-expanded={isSidebarOpen}
              onClick={onToggleSidebar}
            >
              {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
            </Button>
          ) : null}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="hidden sm:inline">Inventory</span>
            <span className="hidden sm:inline">/</span>
            <span className="font-medium text-foreground">Management</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <button
                  onClick={openSearch}
                  className="flex items-center w-[220px] h-9 pl-8 pr-3 bg-background border border-input rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <span className="flex-1 text-left">Alles durchsuchen...</span>
                  <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </button>
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
      </header>
      
      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={searchOpen} onClose={closeSearch} />
    </>
  );
}

function UserMenu() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
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

      const list: CompanyRecord[] = [];
      type MembershipRow = { companies: CompanyRecord | CompanyRecord[] | null };
      const { data: memberships, error: mErr } = await supabase
        .from("users_companies")
        .select("companies(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .returns<MembershipRow[]>();

      if (mErr && mErr.code !== "PGRST116") {
        // ignore not found, but keep going to owned
      }
      if (memberships?.length) {
        for (const row of memberships) {
          const picked = normalizeCompanyRelation(row.companies);
          if (picked) list.push(picked);
        }
      }

      // Fallback: also include companies owned by the user (in case membership rows are missing)
      const { data: owned, error: ownedErr } = await supabase
        .from("companies")
        .select("*")
        .eq("owner_user_id", userId)
        .order("created_at", { ascending: true })
        .returns<CompanyRecord[]>();
      if (!ownedErr && owned?.length) {
        for (const c of owned) {
          if (!list.find((x) => x.id === c.id)) list.push(c);
        }
      }

      if (!active) return;
      setCompanies(list);
      const activeId = desired ?? (list[0] ? String(list[0].id) : null);
      setSelectedCompanyId(activeId);
      // Ensure cookie is set on initial load
      if (activeId && typeof window !== "undefined") {
        document.cookie = `active_company_id=${activeId}; path=/; max-age=31536000; SameSite=Lax`;
      }
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
      // Set cookie for server-side access (expires in 1 year)
      document.cookie = `active_company_id=${id}; path=/; max-age=31536000; SameSite=Lax`;
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
          id="user-menu-trigger"
        >
          <User className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-56" id="user-menu-content">
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
