import type { ReactNode } from "react";
import { AlertTriangle, PlugZap, RotateCw, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApiError } from "@/lib/api/errors";
import { Button } from "./Button";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-md bg-muted", className)} aria-hidden>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-surface/60 to-transparent" />
    </div>
  );
}

export function SkeletonRows({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("divide-y divide-line", className)} role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-3.5">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-2.5 w-1/5" />
          </div>
          <Skeleton className="hidden h-5 w-16 sm:block" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-3", className)} role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card space-y-3 p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-2.5 w-1/3" />
            </div>
          </div>
          <Skeleton className="h-2.5 w-full" />
          <Skeleton className="h-2.5 w-4/5" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondary,
  className,
  compact,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  secondary?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 text-center", compact ? "py-8" : "py-14", className)}>
      {icon && (
        <div className="mb-3.5 flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-subtle text-ink-2 [&>svg]:h-5 [&>svg]:w-5">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-ink-2">{description}</p>}
      {(action || secondary) && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondary}
        </div>
      )}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
  className,
  compact,
}: {
  error: ApiError | null;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}) {
  const network = error?.kind === "network";
  const unsupported = error?.kind === "unsupported";
  const Icon = network ? WifiOff : unsupported ? PlugZap : AlertTriangle;
  return (
    <div role="alert" className={cn("flex flex-col items-center px-6 text-center", compact ? "py-8" : "py-14", className)}>
      <div
        className={cn(
          "mb-3.5 flex h-11 w-11 items-center justify-center rounded-xl",
          unsupported ? "bg-accent-soft text-accent-ink" : "bg-danger-soft text-danger",
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold text-ink">
        {network ? "Backend unreachable" : unsupported ? "Needs backend support" : "Couldn't load this"}
      </h3>
      <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-ink-2">{error?.message ?? "Something went wrong."}</p>
      {onRetry && !unsupported && (
        <Button className="mt-4" size="sm" onClick={onRetry} icon={<RotateCw className="h-3.5 w-3.5" />}>
          Try again
        </Button>
      )}
    </div>
  );
}

/** Renders loading / error / empty / data consistently for any async resource. */
export function AsyncContent<T>({
  state,
  loading,
  empty,
  isEmpty,
  children,
}: {
  state: { data: T | undefined; loading: boolean; error: ApiError | null; refetch: () => void };
  loading: ReactNode;
  empty?: ReactNode;
  isEmpty?: (data: T) => boolean;
  children: (data: T) => ReactNode;
}) {
  if (state.error) return <ErrorState error={state.error} onRetry={state.refetch} />;
  if (state.data === undefined) return <>{loading}</>;
  if (empty && isEmpty?.(state.data)) return <>{empty}</>;
  return <>{children(state.data)}</>;
}
