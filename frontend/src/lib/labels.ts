import type { BadgeTone } from "@/components/ui/Badge";
import type { CallingMode, LeadOutcome, SourceProvider, Temperature } from "@/types/domain";

export const LANGUAGES: { code: string; label: string }[] = [
  { code: "hi-IN", label: "Hindi" },
  { code: "en-IN", label: "English (India)" },
  { code: "hinglish", label: "Hinglish" },
  { code: "mr-IN", label: "Marathi" },
  { code: "ta-IN", label: "Tamil" },
  { code: "te-IN", label: "Telugu" },
  { code: "kn-IN", label: "Kannada" },
  { code: "bn-IN", label: "Bengali" },
  { code: "gu-IN", label: "Gujarati" },
];

export function languageLabel(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.label ?? code;
}

export const CALLING_MODES: Record<CallingMode, { label: string; short: string; description: string }> = {
  instant: {
    label: "Instant",
    short: "Calls new leads immediately",
    description: "Calls a new lead the moment it arrives from an ad, form or CRM.",
  },
  bulk: {
    label: "Bulk",
    short: "Works through a list",
    description: "Processes a list of leads you upload or select, at a controlled pace.",
  },
  inbound: {
    label: "Inbound",
    short: "Answers incoming calls",
    description: "Answers calls to your business number and captures the details.",
  },
};

export const OUTCOMES: Record<LeadOutcome, { label: string; tone: BadgeTone }> = {
  interested: { label: "Interested", tone: "success" },
  completed: { label: "Completed", tone: "success" },
  callback: { label: "Callback", tone: "info" },
  not_interested: { label: "Not interested", tone: "neutral" },
  no_answer: { label: "No answer", tone: "warning" },
  busy: { label: "Busy", tone: "warning" },
  dnd: { label: "DND blocked", tone: "danger" },
  failed: { label: "Failed", tone: "danger" },
  pending: { label: "Pending", tone: "neutral" },
};

export const PIPELINE_COLUMNS: { key: string; label: string; outcomes: LeadOutcome[] }[] = [
  { key: "new", label: "New", outcomes: ["pending"] },
  { key: "attempted", label: "Attempted", outcomes: ["no_answer", "busy", "failed"] },
  { key: "callback", label: "Callback", outcomes: ["callback"] },
  { key: "qualified", label: "Qualified", outcomes: ["interested", "completed"] },
  { key: "closed", label: "Closed lost", outcomes: ["not_interested", "dnd"] },
];

export const CALL_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  initiated: { label: "Initiated", tone: "neutral" },
  ringing: { label: "Ringing", tone: "info" },
  "in-progress": { label: "In progress", tone: "accent" },
  completed: { label: "Completed", tone: "success" },
  busy: { label: "Busy", tone: "warning" },
  "no-answer": { label: "No answer", tone: "warning" },
  failed: { label: "Failed", tone: "danger" },
};

export function callStatus(status: string) {
  return CALL_STATUS[status] ?? { label: status, tone: "neutral" as BadgeTone };
}

export const TEMPERATURE: Record<Temperature, { label: string; tone: BadgeTone }> = {
  hot: { label: "Hot", tone: "hot" },
  warm: { label: "Warm", tone: "warning" },
  cold: { label: "Cold", tone: "info" },
  neutral: { label: "Neutral", tone: "neutral" },
};

export const CAMPAIGN_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  draft: { label: "Draft", tone: "neutral" },
  running: { label: "Running", tone: "success" },
  paused: { label: "Paused", tone: "warning" },
  completed: { label: "Completed", tone: "info" },
};

export const SOURCE_LABELS: Record<string, string> = {
  csv_upload: "CSV upload",
  meta_ads: "Meta Lead Ads",
  meta_lead_ads: "Meta Lead Ads",
  google_ads: "Google Ads",
  website_form: "Website form",
  webhook: "Webhook",
  crm: "CRM",
  api: "API",
  manual: "Manual",
  inbound: "Inbound call",
};

export function sourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source.replace(/_/g, " ");
}

export const SOURCE_PROVIDERS: Record<SourceProvider, { label: string; description: string }> = {
  meta_ads: { label: "Meta Lead Ads", description: "Facebook & Instagram instant forms" },
  google_ads: { label: "Google Ads", description: "Lead form extensions" },
  website_form: { label: "Website form", description: "Embed or post from your site" },
  webhook: { label: "Webhook / Zapier", description: "Send leads from any tool" },
  crm: { label: "CRM", description: "HubSpot, Zoho, Salesforce" },
};

export const WEBHOOK_EVENTS: { id: string; label: string }[] = [
  { id: "call.completed", label: "Call completed" },
  { id: "lead.qualified", label: "Lead qualified" },
  { id: "campaign.completed", label: "Campaign completed" },
];

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
