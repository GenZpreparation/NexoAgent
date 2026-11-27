"use client";

import { useMemo, useState } from "react";
import { Clock, PhoneIncoming, PhoneMissed, Plus, Radio, Settings2, UserRound } from "lucide-react";
import { formatDateTime, formatDuration, formatDurationLong, formatPhone } from "@/lib/utils";
import { can } from "@/lib/capabilities";
import { useAsync } from "@/hooks/useAsync";
import { conversationsService } from "@/services/conversations";
import { channelsService } from "@/services/channels";
import { employeesService } from "@/services/employees";
import type { Channel, Conversation } from "@/types/domain";
import { Badge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Select } from "@/components/ui/Field";
import { BackendNotice, NeedsBackend, PageHeader, StatCard } from "@/components/ui/Misc";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/States";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { CallStatusBadge, OutcomeBadge } from "@/components/domain/Badges";
import { ConversationSheet } from "@/features/conversations/ConversationSheet";

export default function IncomingCallsPage() {
  const toast = useToast();
  // Backend /calls has no direction filter yet: fetch the latest page and filter client-side.
  const calls = useAsync(() => conversationsService.list({ limit: 100, offset: 0, direction: can("calls.filter.direction") ? "inbound" : undefined }), "incoming:calls", { pollMs: 30_000 });
  const channels = useAsync(() => channelsService.list(), "channels");
  const employees = useAsync(() => employeesService.list(), "employees");
  const [open, setOpen] = useState<Conversation | null>(null);
  const [assigning, setAssigning] = useState<Channel | null>(null);

  const inbound = useMemo(() => (calls.data?.items ?? []).filter((c) => c.direction === "inbound"), [calls.data]);
  const answered = inbound.filter((c) => c.durationSec > 0);
  const avg = answered.length ? Math.round(answered.reduce((s, c) => s + c.durationSec, 0) / answered.length) : 0;
  const empName = (id: string | null) => employees.data?.find((e) => e.id === id)?.name;

  return (
    <>
      <PageHeader
        title="Incoming calls"
        description="Let an AI employee answer your business numbers, capture details and book next steps."
        actions={<LinkButton href="/channels" icon={<Plus className="h-4 w-4" />}>Add a number</LinkButton>}
      />

      <section aria-label="Inbound summary" className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Inbound calls" value={calls.data ? inbound.length : "—"} icon={<PhoneIncoming />} tone="accent" loading={!calls.data && !calls.error} hint="Most recent 100 calls" />
        <StatCard label="Answered" value={calls.data ? answered.length : "—"} icon={<UserRound />} tone="success" loading={!calls.data && !calls.error} />
        <StatCard label="Missed / failed" value={calls.data ? inbound.length - answered.length : "—"} icon={<PhoneMissed />} tone="warning" loading={!calls.data && !calls.error} />
        <StatCard label="Avg handle time" value={calls.data ? formatDurationLong(avg) : "—"} icon={<Clock />} loading={!calls.data && !calls.error} />
      </section>

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardHeader title="Answering numbers" description="Which AI employee picks up on each number." />
          <div className="mt-3">
            {channels.error ? (
              <ErrorState compact error={channels.error} onRetry={channels.refetch} />
            ) : !channels.data ? (
              <SkeletonRows rows={3} />
            ) : channels.data.length === 0 ? (
              <EmptyState compact icon={<Radio />} title="No numbers yet" description="Add a business number, then assign an AI employee to answer it." action={<LinkButton href="/channels" size="sm" variant="primary">Add a number</LinkButton>} />
            ) : (
              <ul className="divide-y divide-line">
                {channels.data.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-[13px] font-medium text-ink">
                        <span className="font-mono">{formatPhone(c.phone)}</span>
                        {!c.active && <Badge>Inactive</Badge>}
                      </p>
                      <p className="truncate text-xs text-ink-3">
                        {c.name} · {c.assignedEmployeeId ? `Answered by ${empName(c.assignedEmployeeId) ?? `#${c.assignedEmployeeId}`}` : "No one answers yet"}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => setAssigning(c)} disabled={!can("channels.update")} title={can("channels.update") ? undefined : "Needs backend support"}>
                      {c.assignedEmployeeId ? "Change" : "Assign"}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {!can("channels.update") && channels.data && channels.data.length > 0 && (
            <p className="border-t border-line px-5 py-3 text-xs text-ink-3">Changing the answering employee needs a backend endpoint (PATCH /channels/{"{id}"}). It can be set when a number is added.</p>
          )}
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader title="Recent inbound calls" action={<Button size="sm" onClick={calls.refetch} loading={calls.loading && !!calls.data}>Refresh</Button>} />
          <div className="mt-3">
            {calls.error ? (
              <ErrorState compact error={calls.error} onRetry={calls.refetch} />
            ) : !calls.data ? (
              <SkeletonRows rows={5} />
            ) : inbound.length === 0 ? (
              <EmptyState compact icon={<PhoneIncoming />} title="No inbound calls yet" description="Once a number is assigned to an AI employee, answered calls will appear here with summaries." />
            ) : (
              <ul className="divide-y divide-line">
                {inbound.slice(0, 12).map((c) => (
                  <li key={c.id}>
                    <button type="button" onClick={() => setOpen(c)} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-subtle">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-ink">{c.callerName ?? formatPhone(c.phone)}</p>
                        <p className="truncate text-xs text-ink-3">{c.summary ?? `${c.employeeName ?? "Unassigned"} · ${formatDateTime(c.startedAt)}`}</p>
                      </div>
                      <span className="tabular hidden w-12 text-right text-xs text-ink-2 sm:block">{formatDuration(c.durationSec)}</span>
                      {c.outcome ? <OutcomeBadge outcome={c.outcome} /> : <CallStatusBadge status={String(c.status)} />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title="Inbound behaviour" description="What happens when a call comes in." action={<Settings2 className="h-4 w-4 text-ink-3" aria-hidden />} />
        <div className="grid gap-3 p-5 md:grid-cols-3">
          {[
            { title: "Greeting", body: "Uses the answering employee's opening line. Edit it on the employee's Instructions tab." },
            { title: "After hours", body: "Callers outside working hours hear a closed message and are added as callback leads.", backend: true },
            { title: "Hand-off to a person", body: "Transfer to a team member when the caller asks for a human.", backend: true },
          ].map((x) => (
            <div key={x.title} className="rounded-xl border border-line bg-subtle p-4">
              <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                {x.title}
                {x.backend && <NeedsBackend what={x.title} />}
              </p>
              <p className="mt-1 text-[13px] leading-snug text-ink-2">{x.body}</p>
            </div>
          ))}
        </div>
      </Card>

      <AssignDialog
        channel={assigning}
        employees={employees.data ?? []}
        onClose={() => setAssigning(null)}
        onSave={async (employeeId) => {
          if (!assigning) return;
          try {
            const updated = await channelsService.update(assigning.id, { assignedEmployeeId: employeeId });
            channels.setData((xs) => (xs ?? []).map((x) => (x.id === updated.id ? updated : x)));
            toast.success("Answering employee updated");
            setAssigning(null);
          } catch (err) {
            toast.fromError(err, "Couldn't update number");
          }
        }}
      />
      <ConversationSheet conversation={open} onClose={() => setOpen(null)} />
    </>
  );
}

function AssignDialog({ channel, employees, onClose, onSave }: { channel: Channel | null; employees: { id: string; name: string; status: string }[]; onClose: () => void; onSave: (id: string | null) => Promise<void> }) {
  const [value, setValue] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const current = value ?? channel?.assignedEmployeeId ?? "";
  return (
    <Dialog
      open={!!channel}
      onClose={() => { setValue(null); onClose(); }}
      title="Who answers this number?"
      description={channel ? formatPhone(channel.phone) : undefined}
      size="sm"
      footer={
        <>
          <Button onClick={() => { setValue(null); onClose(); }}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={async () => { setSaving(true); await onSave(current || null); setSaving(false); setValue(null); }}>Save</Button>
        </>
      }
    >
      {employees.length === 0 ? (
        <BackendNotice title="No AI employees yet">Hire an AI employee with the Inbound calling mode first.</BackendNotice>
      ) : (
        <Field label="AI employee">
          {(id) => (
            <Select id={id} value={current} onChange={(e) => setValue(e.target.value)}>
              <option value="">Nobody (don&apos;t answer)</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.name}{e.status !== "active" ? " (paused)" : ""}</option>
              ))}
            </Select>
          )}
        </Field>
      )}
    </Dialog>
  );
}
