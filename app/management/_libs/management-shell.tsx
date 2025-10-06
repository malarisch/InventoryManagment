"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/app/management/_libs/management-sidebar";
import { Header } from "@/app/management/_libs/management-header";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

const LG_BREAKPOINT_QUERY = "(min-width: 1024px)";

type ManagementShellProps = {
  items: NavItem[];
  children: React.ReactNode;
};

export function ManagementShell({ items, children }: ManagementShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const sidebarId = "management-navigation";

  useEffect(() => {
    const mediaQuery = window.matchMedia(LG_BREAKPOINT_QUERY);

    const applyMatch = (matches: boolean) => {
      setIsLargeScreen(matches);
      setSidebarOpen(matches);
    };

    applyMatch(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      applyMatch(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  const handleToggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const showOverlay = sidebarOpen && !isLargeScreen;

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {showOverlay ? (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      <aside
        id={sidebarId}
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-background transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:-translate-x-full"
        )}
      >
        <Sidebar items={items} />
      </aside>

      <div
        className={cn(
          "relative flex min-h-screen flex-col transition-[padding-left] duration-300 lg:pl-64",
          isLargeScreen && !sidebarOpen && "lg:pl-0"
        )}
      >
        <Header
          items={items}
          onToggleSidebar={handleToggleSidebar}
          isSidebarOpen={sidebarOpen}
          sidebarId={sidebarId}
        />
        <main className="p-3 md:p-4 lg:p-6 max-w-[1600px] mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}
