"use client";

import { useState } from "react";
import { ArrowRight, Clock, Globe, Link2, Megaphone, PhoneCall, Plug, Plus, Settings2, Sparkles, Trash2, Webhook, Zap } from "lucide-react";
import { cn, formatPhone, formatRelative } from "@/lib/utils";
import { SOURCE_PROVIDERS, sourceLabel } from "@/lib/labels";
import { can } from "@/lib/capabilities";
import { isMockMode } from "@/lib/config";
import { useAsync, type AsyncState } from "@/hooks/useAsync";
import { instantLeadsService } from "@/services/instantLeads";
import { leadsService } from "@/services/leads";
import { employeesService } from "@/services/employees";
import type { InstantLeadSettings, LeadSource, SourceProvider } from "@/types/domain";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, Select } from "@/components/ui/Field";
import { SwitchRow } from "@/components/ui/Switch";
import { Tabs } from "@/components/ui/Tabs";
import { BackendNotice, PageHeader, StatCard } from "@/components/ui/Misc";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/States";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { ChartCard, DataTable, TimeSeriesChart } from "@/components/charts/Charts";
import { OutcomeBadge } from "@/components/domain/Badges";

type Tab = "activity" | "analytics" | "queue" | "sources";
const INSTANT_SOURCES = ["meta_ads", "meta_lead_ads", "google_ads", "website_form", "webhook", "crm", "api"];
const PROVIDER_ICONS: Record<SourceProvider, typeof Megaphone> = { meta_ads: Megaphone, google_ads: Globe, website_form: Link2, webhook: Webhook, crm: Plug };

export default function InstantLeadsPage() {
  const [tab, setTab] = useState<Tab>("activity");
  const [connectOpen, setConnectOpen] = useState(false);
  const sources = useAsync(() => instantLeadsService.sources(), "il:sources", { enabled: can("instantLeads.sources") });

  return (
    <>
      <PageHeader
        title="Instant leads"
        description="Call every new lead within seconds of it arriving — while they're still interested."
        actions={
          <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setConnectOpen(true)}>
            Connect a source
          </Button>
        }
      />

      <HowItWorks />

      <Tabs
        className="mb-5 mt-6"
        ariaLabel="Instant leads sections"
        value={tab}
        onChange={setTab}
        items={[
          { value: "activity", label: "Activity" },
          { value: "analytics", label: "Analytics" },
          { value: "queue", label: "Queue" },
          { value: "sources", label: "Sources", count: sources.data?.length },
        ]}
      />

      {tab === "activity" && <Activity />}
      {tab === "analytics" && <Analytics />}
      {tab === "queue" && <Queue />}
      {tab === "sources" && <Sources state={sources} onConnect={() => setConnectOpen(true)} />}

      <ConnectDialog open={connectOpen} onClose={() => setConnectOpen(false)} onConnected={(s) => sources.setData((xs) => [...(xs ?? []), s])} />
    </>
  );
}

function HowItWorks() {
  const steps = [
    { icon: Megaphone, title: "A lead arrives", body: "From a Meta or Google ad, your website form, or your CRM." },
    { icon: PhoneCall, title: "Your AI employee calls", body: "Within seconds — during your working hours, with retries if busy." },
    { icon: Sparkles, title: "Results are captured", body: "Answers, outcome and summary land in Leads, ready for follow-up." },
  ];
  return (
    <Card className="overflow-hidden">
      <ol className="grid divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
        {steps.map((s, i) => (
          <li key={s.title} className="relative flex gap-3.5 p-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-ink">
              <s.icon className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <span>
              <span className="text-2xs font-semibold uppercase tracking-wide text-ink-3">Step {i + 1}</span>
              <span className="mt-0.5 block text-sm font-semibold text-ink">{s.title}</span>
              <span className="mt-0.5 block text-[13px] leading-snug text-ink-2">{s.body}</span>
            </span>
            {i < steps.length - 1 && <ArrowRight className="absolute -right-2.5 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 rounded-full border border-line bg-surface p-0.5 text-ink-3 md:block" aria-hidden />}
          </li>
        ))}
      </ol>
    </Card>
  );
}

function Activity() {
  const leads = useAsync(() => leadsService.list({ limit: 100, offset: 0, sort: "recent" }), "il:activity");
  const rows = (leads.data?.items ?? []).filter((l) => INSTANT_SOURCES.includes(l.source)).slice(0, 20);
  return (
    <Card>
      <CardHeader title="Recent instant leads" description="New leads from connected sources and what happened next." />
      <div className="mt-3">
        {leads.error ? (
          <ErrorState compact error={leads.error} onRetry={leads.refetch} />
        ) : !leads.data ? (
          <SkeletonRows rows={5} />
        ) : rows.length === 0 ? (
          <EmptyState compact icon={<Zap />} title="No instant leads yet" description="Connect a lead source and new leads will be called automatically. They'll show up here." />
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((l) => (
              <li key={l.id} className="flex items-center gap-3 px-5 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-ink-2">
                  <Zap className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">{l.name}</p>
                  <p className="truncate text-xs text-ink-3">
                    {sourceLabel(l.source)} · {formatPhone(l.phone)}
                    {l.employeeName && ` · ${l.employeeName}`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <OutcomeBadge outcome={l.outcome} />
                  <span className="text-2xs text-ink-3">{formatRelative(l.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

function Analytics() {
  const enabled = can("instantLeads.analytics");
  const stats = useAsync(() => instantLeadsService.stats(), "il:stats", { enabled });
  if (!enabled) {
    return <BackendNotice title="Speed-to-lead analytics need backend support">Time from lead arrival to first call, and call-within-60s rates, require an analytics endpoint. See the contract document.</BackendNotice>;
  }
  const s = stats.data;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Leads received (7d)" value={s?.leadsReceived ?? "—"} icon={<Zap />} tone="accent" loading={!s && !stats.error} />
        <StatCard label="Called within 60s" value={s ? `${s.calledWithin60sPct}%` : "—"} icon={<Clock />} tone="success" loading={!s && !stats.error} />
        <StatCard label="Median speed to lead" value={s ? `${s.medianSpeedToLeadSec}s` : "—"} icon={<PhoneCall />} loading={!s && !stats.error} />
        <StatCard label="Connect rate" value={s ? `${s.connectRatePct}%` : "—"} icon={<PhoneCall />} loading={!s && !stats.error} />
      </div>
      <ChartCard
        title="Leads received vs called"
        description="Last 7 days"
        loading={!s && !stats.error}
        error={stats.error}
        onRetry={stats.refetch}
        empty={!!s && s.leadsReceived === 0}
        table={<DataTable columns={["Date", "Received", "Called"]} rows={(s?.daily ?? []).map((d) => [d.date, d.received, d.called])} />}
      >
        <TimeSeriesChart data={s?.daily ?? []} series={[{ key: "received", label: "Received" }, { key: "called", label: "Called" }]} height={220} />
      </ChartCard>
    </div>
  );
}

const QUEUE_STATE: Record<string, { label: string; tone: "accent" | "neutral" | "warning" | "info" }> = {
  dialing: { label: "Dialing", tone: "accent" },
  waiting: { label: "Waiting", tone: "neutral" },
  retry_scheduled: { label: "Retry scheduled", tone: "warning" },
  outside_hours: { label: "Outside hours", tone: "info" },
};

function Queue() {
  const enabled = can("instantLeads.queue");
  const queue = useAsync(() => instantLeadsService.queue(), "il:queue", { enabled, pollMs: 20_000 });
  if (!enabled) {
    return <BackendNotice title="The live queue needs backend support">Leads waiting to be called, retries and out-of-hours holds will appear here once the backend exposes its dialing queue.</BackendNotice>;
  }
  return (
    <Card>
      <CardHeader title="Calling queue" description="Leads waiting for their first call or a retry. Refreshes automatically." action={<Button size="sm" onClick={queue.refetch}>Refresh</Button>} />
      <div className="mt-3">
        {queue.error ? (
          <ErrorState compact error={queue.error} onRetry={queue.refetch} />
        ) : !queue.data ? (
          <SkeletonRows rows={4} />
        ) : queue.data.length === 0 ? (
          <EmptyState compact icon={<Clock />} title="Queue is empty" description="Every lead received so far has been called." />
        ) : (
          <ul className="divide-y divide-line">
            {queue.data.map((q) => (
              <li key={q.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">{q.name}</p>
                  <p className="truncate text-xs text-ink-3">
                    {sourceLabel(q.source)} · received {formatRelative(q.receivedAt)}
                  </p>
                </div>
                {q.nextAttemptAt && <span className="hidden text-xs text-ink-3 sm:block">Next try {formatRelative(q.nextAttemptAt)}</span>}
                <Badge tone={QUEUE_STATE[q.state].tone} dot>
                  {QUEUE_STATE[q.state].label}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

function Sources({ state, onConnect }: { state: AsyncState<LeadSource[]>; onConnect: () => void }) {
  const toast = useToast();
  const employees = useAsync(() => employeesService.list(), "employees");
  const [remove, setRemove] = useState<LeadSource | null>(null);

  if (!can("instantLeads.sources")) {
    return (
      <div className="space-y-4">
        <BackendNotice title="Source management needs backend support">
          The backend can already receive Meta Lead Ads via its webhook, but there&apos;s no API yet to list, connect or configure sources from here.
        </BackendNotice>
        <Card>
          <CardHeader title="Meta Lead Ads webhook (backend)" description="Configured on the backend and in Meta's developer console — not from this page." />
          <CardBody className="space-y-2 text-[13px] text-ink-2">
            <p>
              Endpoint: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-ink">POST /api/v1/webhooks/meta-leads</code> on your backend&apos;s public URL.
            </p>
            <p>Leads received this way are stored with the source “Meta Lead Ads” and appear in the Activity tab.</p>
          </CardBody>
        </Card>
        <SettingsCard />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        {state.error ? (
          <ErrorState error={state.error} onRetry={state.refetch} />
        ) : !state.data ? (
          <SkeletonRows rows={3} />
        ) : state.data.length === 0 ? (
          <EmptyState icon={<Plug />} title="No sources connected" description="Connect an ad account, form or CRM so new leads are called instantly." action={<Button variant="primary" onClick={onConnect} icon={<Plus className="h-4 w-4" />}>Connect a source</Button>} />
        ) : (
          <ul className="divide-y divide-line">
            {state.data.map((s) => {
              const Icon = PROVIDER_ICONS[s.provider];
              const emp = employees.data?.find((e) => e.id === s.employeeId);
              return (
                <li key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-subtle text-ink-2">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-ink">
                      {s.name}
                      {s.status === "connected" ? <Badge tone="success" dot>Connected{isMockMode ? " (demo)" : ""}</Badge> : s.status === "error" ? <Badge tone="danger" dot>Needs attention</Badge> : <Badge dot>Not connected</Badge>}
                    </p>
                    <p className="text-xs text-ink-3">
                      {SOURCE_PROVIDERS[s.provider].label} · {s.leadsLast7d} leads in 7 days · last lead {formatRelative(s.lastLeadAt)} · {emp ? `Calls with ${emp.name}` : "No employee assigned"}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => setRemove(s)}>
                    Disconnect
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      <SettingsCard />
      <ConfirmDialog
        open={!!remove}
        onClose={() => setRemove(null)}
        tone="danger"
        title={`Disconnect ${remove?.name ?? "source"}?`}
        description="New leads from this source will no longer be called automatically. Existing leads are kept."
        confirmLabel="Disconnect"
        onConfirm={async () => {
          if (!remove) return;
          try {
            await instantLeadsService.disconnect(remove.id);
            state.setData((xs) => (xs ?? []).filter((x) => x.id !== remove.id));
            toast.success("Source disconnected");
          } catch (err) {
            toast.fromError(err, "Couldn't disconnect");
          }
          setRemove(null);
        }}
      />
    </div>
  );
}

function SettingsCard() {
  const toast = useToast();
  const enabled = can("instantLeads.settings");
  const settings = useAsync(() => instantLeadsService.settings(), "il:settings", { enabled });
  const employees = useAsync(() => employeesService.list(), "employees");
  const [draft, setDraft] = useState<InstantLeadSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const value = draft ?? settings.data ?? { enabled: false, employeeId: null, delaySeconds: 15, maxAttempts: 3, respectWorkingHours: true };
  const set = (p: Partial<InstantLeadSettings>) => setDraft({ ...value, ...p });

  async function save() {
    setSaving(true);
    try {
      const s = await instantLeadsService.saveSettings(value);
      settings.setData(s);
      setDraft(null);
      toast.success("Instant calling settings saved");
    } catch (err) {
      toast.fromError(err, "Couldn't save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Configuration" description="How new leads are handled." action={<Settings2 className="h-4 w-4 text-ink-3" aria-hidden />} />
      <CardBody className="space-y-1">
        {!enabled && <p className="mb-2 text-xs text-ink-3">Read-only: saving these settings needs backend support.</p>}
        <div className="divide-y divide-line">
          <SwitchRow title="Call new leads automatically" description="Turn off to pause instant calling without disconnecting sources." checked={value.enabled} onChange={(v) => set({ enabled: v })} disabled={!enabled} />
          <SwitchRow title="Respect working hours" description="Outside hours, leads wait and are called when the day starts." checked={value.respectWorkingHours} onChange={(v) => set({ respectWorkingHours: v })} disabled={!enabled} />
        </div>
        <div className="grid gap-4 pt-3 sm:grid-cols-3">
          <Field label="AI employee">
            {(id) => (
              <Select id={id} value={value.employeeId ?? ""} onChange={(e) => set({ employeeId: e.target.value || null })} disabled={!enabled}>
                <option value="">Select…</option>
                {(employees.data ?? []).map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Call after">
            {(id) => (
              <Select id={id} value={value.delaySeconds} onChange={(e) => set({ delaySeconds: Number(e.target.value) })} disabled={!enabled}>
                {[0, 15, 30, 60, 120].map((s) => (
                  <option key={s} value={s}>{s === 0 ? "Immediately" : `${s} seconds`}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Attempts">
            {(id) => (
              <Select id={id} value={value.maxAttempts} onChange={(e) => set({ maxAttempts: Number(e.target.value) })} disabled={!enabled}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        {enabled && (
          <div className="flex justify-end gap-2 pt-4">
            <Button disabled={!draft || saving} onClick={() => setDraft(null)}>Discard</Button>
            <Button variant="primary" disabled={!draft} loading={saving} onClick={save}>Save</Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function ConnectDialog({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: LeadSource) => void }) {
  const toast = useToast();
  const employees = useAsync(() => employeesService.list(), "employees", { enabled: open });
  const [provider, setProvider] = useState<SourceProvider | null>(null);
  const [employeeId, setEmployeeId] = useState("");
  const [saving, setSaving] = useState(false);
  const supported = can("instantLeads.sources");

  function close() {
    setProvider(null);
    setEmployeeId("");
    onClose();
  }

  async function connect() {
    if (!provider) return;
    setSaving(true);
    try {
      const s = await instantLeadsService.connect(provider, employeeId || null);
      onConnected(s);
      toast.success(`${SOURCE_PROVIDERS[provider].label} connected`, isMockMode ? "Demo only — no real account was linked." : undefined);
      close();
    } catch (err) {
      toast.fromError(err, "Couldn't connect source");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Connect a lead source"
      description="Choose where your leads come from."
      size="lg"
      footer={
        <>
          <Button onClick={close}>Cancel</Button>
          <Button variant="primary" onClick={connect} loading={saving} disabled={!provider || !supported}>
            {supported ? "Connect" : "Needs backend"}
          </Button>
        </>
      }
    >
      {!supported && <BackendNotice className="mb-4" title="Connecting sources needs backend support">Account linking (OAuth) and source records must be implemented on the backend first. Nothing will be connected from here yet.</BackendNotice>}
      <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Source type">
        {(Object.keys(SOURCE_PROVIDERS) as SourceProvider[]).map((p) => {
          const Icon = PROVIDER_ICONS[p];
          const active = provider === p;
          return (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setProvider(p)}
              className={cn("flex items-center gap-3 rounded-xl border p-3 text-left transition-colors", active ? "border-accent ring-2 ring-accent/15" : "border-line hover:border-line-strong")}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-subtle text-ink-2">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span>
                <span className="block text-[13px] font-semibold text-ink">{SOURCE_PROVIDERS[p].label}</span>
                <span className="block text-xs text-ink-3">{SOURCE_PROVIDERS[p].description}</span>
              </span>
            </button>
          );
        })}
      </div>
      {provider && (
        <Field label="Which AI employee should call these leads?" className="mt-4">
          {(id) => (
            <Select id={id} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              <option value="">Decide later</option>
              {(employees.data ?? []).map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </Select>
          )}
        </Field>
      )}
    </Dialog>
  );
}
