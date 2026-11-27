"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarClock, CheckCircle2, Contact, Download, Flame, Kanban, LayoutGrid, List, PhoneForwarded, Users, Zap } from "lucide-react";
import { cn, formatDate, formatPhone, formatRelative, titleCase } from "@/lib/utils";
import { OUTCOMES, PIPELINE_COLUMNS, sourceLabel } from "@/lib/labels";
import { can } from "@/lib/capabilities";
import { downloadBlob, downloadCsv, datedFilename } from "@/lib/csv";
import { useAsync, useDebounced } from "@/hooks/useAsync";
import { leadsService } from "@/services/leads";
import { employeesService } from "@/services/employees";
import { channelsService } from "@/services/channels";
import type { Lead, LeadOutcome, LeadSort } from "@/types/domain";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SearchInput, Select } from "@/components/ui/Field";
import { FilterMenu, ToggleChip } from "@/components/ui/FilterMenu";
import { Segmented } from "@/components/ui/Tabs";
import { Avatar, PageHeader, Pagination, StatCard } from "@/components/ui/Misc";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { OutcomeBadge, TemperatureBadge } from "@/components/domain/Badges";
import { LeadSheet } from "@/features/leads/LeadSheet";

type View = "pipeline" | "list" | "grid";
const NEEDS_BACKEND = "Needs backend support for this filter";

export default function LeadsPage() {
  return (
    <Suspense>
      <LeadsInner />
    </Suspense>
  );
}

function LeadsInner() {
  const params = useSearchParams();
  const toast = useToast();
  const [search, setSearch] = useState(params.get("search") ?? "");
  const [sort, setSort] = useState<LeadSort>("recent");
  const [employeeId, setEmployeeId] = useState<string>();
  const [channel, setChannel] = useState<string>();
  const [outcome, setOutcome] = useState<LeadOutcome>();
  const [created, setCreated] = useState<string>();
  const [contacted, setContacted] = useState<string>();
  const [hotOnly, setHotOnly] = useState(params.get("hot") === "1");
  const [view, setView] = useState<View>("list");
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [exporting, setExporting] = useState(false);

  const q = useDebounced(search, 300);
  const limit = view === "pipeline" ? 100 : 25;
  const query = { search: q || undefined, sort, employeeId, channel, outcome, hotOnly, createdWithinDays: created ? Number(created) : undefined, contactedWithinDays: contacted ? Number(contacted) : undefined };
  const key = JSON.stringify({ ...query, limit, offset });
  const leads = useAsync(() => leadsService.list({ ...query, limit, offset }), `leads:${key}`);
  const employees = useAsync(() => employeesService.list(), "employees");
  const channels = useAsync(() => channelsService.list(), "channels");

  const resetPage = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setOffset(0);
  };
  const hasFilters = !!(search || employeeId || channel || outcome || created || contacted || hotOnly);
  const summary = leads.data?.summary;
  const items = leads.data?.items ?? [];

  async function exportLeads() {
    setExporting(true);
    try {
      const blob = can("leads.export") ? await leadsService.exportCsv(query) : null;
      if (blob) {
        downloadBlob(blob, datedFilename("nexoagent-leads"));
        toast.success("Export ready", "All leads were exported by the backend.");
      } else {
        downloadCsv(
          items,
          [
            { header: "Name", value: (l) => l.name },
            { header: "Phone", value: (l) => l.phone },
            { header: "City", value: (l) => l.city },
            { header: "Source", value: (l) => sourceLabel(l.source) },
            { header: "AI employee", value: (l) => l.employeeName },
            { header: "Outcome", value: (l) => OUTCOMES[l.outcome].label },
            { header: "Qualified", value: (l) => (l.qualified ? "Yes" : "No") },
            { header: "Hot", value: (l) => (l.temperature === "hot" ? "Yes" : "No") },
            { header: "Captured info", value: (l) => Object.entries(l.capturedInfo).map(([k, v]) => `${k}: ${v}`).join("; ") },
            { header: "Follow-up", value: (l) => (l.followUp.at ? `${l.followUp.status} ${l.followUp.at}` : l.followUp.status) },
            { header: "Last contacted", value: (l) => l.lastContactedAt },
            { header: "Created", value: (l) => l.createdAt },
          ],
          datedFilename("nexoagent-leads"),
        );
        toast.success("Export ready", `${items.length} lead(s) currently shown were exported.`);
      }
    } catch (err) {
      toast.fromError(err, "Export failed");
    } finally {
      setExporting(false);
    }
  }

  const dateOptions = [
    { value: "1", label: "Last 24 hours" },
    { value: "7", label: "Last 7 days" },
    { value: "30", label: "Last 30 days" },
    { value: "90", label: "Last 90 days" },
  ];

  return (
    <>
      <PageHeader
        title="Leads & results"
        description="Everyone your AI employees have spoken to, what they said, and what happens next."
        actions={
          <Button onClick={exportLeads} loading={exporting} disabled={!leads.data || (summary?.total ?? 0) === 0} icon={<Download className="h-4 w-4" />}>
            Export
          </Button>
        }
      />

      <section aria-label="Lead summary" className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total leads" value={summary?.total ?? "—"} icon={<Users />} tone="accent" loading={!summary && !leads.error} />
        <StatCard label="Qualified" value={summary?.qualified ?? "—"} icon={<CheckCircle2 />} tone="success" loading={!summary && !leads.error} />
        <StatCard label="Pending callback" value={summary?.pendingCallback ?? "—"} icon={<PhoneForwarded />} tone="info" loading={!summary && !leads.error} />
        <StatCard label="Hot leads" value={summary?.hot ?? "—"} icon={<Flame />} tone="hot" loading={!summary && !leads.error} />
      </section>

      <Card className="mb-4 p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput value={search} onChange={resetPage(setSearch)} placeholder="Search name, phone or captured info" className="lg:w-80" label="Search leads" />
          <div className="flex items-center gap-2 lg:ml-auto">
            <label className="flex items-center gap-2 text-[13px] text-ink-2">
              <span className="hidden sm:inline">Sort</span>
              <Select value={sort} onChange={(e) => resetPage(setSort)(e.target.value as LeadSort)} className="w-44" aria-label="Sort leads">
                <option value="recent">Most recent</option>
                <option value="oldest">Oldest first</option>
                <option value="last_contacted" disabled={!can("leads.sort.extended")}>Last contacted{can("leads.sort.extended") ? "" : " (needs backend)"}</option>
                <option value="name" disabled={!can("leads.sort.extended")}>Name A–Z{can("leads.sort.extended") ? "" : " (needs backend)"}</option>
              </Select>
            </label>
            <Segmented
              ariaLabel="View"
              value={view}
              onChange={(v) => {
                setView(v);
                setOffset(0);
              }}
              items={[
                { value: "pipeline", label: <span className="hidden sm:inline">Pipeline</span>, icon: <Kanban className="h-4 w-4" />, title: "Pipeline" },
                { value: "list", label: <span className="hidden sm:inline">List</span>, icon: <List className="h-4 w-4" />, title: "List" },
                { value: "grid", label: <span className="hidden sm:inline">Grid</span>, icon: <LayoutGrid className="h-4 w-4" />, title: "Grid" },
              ]}
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <FilterMenu label="Channels" value={channel} onChange={resetPage(setChannel)} options={(channels.data ?? []).map((c) => ({ value: c.phone, label: `${c.name} · ${formatPhone(c.phone)}` }))} disabledReason={can("leads.filter.channel") ? undefined : NEEDS_BACKEND} />
          <FilterMenu label="AI employees" value={employeeId} onChange={resetPage(setEmployeeId)} options={(employees.data ?? []).map((e) => ({ value: e.id, label: e.name }))} />
          <FilterMenu label="Date" value={created} onChange={resetPage(setCreated)} options={dateOptions} disabledReason={can("leads.filter.date") ? undefined : NEEDS_BACKEND} />
          <FilterMenu label="Last contacted" value={contacted} onChange={resetPage(setContacted)} options={dateOptions} disabledReason={can("leads.filter.lastContacted") ? undefined : NEEDS_BACKEND} />
          <FilterMenu label="Outcomes" value={outcome} onChange={resetPage(setOutcome)} options={(Object.keys(OUTCOMES) as LeadOutcome[]).map((o) => ({ value: o, label: OUTCOMES[o].label }))} />
          <ToggleChip active={hotOnly} onChange={resetPage(setHotOnly)} icon={<Flame className="h-3.5 w-3.5" />}>
            Hot leads
          </ToggleChip>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setEmployeeId(undefined);
                setChannel(undefined);
                setOutcome(undefined);
                setCreated(undefined);
                setContacted(undefined);
                setHotOnly(false);
                setOffset(0);
              }}
            >
              Clear all
            </Button>
          )}
          {leads.loading && leads.data && <span className="ml-auto text-xs text-ink-3">Updating…</span>}
        </div>
      </Card>

      {leads.error ? (
        <Card>
          <ErrorState error={leads.error} onRetry={leads.refetch} />
        </Card>
      ) : !leads.data ? (
        <Card>
          <SkeletonRows rows={8} />
        </Card>
      ) : summary?.total === 0 ? (
        <Card>
          <EmptyState
            icon={<Contact />}
            title="No leads yet"
            description="Leads appear here as soon as your AI employees start calling — from a campaign list, an instant lead source, or incoming calls."
            action={<LinkButton href="/campaigns?new=1" variant="primary">Start a campaign</LinkButton>}
            secondary={<LinkButton href="/instant-leads" icon={<Zap className="h-4 w-4" />}>Connect a lead source</LinkButton>}
          />
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState icon={<Contact />} title="No leads match these filters" description="Try a different search, or clear some filters." />
        </Card>
      ) : view === "pipeline" ? (
        <Pipeline items={items} onOpen={setSelected} />
      ) : view === "grid" ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((l) => (
              <LeadCard key={l.id} lead={l} onOpen={() => setSelected(l)} />
            ))}
          </div>
          <Card className="mt-3">
            <Pagination offset={offset} limit={limit} count={items.length} hasMore={leads.data.hasMore} onChange={setOffset} />
          </Card>
        </>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-[13px]">
              <thead>
                <tr className="border-b border-line bg-subtle/60 text-left text-xs text-ink-3">
                  <th className="px-5 py-2.5 font-medium">Lead</th>
                  <th className="px-3 py-2.5 font-medium">Outcome</th>
                  <th className="px-3 py-2.5 font-medium">Captured info</th>
                  <th className="px-3 py-2.5 font-medium">AI employee</th>
                  <th className="px-3 py-2.5 font-medium">Source</th>
                  <th className="px-3 py-2.5 font-medium">Follow-up</th>
                  <th className="px-5 py-2.5 text-right font-medium">Last contacted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((l) => (
                  <tr key={l.id} onClick={() => setSelected(l)} className="cursor-pointer hover:bg-subtle">
                    <td className="px-5 py-3">
                      <button type="button" className="flex items-center gap-2.5 text-left" onClick={(e) => { e.stopPropagation(); setSelected(l); }}>
                        <Avatar name={l.name} size="sm" />
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 font-medium text-ink">
                            {l.name}
                            <TemperatureBadge value={l.temperature} />
                          </span>
                          <span className="block font-mono text-xs text-ink-3">{formatPhone(l.phone)}</span>
                        </span>
                      </button>
                    </td>
                    <td className="px-3 py-3"><OutcomeBadge outcome={l.outcome} /></td>
                    <td className="max-w-[240px] px-3 py-3">
                      <CapturedChips info={l.capturedInfo} />
                    </td>
                    <td className="px-3 py-3 text-ink-2">{l.employeeName ?? "—"}</td>
                    <td className="px-3 py-3 text-ink-2">{sourceLabel(l.source)}</td>
                    <td className="px-3 py-3"><FollowUp lead={l} /></td>
                    <td className="px-5 py-3 text-right text-ink-2">{formatRelative(l.lastContactedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination offset={offset} limit={limit} count={items.length} hasMore={leads.data.hasMore} onChange={setOffset} />
        </Card>
      )}

      <LeadSheet
        lead={selected}
        onClose={() => setSelected(null)}
        onUpdated={(u) => {
          setSelected(u);
          leads.setData((prev) => (prev ? { ...prev, items: prev.items.map((x) => (x.id === u.id ? u : x)) } : prev!));
        }}
      />
    </>
  );
}

function CapturedChips({ info, max = 2 }: { info: Record<string, string>; max?: number }) {
  const entries = Object.entries(info);
  if (!entries.length) return <span className="text-ink-3">—</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {entries.slice(0, max).map(([k, v]) => (
        <span key={k} className="max-w-full truncate rounded-md bg-muted px-1.5 py-0.5 text-xs text-ink-2" title={`${titleCase(k)}: ${v}`}>
          <span className="text-ink-3">{titleCase(k)}:</span> {v}
        </span>
      ))}
      {entries.length > max && <span className="text-xs text-ink-3">+{entries.length - max}</span>}
    </span>
  );
}

function FollowUp({ lead }: { lead: Lead }) {
  const f = lead.followUp;
  if (f.status === "none") return <span className="text-ink-3">—</span>;
  if (f.status === "done") return <span className="text-xs text-ink-3">Done</span>;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", f.status === "overdue" ? "text-danger" : "text-info")}>
      <CalendarClock className="h-3.5 w-3.5" aria-hidden />
      {f.status === "overdue" ? "Overdue" : formatRelative(f.at)}
    </span>
  );
}

function LeadCard({ lead: l, onOpen }: { lead: Lead; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="card flex flex-col p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-pop">
      <div className="flex items-start gap-3">
        <Avatar name={l.name} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-ink">
            {l.name} <TemperatureBadge value={l.temperature} />
          </p>
          <p className="font-mono text-xs text-ink-3">{formatPhone(l.phone)}</p>
        </div>
        <OutcomeBadge outcome={l.outcome} />
      </div>
      <div className="mt-3 min-h-[24px]">
        <CapturedChips info={l.capturedInfo} max={3} />
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-xs text-ink-3">
        <span>{l.employeeName ?? sourceLabel(l.source)}</span>
        <span>{l.lastContactedAt ? formatRelative(l.lastContactedAt) : `Added ${formatDate(l.createdAt)}`}</span>
      </div>
    </button>
  );
}

function Pipeline({ items, onOpen }: { items: Lead[]; onOpen: (l: Lead) => void }) {
  const columns = useMemo(() => PIPELINE_COLUMNS.map((c) => ({ ...c, leads: items.filter((l) => c.outcomes.includes(l.outcome)) })), [items]);
  return (
    <div className="scrollbar-thin -mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
      <div className="grid min-w-[1000px] grid-cols-5 gap-3">
        {columns.map((col) => (
          <section key={col.key} aria-label={col.label} className="flex flex-col rounded-xl border border-line bg-subtle/70">
            <header className="flex items-center justify-between px-3 py-2.5">
              <h2 className="text-[13px] font-semibold text-ink">{col.label}</h2>
              <span className="tabular rounded-md bg-surface px-1.5 text-xs font-medium text-ink-2 ring-1 ring-line">{col.leads.length}</span>
            </header>
            <ul className="flex max-h-[640px] flex-col gap-2 overflow-y-auto px-2 pb-2">
              {col.leads.length === 0 && <li className="rounded-lg border border-dashed border-line-strong px-3 py-6 text-center text-xs text-ink-3">No leads</li>}
              {col.leads.map((l) => (
                <li key={l.id}>
                  <button type="button" onClick={() => onOpen(l)} className="w-full rounded-lg border border-line bg-surface p-3 text-left shadow-card transition-colors hover:border-line-strong">
                    <p className="flex items-center justify-between gap-2 text-[13px] font-medium text-ink">
                      <span className="truncate">{l.name}</span>
                      {l.temperature === "hot" && <Flame className="h-3.5 w-3.5 shrink-0 text-hot" aria-label="Hot lead" />}
                    </p>
                    <p className="font-mono text-2xs text-ink-3">{formatPhone(l.phone)}</p>
                    {Object.keys(l.capturedInfo).length > 0 && (
                      <div className="mt-2">
                        <CapturedChips info={l.capturedInfo} max={1} />
                      </div>
                    )}
                    <p className="mt-2 text-2xs text-ink-3">{l.employeeName ?? sourceLabel(l.source)} · {formatRelative(l.lastContactedAt ?? l.createdAt)}</p>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-3">Pipeline shows up to 100 leads matching your filters. Columns group leads by call outcome.</p>
    </div>
  );
}
