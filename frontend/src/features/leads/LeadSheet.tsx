"use client";

import { useState } from "react";
import { CalendarClock, Copy, MessagesSquare } from "lucide-react";
import { formatDateTime, formatPhone, formatRelative, titleCase } from "@/lib/utils";
import { sourceLabel } from "@/lib/labels";
import { can } from "@/lib/capabilities";
import { leadsService } from "@/services/leads";
import type { Lead } from "@/types/domain";
import { Sheet } from "@/components/ui/Dialog";
import { DetailRow } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { NeedsBackend } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import { OutcomeBadge, TemperatureBadge } from "@/components/domain/Badges";

/** Datetime-local value for an ISO string, in the browser's timezone. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function LeadSheet({ lead, onClose, onUpdated }: { lead: Lead | null; onClose: () => void; onUpdated: (l: Lead) => void }) {
  if (!lead) return null;
  return <LeadSheetInner key={lead.id} lead={lead} onClose={onClose} onUpdated={onUpdated} />;
}

function LeadSheetInner({ lead: l, onClose, onUpdated }: { lead: Lead; onClose: () => void; onUpdated: (l: Lead) => void }) {
  const toast = useToast();
  const [when, setWhen] = useState(toLocalInput(l.followUp.at));
  const [saving, setSaving] = useState(false);
  const captured = Object.entries(l.capturedInfo);

  async function saveFollowUp(clear = false) {
    if (!clear && !when) return;
    setSaving(true);
    try {
      const updated = await leadsService.scheduleFollowUp(l.id, clear ? null : new Date(when).toISOString());
      onUpdated(updated);
      if (clear) setWhen("");
      toast.success(clear ? "Follow-up cleared" : "Follow-up scheduled", clear ? undefined : `For ${formatDateTime(updated.followUp.at)}`);
    } catch (err) {
      toast.fromError(err, "Couldn't schedule follow-up");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={l.name}
      subtitle={<span className="font-mono">{formatPhone(l.phone)}</span>}
      actions={
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Copy phone number"
          onClick={() => navigator.clipboard?.writeText(l.phone).then(() => toast.success("Phone number copied"), () => toast.error("Couldn't copy"))}
        >
          <Copy className="h-4 w-4" />
        </Button>
      }
    >
      <div className="space-y-6 p-5">
        <div className="flex flex-wrap gap-1.5">
          <OutcomeBadge outcome={l.outcome} />
          <TemperatureBadge value={l.temperature} />
          {l.qualified && <span className="text-xs font-medium text-success">Qualified</span>}
        </div>

        <section>
          <h3 className="mb-2 text-[13px] font-semibold text-ink">Captured information</h3>
          {captured.length === 0 ? (
            <p className="text-[13px] text-ink-3">Nothing captured yet.</p>
          ) : (
            <dl className="grid gap-2 sm:grid-cols-2">
              {captured.map(([k, v]) => (
                <div key={k} className="rounded-lg border border-line bg-subtle px-3 py-2">
                  <dt className="text-2xs font-medium uppercase tracking-wide text-ink-3">{titleCase(k)}</dt>
                  <dd className="mt-0.5 text-[13px] font-medium text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-ink">Follow-up</h3>
            {!can("leads.followUp") && <NeedsBackend what="Scheduling follow-ups" />}
          </div>
          <p className="mb-2 flex items-center gap-1.5 text-[13px] text-ink-2">
            <CalendarClock className="h-4 w-4 text-ink-3" aria-hidden />
            {l.followUp.status === "none" ? "No follow-up scheduled" : l.followUp.status === "done" ? "Follow-up complete" : `${titleCase(l.followUp.status)} · ${formatDateTime(l.followUp.at)}`}
          </p>
          <div className="flex flex-wrap gap-2">
            <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="w-auto flex-1" aria-label="Follow-up date and time" disabled={!can("leads.followUp")} />
            <Button onClick={() => saveFollowUp()} loading={saving} disabled={!when || !can("leads.followUp")}>
              Schedule
            </Button>
            {l.followUp.at && (
              <Button variant="ghost" onClick={() => saveFollowUp(true)} disabled={saving || !can("leads.followUp")}>
                Clear
              </Button>
            )}
          </div>
          <p className="mt-1.5 text-xs text-ink-3">The AI employee calls back at this time. Execution happens on the backend.</p>
        </section>

        <section>
          <h3 className="mb-1 text-[13px] font-semibold text-ink">Details</h3>
          <dl className="divide-y divide-line">
            <DetailRow label="City">{l.city ?? "—"}</DetailRow>
            <DetailRow label="Source">{sourceLabel(l.source)}</DetailRow>
            {l.campaignName && <DetailRow label="Campaign">{l.campaignName}</DetailRow>}
            <DetailRow label="AI employee">{l.employeeName ?? "—"}</DetailRow>
            <DetailRow label="Channel">{l.channel ? formatPhone(l.channel) : "—"}</DetailRow>
            <DetailRow label="Call attempts">{l.callAttempts}</DetailRow>
            <DetailRow label="Last contacted">{l.lastContactedAt ? `${formatDateTime(l.lastContactedAt)} (${formatRelative(l.lastContactedAt)})` : "Not yet"}</DetailRow>
            <DetailRow label="Created">{formatDateTime(l.createdAt)}</DetailRow>
            {l.tags.length > 0 && <DetailRow label="Tags">{l.tags.join(", ")}</DetailRow>}
          </dl>
        </section>

        <LinkButton href={`/conversations?search=${encodeURIComponent(l.phone)}`} className="w-full" icon={<MessagesSquare className="h-4 w-4" />}>
          View conversations
        </LinkButton>
      </div>
    </Sheet>
  );
}
