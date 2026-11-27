/**
 * Wire (backend) → domain (UI) adapters. Pure functions; unit tested.
 * If a backend schema changes, this is the file to update.
 */
import type {
  ApiAgent,
  ApiCall,
  ApiCampaign,
  ApiCampaignLead,
  ApiChannel,
  ApiKeyItem,
  ApiLeadItem,
  ApiMember,
  ApiPerformance,
  ApiTransaction,
  ApiVoice,
  ApiWebhook,
} from "@/types/api";
import type {
  ApiKey,
  Campaign,
  CampaignLead,
  Channel,
  Conversation,
  Employee,
  Lead,
  LeadOutcome,
  Member,
  Performance,
  Temperature,
  Transaction,
  TranscriptTurn,
  Voice,
  Webhook,
} from "@/types/domain";

const str = (v: unknown): string => (v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v));

export function toStringRecord(obj: Record<string, unknown> | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!obj) return out;
  for (const [k, v] of Object.entries(obj)) if (v !== null && v !== undefined && v !== "") out[k] = str(v);
  return out;
}

export function toEmployee(a: ApiAgent): Employee {
  return {
    id: String(a.id),
    name: a.name,
    role: "",
    status: a.is_active ? "active" : "paused",
    language: a.language,
    voiceId: a.voice_id,
    voiceProvider: a.voice_provider,
    firstMessage: a.first_message,
    instructions: a.system_prompt,
    callingMode: null,
    naturalSpeech: null,
    qualificationQuestions: null,
    followUp: null,
    workingHours: null,
    channels: null,
    templateId: null,
    stats: null,
    createdAt: a.created_at,
    updatedAt: a.updated_at,
  };
}

export function toVoice(v: ApiVoice): Voice {
  return {
    id: v.id,
    name: v.name,
    language: v.language,
    languageCode: v.language_code,
    provider: v.provider,
    gender: v.gender,
    accent: v.accent,
    tier: v.tier,
    ratePerMinInr: v.rate_per_min_inr,
    description: v.description,
  };
}

/**
 * Backend transcripts are a single string like "Agent: Namaste! User: Haan boliye…".
 * Split on speaker labels into turns; fall back to a single agent turn.
 */
export function parseTranscript(raw: string | null | undefined): TranscriptTurn[] | null {
  if (!raw || !raw.trim()) return null;
  const re = /(?:^|\s|\n)(Agent|AI|Assistant|Bot|User|Customer|Caller|Human)\s*:\s*/gi;
  const turns: TranscriptTurn[] = [];
  let match: RegExpExecArray | null;
  let lastSpeaker: TranscriptTurn["speaker"] | null = null;
  let lastIndex = 0;
  while ((match = re.exec(raw))) {
    if (lastSpeaker !== null) {
      const text = raw.slice(lastIndex, match.index).trim();
      if (text) turns.push({ speaker: lastSpeaker, text });
    }
    lastSpeaker = /^(agent|ai|assistant|bot)$/i.test(match[1]) ? "agent" : "customer";
    lastIndex = match.index + match[0].length;
  }
  if (lastSpeaker !== null) {
    const text = raw.slice(lastIndex).trim();
    if (text) turns.push({ speaker: lastSpeaker, text });
  }
  return turns.length ? turns : [{ speaker: "agent", text: raw.trim() }];
}

const KNOWN_OUTCOMES: LeadOutcome[] = ["interested", "callback", "not_interested", "no_answer", "busy", "dnd", "failed", "pending", "completed"];

/** Map backend lead/call status strings onto the UI's outcome vocabulary. */
export function toOutcome(status: string | null | undefined): LeadOutcome {
  const s = (status ?? "").toLowerCase().replace(/-/g, "_");
  if (s === "dnd_blocked" || s === "dnd_scrubbed") return "dnd";
  if (s === "retry_scheduled") return "callback";
  if (s === "dialing" || s === "initiated" || s === "ringing" || s === "in_progress") return "pending";
  return (KNOWN_OUTCOMES as string[]).includes(s) ? (s as LeadOutcome) : "pending";
}

export function toTemperature(sentiment: string | null | undefined, captured?: Record<string, string>): Temperature {
  const s = (sentiment ?? "").toLowerCase();
  const interest = (captured?.lead_interest ?? "").toLowerCase();
  if (s === "hot" || interest === "hot") return "hot";
  if (s === "warm" || s === "positive" || interest === "warm") return "warm";
  if (s === "cold" || s === "negative" || interest === "cold") return "cold";
  return "neutral";
}

export function toLead(l: ApiLeadItem): Lead {
  const capturedInfo = toStringRecord(l.captured_info);
  const outcome = toOutcome(l.outcome || l.status);
  return {
    id: String(l.id),
    name: l.name,
    phone: l.phone_number,
    city: l.city,
    source: l.lead_source,
    campaignName: l.campaign_name,
    employeeName: null, // not returned by GET /leads
    employeeId: null,
    channel: null,
    qualified: l.status === "completed" || outcome === "interested",
    outcome,
    temperature: toTemperature(l.sentiment, capturedInfo),
    capturedInfo,
    followUp: { status: "none", at: null }, // not tracked by backend yet
    callAttempts: l.call_attempts,
    lastContactedAt: l.last_contacted_at,
    createdAt: l.created_at,
    tags: [],
  };
}

export function toConversation(c: ApiCall, employeeNames: Map<string, string>): Conversation {
  const capturedData = toStringRecord(c.log?.extracted_data ?? null);
  const employeeId = c.agent_id !== null ? String(c.agent_id) : null;
  return {
    id: String(c.id),
    callSid: c.call_sid,
    callerName: capturedData.name ?? capturedData.customer_name ?? null,
    phone: c.customer_phone,
    employeeId,
    employeeName: employeeId ? employeeNames.get(employeeId) ?? `Employee #${employeeId}` : null,
    direction: c.direction === "inbound" ? "inbound" : "outbound",
    channel: null,
    startedAt: c.created_at,
    durationSec: c.duration_seconds,
    status: c.status,
    outcome: c.status === "completed" ? null : toOutcome(c.status),
    sentiment: c.log?.sentiment ?? null,
    summary: c.log?.summary ?? null,
    transcript: parseTranscript(c.log?.transcript),
    capturedData,
    recordingAvailable: !!c.recording_url,
    costInr: c.cost_inr,
    whatsappStatus: c.log?.whatsapp_status ?? null,
  };
}

export function toPerformance(p: ApiPerformance): Performance {
  const o = p.outcomes;
  return {
    summary: {
      calls: p.summary.total_calls,
      connectRatePct: p.summary.connect_rate_pct,
      conversionRatePct: p.summary.conversion_rate_pct,
      avgCallLengthSec: p.summary.avg_call_length_seconds,
      leads: p.summary.qualified_leads,
      successRatePct: p.summary.success_rate_pct,
      creditsUsedInr: p.summary.credits_used_inr,
    },
    callsOverTime: p.calls_over_time,
    funnel: [
      { stage: "Dialed", value: p.conversion_funnel.dialed },
      { stage: "Connected", value: p.conversion_funnel.connected },
      { stage: "Engaged > 30s", value: p.conversion_funnel.engaged_gt_30s },
      { stage: "Qualified", value: p.conversion_funnel.qualified },
    ],
    outcomes: [
      { outcome: "interested", label: "Interested", value: o.interested },
      { outcome: "callback", label: "Callback", value: o.callback },
      { outcome: "not_interested", label: "Not interested", value: o.not_interested },
      { outcome: "busy", label: "Busy", value: o.busy },
      { outcome: "dnd", label: "DND", value: o.dnd_scrubbed },
      { outcome: "failed", label: "Failed", value: o.failed },
    ].filter((x) => x.value > 0),
    byChannel: null,
    businessHours: null,
    leaderboard: null,
  };
}

export function toCampaign(c: ApiCampaign, employeeNames: Map<string, string>): Campaign {
  return {
    id: String(c.id),
    name: c.name,
    status: c.status,
    employeeId: String(c.agent_id),
    employeeName: employeeNames.get(String(c.agent_id)) ?? null,
    source: c.total_leads ? `${c.total_leads.toLocaleString("en-IN")} leads` : "No list uploaded",
    totalLeads: c.total_leads,
    dialed: c.dialed_leads,
    connected: c.connected_leads,
    concurrency: c.concurrency_limit,
    createdAt: c.created_at,
  };
}

export function toCampaignLead(l: ApiCampaignLead): CampaignLead {
  return { id: String(l.id), name: l.full_name, phone: l.phone_number, city: l.city, status: l.status, retryCount: l.retry_count, lastCalledAt: l.last_called_at };
}

export function toChannel(c: ApiChannel): Channel {
  return {
    id: String(c.id),
    type: "phone",
    phone: c.phone_number,
    name: c.friendly_name,
    active: c.is_active,
    concurrency: c.concurrency_limit,
    assignedEmployeeId: c.assigned_agent_id !== null ? String(c.assigned_agent_id) : null,
    dltEntityId: c.dlt_entity_id,
    dltSenderId: c.dlt_sender_id,
  };
}

export function toTransaction(t: ApiTransaction): Transaction {
  const type = t.transaction_type.toLowerCase();
  return {
    id: String(t.id),
    type: type.includes("debit") || type.includes("usage") || type.includes("charge") ? "debit" : type.includes("credit") || type.includes("recharge") || type.includes("bonus") ? "credit" : type,
    amountInr: Math.abs(t.amount_inr),
    closingBalanceInr: t.closing_balance_inr,
    reference: t.reference_id,
    description: t.description,
    createdAt: t.created_at,
  };
}

export const toApiKey = (k: ApiKeyItem): ApiKey => ({ id: String(k.id), name: k.name, prefix: k.key_prefix, active: k.is_active, createdAt: k.created_at, lastUsedAt: k.last_used_at });

export const toWebhook = (w: ApiWebhook): Webhook => ({ id: String(w.id), url: w.target_url, description: w.description, secret: w.secret, events: w.subscribed_events, active: w.is_active, createdAt: w.created_at });

export const toMember = (m: ApiMember): Member => ({ id: String(m.id), name: m.full_name, email: m.email, role: m.role, active: m.is_active });
