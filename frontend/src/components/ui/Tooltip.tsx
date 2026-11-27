import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Lightweight CSS tooltip (hover + keyboard focus). For truly essential
 * information, also expose it as visible text or aria-label — tooltips are
 * not reachable on touch devices.
 */
export function Tooltip({
  content,
  children,
  side = "top",
  className,
  disabled,
}: {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "right" | "bottom";
  className?: string;
  disabled?: boolean;
}) {
  if (disabled) return <>{children}</>;
  return (
    <span className={cn("group/tt relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 w-max max-w-[240px] rounded-md bg-ink px-2 py-1 text-xs font-medium leading-snug text-canvas opacity-0 shadow-pop transition-opacity duration-100 group-focus-within/tt:opacity-100 group-hover/tt:opacity-100",
          side === "top" && "bottom-full left-1/2 mb-1.5 -translate-x-1/2",
          side === "bottom" && "left-1/2 top-full mt-1.5 -translate-x-1/2",
          side === "right" && "left-full top-1/2 ml-2 -translate-y-1/2",
        )}
      >
        {content}
      </span>
    </span>
  );
}
