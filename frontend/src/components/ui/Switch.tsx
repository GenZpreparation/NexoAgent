"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Switch({
  checked,
  onChange,
  disabled,
  label,
  id,
  size = "md",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
  size?: "sm" | "md";
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex shrink-0 items-center rounded-full transition-colors duration-150 focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-50",
        size === "md" ? "h-5 w-9" : "h-4 w-7",
        checked ? "bg-accent" : "bg-line-strong",
      )}
    >
      <span
        className={cn(
          "inline-block rounded-full bg-white shadow-sm transition-transform duration-150",
          size === "md" ? "h-4 w-4" : "h-3 w-3",
          checked ? (size === "md" ? "translate-x-[18px]" : "translate-x-[14px]") : "translate-x-0.5",
        )}
      />
    </button>
  );
}

/** A labelled row with a switch on the right — used in settings and the wizard. */
export function SwitchRow({
  title,
  description,
  checked,
  onChange,
  disabled,
  extra,
}: {
  title: ReactNode;
  description?: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  extra?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm font-medium text-ink">
          {title}
          {extra}
        </div>
        {description && <p className="mt-0.5 text-[13px] text-ink-2">{description}</p>}
      </div>
      <Switch checked={checked} onChange={onChange} disabled={disabled} label={typeof title === "string" ? title : undefined} />
    </div>
  );
}
