"use client";

import type { ReactNode } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, MenuItem } from "./Popover";
import { Tooltip } from "./Tooltip";

export interface FilterOption<T extends string> {
  value: T;
  label: string;
}

/**
 * Single-select filter chip ("Channels ▾", "Outcome ▾"). When a value is set the chip
 * shows it and offers a clear (×) button. `disabledReason` renders it disabled with a tooltip.
 */
export function FilterMenu<T extends string>({
  label,
  icon,
  options,
  value,
  onChange,
  disabledReason,
}: {
  label: string;
  icon?: ReactNode;
  options: FilterOption<T>[];
  value: T | undefined;
  onChange: (v: T | undefined) => void;
  disabledReason?: string;
}) {
  const selected = options.find((o) => o.value === value);
  const chipClass = cn(
    "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[13px] font-medium transition-colors",
    selected ? "border-accent/30 bg-accent-soft text-accent-ink" : "border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink",
  );

  if (disabledReason) {
    return (
      <Tooltip content={disabledReason}>
        <button type="button" disabled className={cn(chipClass, "cursor-not-allowed opacity-50")}>
          {icon}
          {label}
          <ChevronDown className="h-3.5 w-3.5" aria-hidden />
        </button>
      </Tooltip>
    );
  }

  return (
    <Popover
      trigger={({ open, toggle }) => (
        <div className={chipClass}>
          <button type="button" onClick={toggle} aria-expanded={open} aria-haspopup="menu" className="inline-flex items-center gap-1.5">
            {icon}
            {selected ? `${label}: ${selected.label}` : label}
            {!selected && <ChevronDown className="h-3.5 w-3.5" aria-hidden />}
          </button>
          {selected && (
            <button type="button" onClick={() => onChange(undefined)} aria-label={`Clear ${label} filter`} className="-mr-1 rounded p-0.5 hover:bg-accent/10">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    >
      {(close) => (
        <div role="menu" className="max-h-72 overflow-y-auto">
          {options.length === 0 && <p className="px-2.5 py-2 text-[13px] text-ink-3">No options yet</p>}
          {options.map((o) => (
            <MenuItem
              key={o.value}
              selected={o.value === value}
              onSelect={() => {
                onChange(o.value === value ? undefined : o.value);
                close();
              }}
            >
              {o.label}
            </MenuItem>
          ))}
        </div>
      )}
    </Popover>
  );
}

/** Boolean filter chip (e.g. "Hot leads only"). */
export function ToggleChip({
  active,
  onChange,
  icon,
  children,
  disabledReason,
}: {
  active: boolean;
  onChange: (v: boolean) => void;
  icon?: ReactNode;
  children: ReactNode;
  disabledReason?: string;
}) {
  const btn = (
    <button
      type="button"
      aria-pressed={active}
      disabled={!!disabledReason}
      onClick={() => onChange(!active)}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        active ? "border-accent/30 bg-accent-soft text-accent-ink" : "border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink",
      )}
    >
      {icon}
      {children}
    </button>
  );
  return disabledReason ? <Tooltip content={disabledReason}>{btn}</Tooltip> : btn;
}
