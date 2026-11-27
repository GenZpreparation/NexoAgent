"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, LayoutGrid, LayoutTemplate, List, MoreHorizontal, Pause, Phone, Play, Plus, Trash2, Users } from "lucide-react";
import { formatDate, formatNumber, formatPhone, formatRelative } from "@/lib/utils";
import { CALLING_MODES, LANGUAGES, languageLabel } from "@/lib/labels";
import { can } from "@/lib/capabilities";
import { useAsync } from "@/hooks/useAsync";
import { employeesService } from "@/services/employees";
import type { CallingMode, Employee, EmployeeStatus } from "@/types/domain";
import { Button, LinkButton } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/Field";
import { FilterMenu } from "@/components/ui/FilterMenu";
import { Segmented } from "@/components/ui/Tabs";
import { PageHeader, Avatar } from "@/components/ui/Misc";
import { Card } from "@/components/ui/Card";
import { EmptyState, ErrorState, SkeletonCards } from "@/components/ui/States";
import { Popover, MenuItem, MenuDivider } from "@/components/ui/Popover";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { CallingModeBadge, EmployeeStatusBadge } from "@/components/domain/Badges";

export default function TeamPage() {
  const toast = useToast();
  const router = useRouter();
  const employees = useAsync(() => employeesService.list(), "employees");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<EmployeeStatus>();
  const [mode, setMode] = useState<CallingMode>();
  const [language, setLanguage] = useState<string>();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [toDelete, setToDelete] = useState<Employee | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const n = search.trim().toLowerCase();
    return (employees.data ?? []).filter(
      (e) =>
        (!n || e.name.toLowerCase().includes(n) || e.role.toLowerCase().includes(n) || e.instructions.toLowerCase().includes(n)) &&
        (!status || e.status === status) &&
        (!mode || e.callingMode === mode) &&
        (!language || e.language === language),
    );
  }, [employees.data, search, status, mode, language]);

  const hasFilters = !!(search || status || mode || language);

  async function toggleStatus(e: Employee) {
    const next = e.status === "active" ? "paused" : "active";
    try {
      const updated = await employeesService.update(e.id, { status: next });
      employees.setData((xs) => (xs ?? []).map((x) => (x.id === e.id ? { ...x, status: updated.status } : x)));
      toast.success(next === "active" ? `${e.name} is active` : `${e.name} is paused`, next === "paused" ? "They won't make or answer calls until reactivated." : undefined);
    } catch (err) {
      toast.fromError(err, "Couldn't update status");
    }
  }

  async function duplicate(e: Employee) {
    try {
      const copy = await employeesService.duplicate(e.id);
      employees.setData((xs) => [copy, ...(xs ?? [])]);
      toast.success(`Created “${copy.name}”`, "The copy starts paused so you can review it first.");
    } catch (err) {
      toast.fromError(err, "Couldn't duplicate");
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setBusy(true);
    try {
      await employeesService.remove(toDelete.id);
      employees.setData((xs) => (xs ?? []).filter((x) => x.id !== toDelete.id));
      toast.success(`${toDelete.name} was removed`);
      setToDelete(null);
    } catch (err) {
      toast.fromError(err, "Couldn't delete");
    } finally {
      setBusy(false);
    }
  }

  const menu = (e: Employee) => (
    <Popover
      align="end"
      className="w-48"
      trigger={({ toggle, open }) => (
        <Button variant="ghost" size="icon-sm" onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); toggle(); }} aria-expanded={open} aria-label={`Actions for ${e.name}`}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      )}
    >
      {(close) => (
        <div role="menu" onClick={(ev) => ev.stopPropagation()}>
          <MenuItem icon={e.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} disabled={!can("employees.update")} onSelect={() => { close(); toggleStatus(e); }}>
            {e.status === "active" ? "Pause" : "Activate"}
          </MenuItem>
          <MenuItem icon={<Copy className="h-4 w-4" />} disabled={!can("employees.duplicate")} onSelect={() => { close(); duplicate(e); }}>
            Duplicate
          </MenuItem>
          <MenuDivider />
          <MenuItem danger icon={<Trash2 className="h-4 w-4" />} disabled={!can("employees.delete")} onSelect={() => { close(); setToDelete(e); }}>
            Delete
          </MenuItem>
        </div>
      )}
    </Popover>
  );

  return (
    <>
      <PageHeader
        title="Your team"
        description="AI employees that call, answer and follow up for you. Open one to edit its instructions or review its calls."
        actions={
          <>
            <LinkButton href="/employees/templates" icon={<LayoutTemplate className="h-4 w-4" />}>
              Templates
            </LinkButton>
            <LinkButton href="/employees/new" variant="primary" icon={<Plus className="h-4 w-4" />}>
              Hire an AI employee
            </LinkButton>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, role or instructions" className="lg:w-80" label="Search AI employees" />
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <FilterMenu label="Status" value={status} onChange={setStatus} options={[{ value: "active", label: "Active" }, { value: "paused", label: "Paused" }]} />
          <FilterMenu
            label="Calling mode"
            value={mode}
            onChange={setMode}
            options={(Object.keys(CALLING_MODES) as CallingMode[]).map((m) => ({ value: m, label: CALLING_MODES[m].label }))}
            disabledReason={can("employees.structuredConfig") ? undefined : "The backend doesn't store calling mode yet"}
          />
          <FilterMenu label="Language" value={language} onChange={setLanguage} options={LANGUAGES.map((l) => ({ value: l.code, label: l.label }))} />
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setStatus(undefined); setMode(undefined); setLanguage(undefined); }}>
              Clear
            </Button>
          )}
        </div>
        <Segmented
          ariaLabel="View"
          value={view}
          onChange={setView}
          items={[
            { value: "grid", label: <span className="sr-only">Grid</span>, icon: <LayoutGrid className="h-4 w-4" />, title: "Grid view" },
            { value: "list", label: <span className="sr-only">List</span>, icon: <List className="h-4 w-4" />, title: "List view" },
          ]}
        />
      </div>

      {employees.error ? (
        <Card>
          <ErrorState error={employees.error} onRetry={employees.refetch} />
        </Card>
      ) : !employees.data ? (
        <SkeletonCards />
      ) : employees.data.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users />}
            title="Hire your first AI employee"
            description="Describe the job in plain words, pick a language and how it should call. Start from a template to go faster."
            action={<LinkButton href="/employees/new" variant="primary" icon={<Plus className="h-4 w-4" />}>Hire an AI employee</LinkButton>}
            secondary={<LinkButton href="/employees/templates">Browse templates</LinkButton>}
          />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState icon={<Users />} title="No AI employees match" description="Try a different search or clear the filters." />
        </Card>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((e) => (
            <div
              key={e.id}
              role="link"
              tabIndex={0}
              onClick={() => router.push(`/employees/${e.id}`)}
              onKeyDown={(ev) => ev.key === "Enter" && router.push(`/employees/${e.id}`)}
              className="card group flex cursor-pointer flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-pop"
            >
              <div className="flex items-start gap-3">
                <Avatar name={e.name} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-ink">{e.name}</h3>
                  </div>
                  <p className="truncate text-[13px] text-ink-2">{e.role || languageLabel(e.language)}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <EmployeeStatusBadge status={e.status} />
                    <CallingModeBadge mode={e.callingMode} />
                  </div>
                </div>
                {menu(e)}
              </div>
              <p className="mt-4 line-clamp-2 text-[13px] leading-relaxed text-ink-2">{e.firstMessage}</p>
              <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3.5 text-xs">
                <div>
                  <dt className="text-ink-3">Calls</dt>
                  <dd className="tabular mt-0.5 font-medium text-ink">{e.stats ? formatNumber(e.stats.calls) : "—"}</dd>
                </div>
                <div>
                  <dt className="text-ink-3">Qualified</dt>
                  <dd className="tabular mt-0.5 font-medium text-ink">{e.stats ? formatNumber(e.stats.qualified) : "—"}</dd>
                </div>
                <div>
                  <dt className="text-ink-3">Last active</dt>
                  <dd className="mt-0.5 truncate font-medium text-ink">{e.stats?.lastActiveAt ? formatRelative(e.stats.lastActiveAt) : "—"}</dd>
                </div>
              </dl>
              <div className="mt-3 flex items-center justify-between gap-2 text-xs text-ink-3">
                <span className="flex min-w-0 items-center gap-1.5 truncate">
                  <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {e.channels === null ? "Channels: see Numbers" : e.channels.length ? e.channels.map(formatPhone).join(", ") : "No number assigned"}
                </span>
                <span className="shrink-0">{languageLabel(e.language)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-[13px]">
            <thead>
              <tr className="border-b border-line bg-subtle/60 text-left text-xs text-ink-3">
                <th className="px-5 py-2.5 font-medium">Employee</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium">Mode</th>
                <th className="px-3 py-2.5 font-medium">Language</th>
                <th className="px-3 py-2.5 text-right font-medium">Calls</th>
                <th className="px-3 py-2.5 font-medium">Created</th>
                <th className="w-12 px-3 py-2.5"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-subtle">
                  <td className="px-5 py-3">
                    <Link href={`/employees/${e.id}`} className="flex items-center gap-2.5">
                      <Avatar name={e.name} size="sm" />
                      <span className="min-w-0">
                        <span className="block font-medium text-ink">{e.name}</span>
                        {e.role && <span className="block truncate text-xs text-ink-3">{e.role}</span>}
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-3"><EmployeeStatusBadge status={e.status} /></td>
                  <td className="px-3 py-3"><CallingModeBadge mode={e.callingMode} /></td>
                  <td className="px-3 py-3 text-ink-2">{languageLabel(e.language)}</td>
                  <td className="tabular px-3 py-3 text-right text-ink">{e.stats ? formatNumber(e.stats.calls) : "—"}</td>
                  <td className="px-3 py-3 text-ink-2">{formatDate(e.createdAt)}</td>
                  <td className="px-3 py-3 text-right">{menu(e)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={busy}
        tone="danger"
        title={`Delete ${toDelete?.name ?? "employee"}?`}
        description="This removes the AI employee and its configuration. Past calls and leads stay in your workspace. This can't be undone."
        confirmLabel="Delete"
      />
    </>
  );
}
