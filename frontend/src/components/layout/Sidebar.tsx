"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsUpDown, Plus, Search, Settings } from "lucide-react";
import { cn, formatInr } from "@/lib/utils";
import { isMockMode } from "@/lib/config";
import { useAsync } from "@/hooks/useAsync";
import { billingService } from "@/services/billing";
import { useSession } from "@/components/providers/SessionProvider";
import { Popover, MenuItem, MenuLabel, MenuDivider } from "@/components/ui/Popover";
import { Tooltip } from "@/components/ui/Tooltip";
import { Kbd } from "@/components/ui/Misc";
import { buttonClasses } from "@/components/ui/Button";
import { NAV, isActive } from "./nav";
import { Logo } from "./Logo";

export function Sidebar({
  collapsed,
  onNavigate,
  onOpenSearch,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
  onOpenSearch: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-14 shrink-0 items-center", collapsed ? "justify-center px-2" : "px-4")}>
        <Link href="/" onClick={onNavigate} aria-label="NexoAgent home">
          <Logo collapsed={collapsed} />
        </Link>
      </div>

      <div className={cn("pb-2", collapsed ? "px-2" : "px-3")}>
        <WorkspaceSwitcher collapsed={collapsed} />
      </div>

      <nav className={cn("scrollbar-thin min-h-0 flex-1 overflow-y-auto pb-3", collapsed ? "px-2" : "px-3")} aria-label="Main">
        <NavButton collapsed={collapsed} label="Search" onClick={onOpenSearch} icon={<Search className="h-4 w-4" />} trailing={<Kbd>Ctrl K</Kbd>} />
        {NAV.map((group, gi) => (
          <div key={gi} role="group" aria-label={group.label ?? undefined}>
            {group.label &&
              (collapsed ? <div className="mx-2 my-2.5 h-px bg-line" aria-hidden /> : <div className="section-label">{group.label}</div>)}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item, pathname);
                const Icon = item.icon;
                const link = (
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    className={cn(
                      "group flex h-8 items-center gap-2.5 rounded-lg text-[13px] font-medium transition-colors",
                      collapsed ? "w-10 justify-center" : "px-2.5",
                      active ? "bg-surface text-ink shadow-card ring-1 ring-line" : "text-ink-2 hover:bg-muted hover:text-ink",
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", active ? "text-accent" : "text-ink-3 group-hover:text-ink-2")} aria-hidden />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
                return (
                  <li key={item.href}>
                    {collapsed ? (
                      <Tooltip content={item.label} side="right">
                        {link}
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {!collapsed && <CreditsCard onNavigate={onNavigate} />}
    </div>
  );
}

function NavButton({ collapsed, label, onClick, icon, trailing }: { collapsed: boolean; label: string; onClick: () => void; icon: React.ReactNode; trailing?: React.ReactNode }) {
  const btn = (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "group mb-1 flex h-8 w-full items-center gap-2.5 rounded-lg text-[13px] font-medium text-ink-2 transition-colors hover:bg-muted hover:text-ink",
        collapsed ? "w-10 justify-center" : "px-2.5",
      )}
    >
      <span className="text-ink-3 group-hover:text-ink-2">{icon}</span>
      {!collapsed && (
        <>
          <span className="flex-1 text-left">{label}</span>
          <span className="hidden lg:inline-flex">{trailing}</span>
        </>
      )}
    </button>
  );
  return collapsed ? (
    <Tooltip content={label} side="right">
      {btn}
    </Tooltip>
  ) : (
    btn
  );
}

function WorkspaceSwitcher({ collapsed }: { collapsed: boolean }) {
  const { session } = useSession();
  const name = session?.workspace.name ?? "Workspace";
  return (
    <Popover
      className="w-60"
      trigger={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={`Workspace: ${name}`}
          className={cn(
            "flex items-center gap-2 rounded-lg border border-line bg-surface text-left shadow-card transition-colors hover:border-line-strong",
            collapsed ? "h-10 w-10 justify-center" : "h-10 w-[224px] px-2.5",
          )}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-semibold text-ink-2">
            {name.slice(0, 1).toUpperCase()}
          </span>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-ink">{name}</span>
                <span className="block truncate text-2xs text-ink-3">{isMockMode ? "Demo data" : session?.user.role ?? ""}</span>
              </span>
              <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-ink-3" aria-hidden />
            </>
          )}
        </button>
      )}
    >
      {(close) => (
        <div role="menu">
          <MenuLabel>Workspaces</MenuLabel>
          <MenuItem selected onSelect={close}>
            {name}
          </MenuItem>
          <p className="px-2.5 pb-1.5 pt-1 text-2xs leading-snug text-ink-3">Multiple workspaces per account need backend support.</p>
          <MenuDivider />
          <Link href="/settings?tab=workspace" onClick={close} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] text-ink hover:bg-muted">
            <Settings className="h-4 w-4 text-ink-2" aria-hidden />
            Workspace settings
          </Link>
        </div>
      )}
    </Popover>
  );
}

function CreditsCard({ onNavigate }: { onNavigate?: () => void }) {
  const wallet = useAsync(() => billingService.wallet(), "wallet", { pollMs: 60_000 });
  const w = wallet.data;
  return (
    <div className="m-3 mt-0 rounded-xl border border-line bg-surface p-3 shadow-card">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xs font-semibold uppercase tracking-wide text-ink-3">Balance</span>
        {w?.lowBalance && <span className="text-2xs font-medium text-warning">Low</span>}
      </div>
      <div className="tabular mt-1 text-base font-semibold text-ink">{w ? formatInr(w.balanceInr) : wallet.error ? "—" : "…"}</div>
      <div className="text-xs text-ink-3">{w ? `≈ ${w.estimatedMinutes.toLocaleString("en-IN")} calling minutes` : wallet.error ? "Unavailable" : "Loading"}</div>
      <Link href="/billing?add=1" onClick={onNavigate} className={buttonClasses("secondary", "sm", "mt-2.5 w-full")}>
        <Plus className="h-3.5 w-3.5" aria-hidden />
        Add credits
      </Link>
    </div>
  );
}
