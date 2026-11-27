import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { CALLING_MODES, CAMPAIGN_STATUS, OUTCOMES, TEMPERATURE, callStatus } from "@/lib/labels";
import type { CallingMode, EmployeeStatus, LeadOutcome, Temperature } from "@/types/domain";

export function OutcomeBadge({ outcome }: { outcome: LeadOutcome | null }) {
  if (!outcome) return <span className="text-ink-3">—</span>;
  const o = OUTCOMES[outcome];
  return <Badge tone={o.tone}>{o.label}</Badge>;
}

export function CallStatusBadge({ status }: { status: string }) {
  const s = callStatus(status);
  return (
    <Badge tone={s.tone} dot>
      {s.label}
    </Badge>
  );
}

export function TemperatureBadge({ value }: { value: Temperature }) {
  if (value === "neutral") return null;
  const t = TEMPERATURE[value];
  return (
    <Badge tone={t.tone} icon={value === "hot" ? <Flame className="h-3 w-3" aria-hidden /> : undefined}>
      {t.label}
    </Badge>
  );
}

export function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
  return status === "active" ? (
    <Badge tone="success" dot>
      Active
    </Badge>
  ) : (
    <Badge tone="neutral" dot>
      Paused
    </Badge>
  );
}

export function CallingModeBadge({ mode }: { mode: CallingMode | null }) {
  if (!mode) return <Badge tone="neutral">Mode not set</Badge>;
  return <Badge tone="accent">{CALLING_MODES[mode].label}</Badge>;
}

export function CampaignStatusBadge({ status }: { status: string }) {
  const s = CAMPAIGN_STATUS[status] ?? { label: status, tone: "neutral" as const };
  return (
    <Badge tone={s.tone} dot>
      {s.label}
    </Badge>
  );
}
