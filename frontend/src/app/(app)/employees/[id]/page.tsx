"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, MessagesSquare, Pause, Play, Save, Trash2 } from "lucide-react";
import { formatDate, formatDateTime, formatDuration, formatNumber, formatPhone, formatRelative } from "@/lib/utils";
import { CALLING_MODES, WEEKDAYS, languageLabel } from "@/lib/labels";
import { can } from "@/lib/capabilities";
import { toApiError } from "@/lib/api/errors";
import { useAsync } from "@/hooks/useAsync";
import { employeesService } from "@/services/employees";
import { conversationsService } from "@/services/conversations";
import type { Conversation, Employee } from "@/types/domain";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, DetailRow } from "@/components/ui/Card";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Tabs } from "@/components/ui/Tabs";
import { Avatar, BackendNotice, NeedsBackend, Pagination } from "@/components/ui/Misc";
import { EmptyState, ErrorState, Skeleton, SkeletonRows } from "@/components/ui/States";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { CallStatusBadge, CallingModeBadge, EmployeeStatusBadge, OutcomeBadge } from "@/components/domain/Badges";
import { ConversationSheet } from "@/features/conversations/ConversationSheet";

type Tab = "overview" | "instructions" | "activity";

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const emp = useAsync(() => employeesService.get(id), `employee:${id}`);
  const [tab, setTab] = useState<Tab>("overview");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  if (emp.error) {
    return (
      <Card>
        <ErrorState error={emp.error} onRetry={emp.error.kind === "not_found" ? undefined : emp.refetch} />
        <div className="pb-8 text-center">
          <LinkButton href="/employees" size="sm">Back to your team</LinkButton>
        </div>
      </Card>
    );
  }
  if (!emp.data) {
    return (
      <div className="space-y-4" role="status" aria-label="Loading">
        <Skeleton className="h-14 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  const e = emp.data;

  async function toggle() {
    setBusy(true);
    try {
      const updated = await employeesService.update(e.id, { status: e.status === "active" ? "paused" : "active" });
      emp.setData((prev) => ({ ...(prev as Employee), status: updated.status }));
      toast.success(updated.status === "active" ? `${e.name} is active` : `${e.name} is paused`);
    } catch (err) {
      toast.fromError(err, "Couldn't update status");
    } finally {
      setBusy(false);
    }
  }

  async function duplicate() {
    try {
      const copy = await employeesService.duplicate(e.id);
      toast.success(`Created “${copy.name}”`);
      router.push(`/employees/${copy.id}`);
    } catch (err) {
      toast.fromError(err, "Couldn't duplicate");
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await employeesService.remove(e.id);
      toast.success(`${e.name} was removed`);
      router.push("/employees");
    } catch (err) {
      toast.fromError(err, "Couldn't delete");
      setBusy(false);
    }
  }

  return (
    <>
      <Link href="/employees" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-ink-2 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Your team
      </Link>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <Avatar name={e.name} size="lg" />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight text-ink">{e.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <EmployeeStatusBadge status={e.status} />
              <CallingModeBadge mode={e.callingMode} />
              {e.role && <span className="text-[13px] text-ink-2">{e.role}</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={toggle} loading={busy} disabled={!can("employees.update")} icon={e.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}>
            {e.status === "active" ? "Pause" : "Activate"}
          </Button>
          <Button onClick={duplicate} disabled={!can("employees.duplicate")} icon={<Copy className="h-4 w-4" />}>
            Duplicate
          </Button>
          <Button variant="outline-danger" onClick={() => setConfirmDelete(true)} disabled={!can("employees.delete")} icon={<Trash2 className="h-4 w-4" />}>
            Delete
          </Button>
        </div>
      </div>

      <Tabs
        className="mb-5"
        ariaLabel="Employee sections"
        value={tab}
        onChange={setTab}
        items={[
          { value: "overview", label: "Overview" },
          { value: "instructions", label: "Instructions" },
          { value: "activity", label: "Activity" },
        ]}
      />

      {tab === "overview" && <Overview e={e} />}
      {tab === "instructions" && <InstructionsEditor e={e} onSaved={(u) => emp.setData(() => ({ ...e, ...u }))} />}
      {tab === "activity" && <Activity employeeId={e.id} />}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={remove}
        loading={busy}
        tone="danger"
        title={`Delete ${e.name}?`}
        description="This removes the AI employee and its configuration. Past calls and leads stay in your workspace."
        confirmLabel="Delete"
      />
    </>
  );
}

function Overview({ e }: { e: Employee }) {
  const notStored = <span className="font-normal text-ink-3">Not stored yet</span>;
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader title="Opening line" />
          <CardBody>
            <p className="rounded-xl bg-subtle px-4 py-3 text-[14px] leading-relaxed text-ink">“{e.firstMessage}”</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Qualification questions" action={e.qualificationQuestions === null ? <NeedsBackend what="Structured qualification questions" /> : undefined} />
          <CardBody>
            {e.qualificationQuestions === null ? (
              <p className="text-[13px] text-ink-2">The backend doesn&apos;t store questions as fields yet — they&apos;re part of this employee&apos;s instructions.</p>
            ) : e.qualificationQuestions.length === 0 ? (
              <p className="text-[13px] text-ink-3">No questions configured.</p>
            ) : (
              <ol className="space-y-2">
                {e.qualificationQuestions.map((q, i) => (
                  <li key={q.id} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2 text-[13px]">
                    <span className="text-ink">
                      {i + 1}. {q.question}
                    </span>
                    <span className="shrink-0 font-mono text-xs text-ink-3">{q.field}</span>
                  </li>
                ))}
              </ol>
            )}
          </CardBody>
        </Card>
      </div>
      <div className="space-y-4">
        <Card>
          <CardHeader title="Configuration" />
          <CardBody className="pt-2">
            <dl className="divide-y divide-line">
              <DetailRow label="Language">{languageLabel(e.language)}</DetailRow>
              <DetailRow label="Voice">{e.voiceId}</DetailRow>
              <DetailRow label="Calling mode">{e.callingMode ? CALLING_MODES[e.callingMode].label : notStored}</DetailRow>
              <DetailRow label="Natural speech">{e.naturalSpeech === null ? notStored : e.naturalSpeech ? "On" : "Off"}</DetailRow>
              <DetailRow label="Follow-ups">{e.followUp ? `${e.followUp.maxAttempts} attempts, ${e.followUp.retryGapHours}h apart` : notStored}</DetailRow>
              <DetailRow label="Hours">
                {e.workingHours ? `${e.workingHours.days.map((d) => WEEKDAYS[d]).join(" ")} · ${e.workingHours.start}–${e.workingHours.end}` : notStored}
              </DetailRow>
              <DetailRow label="Numbers">{e.channels === null ? <Link className="text-accent hover:underline" href="/channels">See Numbers & channels</Link> : e.channels.length ? e.channels.map(formatPhone).join(", ") : "None assigned"}</DetailRow>
              <DetailRow label="Created">{formatDate(e.createdAt)}</DetailRow>
              <DetailRow label="Updated">{formatRelative(e.updatedAt)}</DetailRow>
            </dl>
          </CardBody>
        </Card>
        {e.stats && (
          <Card>
            <CardHeader title="Activity" />
            <CardBody className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-ink-3">Calls</p>
                <p className="tabular text-lg font-semibold text-ink">{formatNumber(e.stats.calls)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-3">Qualified</p>
                <p className="tabular text-lg font-semibold text-ink">{formatNumber(e.stats.qualified)}</p>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}

function InstructionsEditor({ e, onSaved }: { e: Employee; onSaved: (u: Employee) => void }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: e.name, firstMessage: e.firstMessage, instructions: e.instructions });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const dirty = form.name !== e.name || form.firstMessage !== e.firstMessage || form.instructions !== e.instructions;

  async function save() {
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = "At least 2 characters.";
    if (form.firstMessage.trim().length < 5) errs.firstMessage = "At least 5 characters.";
    if (form.instructions.trim().length < 10) errs.instructions = "At least 10 characters.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const updated = await employeesService.update(e.id, { name: form.name.trim(), firstMessage: form.firstMessage.trim(), instructions: form.instructions.trim() });
      onSaved(updated);
      toast.success("Changes saved");
    } catch (err) {
      const apiErr = toApiError(err);
      setErrors(apiErr.fieldErrors);
      toast.fromError(err, "Couldn't save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardBody className="space-y-4 py-5">
        {!can("employees.structuredConfig") && (
          <BackendNotice title="Instructions include the wizard settings">Calling mode, questions, follow-ups and hours set during hiring are written into these instructions until the backend stores them separately.</BackendNotice>
        )}
        <Field label="Name" error={errors.name}>
          {(id, d) => <Input id={id} aria-describedby={d} value={form.name} maxLength={100} onChange={(ev) => setForm({ ...form, name: ev.target.value })} invalid={!!errors.name} />}
        </Field>
        <Field label="Opening line" error={errors.firstMessage}>
          {(id, d) => <Textarea id={id} aria-describedby={d} rows={2} maxLength={500} value={form.firstMessage} onChange={(ev) => setForm({ ...form, firstMessage: ev.target.value })} invalid={!!errors.firstMessage} />}
        </Field>
        <Field label="Instructions" error={errors.instructions ?? errors.system_prompt}>
          {(id, d) => <Textarea id={id} aria-describedby={d} rows={14} value={form.instructions} onChange={(ev) => setForm({ ...form, instructions: ev.target.value })} invalid={!!errors.instructions} className="font-mono text-[13px]" />}
        </Field>
        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button disabled={!dirty || saving} onClick={() => setForm({ name: e.name, firstMessage: e.firstMessage, instructions: e.instructions })}>
            Discard
          </Button>
          <Button variant="primary" onClick={save} loading={saving} disabled={!dirty || !can("employees.update")} icon={<Save className="h-4 w-4" />}>
            Save changes
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function Activity({ employeeId }: { employeeId: string }) {
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState<Conversation | null>(null);
  const limit = 10;
  const calls = useAsync(() => conversationsService.list({ employeeId, limit, offset }), `emp-calls:${employeeId}:${offset}`);
  return (
    <Card>
      {calls.error ? (
        <ErrorState error={calls.error} onRetry={calls.refetch} />
      ) : !calls.data ? (
        <SkeletonRows rows={6} />
      ) : calls.data.items.length === 0 ? (
        <EmptyState icon={<MessagesSquare />} title="No calls yet" description="Calls made or answered by this employee will appear here." />
      ) : (
        <>
          <ul className="divide-y divide-line">
            {calls.data.items.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => setOpen(c)} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-subtle">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">{c.callerName ?? formatPhone(c.phone)}</p>
                    <p className="truncate text-xs text-ink-3">{c.summary ?? "No summary"}</p>
                  </div>
                  <span className="hidden text-xs text-ink-3 sm:block">{formatDateTime(c.startedAt)}</span>
                  <span className="tabular w-12 text-right text-xs text-ink-2">{formatDuration(c.durationSec)}</span>
                  {c.outcome ? <OutcomeBadge outcome={c.outcome} /> : <CallStatusBadge status={String(c.status)} />}
                </button>
              </li>
            ))}
          </ul>
          <Pagination offset={offset} limit={limit} count={calls.data.items.length} total={calls.data.total} onChange={setOffset} />
        </>
      )}
      <ConversationSheet conversation={open} onClose={() => setOpen(null)} />
    </Card>
  );
}
