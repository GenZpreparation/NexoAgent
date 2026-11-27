import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, PlugZap } from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { Button } from "./Button";
import { Tooltip } from "./Tooltip";

const AVATAR_TINTS = [
  "bg-accent-soft text-accent-ink",
  "bg-info-soft text-info",
  "bg-success-soft text-success",
  "bg-warning-soft text-warning",
  "bg-hot-soft text-hot",
];

export function Avatar({ name, size = "md", className }: { name: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const tint = AVATAR_TINTS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_TINTS.length];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        size === "sm" && "h-7 w-7 text-[11px]",
        size === "md" && "h-9 w-9 text-xs",
        size === "lg" && "h-12 w-12 text-sm",
        tint,
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  hint,
  tone,
  loading,
}: {
  label: ReactNode;
  value: ReactNode;
  icon?: ReactNode;
  hint?: ReactNode;
  tone?: "accent" | "success" | "info" | "hot" | "warning";
  loading?: boolean;
}) {
  const toneClass = {
    accent: "bg-accent-soft text-accent-ink",
    success: "bg-success-soft text-success",
    info: "bg-info-soft text-info",
    hot: "bg-hot-soft text-hot",
    warning: "bg-warning-soft text-warning",
  };
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-ink-2">{label}</span>
        {icon && (
          <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg [&>svg]:h-4 [&>svg]:w-4", tone ? toneClass[tone] : "bg-muted text-ink-2")}>
            {icon}
          </span>
        )}
      </div>
      {loading ? (
        <div className="mt-2 h-7 w-20 animate-pulse rounded bg-muted" />
      ) : (
        <div className="tabular mt-1.5 text-2xl font-semibold tracking-tight text-ink">{value}</div>
      )}
      {hint && <div className="mt-1 text-xs text-ink-3">{hint}</div>}
    </div>
  );
}

/** Small inline marker for controls that depend on a backend endpoint that doesn't exist yet. */
export function NeedsBackend({ what, className }: { what?: string; className?: string }) {
  return (
    <Tooltip content={what ? `${what} needs a backend endpoint. See FRONTEND_BACKEND_CONTRACT.md` : "Needs a backend endpoint"}>
      <span
        tabIndex={0}
        className={cn("inline-flex h-5 items-center gap-1 rounded-md bg-accent-soft px-1.5 text-2xs font-medium text-accent-ink", className)}
      >
        <PlugZap className="h-3 w-3" aria-hidden />
        Needs backend
      </span>
    </Tooltip>
  );
}

/** Callout explaining a backend dependency for an entire section. */
export function BackendNotice({ title, children, className }: { title: string; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start gap-3 rounded-xl border border-accent/20 bg-accent-soft/50 px-4 py-3", className)}>
      <PlugZap className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
      <div className="text-[13px] leading-relaxed">
        <p className="font-medium text-ink">{title}</p>
        {children && <div className="mt-0.5 text-ink-2">{children}</div>}
      </div>
    </div>
  );
}

export function Pagination({
  offset,
  limit,
  count,
  total,
  hasMore,
  onChange,
}: {
  offset: number;
  limit: number;
  count: number;
  total?: number;
  hasMore?: boolean;
  onChange: (offset: number) => void;
}) {
  const canNext = total !== undefined ? offset + limit < total : !!hasMore;
  if (count === 0 && offset === 0) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 text-[13px] text-ink-2">
      <span className="tabular">
        {count === 0 ? "No results" : `${offset + 1}–${offset + count}`}
        {total !== undefined && ` of ${total}`}
      </span>
      <div className="flex gap-1.5">
        <Button size="icon-sm" aria-label="Previous page" disabled={offset === 0} onClick={() => onChange(Math.max(0, offset - limit))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button size="icon-sm" aria-label="Next page" disabled={!canNext} onClick={() => onChange(offset + limit)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-line bg-subtle px-1 font-sans text-2xs font-medium text-ink-3">
      {children}
    </kbd>
  );
}

export function Progress({ value, className, tone = "accent" }: { value: number; className?: string; tone?: "accent" | "success" }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full transition-[width] duration-500", tone === "accent" ? "bg-accent" : "bg-success")} style={{ width: `${pct}%` }} />
    </div>
  );
}
