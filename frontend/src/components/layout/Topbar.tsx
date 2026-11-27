"use client";

import Link from "next/link";
import { Bell, FlaskConical, LogOut, Menu, Monitor, Moon, PanelLeft, Search, Settings, Sun, User } from "lucide-react";
import { cn, formatRelative } from "@/lib/utils";
import { isMockMode, mockModeMisconfigured } from "@/lib/config";
import { can } from "@/lib/capabilities";
import { useAsync } from "@/hooks/useAsync";
import { channelsService } from "@/services/channels";
import { workspaceService } from "@/services/workspace";
import { useSession } from "@/components/providers/SessionProvider";
import { useTheme, type Theme } from "@/components/providers/ThemeProvider";
import { Button } from "@/components/ui/Button";
import { Popover, MenuItem, MenuDivider, MenuLabel } from "@/components/ui/Popover";
import { Tooltip } from "@/components/ui/Tooltip";
import { Avatar } from "@/components/ui/Misc";
import { StatusDot } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";

export function Topbar({ onToggleSidebar, onOpenMobileNav, onOpenSearch, collapsed }: { onToggleSidebar: () => void; onOpenMobileNav: () => void; onOpenSearch: () => void; collapsed: boolean }) {
  return (
    <header
      className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-line bg-canvas/85 px-3 backdrop-blur-md sm:px-5"
    >
      <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={onOpenMobileNav} aria-label="Open navigation">
        <Menu className="h-[18px] w-[18px]" />
      </Button>
      <Tooltip content={collapsed ? "Expand sidebar" : "Collapse sidebar"} side="bottom" className="hidden lg:inline-flex">
        <Button variant="ghost" size="icon-sm" onClick={onToggleSidebar} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-pressed={!collapsed}>
          <PanelLeft className="h-[18px] w-[18px]" />
        </Button>
      </Tooltip>

      <LiveIndicator />

      <div className="ml-auto flex items-center gap-1">
        {isMockMode && <DemoBadge />}
        <Button variant="ghost" size="icon-sm" onClick={onOpenSearch} aria-label="Search" className="sm:hidden">
          <Search className="h-[18px] w-[18px]" />
        </Button>
        <Notifications />
        <ThemeMenu />
        <UserMenu />
      </div>
    </header>
  );
}

/** Live call activity from GET /channels/live (polled; swap for SSE/WebSocket later). */
function LiveIndicator() {
  const live = useAsync(() => channelsService.live(), "live", { pollMs: 15_000 });
  const active = live.data?.activeCalls ?? 0;
  const label = live.error ? "Call activity unavailable" : `${active} on calls · ₹${(live.data?.burnRatePerMin ?? 0).toFixed(1)}/min`;
  return (
    <Tooltip content={live.data ? `${live.data.totalChannels} concurrent line(s) available` : "Live call activity"} side="bottom">
      <div
        tabIndex={0}
        className="flex h-8 items-center gap-2 rounded-full border border-line bg-surface px-3 text-xs font-medium text-ink-2 shadow-card"
        aria-live="polite"
      >
        <StatusDot tone={live.error ? "neutral" : active > 0 ? "success" : "neutral"} pulse={active > 0} />
        <span className="tabular whitespace-nowrap">{live.data || live.error ? label : "Checking…"}</span>
      </div>
    </Tooltip>
  );
}

function DemoBadge() {
  return (
    <Tooltip
      side="bottom"
      content={
        mockModeMisconfigured
          ? "Production build running on demo data! Set NEXT_PUBLIC_DATA_MODE=api."
          : "You are viewing demo data generated in your browser. Set NEXT_PUBLIC_DATA_MODE=api to use the backend."
      }
    >
      <Link
        href="/settings?tab=preferences"
        className={cn(
          "mr-1 hidden h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold sm:inline-flex",
          mockModeMisconfigured ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning",
        )}
      >
        <FlaskConical className="h-3.5 w-3.5" aria-hidden />
        Demo data
      </Link>
    </Tooltip>
  );
}

function Notifications() {
  const enabled = can("notifications.feed");
  const feed = useAsync(() => workspaceService.notifications(), "notifications", { enabled });
  const unread = feed.data?.filter((n) => !n.read).length ?? 0;

  return (
    <Popover
      align="end"
      className="w-[min(340px,calc(100vw-24px))] p-0"
      trigger={({ open, toggle }) => (
        <Button variant="ghost" size="icon-sm" onClick={toggle} aria-expanded={open} aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} className="relative">
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent ring-2 ring-canvas" aria-hidden />}
        </Button>
      )}
    >
      {(close) => (
        <div>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-sm font-semibold text-ink">Notifications</span>
            {unread > 0 && (
              <button
                type="button"
                className="text-xs font-medium text-accent hover:underline"
                onClick={async () => {
                  await workspaceService.markAllRead();
                  feed.setData((prev) => (prev ?? []).map((n) => ({ ...n, read: true })));
                }}
              >
                Mark all read
              </button>
            )}
          </div>
          {!enabled ? (
            <EmptyState compact icon={<Bell />} title="No notifications yet" description="A notifications feed will appear here once the backend provides one." />
          ) : feed.error ? (
            <EmptyState compact icon={<Bell />} title="Couldn't load notifications" description={feed.error.message} />
          ) : !feed.data ? (
            <p className="px-4 py-6 text-center text-[13px] text-ink-3">Loading…</p>
          ) : feed.data.length === 0 ? (
            <EmptyState compact icon={<Bell />} title="You're all caught up" description="We'll let you know about hot leads and issues here." />
          ) : (
            <ul className="max-h-80 divide-y divide-line overflow-y-auto">
              {feed.data.map((n) => (
                <li key={n.id}>
                  <Link href={n.href ?? "/"} onClick={close} className="flex gap-3 px-4 py-3 hover:bg-subtle">
                    <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-accent")} aria-hidden />
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium text-ink">{n.title}</span>
                      <span className="mt-0.5 block text-xs leading-snug text-ink-2">{n.body}</span>
                      <span className="mt-1 block text-2xs text-ink-3">{formatRelative(n.createdAt)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Popover>
  );
}

function ThemeMenu() {
  const { theme, resolved, setTheme } = useTheme();
  const options: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: "Light", icon: <Sun className="h-4 w-4" /> },
    { value: "dark", label: "Dark", icon: <Moon className="h-4 w-4" /> },
    { value: "system", label: "System", icon: <Monitor className="h-4 w-4" /> },
  ];
  return (
    <Popover
      align="end"
      className="w-40"
      trigger={({ open, toggle }) => (
        <Button variant="ghost" size="icon-sm" onClick={toggle} aria-expanded={open} aria-label="Theme">
          {resolved === "dark" ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
        </Button>
      )}
    >
      {(close) => (
        <div role="menu">
          {options.map((o) => (
            <MenuItem
              key={o.value}
              icon={o.icon}
              selected={theme === o.value}
              onSelect={() => {
                setTheme(o.value);
                close();
              }}
            >
              {o.label}
            </MenuItem>
          ))}
        </div>
      )}
    </Popover>
  );
}

function UserMenu() {
  const { session, signOut } = useSession();
  const name = session?.user.name ?? "Account";
  return (
    <Popover
      align="end"
      className="w-60"
      trigger={({ open, toggle }) => (
        <button type="button" onClick={toggle} aria-expanded={open} aria-label="Account menu" className="ml-1 rounded-full focus-visible:shadow-focus">
          <Avatar name={name} size="sm" />
        </button>
      )}
    >
      {(close) => (
        <div role="menu">
          <div className="px-2.5 pb-2 pt-1.5">
            <p className="truncate text-[13px] font-medium text-ink">{name}</p>
            <p className="truncate text-xs text-ink-3">{session?.user.email}</p>
          </div>
          <MenuDivider />
          <MenuLabel>Account</MenuLabel>
          <Link href="/settings?tab=profile" onClick={close} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] text-ink hover:bg-muted">
            <User className="h-4 w-4 text-ink-2" aria-hidden /> Profile
          </Link>
          <Link href="/settings" onClick={close} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] text-ink hover:bg-muted">
            <Settings className="h-4 w-4 text-ink-2" aria-hidden /> Settings
          </Link>
          <MenuDivider />
          <MenuItem icon={<LogOut className="h-4 w-4" />} onSelect={signOut}>
            {isMockMode ? "Exit demo" : "Sign out"}
          </MenuItem>
        </div>
      )}
    </Popover>
  );
}
