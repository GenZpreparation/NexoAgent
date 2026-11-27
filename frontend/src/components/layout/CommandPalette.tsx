"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ArrowRight, Contact, CornerDownLeft, Loader2, Megaphone, PhoneCall, Search, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAsync, useDebounced } from "@/hooks/useAsync";
import { workspaceService } from "@/services/workspace";
import type { SearchResult } from "@/types/domain";
import { ALL_NAV_ITEMS } from "./nav";

const CATEGORY_ICON = { employee: Users, lead: Contact, campaign: Megaphone, call: PhoneCall, page: ArrowRight };
const CATEGORY_LABEL = { employee: "AI employees", lead: "Leads", campaign: "Campaigns", call: "Conversations", page: "Pages" };

/** Ctrl/⌘+K palette: jump to pages, and search employees/leads/campaigns via the search service. */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const q = useDebounced(query.trim(), 220);

  const remote = useAsync(() => workspaceService.search(q), `search:${q}`, { enabled: open && q.length >= 2 });

  const pages: SearchResult[] = useMemo(() => {
    const n = query.trim().toLowerCase();
    return ALL_NAV_ITEMS.filter((i) => !n || i.label.toLowerCase().includes(n) || i.keywords?.includes(n)).map((i) => ({
      category: "page" as const,
      id: i.href,
      title: i.label,
      subtitle: null,
      href: i.href,
    }));
  }, [query]);

  const results = useMemo(() => [...(q.length >= 2 ? remote.data ?? [] : []), ...pages], [q, remote.data, pages]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 10);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  function close() {
    setQuery("");
    setCursor(0);
    onClose();
  }

  function go(r: SearchResult) {
    close();
    router.push(r.href);
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") close();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter" && results[cursor]) {
      e.preventDefault();
      go(results[cursor]);
    }
  }

  if (!open || typeof document === "undefined") return null;

  let lastCategory = "";
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 pt-[12vh]">
      <div className="absolute inset-0 animate-fade-in bg-ink/30" onClick={close} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label="Search" className="relative w-full max-w-xl animate-slide-up overflow-hidden rounded-xl border border-line bg-surface shadow-pop" onKeyDown={onKeyDown}>
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="h-4 w-4 shrink-0 text-ink-3" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            placeholder="Search pages, employees, leads, campaigns…"
            className="h-12 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-3 focus:outline-none"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-results"
            aria-activedescendant={results[cursor] ? `palette-${cursor}` : undefined}
          />
          {remote.loading && q.length >= 2 && <Loader2 className="h-4 w-4 animate-spin text-ink-3" aria-hidden />}
        </div>
        <ul id="palette-results" role="listbox" className="max-h-[50vh] overflow-y-auto p-1.5">
          {remote.error && q.length >= 2 && <li className="px-3 py-2 text-xs text-danger">Record search failed: {remote.error.message}</li>}
          {results.length === 0 && <li className="px-3 py-8 text-center text-[13px] text-ink-3">No results for “{query}”</li>}
          {results.map((r, i) => {
            const Icon = CATEGORY_ICON[r.category];
            const header = r.category !== lastCategory ? CATEGORY_LABEL[r.category] : null;
            lastCategory = r.category;
            return (
              <li key={`${r.category}-${r.id}`} role="presentation">
                {header && <div className="px-3 pb-1 pt-2.5 text-2xs font-semibold uppercase tracking-wide text-ink-3">{header}</div>}
                <div
                  id={`palette-${i}`}
                  role="option"
                  aria-selected={i === cursor}
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => go(r)}
                  className={cn("flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2", i === cursor ? "bg-muted" : "")}
                >
                  <Icon className="h-4 w-4 shrink-0 text-ink-3" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-ink">{r.title}</span>
                    {r.subtitle && <span className="block truncate text-xs text-ink-3">{r.subtitle}</span>}
                  </span>
                  {i === cursor && <CornerDownLeft className="h-3.5 w-3.5 text-ink-3" aria-hidden />}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center gap-4 border-t border-line px-4 py-2 text-2xs text-ink-3">
          <span>↑↓ to navigate</span>
          <span>↵ to open</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
