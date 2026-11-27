"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, Download, Info, MessagesSquare, RotateCw } from "lucide-react";
import { formatDateTime, formatDuration, formatPhone } from "@/lib/utils";
import { CALL_STATUS } from "@/lib/labels";
import { can } from "@/lib/capabilities";
import { downloadCsv, datedFilename } from "@/lib/csv";
import { useAsync, useDebounced } from "@/hooks/useAsync";
import { conversationsService } from "@/services/conversations";
import { employeesService } from "@/services/employees";
import { channelsService } from "@/services/channels";
import type { Conversation } from "@/types/domain";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SearchInput } from "@/components/ui/Field";
import { FilterMenu } from "@/components/ui/FilterMenu";
import { PageHeader, Pagination } from "@/components/ui/Misc";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/States";
import { Tooltip } from "@/components/ui/Tooltip";
import { useToast } from "@/components/ui/Toast";
import { CallStatusBadge, OutcomeBadge } from "@/components/domain/Badges";
import { ConversationSheet } from "@/features/conversations/ConversationSheet";

const NEEDS_BACKEND = "Needs backend support for this filter";
const LIMIT = 20;

export default function ConversationsPage() {
  return (
    <Suspense>
      <ConversationsInner />
    </Suspense>
  );
}

function ConversationsInner() {
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const [search, setSearch] = useState(params.get("search") ?? "");
  const [employeeId, setEmployeeId] = useState<string>();
  const [channel, setChannel] = useState<string>();
  const [status, setStatus] = useState<string>();
  const [days, setDays] = useState<string>();
  const [direction, setDirection] = useState<"inbound" | "outbound">();
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState<Conversation | null>(null);
  const q = useDebounced(search, 300);

  const query = {
    search: can("calls.filter.search") ? q || undefined : undefined,
    employeeId,
    channel,
    status,
    direction,
    withinDays: days ? Number(days) : undefined,
  };
  const calls = useAsync(() => conversationsService.list({ ...query, limit: LIMIT, offset }), `calls:${JSON.stringify(query)}:${offset}`);
  const employees = useAsync(() => employeesService.list(), "employees");
  const channels = useAsync(() => channelsService.list(), "channels");

  // Deep link: /conversations?open=<id>
  const openId = params.get("open");
  useEffect(() => {
    if (!openId) return;
    let cancelled = false;
    conversationsService.get(openId).then(
      (c) => !cancelled && setOpen(c),
      (err) => !cancelled && toast.fromError(err, "Couldn't open conversation"),
    );
    return () => {
      cancelled = true;
    };
  }, [openId, toast]);

  function closeSheet() {
    setOpen(null);
    if (openId) router.replace("/conversations");
  }

  const reset = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setOffset(0);
  };

  function exportCsv() {
    const rows = calls.data?.items ?? [];
    downloadCsv(
      rows,
      [
        { header: "Started", value: (c) => c.startedAt },
        { header: "Caller", value: (c) => c.callerName },
        { header: "Phone", value: (c) => c.phone },
        { header: "AI employee", value: (c) => c.employeeName },
        { header: "Direction", value: (c) => c.direction },
        { header: "Duration (s)", value: (c) => c.durationSec },
        { header: "Status", value: (c) => c.status },
        { header: "Outcome", value: (c) => c.outcome },
        { header: "Summary", value: (c) => c.summary },
        { header: "Cost (INR)", value: (c) => c.costInr },
        { header: "Call ID", value: (c) => c.callSid },
      ],
      datedFilename("nexoagent-conversations"),
    );
    toast.success("Export ready", `${rows.length} conversation(s) on this page were exported.`);
  }

  const hasFilters = !!(search || employeeId || channel || status || days || direction);

  return (
    <>
      <PageHeader
        title="Conversations"
        description="Every call your AI employees made or answered, with summaries and transcripts."
        actions={
          <>
            <Button onClick={calls.refetch} loading={calls.loading && !!calls.data} icon={<RotateCw className="h-4 w-4" />}>
              Refresh
            </Button>
            <Tooltip content="Exports the conversations on the current page. A server-side export needs a backend endpoint.">
              <Button onClick={exportCsv} disabled={!calls.data?.items.length} icon={<Download className="h-4 w-4" />}>
                Export CSV
              </Button>
            </Tooltip>
          </>
        }
      />

      <Card className="mb-4 p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {can("calls.filter.search") ? (
            <SearchInput value={search} onChange={reset(setSearch)} placeholder="Search caller, phone or summary" className="lg:w-80" label="Search conversations" />
          ) : (
            <Tooltip content="Searching calls needs backend support" className="lg:w-80">
              <SearchInput value="" onChange={() => undefined} placeholder="Search (needs backend)" className="pointer-events-none w-full opacity-60" label="Search conversations (unavailable)" />
            </Tooltip>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <FilterMenu label="AI employee" value={employeeId} onChange={reset(setEmployeeId)} options={(employees.data ?? []).map((e) => ({ value: e.id, label: e.name }))} />
            <FilterMenu label="Channel" value={channel} onChange={reset(setChannel)} options={(channels.data ?? []).map((c) => ({ value: c.phone, label: `${c.name} · ${formatPhone(c.phone)}` }))} disabledReason={can("calls.filter.channel") ? undefined : NEEDS_BACKEND} />
            <FilterMenu label="Status" value={status} onChange={reset(setStatus)} options={["completed", "busy", "no-answer", "failed", "in-progress"].map((s) => ({ value: s, label: CALL_STATUS[s].label }))} />
            <FilterMenu label="Direction" value={direction} onChange={reset(setDirection)} options={[{ value: "outbound", label: "Outbound" }, { value: "inbound", label: "Inbound" }]} disabledReason={can("calls.filter.direction") ? undefined : NEEDS_BACKEND} />
            <FilterMenu
              label="Date"
              value={days}
              onChange={reset(setDays)}
              options={[{ value: "1", label: "Today" }, { value: "7", label: "Last 7 days" }, { value: "30", label: "Last 30 days" }]}
              disabledReason={can("calls.filter.date") ? undefined : NEEDS_BACKEND}
            />
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setEmployeeId(undefined); setChannel(undefined); setStatus(undefined); setDays(undefined); setDirection(undefined); setOffset(0); }}>
                Clear all
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {calls.error ? (
          <ErrorState error={calls.error} onRetry={calls.refetch} />
        ) : !calls.data ? (
          <SkeletonRows rows={8} />
        ) : calls.data.items.length === 0 ? (
          hasFilters ? (
            <EmptyState icon={<MessagesSquare />} title="No conversations match" description="Try different filters." />
          ) : (
            <EmptyState icon={<MessagesSquare />} title="No conversations yet" description="When your AI employees make or answer calls, each conversation shows up here with a summary, transcript and outcome." />
          )
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-[13px]">
                <thead>
                  <tr className="border-b border-line bg-subtle/60 text-left text-xs text-ink-3">
                    <th className="px-5 py-2.5 font-medium">Caller</th>
                    <th className="px-3 py-2.5 font-medium">AI employee</th>
                    <th className="px-3 py-2.5 font-medium">Summary</th>
                    <th className="px-3 py-2.5 font-medium">Result</th>
                    <th className="px-3 py-2.5 text-right font-medium">Duration</th>
                    <th className="px-5 py-2.5 text-right font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {calls.data.items.map((c) => (
                    <tr key={c.id} onClick={() => setOpen(c)} className="cursor-pointer hover:bg-subtle">
                      <td className="px-5 py-3">
                        <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(c); }} className="flex items-center gap-2 text-left">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-ink-2" title={c.direction === "inbound" ? "Inbound" : "Outbound"}>
                            {c.direction === "inbound" ? <ArrowDownLeft className="h-3.5 w-3.5" aria-label="Inbound" /> : <ArrowUpRight className="h-3.5 w-3.5" aria-label="Outbound" />}
                          </span>
                          <span className="min-w-0">
                            <span className="block font-medium text-ink">{c.callerName ?? formatPhone(c.phone)}</span>
                            {c.callerName && <span className="block font-mono text-xs text-ink-3">{formatPhone(c.phone)}</span>}
                          </span>
                        </button>
                      </td>
                      <td className="px-3 py-3 text-ink-2">{c.employeeName ?? "—"}</td>
                      <td className="max-w-[320px] px-3 py-3">
                        <span className="line-clamp-2 text-ink-2">{c.summary ?? <span className="text-ink-3">—</span>}</span>
                      </td>
                      <td className="px-3 py-3">{c.outcome ? <OutcomeBadge outcome={c.outcome} /> : <CallStatusBadge status={String(c.status)} />}</td>
                      <td className="tabular px-3 py-3 text-right text-ink-2">{formatDuration(c.durationSec)}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-right text-ink-2">{formatDateTime(c.startedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination offset={offset} limit={LIMIT} count={calls.data.items.length} total={calls.data.total} onChange={setOffset} />
          </>
        )}
      </Card>

      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink-3">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        Recordings and transcripts can be kept for different lengths of time. Retention periods are set by the backend and will be documented here once confirmed.
      </p>

      <ConversationSheet conversation={open} onClose={closeSheet} />
    </>
  );
}
