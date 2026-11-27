"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Click-to-open popover anchored to its trigger. Closes on outside click / Esc.
 * `trigger` receives the open state and toggle so it can render any button.
 */
export function Popover({
  trigger,
  children,
  align = "start",
  className,
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  align?: "start" | "end";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={ref} className="relative inline-block">
      {trigger({ open, toggle: () => setOpen(!open) })}
      {open && (
        <div
          className={cn(
            "absolute top-full z-40 mt-1.5 min-w-[200px] animate-slide-up rounded-xl border border-line bg-surface p-1 shadow-pop",
            align === "end" ? "right-0" : "left-0",
            className,
          )}
        >
          {typeof children === "function" ? children(close) : children}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  onSelect,
  icon,
  children,
  selected,
  danger,
  disabled,
  hint,
}: {
  onSelect: () => void;
  icon?: ReactNode;
  children: ReactNode;
  selected?: boolean;
  danger?: boolean;
  disabled?: boolean;
  hint?: ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        danger ? "text-danger hover:bg-danger-soft" : "text-ink hover:bg-muted",
      )}
    >
      {icon && <span className="flex h-4 w-4 shrink-0 items-center justify-center text-ink-2">{icon}</span>}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {hint && <span className="text-xs text-ink-3">{hint}</span>}
      {selected && <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden />}
    </button>
  );
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <div className="px-2.5 pb-1 pt-2 text-2xs font-semibold uppercase tracking-wide text-ink-3">{children}</div>;
}

export function MenuDivider() {
  return <div className="my-1 h-px bg-line" />;
}
