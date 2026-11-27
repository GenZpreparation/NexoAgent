"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, BarChart3, CheckCircle2, Clock, CreditCard, PhoneCall, PhoneIncoming, Target, Trophy, Users } from "lucide-react";
import { formatDurationLong, formatInr, formatNumber, formatPct, formatPhone } from "@/lib/utils";
import { can } from "@/lib/capabilities";
import { useAsync } from "@/hooks/useAsync";
import { performanceService } from "@/services/performance";
import { employeesService } from "@/services/employees";
import { channelsService } from "@/services/channels";
import { Input, Select } from "@/components/ui/Field";
import { FilterMenu, ToggleChip } from "@/components/ui/FilterMenu";
import { Segmented } from "@/components/ui/Tabs";
import { Avatar, PageHeader, StatCard } from "@/components/ui/Misc";
import { Card } from "@/components/ui/Card";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { BarList, ChartCard, ColumnChart, DataTable, TimeSeriesChart } from "@/components/charts/Charts";

type Range = "7" | "30" | "90" | "custom";
const NEEDS_BACKEND = "Needs backend support";

const isoDay = (offsetDays: number) => new Date(Date.now() - offsetDays * 86_400_000).toISOString().slice(0, 10);

function Unavailable({ what }: { what: string }) {
  return <EmptyState compact icon={<BarChart3 />} title="Not available yet" description={`${what} needs a backend endpoint. See the frontend–backend contract.`} />;
}

export default function PerformancePage() {
  const [range, setRange] = useState<Range>("30");
  const [from, setFrom] = useState(isoDay(14));
  const [to, setTo] = useState(isoDay(0));
  const [employeeId, setEmployeeId] = useState<string>();
  const [channel, setChannel] = useState<string>();
  const [issuesOnly, setIssuesOnly] = useState(false);
  const [minDuration, setMinDuration] = useState(0);

  const customValid = range !== "custom" || (from && to && from <= to);
  const days = range === "custom" ? Math.max(1, Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1) : Number(range);
  const query = { days, from: range === "custom" ? from : undefined, to: range === "custom" ? to : undefined, employeeId, channel, issuesOnly, minDurationSec: minDuration };
  const perf = useAsync(() => performanceService.get(query), `perf:${JSON.stringify(query)}`, { enabled: !!customValid });
  const employees = useAsync(() => employeesService.list(), "employees");
  const channels = useAsync(() => channelsService.list(), "channels");

  const p = perf.data;
  const s = p?.summary;
  const loading = !p && !perf.error;
  const noCalls = !!p && p.summary.calls === 0;
  const funnelTop = p?.funnel[0]?.value ?? 0;
  const hours = useMemo(() => p?.businessHours?.filter((h) => h.hour >= 7 && h.hour <= 22).map((h) => ({ hour: String(h.hour), calls: h.calls })) ?? [], [p]);

  return (
    <>
      <PageHeader title="Performance" description="How your AI employees are doing — calls, connections, conversions and cost." />

      <Card className="mb-5 p-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              ariaLabel="Date range"
              value={range}
              onChange={setRange}
              items={[
                { value: "7", label: "7 days" },
                { value: "30", label: "30 days" },
                { value: "90", label: "90 days" },
                { value: "custom", label: "Custom", disabled: !can("analytics.customRange"), title: can("analytics.customRange") ? undefined : "Custom ranges need backend support" },
              ]}
            />
            {range === "custom" && (
              <div className="flex items-center gap-1.5">
                <Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="w-[150px]" aria-label="From date" invalid={!customValid} />
                <span className="text-ink-3">–</span>
                <Input type="date" value={to} min={from} max={isoDay(0)} onChange={(e) => setTo(e.target.value)} className="w-[150px]" aria-label="To date" invalid={!customValid} />
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 xl:ml-auto">
            <FilterMenu label="AI employee" value={employeeId} onChange={setEmployeeId} options={(employees.data ?? []).map((e) => ({ value: e.id, label: e.name }))} />
            <FilterMenu label="Channel" value={channel} onChange={setChannel} options={(channels.data ?? []).map((c) => ({ value: c.phone, label: `${c.name} · ${formatPhone(c.phone)}` }))} disabledReason={can("analytics.filter.channel") ? undefined : NEEDS_BACKEND} />
            <ToggleChip active={issuesOnly} onChange={setIssuesOnly} icon={<AlertTriangle className="h-3.5 w-3.5" />}>
              Issues only
            </ToggleChip>
            <Select value={minDuration} onChange={(e) => setMinDuration(Number(e.target.value))} className="w-40" aria-label="Minimum call duration">
              <option value={0}>Any duration</option>
              <option value={15}>Calls ≥ 15s</option>
              <option value={30}>Calls ≥ 30s</option>
              <option value={60}>Calls ≥ 1 min</option>
              <option value={120}>Calls ≥ 2 min</option>
            </Select>
          </div>
        </div>
        {!customValid && <p className="mt-2 text-xs text-danger">The start date must be on or before the end date.</p>}
      </Card>

      {perf.error ? (
        <Card>
          <ErrorState error={perf.error} onRetry={perf.refetch} />
        </Card>
      ) : (
        <>
          <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
            <StatCard label="Calls" value={s ? formatNumber(s.calls) : "—"} icon={<PhoneCall />} tone="accent" loading={loading} />
            <StatCard label="Connect rate" value={s ? formatPct(s.connectRatePct) : "—"} icon={<PhoneIncoming />} loading={loading} />
            <StatCard label="Conversion" value={s ? formatPct(s.conversionRatePct) : "—"} icon={<Target />} tone="success" loading={loading} hint="Qualified ÷ connected" />
            <StatCard label="Avg call length" value={s ? formatDurationLong(s.avgCallLengthSec) : "—"} icon={<Clock />} loading={loading} />
            <StatCard label="Leads" value={s ? formatNumber(s.leads) : "—"} icon={<Users />} loading={loading} hint={can("analytics.leaderboard") ? "Unique numbers" : "Qualified leads"} />
            <StatCard label="Success rate" value={s ? formatPct(s.successRatePct) : "—"} icon={<CheckCircle2 />} loading={loading} hint="Calls without errors" />
            <StatCard label="Credits used" value={s ? formatInr(s.creditsUsedInr) : "—"} icon={<CreditCard />} loading={loading} />
          </section>

          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            <ChartCard
              className="xl:col-span-2"
              title="Calls over time"
              loading={loading}
              empty={noCalls}
              emptyText="No calls match this period and filters."
              table={<DataTable columns={["Date", "Dialed", "Connected", "Qualified"]} rows={(p?.callsOverTime ?? []).map((d) => [d.date, d.dialed, d.connected, d.qualified])} />}
            >
              <TimeSeriesChart
                height={260}
                data={p?.callsOverTime ?? []}
                series={[
                  { key: "dialed", label: "Dialed" },
                  { key: "connected", label: "Connected" },
                  { key: "qualified", label: "Qualified" },
                ]}
              />
            </ChartCard>

            <ChartCard title="Conversion funnel" description="Share of dialed calls reaching each stage" loading={loading} empty={noCalls}>
              <BarList items={(p?.funnel ?? []).map((f) => ({ label: f.stage, value: f.value }))} secondary={(i) => (funnelTop ? formatPct((i.value / funnelTop) * 100, 0) : "")} />
            </ChartCard>

            <ChartCard title="Outcomes" loading={loading} empty={noCalls || (p?.outcomes.length ?? 0) === 0}>
              <BarList items={(p?.outcomes ?? []).map((o) => ({ label: o.label, value: o.value }))} />
            </ChartCard>

            <ChartCard title="By channel" loading={loading} empty={noCalls} unavailable={p && !p.byChannel ? <Unavailable what="A per-channel breakdown" /> : undefined}>
              <BarList items={(p?.byChannel ?? []).map((c) => ({ label: formatPhone(c.channel), value: c.calls }))} secondary={(i) => {
                const row = p?.byChannel?.find((c) => formatPhone(c.channel) === i.label);
                return row && row.calls ? `${Math.round((row.connected / row.calls) * 100)}% connected` : "";
              }} />
            </ChartCard>

            <ChartCard
              title="Business hours"
              description="Calls by hour of day"
              loading={loading}
              empty={noCalls}
              unavailable={p && !p.businessHours ? <Unavailable what="An hourly breakdown" /> : undefined}
              table={<DataTable columns={["Hour", "Calls"]} rows={hours.map((h) => [`${h.hour}:00`, h.calls])} />}
            >
              <ColumnChart data={hours} xKey="hour" yKey="calls" label="Calls" xFormatter={(h) => `${Number(h) % 12 || 12}${Number(h) < 12 ? "am" : "pm"}`} />
            </ChartCard>
          </div>

          <Card className="mt-4">
            <div className="flex items-center gap-2 px-5 pt-4">
              <Trophy className="h-4 w-4 text-warning" aria-hidden />
              <h2 className="text-sm font-semibold text-ink">Employee leaderboard</h2>
            </div>
            <div className="mt-3">
              {loading ? (
                <div className="h-32 animate-pulse bg-subtle" />
              ) : !p?.leaderboard ? (
                <Unavailable what="A per-employee leaderboard" />
              ) : p.leaderboard.length === 0 ? (
                <EmptyState compact icon={<Trophy />} title="No activity in this period" description="Rankings appear once your AI employees have made calls." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-[13px]">
                    <thead>
                      <tr className="border-y border-line bg-subtle/60 text-left text-xs text-ink-3">
                        <th className="w-10 px-5 py-2 font-medium">#</th>
                        <th className="px-3 py-2 font-medium">AI employee</th>
                        <th className="px-3 py-2 text-right font-medium">Calls</th>
                        <th className="px-3 py-2 text-right font-medium">Connect rate</th>
                        <th className="px-5 py-2 text-right font-medium">Qualified</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {p.leaderboard.map((row, i) => (
                        <tr key={row.employeeId}>
                          <td className="tabular px-5 py-2.5 text-ink-3">{i + 1}</td>
                          <td className="px-3 py-2.5">
                            <span className="flex items-center gap-2 font-medium text-ink">
                              <Avatar name={row.name} size="sm" />
                              {row.name}
                            </span>
                          </td>
                          <td className="tabular px-3 py-2.5 text-right text-ink">{formatNumber(row.calls)}</td>
                          <td className="tabular px-3 py-2.5 text-right text-ink">{formatPct(row.connectRatePct)}</td>
                          <td className="tabular px-5 py-2.5 text-right font-semibold text-ink">{formatNumber(row.qualified)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </>
  );
}
