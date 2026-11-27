"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockModeMisconfigured } from "@/lib/config";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { CommandPalette } from "./CommandPalette";

const COLLAPSE_KEY = "nexo.sidebar.collapsed"; // non-sensitive UI preference

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    let stored = false;
    try {
      stored = window.localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      /* ignore */
    }
    if (stored) Promise.resolve().then(() => setCollapsed(true));
  }, []);

  // Close the mobile drawer on navigation.
  useEffect(() => {
    Promise.resolve().then(() => setMobileOpen(false));
  }, [pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  function toggleCollapsed() {
    setCollapsed((v) => {
      try {
        window.localStorage.setItem(COLLAPSE_KEY, v ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !v;
    });
  }

  return (
    <div className="flex min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2 focus:shadow-pop">
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 border-r border-line bg-subtle/60 transition-[width] duration-200 lg:block",
          collapsed ? "w-[64px]" : "w-[248px]",
        )}
      >
        <Sidebar collapsed={collapsed} onOpenSearch={() => setSearchOpen(true)} />
      </aside>

      {/* Mobile / tablet drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 animate-fade-in bg-ink/30" onClick={() => setMobileOpen(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 w-[272px] max-w-[85vw] animate-slide-in-left border-r border-line bg-canvas shadow-pop">
            <Sidebar collapsed={false} onNavigate={() => setMobileOpen(false)} onOpenSearch={() => { setMobileOpen(false); setSearchOpen(true); }} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {mockModeMisconfigured && (
          <div role="alert" className="flex items-center gap-2 bg-danger px-4 py-2 text-[13px] font-medium text-white">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
            This production build is showing DEMO data. Set NEXT_PUBLIC_DATA_MODE=api (or explicitly allow mock mode) before deploying.
          </div>
        )}
        <Topbar collapsed={collapsed} onToggleSidebar={toggleCollapsed} onOpenMobileNav={() => setMobileOpen(true)} onOpenSearch={() => setSearchOpen(true)} />
        <main id="main" className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
