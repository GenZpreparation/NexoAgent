"use client";

import { useState } from "react";
import { MessageCircle, Network, Phone, Plus, Radio, Settings2 } from "lucide-react";
import { formatPhone, isValidPhone } from "@/lib/utils";
import { can } from "@/lib/capabilities";
import { isMockMode } from "@/lib/config";
import { toApiError } from "@/lib/api/errors";
import { useAsync } from "@/hooks/useAsync";
import { channelsService } from "@/services/channels";
import { employeesService } from "@/services/employees";
import type { Channel, ChannelInput } from "@/types/domain";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, DetailRow } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Field";
import { Switch } from "@/components/ui/Switch";
import { NeedsBackend, PageHeader, StatCard } from "@/components/ui/Misc";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/States";
import { Dialog, Sheet } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";

const EMPTY: ChannelInput = { phone: "", name: "", concurrency: 1, assignedEmployeeId: null, dltEntityId: "", dltSenderId: "" };

export default function ChannelsPage() {
  const channels = useAsync(() => channelsService.list(), "channels");
  const employees = useAsync(() => employeesService.list(), "employees");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Channel | null>(null);
  const empName = (id: string | null) => (id ? employees.data?.find((e) => e.id === id)?.name ?? `#${id}` : null);
  const active = channels.data?.filter((c) => c.active) ?? [];

  return (
    <>
      <PageHeader
        title="Numbers & channels"
        description="The phone numbers your AI employees call from and answer, and how many calls each can handle at once."
        actions={<Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)}>Add number</Button>}
      />

      <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3" aria-label="Channel summary">
        <StatCard label="Numbers" value={channels.data?.length ?? "—"} icon={<Phone />} tone="accent" loading={!channels.data && !channels.error} />
        <StatCard label="Active numbers" value={channels.data ? active.length : "—"} icon={<Radio />} tone="success" loading={!channels.data && !channels.error} />
        <StatCard label="Simultaneous lines" value={channels.data ? active.reduce((s, c) => s + c.concurrency, 0) : "—"} icon={<Network />} loading={!channels.data && !channels.error} hint="Across active numbers" />
      </section>

      <Card className="overflow-hidden">
        {channels.error ? (
          <ErrorState error={channels.error} onRetry={channels.refetch} />
        ) : !channels.data ? (
          <SkeletonRows rows={3} />
        ) : channels.data.length === 0 ? (
          <EmptyState
            icon={<Phone />}
            title="No numbers yet"
            description="Add a business phone number so your AI employees can call leads and answer incoming calls."
            action={<Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)}>Add number</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-[13px]">
              <thead>
                <tr className="border-b border-line bg-subtle/60 text-left text-xs text-ink-3">
                  <th className="px-5 py-2.5 font-medium">Number</th>
                  <th className="px-3 py-2.5 font-medium">Type</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Assigned employee</th>
                  <th className="px-3 py-2.5 text-right font-medium">Lines</th>
                  <th className="px-3 py-2.5 font-medium">DLT</th>
                  <th className="w-24 px-5 py-2.5"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {channels.data.map((c) => (
                  <tr key={c.id} className="hover:bg-subtle">
                    <td className="px-5 py-3">
                      <span className="block font-mono font-medium text-ink">{formatPhone(c.phone)}</span>
                      <span className="block text-xs text-ink-3">{c.name}</span>
                    </td>
                    <td className="px-3 py-3 text-ink-2">Phone</td>
                    <td className="px-3 py-3">{c.active ? <Badge tone="success" dot>Active</Badge> : <Badge dot>Inactive</Badge>}</td>
                    <td className="px-3 py-3 text-ink-2">{empName(c.assignedEmployeeId) ?? <span className="text-ink-3">Unassigned</span>}</td>
                    <td className="tabular px-3 py-3 text-right text-ink">{c.concurrency}</td>
                    <td className="px-3 py-3">{c.dltEntityId ? <Badge tone="info">Registered</Badge> : <span className="text-xs text-ink-3">Not set</span>}</td>
                    <td className="px-5 py-3 text-right">
                      <Button size="sm" icon={<Settings2 className="h-3.5 w-3.5" />} onClick={() => setEditing(c)}>Configure</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <h2 className="mb-3 mt-8 text-sm font-semibold text-ink">Channel types</h2>
      <div className="grid gap-3 md:grid-cols-3">
        {[
          { icon: Phone, title: "Phone numbers", body: "Indian numbers for outbound calling and answering inbound calls.", status: <Badge tone="success">Available</Badge> },
          { icon: MessageCircle, title: "WhatsApp", body: "Send summaries and brochures after calls. Configured on the backend today.", status: can("channels.whatsapp") ? <Badge tone="success">Available</Badge> : <NeedsBackend what="Managing WhatsApp from the app" /> },
          { icon: Network, title: "SIP trunk", body: "Bring your own carrier or PBX for calling.", status: <NeedsBackend what="SIP trunk setup" /> },
        ].map((t) => (
          <Card key={t.title} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-subtle text-ink-2"><t.icon className="h-4 w-4" aria-hidden /></span>
              {t.status}
            </div>
            <p className="mt-3 text-[13px] font-semibold text-ink">{t.title}</p>
            <p className="mt-0.5 text-[13px] leading-snug text-ink-2">{t.body}</p>
          </Card>
        ))}
      </div>

      <AddNumberDialog
        open={adding}
        onClose={() => setAdding(false)}
        employees={employees.data ?? []}
        onAdded={(c) => channels.setData((xs) => [...(xs ?? []), c])}
      />
      <ConfigureSheet
        channel={editing}
        employees={employees.data ?? []}
        onClose={() => setEditing(null)}
        onSaved={(c) => {
          channels.setData((xs) => (xs ?? []).map((x) => (x.id === c.id ? c : x)));
          setEditing(c);
        }}
      />
    </>
  );
}

function AddNumberDialog({ open, onClose, employees, onAdded }: { open: boolean; onClose: () => void; employees: { id: string; name: string }[]; onAdded: (c: Channel) => void }) {
  const toast = useToast();
  const [form, setForm] = useState<ChannelInput>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const close = () => {
    setForm(EMPTY);
    setErrors({});
    onClose();
  };

  async function submit() {
    const phone = form.phone.replace(/[\s()-]/g, "");
    const e: Record<string, string> = {};
    if (!isValidPhone(phone)) e.phone = "Enter a valid number in international format, e.g. +918045678900.";
    if (form.dltSenderId && !/^[A-Za-z]{6}$/.test(form.dltSenderId)) e.dltSenderId = "Sender ID is 6 letters.";
    if (form.dltEntityId && !/^\d{12,20}$/.test(form.dltEntityId)) e.dltEntityId = "Entity ID is 12–20 digits.";
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      const c = await channelsService.create({ ...form, phone: phone.startsWith("+") ? phone : `+${phone}` });
      onAdded(c);
      toast.success("Number added", isMockMode ? "Added to demo data only." : "Registered in your workspace.");
      close();
    } catch (err) {
      const apiErr = toApiError(err);
      if (apiErr.kind === "validation") setErrors({ phone: apiErr.message });
      else toast.fromError(err, "Couldn't add number");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Add a phone number"
      description="Register a number you've provisioned with your telephony provider. Carrier setup and verification happen on the backend."
      footer={
        <>
          <Button onClick={close}>Cancel</Button>
          <Button variant="primary" onClick={submit} loading={saving}>Add number</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Phone number" required error={errors.phone}>
          {(id, d) => <Input id={id} aria-describedby={d} inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} invalid={!!errors.phone} placeholder="+91 80456 78900" className="font-mono" data-autofocus />}
        </Field>
        <Field label="Label" hint="Helps your team recognise this line.">
          {(id, d) => <Input id={id} aria-describedby={d} value={form.name} maxLength={60} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Bengaluru main line" />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Simultaneous lines" hint="1–50">
            {(id, d) => <Input id={id} aria-describedby={d} type="number" min={1} max={50} value={form.concurrency} onChange={(e) => setForm({ ...form, concurrency: Math.max(1, Math.min(50, Number(e.target.value) || 1)) })} />}
          </Field>
          <Field label="Answered by">
            {(id) => (
              <Select id={id} value={form.assignedEmployeeId ?? ""} onChange={(e) => setForm({ ...form, assignedEmployeeId: e.target.value || null })}>
                <option value="">Nobody</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </Select>
            )}
          </Field>
        </div>
        <details className="rounded-xl border border-line px-4 py-3">
          <summary className="cursor-pointer text-[13px] font-medium text-ink">TRAI DLT registration (optional)</summary>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Principal entity ID" error={errors.dltEntityId}>
              {(id, d) => <Input id={id} aria-describedby={d} inputMode="numeric" value={form.dltEntityId} onChange={(e) => setForm({ ...form, dltEntityId: e.target.value.trim() })} invalid={!!errors.dltEntityId} className="font-mono" />}
            </Field>
            <Field label="Sender ID" error={errors.dltSenderId}>
              {(id, d) => <Input id={id} aria-describedby={d} value={form.dltSenderId} maxLength={6} onChange={(e) => setForm({ ...form, dltSenderId: e.target.value.toUpperCase().trim() })} invalid={!!errors.dltSenderId} className="font-mono" />}
            </Field>
          </div>
        </details>
      </div>
    </Dialog>
  );
}

function ConfigureSheet({ channel, employees, onClose, onSaved }: { channel: Channel | null; employees: { id: string; name: string }[]; onClose: () => void; onSaved: (c: Channel) => void }) {
  if (!channel) return null;
  return <ConfigureSheetInner key={channel.id} channel={channel} employees={employees} onClose={onClose} onSaved={onSaved} />;
}

function ConfigureSheetInner({ channel, employees, onClose, onSaved }: { channel: Channel; employees: { id: string; name: string }[]; onClose: () => void; onSaved: (c: Channel) => void }) {
  const toast = useToast();
  const editable = can("channels.update");
  const [form, setForm] = useState({ name: channel.name, assignedEmployeeId: channel.assignedEmployeeId, concurrency: channel.concurrency, active: channel.active });
  const [saving, setSaving] = useState(false);
  const dirty = form.name !== channel.name || form.assignedEmployeeId !== channel.assignedEmployeeId || form.concurrency !== channel.concurrency || form.active !== channel.active;

  async function save() {
    setSaving(true);
    try {
      onSaved(await channelsService.update(channel.id, form));
      toast.success("Number updated");
    } catch (err) {
      toast.fromError(err, "Couldn't update number");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open onClose={onClose} title={formatPhone(channel.phone)} subtitle={channel.name}>
      <div className="space-y-5 p-5">
        {!editable && (
          <p className="rounded-lg bg-accent-soft/60 px-3 py-2 text-[13px] text-ink-2">
            Read-only: editing a number needs a backend endpoint (<code className="font-mono text-xs">PATCH /channels/{"{id}"}</code>).
          </p>
        )}
        <Field label="Label">{(id) => <Input id={id} value={form.name} disabled={!editable} onChange={(e) => setForm({ ...form, name: e.target.value })} />}</Field>
        <Field label="Answered by">
          {(id) => (
            <Select id={id} value={form.assignedEmployeeId ?? ""} disabled={!editable} onChange={(e) => setForm({ ...form, assignedEmployeeId: e.target.value || null })}>
              <option value="">Nobody</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Simultaneous lines">
          {(id) => <Input id={id} type="number" min={1} max={50} value={form.concurrency} disabled={!editable} onChange={(e) => setForm({ ...form, concurrency: Math.max(1, Math.min(50, Number(e.target.value) || 1)) })} />}
        </Field>
        <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
          <span>
            <span className="block text-[13px] font-medium text-ink">Active</span>
            <span className="block text-xs text-ink-3">Inactive numbers don&apos;t make or receive AI calls.</span>
          </span>
          <Switch checked={form.active} disabled={!editable} onChange={(v) => setForm({ ...form, active: v })} label="Active" />
        </div>
        <dl className="divide-y divide-line">
          <DetailRow label="DLT entity ID"><span className="font-mono text-xs">{channel.dltEntityId ?? "—"}</span></DetailRow>
          <DetailRow label="DLT sender ID"><span className="font-mono text-xs">{channel.dltSenderId ?? "—"}</span></DetailRow>
        </dl>
        {editable && (
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button onClick={onClose}>Close</Button>
            <Button variant="primary" disabled={!dirty} loading={saving} onClick={save}>Save</Button>
          </div>
        )}
      </div>
    </Sheet>
  );
}
