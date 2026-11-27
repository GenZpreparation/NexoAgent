/**
 * Pure filtering / sorting / aggregation used by the mock services.
 * These mirror the query semantics the frontend expects the backend to
 * implement (see FRONTEND_BACKEND_CONTRACT.md), and are unit tested.
 */
import type { Conversation, ConversationQuery, Lead, LeadQuery, LeadSummary, Performance, PerformanceQuery } from "@/types/domain";

const DAY = 86_400_000;

export function matchesText(haystack: (string | null | undefined)[], needle: string): boolean {
  const n = needle.trim().toLowerCase();
  if (!n) return true;
  const digits = n.replace(/\D/g, "");
  return haystack.some((h) => {
    if (!h) return false;
    const lower = h.toLowerCase();
    return lower.includes(n) || (digits.length >= 3 && lower.replace(/\D/g, "").includes(digits));
  });
}

export function filterLeads(leads: Lead[], q: Omit<LeadQuery, "limit" | "offset">, now = Date.now()): Lead[] {
  let rows = leads.filter((l) => {
    if (q.search && !matchesText([l.name, l.phone, l.city, ...Object.values(l.capturedInfo)], q.search)) return false;
    if (q.employeeId && l.employeeId !== q.employeeId) return false;
    if (q.outcome && l.outcome !== q.outcome) return false;
    if (q.hotOnly && l.temperature !== "hot") return false;
    if (q.channel && l.channel !== q.channel) return false;
    if (q.createdWithinDays && now - Date.parse(l.createdAt) > q.createdWithinDays * DAY) return false;
    if (q.contactedWithinDays && (!l.lastContactedAt || now - Date.parse(l.lastContactedAt) > q.contactedWithinDays * DAY)) return false;
    return true;
  });

  const sort = q.sort ?? "recent";
  rows = [...rows].sort((a, b) => {
    switch (sort) {
      case "oldest":
        return a.createdAt.localeCompare(b.createdAt);
      case "name":
        return a.name.localeCompare(b.name);
      case "last_contacted":
        return (b.lastContactedAt ?? "").localeCompare(a.lastContactedAt ?? "");
      default:
        return b.createdAt.localeCompare(a.createdAt);
    }
  });
  return rows;
}

export function summarizeLeads(leads: Lead[]): LeadSummary {
  return {
    total: leads.length,
    qualified: leads.filter((l) => l.qualified).length,
    pendingCallback: leads.filter((l) => l.outcome === "callback" || l.followUp.status === "scheduled" || l.followUp.status === "overdue").length,
    hot: leads.filter((l) => l.temperature === "hot").length,
  };
}

export function filterConversations(rows: Conversation[], q: Omit<ConversationQuery, "limit" | "offset">, now = Date.now()): Conversation[] {
  return rows.filter((c) => {
    if (q.search && !matchesText([c.callerName, c.phone, c.summary, c.employeeName], q.search)) return false;
    if (q.employeeId && c.employeeId !== q.employeeId) return false;
    if (q.status && c.status !== q.status && c.outcome !== q.status) return false;
    if (q.channel && c.channel !== q.channel) return false;
    if (q.direction && c.direction !== q.direction) return false;
    if (q.withinDays && now - Date.parse(c.startedAt) > q.withinDays * DAY) return false;
    return true;
  });
}

const OUTCOME_LABELS: Record<string, string> = {
  interested: "Interested",
  callback: "Callback",
  not_interested: "Not interested",
  busy: "Busy",
  no_answer: "No answer",
  dnd: "DND",
  failed: "Failed",
};

/** Computes the Performance view from raw conversations — keeps demo numbers internally consistent. */
export function computePerformance(
  all: Conversation[],
  employees: { id: string; name: string }[],
  q: PerformanceQuery,
  now = Date.now(),
): Performance {
  const fromTs = q.from ? Date.parse(q.from) : now - q.days * DAY;
  const toTs = q.to ? Date.parse(q.to) + DAY - 1 : now;
  const calls = all.filter((c) => {
    const t = Date.parse(c.startedAt);
    if (t < fromTs || t > toTs) return false;
    if (q.employeeId && c.employeeId !== q.employeeId) return false;
    if (q.channel && c.channel !== q.channel) return false;
    if (q.minDurationSec && c.durationSec < q.minDurationSec) return false;
    if (q.issuesOnly && !["failed", "busy", "no-answer"].includes(String(c.status))) return false;
    return true;
  });

  const connected = calls.filter((c) => c.durationSec > 0);
  const qualified = calls.filter((c) => c.outcome === "interested");
  const engaged = calls.filter((c) => c.durationSec >= 30);
  const nonFailed = calls.filter((c) => c.status !== "failed");
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);

  // daily buckets
  const span = Math.max(1, Math.round((toTs - fromTs) / DAY));
  const buckets = new Map<string, { dialed: number; connected: number; qualified: number }>();
  for (let i = span - 1; i >= 0; i--) {
    buckets.set(new Date(toTs - i * DAY).toISOString().slice(0, 10), { dialed: 0, connected: 0, qualified: 0 });
  }
  for (const c of calls) {
    const b = buckets.get(c.startedAt.slice(0, 10));
    if (!b) continue;
    b.dialed++;
    if (c.durationSec > 0) b.connected++;
    if (c.outcome === "interested") b.qualified++;
  }

  const outcomeCounts = new Map<string, number>();
  for (const c of calls) if (c.outcome) outcomeCounts.set(c.outcome, (outcomeCounts.get(c.outcome) ?? 0) + 1);

  const byChannelMap = new Map<string, { calls: number; connected: number }>();
  for (const c of calls) {
    const k = c.channel ?? "Unknown";
    const v = byChannelMap.get(k) ?? { calls: 0, connected: 0 };
    v.calls++;
    if (c.durationSec > 0) v.connected++;
    byChannelMap.set(k, v);
  }

  const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, calls: 0 }));
  for (const c of calls) hours[new Date(c.startedAt).getHours()].calls++;

  const leaderboard = employees
    .map((e) => {
      const mine = calls.filter((c) => c.employeeId === e.id);
      return {
        employeeId: e.id,
        name: e.name,
        calls: mine.length,
        qualified: mine.filter((c) => c.outcome === "interested").length,
        connectRatePct: pct(mine.filter((c) => c.durationSec > 0).length, mine.length),
      };
    })
    .filter((x) => x.calls > 0)
    .sort((a, b) => b.qualified - a.qualified || b.calls - a.calls);

  return {
    summary: {
      calls: calls.length,
      connectRatePct: pct(connected.length, calls.length),
      conversionRatePct: pct(qualified.length, connected.length),
      avgCallLengthSec: connected.length ? Math.round(connected.reduce((s, c) => s + c.durationSec, 0) / connected.length) : 0,
      leads: new Set(calls.map((c) => c.phone)).size,
      successRatePct: pct(nonFailed.length, calls.length),
      creditsUsedInr: Math.round(calls.reduce((s, c) => s + c.costInr, 0) * 100) / 100,
    },
    callsOverTime: [...buckets.entries()].map(([date, v]) => ({ date, ...v })),
    funnel: [
      { stage: "Dialed", value: calls.length },
      { stage: "Connected", value: connected.length },
      { stage: "Engaged > 30s", value: engaged.length },
      { stage: "Qualified", value: qualified.length },
    ],
    outcomes: [...outcomeCounts.entries()]
      .map(([outcome, value]) => ({ outcome, label: OUTCOME_LABELS[outcome] ?? outcome, value }))
      .sort((a, b) => b.value - a.value),
    byChannel: [...byChannelMap.entries()].map(([channel, v]) => ({ channel, ...v })).sort((a, b) => b.calls - a.calls),
    businessHours: hours,
    leaderboard,
  };
}
