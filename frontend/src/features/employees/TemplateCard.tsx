import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CALLING_MODES } from "@/lib/labels";
import type { EmployeeTemplate } from "./templates";

/** Local SVG illustration: a calm abstract scene (call bubble + waveform) tinted per industry. */
export function TemplateArt({ template, className }: { template: EmployeeTemplate; className?: string }) {
  const { bg, fg, shape } = template.art;
  const Icon = template.icon;
  return (
    <div className={cn("relative overflow-hidden", className)} style={{ background: bg }} aria-hidden>
      <svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <circle cx="270" cy="18" r="62" fill={shape} opacity="0.7" />
        <circle cx="40" cy="120" r="44" fill={shape} opacity="0.5" />
        <g transform="translate(150 44)" opacity="0.9">
          {[10, 22, 14, 30, 18, 26, 12, 20, 8].map((h, i) => (
            <rect key={i} x={i * 9} y={18 - h / 2} width="4" height={h} rx="2" fill={fg} opacity={0.18 + (i % 3) * 0.08} />
          ))}
        </g>
        <rect x="236" y="70" width="58" height="26" rx="13" fill="white" opacity="0.85" />
        <circle cx="252" cy="83" r="3" fill={fg} opacity="0.5" />
        <circle cx="264" cy="83" r="3" fill={fg} opacity="0.35" />
        <circle cx="276" cy="83" r="3" fill={fg} opacity="0.2" />
      </svg>
      <div className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl bg-white shadow-card" style={{ color: fg }}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}

export function TemplateCard({ template, onSelect, selected, compact }: { template: EmployeeTemplate; onSelect: () => void; selected?: boolean; compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-xl border bg-surface text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-pop focus-visible:shadow-focus",
        selected ? "border-accent ring-2 ring-accent/20" : "border-line hover:border-line-strong",
      )}
    >
      <TemplateArt template={template} className={compact ? "h-20" : "h-28"} />
      <div className="flex flex-1 flex-col p-4">
        <span className="text-2xs font-semibold uppercase tracking-wide text-ink-3">{template.category}</span>
        <span className="mt-1 text-sm font-semibold text-ink">{template.title}</span>
        {!compact && <span className="mt-1 flex-1 text-[13px] leading-relaxed text-ink-2">{template.description}</span>}
        <span className="mt-3 flex items-center justify-between text-xs">
          <span className="text-ink-3">{CALLING_MODES[template.defaults.callingMode].label} calling</span>
          <span className="flex items-center gap-1 font-medium text-accent opacity-80 group-hover:opacity-100">
            {selected ? "Selected" : "Use template"}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </span>
      </div>
    </button>
  );
}
