"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TabItem<T extends string> {
  value: T;
  label: ReactNode;
  count?: number;
}

/** Underline tabs with roving keyboard focus (←/→). Content is rendered by the caller. */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
  ariaLabel,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  ariaLabel?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: KeyboardEvent, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (index + (e.key === "ArrowRight" ? 1 : -1) + items.length) % items.length;
    refs.current[next]?.focus();
    onChange(items[next].value);
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn("scrollbar-thin flex gap-5 overflow-x-auto border-b border-line", className)}
    >
      {items.map((item, i) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "relative -mb-px flex h-10 shrink-0 items-center gap-1.5 border-b-2 text-sm font-medium transition-colors",
              active ? "border-accent text-ink" : "border-transparent text-ink-2 hover:text-ink",
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span className={cn("rounded px-1.5 text-xs tabular", active ? "bg-accent-soft text-accent-ink" : "bg-muted text-ink-2")}>
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Compact segmented control — used for view switchers and date presets. */
export function Segmented<T extends string>({
  items,
  value,
  onChange,
  className,
  ariaLabel,
}: {
  items: { value: T; label: ReactNode; icon?: ReactNode; disabled?: boolean; title?: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn("inline-flex h-9 items-center rounded-lg border border-line bg-subtle p-0.5", className)}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={item.disabled}
            title={item.title}
            onClick={() => onChange(item.value)}
            className={cn(
              "inline-flex h-full items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
              active ? "bg-surface text-ink shadow-card" : "text-ink-2 hover:text-ink",
            )}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
