import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger" | "info" | "hot";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-muted text-ink-2",
  accent: "bg-accent-soft text-accent-ink",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  hot: "bg-hot-soft text-hot",
};

const dots: Record<BadgeTone, string> = {
  neutral: "bg-ink-3",
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  hot: "bg-hot",
};

export function Badge({
  tone = "neutral",
  dot,
  icon,
  className,
  children,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dots[tone])} aria-hidden />}
      {icon}
      {children}
    </span>
  );
}

export function StatusDot({ tone = "neutral", pulse, className }: { tone?: BadgeTone; pulse?: boolean; className?: string }) {
  return (
    <span className={cn("relative inline-flex h-2 w-2", className)} aria-hidden>
      {pulse && <span className={cn("absolute inset-0 animate-ping rounded-full opacity-60", dots[tone])} />}
      <span className={cn("relative h-2 w-2 rounded-full", dots[tone])} />
    </span>
  );
}
