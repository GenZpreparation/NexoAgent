"use client";

import { useState } from "react";
import { Bot, Copy, FileAudio, Headphones, Loader2, User } from "lucide-react";
import { cn, formatDateTime, formatDurationLong, formatInr, formatPhone, titleCase } from "@/lib/utils";
import { conversationsService } from "@/services/conversations";
import { toApiError } from "@/lib/api/errors";
import type { Conversation } from "@/types/domain";
import { Sheet } from "@/components/ui/Dialog";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { DetailRow } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { CallStatusBadge, OutcomeBadge } from "@/components/domain/Badges";

type Tab = "summary" | "transcript" | "details";

export function ConversationSheet({ conversation, onClose }: { conversation: Conversation | null; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("summary");
  if (!conversation) return null;
  const c = conversation;
  return (
    <Sheet
      open
      onClose={onClose}
      width="lg"
      title={c.callerName ?? formatPhone(c.phone)}
      subtitle={
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>{formatDateTime(c.startedAt)}</span>
          <span aria-hidden>·</span>
          <span>{formatDurationLong(c.durationSec)}</span>
          <span aria-hidden>·</span>
          <span>{c.direction === "inbound" ? "Inbound" : "Outbound"}</span>
        </span>
      }
    >
      <div className="flex flex-wrap items-center gap-2 px-5 pt-4">
        <CallStatusBadge status={String(c.status)} />
        {c.outcome && <OutcomeBadge outcome={c.outcome} />}
        {c.sentiment && <span className="text-xs text-ink-3">Sentiment: {c.sentiment}</span>}
      </div>
      <Tabs
        className="mt-3 px-5"
        ariaLabel="Conversation sections"
        value={tab}
        onChange={setTab}
        items={[
          { value: "summary", label: "Summary" },
          { value: "transcript", label: "Transcript" },
          { value: "details", label: "Details" },
        ]}
      />
      <div className="p-5">
        {tab === "summary" && (
          <div className="space-y-5">
            <RecordingPlayer key={c.id} conversation={c} />
            <section>
              <h3 className="mb-1.5 text-[13px] font-semibold text-ink">Call summary</h3>
              {c.summary ? <p className="text-[13px] leading-relaxed text-ink-2">{c.summary}</p> : <p className="text-[13px] text-ink-3">No summary — the call didn&apos;t connect or hasn&apos;t been analysed.</p>}
            </section>
            <CapturedDetails data={c.capturedData} />
          </div>
        )}
        {tab === "transcript" && <Transcript conversation={c} />}
        {tab === "details" && (
          <dl className="divide-y divide-line">
            <DetailRow label="Phone">{formatPhone(c.phone)}</DetailRow>
            <DetailRow label="AI employee">{c.employeeName ?? "—"}</DetailRow>
            <DetailRow label="Direction">{c.direction === "inbound" ? "Inbound" : "Outbound"}</DetailRow>
            <DetailRow label="Channel">{c.channel ? formatPhone(c.channel) : "—"}</DetailRow>
            <DetailRow label="Started">{formatDateTime(c.startedAt)}</DetailRow>
            <DetailRow label="Duration">{formatDurationLong(c.durationSec)}</DetailRow>
            <DetailRow label="Cost">{formatInr(c.costInr)}</DetailRow>
            <DetailRow label="WhatsApp follow-up">{c.whatsappStatus && c.whatsappStatus !== "none" ? titleCase(c.whatsappStatus) : "—"}</DetailRow>
            <DetailRow label="Call ID">
              <span className="font-mono text-xs">{c.callSid}</span>
            </DetailRow>
          </dl>
        )}
      </div>
    </Sheet>
  );
}

function CapturedDetails({ data }: { data: Record<string, string> }) {
  const entries = Object.entries(data);
  return (
    <section>
      <h3 className="mb-1.5 text-[13px] font-semibold text-ink">Captured details</h3>
      {entries.length === 0 ? (
        <p className="text-[13px] text-ink-3">Nothing captured on this call.</p>
      ) : (
        <dl className="grid gap-2 sm:grid-cols-2">
          {entries.map(([k, v]) => (
            <div key={k} className="rounded-lg border border-line bg-subtle px-3 py-2">
              <dt className="text-2xs font-medium uppercase tracking-wide text-ink-3">{titleCase(k)}</dt>
              <dd className="mt-0.5 text-[13px] font-medium text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

function Transcript({ conversation }: { conversation: Conversation }) {
  const toast = useToast();
  const t = conversation.transcript;
  if (!t?.length) {
    return <EmptyState compact icon={<FileAudio />} title="No transcript" description="Transcripts appear for connected calls once the backend has processed them." />;
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(t!.map((x) => `${x.speaker === "agent" ? conversation.employeeName ?? "Agent" : "Customer"}: ${x.text}`).join("\n"));
      toast.success("Transcript copied");
    } catch {
      toast.error("Couldn't copy", "Your browser blocked clipboard access.");
    }
  }
  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button size="sm" variant="ghost" icon={<Copy className="h-3.5 w-3.5" />} onClick={copy}>
          Copy
        </Button>
      </div>
      <ol className="space-y-3">
        {t.map((turn, i) => {
          const agent = turn.speaker === "agent";
          return (
            <li key={i} className={cn("flex gap-2.5", !agent && "flex-row-reverse")}>
              <span className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full", agent ? "bg-accent-soft text-accent-ink" : "bg-muted text-ink-2")} aria-hidden>
                {agent ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
              </span>
              <div className={cn("max-w-[85%] rounded-xl px-3 py-2 text-[13px] leading-relaxed", agent ? "rounded-tl-sm bg-subtle text-ink" : "rounded-tr-sm bg-accent-soft text-ink")}>
                <span className="sr-only">{agent ? "AI employee: " : "Customer: "}</span>
                {turn.text}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Fetches a short-lived streaming URL on demand. Never fabricates audio. */
function RecordingPlayer({ conversation }: { conversation: Conversation }) {
  const [state, setState] = useState<{ status: "idle" | "loading" | "ready" | "error"; url?: string; message?: string }>({ status: "idle" });

  if (!conversation.recordingAvailable) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-line-strong px-4 py-3 text-[13px] text-ink-2">
        <Headphones className="h-4 w-4 shrink-0 text-ink-3" aria-hidden />
        <span>No recording is available for this call. Recording availability and retention are controlled by the backend.</span>
      </div>
    );
  }

  async function load() {
    setState({ status: "loading" });
    try {
      const r = await conversationsService.recordingUrl(conversation.id);
      setState({ status: "ready", url: r.url });
    } catch (err) {
      setState({ status: "error", message: toApiError(err).message });
    }
  }

  return (
    <div className="rounded-xl border border-line bg-subtle p-3">
      {state.status === "ready" && state.url ? (
        <audio controls src={state.url} className="w-full" preload="metadata">
          Your browser can&apos;t play this recording.
        </audio>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-[13px] text-ink-2">
            <Headphones className="h-4 w-4 text-ink-3" aria-hidden /> Call recording
          </span>
          <Button size="sm" onClick={load} disabled={state.status === "loading"} icon={state.status === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : undefined}>
            {state.status === "loading" ? "Loading" : "Load recording"}
          </Button>
        </div>
      )}
      {state.status === "error" && <p className="mt-2 text-xs text-danger">{state.message}</p>}
      <p className="mt-2 text-2xs text-ink-3">Playback links expire after a few minutes. Recording retention is set by the backend.</p>
    </div>
  );
}
