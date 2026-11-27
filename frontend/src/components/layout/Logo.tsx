import { cn } from "@/lib/utils";

/** NexoAgent mark: an "N" drawn as a single voice-wave stroke. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={cn("h-7 w-7 shrink-0", className)} aria-hidden>
      <rect width="28" height="28" rx="8" className="fill-accent" />
      <path d="M8.5 18.5V9.5L19.5 18.5V9.5" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="19.5" cy="9.5" r="1.6" fill="white" opacity="0.55" />
    </svg>
  );
}

export function Logo({ collapsed }: { collapsed?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      {!collapsed && (
        <span className="text-[15px] font-semibold tracking-tight text-ink">
          Nexo<span className="text-accent">Agent</span>
        </span>
      )}
    </span>
  );
}
