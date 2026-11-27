"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileUp, Megaphone, MoreHorizontal, Pause, Play, Plus, Upload, Users } from "lucide-react";
import { formatDate, formatNumber, formatPhone, formatRelative, titleCase } from "@/lib/utils";
import { isMockMode } from "@/lib/config";
import { can } from "@/lib/capabilities";
import { useAsync } from "@/hooks/useAsync";
import { campaignsService } from "@/services/campaigns";
import { employeesService } from "@/services/employees";
import type { Campaign, CsvUploadResult } from "@/types/domain";
import { Button } from "@/components/ui/Button";
import { Card, DetailRow } from "@/components/ui/Card";
import { Field, Input, SearchInput, Select } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Tabs";
import { BackendNotice, PageHeader, Progress } from "@/components/ui/Misc";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/States";
import { ConfirmDialog, Dialog, Sheet } from "@/components/ui/Dialog";
import { Popover, MenuItem } from "@/components/ui/Popover";
import { useToast } from "@/components/ui/Toast";
import { CampaignStatusBadge } from "@/components/domain/Badges";

type StatusFilter = "all" | "running" | "paused" | "draft" | "completed";

export default function CampaignsPage() {
  return (
    <Suspense>
      <CampaignsInner />
    </Suspense>
  );
}

function CampaignsInner() {
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const campaigns = useAsync(() => campaignsService.list(), "campaigns");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(params.get("new") === "1");
  const [openId, setOpenId] = useState<string | null>(params.get("open"));
  const [uploadFor, setUploadFor] = useState<Campaign | null>(null);
  const [startFor, setStartFor] = useState<Campaign | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const n = search.trim().toLowerCase();
    return (campaigns.data ?? []).filter((c) => (filter === "all" || c.status === filter) && (!n || c.name.toLowerCase().includes(n) || (c.employeeName ?? "").toLowerCase().includes(n)));
  }, [campaigns.data, filter, search]);
  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    (campaigns.data ?? []).forEach((c) => (m[c.status] = (m[c.status] ?? 0) + 1));
    return m;
  }, [campaigns.data]);
  const open = campaigns.data?.find((c) => c.id === openId) ?? null;

  const patch = (id: string, p: Partial<Campaign>) => campaigns.setData((xs) => (xs ?? []).map((c) => (c.id === id ? { ...c, ...p } : c)));

  async function start() {
    if (!startFor) return;
    setBusy(true);
    try {
      await campaignsService.start(startFor.id);
      patch(startFor.id, { status: "running" });
      toast.success(`“${startFor.name}” started`, isMockMode ? "Demo only — no calls are placed." : "The backend has started dialing.");
      setStartFor(null);
      if (!isMockMode) campaigns.refetch();
    } catch (err) {
      toast.fromError(err, "Couldn't start campaign");
    } finally {
      setBusy(false);
    }
  }

  async function pause(c: Campaign) {
    try {
      await campaignsService.pause(c.id);
      patch(c.id, { status: "paused" });
      toast.success(`“${c.name}” paused`);
    } catch (err) {
      toast.fromError(err, "Couldn't pause campaign");
    }
  }

  function closeCreate() {
    setCreating(false);
    if (params.get("new")) router.replace("/campaigns");
  }

  const actions = (c: Campaign) => (
    <Popover
      align="end"
      className="w-48"
      trigger={({ toggle, open: o }) => (
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${c.name}`} aria-expanded={o} onClick={(e) => { e.stopPropagation(); toggle(); }}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      )}
    >
      {(close) => (
        <div role="menu" onClick={(e) => e.stopPropagation()}>
          {c.status === "running" ? (
            <MenuItem icon={<Pause className="h-4 w-4" />} disabled={!can("campaigns.pause")} hint={can("campaigns.pause") ? undefined : "Needs backend"} onSelect={() => { close(); pause(c); }}>Pause</MenuItem>
          ) : c.status !== "completed" ? (
            <MenuItem icon={<Play className="h-4 w-4" />} disabled={c.totalLeads === 0} hint={c.totalLeads === 0 ? "No leads" : undefined} onSelect={() => { close(); setStartFor(c); }}>
              Start
            </MenuItem>
          ) : null}
          <MenuItem icon={<Upload className="h-4 w-4" />} disabled={c.status === "completed"} onSelect={() => { close(); setUploadFor(c); }}>Upload leads (CSV)</MenuItem>
          <MenuItem icon={<Users className="h-4 w-4" />} onSelect={() => { close(); setOpenId(c.id); }}>View details</MenuItem>
        </div>
      )}
    </Popover>
  );

  return (
    <>
      <PageHeader
        title="Campaigns"
        description="Have an AI employee work through a list of leads at a pace you control."
        actions={<Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>New campaign</Button>}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Segmented
          ariaLabel="Filter by status"
          value={filter}
          onChange={setFilter}
          className="max-w-full overflow-x-auto"
          items={(["all", "running", "paused", "draft", "completed"] as StatusFilter[]).map((s) => ({
            value: s,
            label: `${s === "all" ? "All" : titleCase(s)}${s === "all" ? "" : counts[s] ? ` ${counts[s]}` : ""}`,
          }))}
        />
        <SearchInput value={search} onChange={setSearch} placeholder="Search campaigns" className="sm:ml-auto sm:w-64" label="Search campaigns" />
      </div>

      <Card className="overflow-hidden">
        {campaigns.error ? (
          <ErrorState error={campaigns.error} onRetry={campaigns.refetch} />
        ) : !campaigns.data ? (
          <SkeletonRows rows={5} />
        ) : campaigns.data.length === 0 ? (
          <EmptyState
            icon={<Megaphone />}
            title="No campaigns yet"
            description="Create a campaign, upload a CSV of leads, pick an AI employee — then start it when you're ready."
            action={<Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>New campaign</Button>}
          />
        ) : rows.length === 0 ? (
          <EmptyState icon={<Megaphone />} title="No campaigns match" description="Try another status or search." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-[13px]">
              <thead>
                <tr className="border-b border-line bg-subtle/60 text-left text-xs text-ink-3">
                  <th className="px-5 py-2.5 font-medium">Campaign</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">AI employee</th>
                  <th className="w-56 px-3 py-2.5 font-medium">Progress</th>
                  <th className="px-3 py-2.5 text-right font-medium">Connected</th>
                  <th className="px-3 py-2.5 font-medium">Created</th>
                  <th className="w-12 px-3 py-2.5"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((c) => {
                  const pct = c.totalLeads ? (c.dialed / c.totalLeads) * 100 : 0;
                  return (
                    <tr key={c.id} className="cursor-pointer hover:bg-subtle" onClick={() => setOpenId(c.id)}>
                      <td className="px-5 py-3">
                        <button type="button" className="text-left" onClick={(e) => { e.stopPropagation(); setOpenId(c.id); }}>
                          <span className="block font-medium text-ink">{c.name}</span>
                          <span className="block text-xs text-ink-3">{c.source}</span>
                        </button>
                      </td>
                      <td className="px-3 py-3"><CampaignStatusBadge status={c.status} /></td>
                      <td className="px-3 py-3 text-ink-2">{c.employeeName ?? `#${c.employeeId}`}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <Progress value={pct} tone={c.status === "completed" ? "success" : "accent"} />
                          <span className="tabular w-24 shrink-0 text-right text-xs text-ink-2">
                            {formatNumber(c.dialed)} / {formatNumber(c.totalLeads)}
                          </span>
                        </div>
                      </td>
                      <td className="tabular px-3 py-3 text-right text-ink">{formatNumber(c.connected)}</td>
                      <td className="px-3 py-3 text-ink-2">{formatDate(c.createdAt)}</td>
                      <td className="px-3 py-3 text-right">{actions(c)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <CreateCampaignDialog
        open={creating}
        onClose={closeCreate}
        onCreated={(c, uploaded) => {
          campaigns.setData((xs) => [c, ...(xs ?? [])]);
          if (uploaded) campaigns.refetch();
          setOpenId(c.id);
        }}
      />
      <UploadDialog campaign={uploadFor} onClose={() => setUploadFor(null)} onUploaded={() => campaigns.refetch()} />
      <ConfirmDialog
        open={!!startFor}
        onClose={() => setStartFor(null)}
        onConfirm={start}
        loading={busy}
        title={`Start “${startFor?.name ?? ""}”?`}
        confirmLabel="Start campaign"
        description={
          isMockMode
            ? "Demo mode: this only changes the campaign status in your browser. No calls are placed."
            : `The backend will begin calling ${formatNumber(startFor?.totalLeads ?? 0)} lead(s) with ${startFor?.employeeName ?? "the selected AI employee"}, up to ${startFor?.concurrency ?? 1} at a time. Calls use credits.`
        }
      />
      <CampaignSheet campaign={open} onClose={() => { setOpenId(null); if (params.get("open")) router.replace("/campaigns"); }} onStart={(c) => setStartFor(c)} onUpload={(c) => setUploadFor(c)} />
    </>
  );
}

function CreateCampaignDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (c: Campaign, uploaded: boolean) => void }) {
  const toast = useToast();
  const employees = useAsync(() => employeesService.list(), "employees", { enabled: open });
  const [form, setForm] = useState({ name: "", employeeId: "", concurrency: 5 });
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function reset() {
    setForm({ name: "", employeeId: "", concurrency: 5 });
    setFile(null);
    setErrors({});
  }

  async function submit() {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = "Give the campaign a name (2+ characters).";
    if (!form.employeeId) e.employeeId = "Choose an AI employee.";
    if (file && !/\.csv$/i.test(file.name)) e.file = "Upload a .csv file.";
    if (file && file.size > 10 * 1024 * 1024) e.file = "File must be under 10 MB.";
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      const c = await campaignsService.create({ name: form.name, employeeId: form.employeeId, concurrency: form.concurrency });
      let uploaded = false;
      if (file) {
        try {
          const r = await campaignsService.uploadCsv(c.id, file);
          uploaded = true;
          toast.success("Campaign created", `${formatNumber(r.added)} lead(s) added. Start it when you're ready.`);
        } catch (err) {
          toast.fromError(err, "Campaign created, but the CSV upload failed");
        }
      } else {
        toast.success("Campaign created as a draft", "Upload leads, then start it.");
      }
      onCreated(c, uploaded);
      reset();
      onClose();
    } catch (err) {
      toast.fromError(err, "Couldn't create campaign");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => { reset(); onClose(); }}
      title="New campaign"
      description="Campaigns are created as drafts — nothing is dialed until you start one."
      footer={
        <>
          <Button onClick={() => { reset(); onClose(); }} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={submit} loading={saving}>Create draft</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Campaign name" required error={errors.name}>
          {(id, d) => <Input id={id} aria-describedby={d} value={form.name} maxLength={150} onChange={(e) => setForm({ ...form, name: e.target.value })} invalid={!!errors.name} placeholder="e.g. Diwali offer follow-ups" data-autofocus />}
        </Field>
        <Field label="AI employee" required error={errors.employeeId} hint={employees.data?.length === 0 ? "You need to hire an AI employee first." : undefined}>
          {(id, d) => (
            <Select id={id} aria-describedby={d} value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} invalid={!!errors.employeeId}>
              <option value="">{employees.data ? "Select…" : "Loading…"}</option>
              {(employees.data ?? []).map((e) => (
                <option key={e.id} value={e.id} disabled={e.status !== "active"}>
                  {e.name}
                  {e.status !== "active" ? " (paused)" : ""}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Simultaneous calls" hint="How many calls run at once (1–50). Limited by your channels.">
          {(id, d) => <Input id={id} aria-describedby={d} type="number" min={1} max={50} value={form.concurrency} onChange={(e) => setForm({ ...form, concurrency: Math.max(1, Math.min(50, Number(e.target.value) || 1)) })} />}
        </Field>
        <CsvPicker file={file} onChange={setFile} error={errors.file} />
      </div>
    </Dialog>
  );
}

function CsvPicker({ file, onChange, error }: { file: File | null; onChange: (f: File | null) => void; error?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <span className="label block">Leads (optional)</span>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="mt-1.5 flex w-full items-center gap-3 rounded-xl border border-dashed border-line-strong bg-subtle px-4 py-4 text-left transition-colors hover:border-accent/50"
      >
        <FileUp className="h-5 w-5 shrink-0 text-ink-3" aria-hidden />
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-medium text-ink">{file ? file.name : "Choose a CSV file"}</span>
          <span className="block text-xs text-ink-3">{file ? `${(file.size / 1024).toFixed(1)} KB` : "Columns: name, phone (required), city and any extra fields"}</span>
        </span>
      </button>
      <input ref={ref} type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => onChange(e.target.files?.[0] ?? null)} aria-label="Leads CSV file" />
      {error && <p className="mt-1 text-xs text-danger" role="alert">{error}</p>}
      <p className="mt-1.5 text-xs text-ink-3">Numbers are cleaned, de-duplicated and DND-checked by the backend.</p>
    </div>
  );
}

function UploadDialog({ campaign, onClose, onUploaded }: { campaign: Campaign | null; onClose: () => void; onUploaded: () => void }) {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<CsvUploadResult | null>(null);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!campaign) {
      Promise.resolve().then(() => {
        setFile(null);
        setResult(null);
        setError(undefined);
      });
    }
  }, [campaign]);

  async function upload() {
    if (!campaign || !file) return;
    if (!/\.csv$/i.test(file.name)) return setError("Upload a .csv file.");
    setSaving(true);
    try {
      const r = await campaignsService.uploadCsv(campaign.id, file);
      setResult(r);
      onUploaded();
      toast.success(`${formatNumber(r.added)} lead(s) added`);
    } catch (err) {
      toast.fromError(err, "Upload failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={!!campaign}
      onClose={onClose}
      title="Upload leads"
      description={campaign ? `Add leads to “${campaign.name}”.` : undefined}
      footer={
        result ? (
          <Button variant="primary" onClick={onClose}>Done</Button>
        ) : (
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={upload} loading={saving} disabled={!file}>Upload</Button>
          </>
        )
      }
    >
      {result ? (
        <dl className="divide-y divide-line">
          <DetailRow label="Leads added">{formatNumber(result.added)}</DetailRow>
          {result.processed !== null && <DetailRow label="Rows processed">{formatNumber(result.processed)}</DetailRow>}
          {result.duplicates !== null && <DetailRow label="Duplicates skipped">{formatNumber(result.duplicates)}</DetailRow>}
          {result.invalid !== null && <DetailRow label="Invalid numbers">{formatNumber(result.invalid)}</DetailRow>}
          {result.dndBlocked !== null && <DetailRow label="DND blocked">{formatNumber(result.dndBlocked)}</DetailRow>}
        </dl>
      ) : (
        <CsvPicker file={file} onChange={(f) => { setFile(f); setError(undefined); }} error={error} />
      )}
    </Dialog>
  );
}

function CampaignSheet({ campaign: c, onClose, onStart, onUpload }: { campaign: Campaign | null; onClose: () => void; onStart: (c: Campaign) => void; onUpload: (c: Campaign) => void }) {
  const leads = useAsync(() => campaignsService.leads(c!.id), `campaign-leads:${c?.id}`, { enabled: !!c });
  if (!c) return null;
  const pct = c.totalLeads ? (c.dialed / c.totalLeads) * 100 : 0;
  return (
    <Sheet open onClose={onClose} title={c.name} subtitle={<CampaignStatusBadge status={c.status} />} width="lg">
      <div className="space-y-6 p-5">
        <div className="grid grid-cols-3 gap-3">
          {[
            ["Leads", c.totalLeads],
            ["Dialed", c.dialed],
            ["Connected", c.connected],
          ].map(([label, v]) => (
            <div key={label} className="rounded-xl border border-line p-3">
              <p className="text-xs text-ink-3">{label}</p>
              <p className="tabular mt-0.5 text-lg font-semibold text-ink">{formatNumber(Number(v))}</p>
            </div>
          ))}
        </div>
        <div>
          <div className="mb-1.5 flex justify-between text-xs text-ink-2">
            <span>Progress</span>
            <span className="tabular">{Math.round(pct)}%</span>
          </div>
          <Progress value={pct} />
        </div>
        <div className="flex flex-wrap gap-2">
          {c.status !== "running" && c.status !== "completed" && (
            <Button variant="primary" icon={<Play className="h-4 w-4" />} disabled={c.totalLeads === 0} onClick={() => onStart(c)}>
              Start campaign
            </Button>
          )}
          {c.status !== "completed" && <Button icon={<Upload className="h-4 w-4" />} onClick={() => onUpload(c)}>Upload leads</Button>}
        </div>
        {c.totalLeads === 0 && <BackendNotice title="Upload leads to start">A campaign needs at least one lead before it can start.</BackendNotice>}
        <dl className="divide-y divide-line">
          <DetailRow label="AI employee">{c.employeeName ?? `#${c.employeeId}`}</DetailRow>
          <DetailRow label="Source">{c.source}</DetailRow>
          <DetailRow label="Simultaneous calls">{c.concurrency}</DetailRow>
          <DetailRow label="Created">{formatDate(c.createdAt)}</DetailRow>
        </dl>
        <section>
          <h3 className="mb-2 text-[13px] font-semibold text-ink">Leads in this campaign</h3>
          {leads.error ? (
            <ErrorState compact error={leads.error} onRetry={leads.refetch} />
          ) : !leads.data ? (
            <SkeletonRows rows={4} />
          ) : leads.data.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line-strong p-4 text-center text-[13px] text-ink-3">No leads uploaded yet.</p>
          ) : (
            <ul className="divide-y divide-line rounded-xl border border-line">
              {leads.data.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 px-3 py-2 text-[13px]">
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink">{l.name}</span>
                    <span className="block font-mono text-xs text-ink-3">{formatPhone(l.phone)}</span>
                  </span>
                  <span className="text-right">
                    <span className="block text-xs font-medium text-ink-2">{titleCase(l.status)}</span>
                    <span className="block text-2xs text-ink-3">{l.lastCalledAt ? formatRelative(l.lastCalledAt) : "Not called"}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Sheet>
  );
}
