"use client";

import { useState, type ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, Table2 } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import type { ApiError } from "@/lib/api/errors";

/**
 * Chart building blocks. Colours come from CSS variables (--series-1..3),
 * validated for colour-vision deficiency in light and dark. Every multi-series
 * chart ships a legend and a table view (light-mode contrast relief rule).
 */
export const SERIES = ["var(--series-1)", "var(--series-2)", "var(--series-3)"];

export interface Series<K extends string> {
  key: K;
  label: string;
}

export function Legend({ series }: { series: { label: string }[] }) {
  if (series.length < 2) return null;
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1" aria-label="Legend">
      {series.map((s, i) => (
        <li key={s.label} className="flex items-center gap-1.5 text-xs text-ink-2">
          <span className="h-2 w-2 rounded-full" style={{ background: SERIES[i] }} aria-hidden />
          {s.label}
        </li>
      ))}
    </ul>
  );
}

/** Card wrapper with loading / error / empty handling and an optional table view. */
export function ChartCard({
  title,
  description,
  action,
  loading,
  error,
  onRetry,
  empty,
  emptyText = "No data for this period yet.",
  unavailable,
  table,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  loading?: boolean;
  error?: ApiError | null;
  onRetry?: () => void;
  empty?: boolean;
  emptyText?: string;
  /** Rendered instead of the chart when the backend doesn't provide this data. */
  unavailable?: ReactNode;
  table?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  const [asTable, setAsTable] = useState(false);
  const showToggle = !!table && !loading && !error && !empty && !unavailable;
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader
        title={title}
        description={description}
        action={
          <>
            {action}
            {showToggle && (
              <button
                type="button"
                onClick={() => setAsTable((v) => !v)}
                className="rounded-md p-1.5 text-ink-3 transition-colors hover:bg-muted hover:text-ink"
                aria-label={asTable ? "Show chart" : "Show as table"}
                title={asTable ? "Show chart" : "Show as table"}
              >
                {asTable ? <BarChart3 className="h-4 w-4" /> : <Table2 className="h-4 w-4" />}
              </button>
            )}
          </>
        }
      />
      <div className={cn("flex-1 px-5 pb-5 pt-3", bodyClassName)}>
        {unavailable ? (
          unavailable
        ) : error ? (
          <ErrorState compact error={error} onRetry={onRetry} />
        ) : loading ? (
          <Skeleton className="h-[220px] w-full" />
        ) : empty ? (
          <EmptyState compact icon={<BarChart3 />} title="Nothing to chart yet" description={emptyText} />
        ) : asTable && table ? (
          <div className="max-h-[260px] overflow-auto">{table}</div>
        ) : (
          children
        )}
      </div>
    </Card>
  );
}

function ChartTooltip({ active, payload, label, labelFormatter }: { active?: boolean; payload?: { name?: string; value?: number; color?: string }[]; label?: string | number; labelFormatter?: (l: string) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-pop">
      <div className="mb-1 font-medium text-ink">{labelFormatter ? labelFormatter(String(label)) : label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4 text-ink-2">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} aria-hidden />
            {p.name}
          </span>
          <span className="tabular font-medium text-ink">{formatNumber(p.value ?? 0)}</span>
        </div>
      ))}
    </div>
  );
}

const shortDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

/** Multi-series time series as overlapping translucent areas with 2px lines + crosshair tooltip. */
export function TimeSeriesChart<K extends string>({ data, series, height = 240 }: { data: ({ date: string } & Record<K, number>)[]; series: Series<K>[]; height?: number }) {
  return (
    <div>
      <div className="mb-3">
        <Legend series={series} />
      </div>
      <div style={{ height }} role="img" aria-label={`Line chart of ${series.map((s) => s.label).join(", ")} over time`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
            <defs>
              {series.map((s, i) => (
                <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SERIES[i]} stopOpacity={0.14} />
                  <stop offset="100%" stopColor={SERIES[i]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <XAxis dataKey="date" tickFormatter={shortDate} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "rgb(var(--ink-3))" }} minTickGap={24} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "rgb(var(--ink-3))" }} width={44} />
            <Tooltip content={<ChartTooltip labelFormatter={shortDate} />} cursor={{ stroke: "rgb(var(--line-strong))", strokeWidth: 1 }} />
            {series.map((s, i) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={SERIES[i]}
                strokeWidth={2}
                fill={`url(#fill-${s.key})`}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "rgb(var(--surface))" }}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Vertical columns (single series) — e.g. calls by hour of day. */
export function ColumnChart({ data, xKey, yKey, label, height = 200, xFormatter }: { data: Record<string, number | string>[]; xKey: string; yKey: string; label: string; height?: number; xFormatter?: (v: string) => string }) {
  return (
    <div style={{ height }} role="img" aria-label={`Column chart: ${label}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }} barCategoryGap={2}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey={xKey} tickFormatter={xFormatter} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "rgb(var(--ink-3))" }} interval="preserveStartEnd" minTickGap={12} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "rgb(var(--ink-3))" }} width={44} />
          <Tooltip content={<ChartTooltip labelFormatter={xFormatter} />} cursor={{ fill: "rgb(var(--muted))" }} />
          <Bar dataKey={yKey} name={label} fill={SERIES[0]} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Horizontal labelled bars in plain HTML — readable on any width, labels never collide. */
export function BarList({ items, valueFormatter = formatNumber, secondary }: { items: { label: string; value: number; hint?: string }[]; valueFormatter?: (n: number) => string; secondary?: (item: { label: string; value: number }) => ReactNode }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.label} title={`${item.label}: ${valueFormatter(item.value)}`}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
            <span className="truncate text-ink-2">{item.label}</span>
            <span className="tabular shrink-0 font-medium text-ink">
              {valueFormatter(item.value)}
              {secondary && <span className="ml-1.5 font-normal text-ink-3">{secondary(item)}</span>}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full" style={{ width: `${(item.value / max) * 100}%`, background: SERIES[0], minWidth: item.value > 0 ? 4 : 0 }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Simple accessible data table used for chart table views. */
export function DataTable({ columns, rows }: { columns: string[]; rows: (string | number)[][] }) {
  return (
    <table className="w-full text-[13px]">
      <thead className="sticky top-0 bg-surface">
        <tr className="border-b border-line text-left text-xs text-ink-3">
          {columns.map((c, i) => (
            <th key={c} className={cn("py-2 font-medium", i > 0 && "text-right")}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {rows.map((r, ri) => (
          <tr key={ri}>
            {r.map((cell, ci) => (
              <td key={ci} className={cn("tabular py-1.5", ci > 0 ? "text-right text-ink" : "text-ink-2")}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
