"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Circle,
  Contact,
  CreditCard,
  Flame,
  Megaphone,
  MessagesSquare,
  PhoneCall,
  PhoneForwarded,
  Radio,
  Sparkles,
  Upload,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import { cn, formatDuration, formatInr, formatNumber, formatPct, formatPhone, formatRelative } from "@/lib/utils";
import { useAsync } from "@/hooks/useAsync";
import { useSession } from "@/components/providers/SessionProvider";
import { performanceService } from "@/services/performance";
import { leadsService } from "@/services/leads";
import { conversationsService } from "@/services/conversations";
import { employeesService } from "@/services/employees";
import { channelsService } from "@/services/channels";
import { billingService } from "@/services/billing";
import { Card, CardHeader } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { PageHeader, StatCard, Avatar } from "@/components/ui/Misc";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/States";
import { ChartCard, TimeSeriesChart, DataTable } from "@/components/charts/Charts";
import { CallStatusBadge, EmployeeStatusBadge, OutcomeBadge, TemperatureBadge } from "@/components/domain/Badges";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function HomePage() {
  const { session } = useSession();
  const perf = useAsync(() => performanceService.get({ days: 30 }), "home:perf");
  const leads = useAsync(() => leadsService.list({ limit: 5, offset: 0, sort: "recent" }), "home:leads");
  const calls = useAsync(() => conversationsService.list({ limit: 6, offset: 0 }), "home:calls");
  const employees = useAsync(() => employeesService.list(), "home:employees");
  const channels = useAsync(() => channelsService.list(), "home:channels");
  const wallet = useAsync(() => billingService.wallet(), "home:wallet");

  const p = perf.data?.summary;
  const s = leads.data?.summary;
  const last14 = perf.data?.callsOverTime.slice(-14) ?? [];
  const firstName = session?.user.name.split(" ")[0];

  return (
    <>
      <PageHeader
        title={`${greeting()}${firstName ? `, ${firstName}` : ""}`}
        description="Here's what your AI employees have been doing over the last 30 days."
        actions={
          <LinkButton href="/employees/new" variant="primary" icon={<UserPlus className="h-4 w-4" />}>
            Hire an AI employee
          </LinkButton>
        }
      />

      <GettingStarted
        loading={!employees.data || !channels.data || !leads.data || !wallet.data}
        steps={[
          { done: (employees.data?.length ?? 0) > 0, title: "Hire your first AI employee", description: "Describe the job; pick a template to start faster.", href: "/employees/new", icon: UserPlus },
          { done: (channels.data?.length ?? 0) > 0, title: "Add a phone number", description: "Your employees call and answer from your numbers.", href: "/channels", icon: Radio },
          { done: (leads.data?.summary.total ?? 0) > 0, title: "Bring in leads", description: "Upload a list, or connect an ad or form for instant calls.", href: "/campaigns", icon: Upload },
          { done: (wallet.data?.balanceInr ?? 0) > 0, title: "Add calling credits", description: "Credits are used per connected minute.", href: "/billing", icon: CreditCard },
        ]}
      />

      <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total calls" value={p ? formatNumber(p.calls) : "—"} icon={<PhoneCall />} tone="accent" loading={perf.loading && !p} hint="Last 30 days" />
        <StatCard label="Leads" value={s ? formatNumber(s.total) : "—"} icon={<Contact />} tone="info" loading={leads.loading && !s} hint="All time" />
        <StatCard label="Qualified" value={s ? formatNumber(s.qualified) : "—"} icon={<CheckCircle2 />} tone="success" loading={leads.loading && !s} hint="All time" />
        <StatCard label="Pending callbacks" value={s ? formatNumber(s.pendingCallback) : "—"} icon={<PhoneForwarded />} tone="warning" loading={leads.loading && !s} hint="Need follow-up" />
        <StatCard label="Connect rate" value={p ? formatPct(p.connectRatePct) : "—"} icon={<BarChart3 />} loading={perf.loading && !p} hint="Last 30 days" />
        <StatCard label="Credits used" value={p ? formatInr(p.creditsUsedInr) : "—"} icon={<CreditCard />} loading={perf.loading && !p} hint="Last 30 days" />
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <ChartCard
          className="xl:col-span-2"
          title="Call activity"
          description="Dialed, connected and qualified calls — last 14 days"
          action={
            <Link href="/performance" className="text-xs font-medium text-accent hover:underline">
              View performance
            </Link>
          }
          loading={!perf.data && !perf.error}
          error={perf.error}
          onRetry={perf.refetch}
          empty={last14.every((d) => d.dialed === 0)}
          emptyText="Calls your AI employees make or answer will show up here."
          table={<DataTable columns={["Date", "Dialed", "Connected", "Qualified"]} rows={last14.map((d) => [d.date, d.dialed, d.connected, d.qualified])} />}
        >
          <TimeSeriesChart
            data={last14}
            series={[
              { key: "dialed", label: "Dialed" },
              { key: "connected", label: "Connected" },
              { key: "qualified", label: "Qualified" },
            ]}
          />
        </ChartCard>

        <Card>
          <CardHeader title="Quick actions" />
          <div className="grid gap-1 p-3">
            {[
              { href: "/employees/new", icon: Sparkles, title: "Hire an AI employee", sub: "Start from a template or describe the job" },
              { href: "/campaigns?new=1", icon: Megaphone, title: "Start a campaign", sub: "Call through a list of leads" },
              { href: "/instant-leads", icon: Zap, title: "Connect a lead source", sub: "Call new leads within seconds" },
              { href: "/leads?hot=1", icon: Flame, title: "Review hot leads", sub: "Leads that showed strong intent" },
              { href: "/conversations", icon: MessagesSquare, title: "Listen & read transcripts", sub: "See what was said on calls" },
            ].map((a) => (
              <Link key={a.href} href={a.href} className="group flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-subtle">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-ink-2 group-hover:text-accent">
                  <a.icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium text-ink">{a.title}</span>
                  <span className="block truncate text-xs text-ink-3">{a.sub}</span>
                </span>
                <ArrowRight className="h-4 w-4 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Recent conversations"
            action={
              <Link href="/conversations" className="text-xs font-medium text-accent hover:underline">
                View all
              </Link>
            }
          />
          <div className="mt-2">
            {calls.error ? (
              <ErrorState compact error={calls.error} onRetry={calls.refetch} />
            ) : !calls.data ? (
              <SkeletonRows rows={5} />
            ) : calls.data.items.length === 0 ? (
              <EmptyState compact icon={<MessagesSquare />} title="No conversations yet" description="Once an AI employee makes or answers a call, it appears here with a summary." />
            ) : (
              <ul className="divide-y divide-line">
                {calls.data.items.map((c) => (
                  <li key={c.id}>
                    <Link href={`/conversations?open=${c.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-subtle">
                      <Avatar name={c.callerName ?? c.phone} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-ink">{c.callerName ?? formatPhone(c.phone)}</p>
                        <p className="truncate text-xs text-ink-3">
                          {c.employeeName ?? "Unassigned"} · {c.direction === "inbound" ? "Inbound" : "Outbound"} · {formatDuration(c.durationSec)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {c.outcome ? <OutcomeBadge outcome={c.outcome} /> : <CallStatusBadge status={String(c.status)} />}
                        <span className="text-2xs text-ink-3">{formatRelative(c.startedAt)}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Recent leads"
            action={
              <Link href="/leads" className="text-xs font-medium text-accent hover:underline">
                View all
              </Link>
            }
          />
          <div className="mt-2">
            {leads.error ? (
              <ErrorState compact error={leads.error} onRetry={leads.refetch} />
            ) : !leads.data ? (
              <SkeletonRows rows={5} />
            ) : leads.data.items.length === 0 ? (
              <EmptyState compact icon={<Contact />} title="No leads yet" description="Upload a list in Campaigns or connect a source in Instant leads." />
            ) : (
              <ul className="divide-y divide-line">
                {leads.data.items.map((l) => (
                  <li key={l.id}>
                    <Link href={`/leads?search=${encodeURIComponent(l.phone)}`} className="flex items-center gap-3 px-5 py-3 hover:bg-subtle">
                      <Avatar name={l.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 truncate text-[13px] font-medium text-ink">
                          {l.name}
                          <TemperatureBadge value={l.temperature} />
                        </p>
                        <p className="truncate text-xs text-ink-3">
                          {formatPhone(l.phone)}
                          {l.city ? ` · ${l.city}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <OutcomeBadge outcome={l.outcome} />
                        <span className="text-2xs text-ink-3">{formatRelative(l.createdAt)}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader
          title="AI employee activity"
          action={
            <Link href="/employees" className="text-xs font-medium text-accent hover:underline">
              Manage team
            </Link>
          }
        />
        <div className="mt-2">
          {employees.error ? (
            <ErrorState compact error={employees.error} onRetry={employees.refetch} />
          ) : !employees.data ? (
            <SkeletonRows rows={3} />
          ) : employees.data.length === 0 ? (
            <EmptyState
              compact
              icon={<Users />}
              title="No AI employees yet"
              description="Hire your first AI employee to start calling leads."
              action={
                <LinkButton href="/employees/new" variant="primary" size="sm">
                  Hire an AI employee
                </LinkButton>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-[13px]">
                <thead>
                  <tr className="border-y border-line bg-subtle/60 text-left text-xs text-ink-3">
                    <th className="px-5 py-2 font-medium">Employee</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 text-right font-medium">Calls (30d)</th>
                    <th className="px-3 py-2 text-right font-medium">Qualified</th>
                    <th className="px-5 py-2 text-right font-medium">Last active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {employees.data.slice(0, 6).map((e) => {
                    const lb = perf.data?.leaderboard?.find((x) => x.employeeId === e.id);
                    return (
                      <tr key={e.id} className="hover:bg-subtle">
                        <td className="px-5 py-2.5">
                          <Link href={`/employees/${e.id}`} className="flex items-center gap-2.5">
                            <Avatar name={e.name} size="sm" />
                            <span className="min-w-0">
                              <span className="block font-medium text-ink">{e.name}</span>
                              {e.role && <span className="block truncate text-xs text-ink-3">{e.role}</span>}
                            </span>
                          </Link>
                        </td>
                        <td className="px-3 py-2.5">
                          <EmployeeStatusBadge status={e.status} />
                        </td>
                        <td className="tabular px-3 py-2.5 text-right text-ink">{lb ? formatNumber(lb.calls) : e.stats ? formatNumber(e.stats.calls) : "—"}</td>
                        <td className="tabular px-3 py-2.5 text-right text-ink">{lb ? formatNumber(lb.qualified) : e.stats ? formatNumber(e.stats.qualified) : "—"}</td>
                        <td className="px-5 py-2.5 text-right text-ink-2">{e.stats?.lastActiveAt ? formatRelative(e.stats.lastActiveAt) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </>
  );
}

function GettingStarted({ loading, steps }: { loading: boolean; steps: { done: boolean; title: string; description: string; href: string; icon: typeof UserPlus }[] }) {
  if (loading) return null;
  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;
  return (
    <Card className="mb-4 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3.5">
        <div>
          <h2 className="text-sm font-semibold text-ink">Get set up</h2>
          <p className="text-xs text-ink-2">
            {doneCount} of {steps.length} done — finish these to start calling.
          </p>
        </div>
        <div className="flex gap-1" aria-hidden>
          {steps.map((s, i) => (
            <span key={i} className={cn("h-1.5 w-8 rounded-full", s.done ? "bg-accent" : "bg-muted")} />
          ))}
        </div>
      </div>
      <ol className="grid gap-px bg-line sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((s) => (
          <li key={s.title} className="bg-surface">
            <Link href={s.href} className={cn("flex h-full gap-3 px-5 py-4 transition-colors hover:bg-subtle", s.done && "opacity-60")}>
              {s.done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-label="Done" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" aria-label="To do" />}
              <span>
                <span className={cn("block text-[13px] font-medium", s.done ? "text-ink-2 line-through" : "text-ink")}>{s.title}</span>
                <span className="mt-0.5 block text-xs text-ink-3">{s.description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  );
}
