/**
 * NexoAgent — DOMAIN types used by UI components.
 *
 * These are intentionally decoupled from backend wire formats (`src/types/api.ts`).
 * Services adapt wire -> domain, so the UI never depends on a specific backend shape.
 * Fields marked `null`-able are ones the current backend does not yet provide;
 * the UI renders them as "Not configured" rather than inventing values.
 */

export type ID = string;

// ------------------------------------------------------------ Session ----
export interface SessionUser {
  id: ID;
  name: string;
  email: string;
  role: string;
}

export interface SessionWorkspace {
  id: ID;
  name: string;
  slug: string;
  balanceInr: number;
}

export interface Session {
  user: SessionUser;
  workspace: SessionWorkspace;
}

// ---------------------------------------------------------- Employees ----
export type CallingMode = "instant" | "bulk" | "inbound";
export type EmployeeStatus = "active" | "paused";

export interface QualificationQuestion {
  id: ID;
  question: string;
  /** Key the answer is captured under, e.g. "budget". */
  field: string;
  required: boolean;
}

export interface FollowUpConfig {
  maxAttempts: number;
  retryGapHours: number;
  honourCallbackRequests: boolean;
  sendSummaryOnWhatsApp: boolean;
}

export interface WorkingHours {
  days: number[]; // 0 = Sunday … 6 = Saturday
  start: string; // "09:30"
  end: string; // "19:00"
  timezone: string;
}

export interface Employee {
  id: ID;
  name: string;
  role: string;
  status: EmployeeStatus;
  language: string; // BCP-47, e.g. "hi-IN"
  voiceId: string;
  voiceProvider: string;
  firstMessage: string;
  instructions: string;
  /** Not stored by the current backend → null in API mode. */
  callingMode: CallingMode | null;
  naturalSpeech: boolean | null;
  qualificationQuestions: QualificationQuestion[] | null;
  followUp: FollowUpConfig | null;
  workingHours: WorkingHours | null;
  channels: string[] | null;
  templateId: string | null;
  stats: { calls: number; qualified: number; lastActiveAt: string | null } | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeDraft {
  name: string;
  role: string;
  description: string;
  language: string;
  naturalSpeech: boolean;
  callingMode: CallingMode | null;
  voiceId: string;
  firstMessage: string;
  instructions: string;
  tone: "friendly" | "professional" | "energetic";
  qualificationQuestions: QualificationQuestion[];
  hotLeadCriteria: string;
  followUp: FollowUpConfig;
  workingHours: WorkingHours;
  templateId: string | null;
}

export interface Voice {
  id: string;
  name: string;
  language: string;
  languageCode: string;
  provider: string;
  gender: string;
  accent: string;
  tier: string;
  ratePerMinInr: number;
  description: string;
}

// -------------------------------------------------------------- Leads ----
export type LeadOutcome =
  | "interested"
  | "callback"
  | "not_interested"
  | "no_answer"
  | "busy"
  | "dnd"
  | "failed"
  | "pending"
  | "completed";

export type FollowUpStatus = "none" | "scheduled" | "overdue" | "done";
export type Temperature = "hot" | "warm" | "cold" | "neutral";

export interface Lead {
  id: ID;
  name: string;
  phone: string;
  city: string | null;
  source: string;
  campaignName: string | null;
  employeeName: string | null;
  employeeId: ID | null;
  channel: string | null;
  qualified: boolean;
  outcome: LeadOutcome;
  temperature: Temperature;
  capturedInfo: Record<string, string>;
  followUp: { status: FollowUpStatus; at: string | null };
  callAttempts: number;
  lastContactedAt: string | null;
  createdAt: string;
  tags: string[];
}

export interface LeadSummary {
  total: number;
  qualified: number;
  pendingCallback: number;
  hot: number;
}

export type LeadSort = "recent" | "oldest" | "last_contacted" | "name";

export interface LeadQuery {
  search?: string;
  sort?: LeadSort;
  employeeId?: ID;
  outcome?: LeadOutcome;
  hotOnly?: boolean;
  channel?: string;
  createdWithinDays?: number;
  contactedWithinDays?: number;
  limit: number;
  offset: number;
}

export interface LeadPage {
  summary: LeadSummary;
  items: Lead[];
  /** True when the server may have more rows after this page. */
  hasMore: boolean;
}

// ------------------------------------------------------ Conversations ----
export type CallStatus =
  | "initiated"
  | "ringing"
  | "in-progress"
  | "completed"
  | "busy"
  | "no-answer"
  | "failed";

export interface TranscriptTurn {
  speaker: "agent" | "customer";
  text: string;
}

export interface Conversation {
  id: ID;
  callSid: string;
  callerName: string | null;
  phone: string;
  employeeId: ID | null;
  employeeName: string | null;
  direction: "inbound" | "outbound";
  channel: string | null;
  startedAt: string;
  durationSec: number;
  status: CallStatus | string;
  outcome: LeadOutcome | null;
  sentiment: string | null;
  summary: string | null;
  transcript: TranscriptTurn[] | null;
  capturedData: Record<string, string>;
  recordingAvailable: boolean;
  costInr: number;
  whatsappStatus: string | null;
}

export interface ConversationQuery {
  search?: string;
  employeeId?: ID;
  status?: string;
  channel?: string;
  direction?: "inbound" | "outbound";
  withinDays?: number;
  limit: number;
  offset: number;
}

export interface ConversationPage {
  items: Conversation[];
  total: number;
}

// --------------------------------------------------------- Performance ----
export interface PerformanceQuery {
  days: number;
  from?: string;
  to?: string;
  employeeId?: ID;
  channel?: string;
  issuesOnly?: boolean;
  minDurationSec?: number;
}

export interface Performance {
  summary: {
    calls: number;
    connectRatePct: number;
    conversionRatePct: number;
    avgCallLengthSec: number;
    leads: number;
    successRatePct: number;
    creditsUsedInr: number;
  };
  callsOverTime: { date: string; dialed: number; connected: number; qualified: number }[];
  funnel: { stage: string; value: number }[];
  outcomes: { outcome: string; label: string; value: number }[];
  /** null → backend does not provide this breakdown yet. */
  byChannel: { channel: string; calls: number; connected: number }[] | null;
  businessHours: { hour: number; calls: number }[] | null;
  leaderboard: { employeeId: ID; name: string; calls: number; qualified: number; connectRatePct: number }[] | null;
}

// ----------------------------------------------------------- Campaigns ----
export type CampaignStatus = "draft" | "running" | "paused" | "completed";

export interface Campaign {
  id: ID;
  name: string;
  status: CampaignStatus | string;
  employeeId: ID;
  employeeName: string | null;
  source: string;
  totalLeads: number;
  dialed: number;
  connected: number;
  concurrency: number;
  createdAt: string;
}

export interface CampaignLead {
  id: ID;
  name: string;
  phone: string;
  city: string | null;
  status: string;
  retryCount: number;
  lastCalledAt: string | null;
}

export interface CsvUploadResult {
  added: number;
  processed: number | null;
  dndBlocked: number | null;
  duplicates: number | null;
  invalid: number | null;
}

// ------------------------------------------------------------ Channels ----
export type ChannelType = "phone" | "whatsapp" | "sip";

export interface Channel {
  id: ID;
  type: ChannelType;
  phone: string;
  name: string;
  active: boolean;
  concurrency: number;
  assignedEmployeeId: ID | null;
  dltEntityId: string | null;
  dltSenderId: string | null;
}

export interface ChannelInput {
  phone: string;
  name: string;
  concurrency: number;
  assignedEmployeeId: ID | null;
  dltEntityId: string;
  dltSenderId: string;
}

export interface LiveActivity {
  activeCalls: number;
  burnRatePerMin: number;
  totalChannels: number;
}

// -------------------------------------------------------- Instant leads ----
export type SourceProvider = "meta_ads" | "google_ads" | "website_form" | "webhook" | "crm";

export interface LeadSource {
  id: ID;
  provider: SourceProvider;
  name: string;
  status: "connected" | "not_connected" | "error";
  employeeId: ID | null;
  leadsLast7d: number;
  lastLeadAt: string | null;
}

export interface InstantLeadStats {
  leadsReceived: number;
  calledWithin60sPct: number;
  medianSpeedToLeadSec: number;
  connectRatePct: number;
  daily: { date: string; received: number; called: number }[];
}

export interface QueueItem {
  id: ID;
  name: string;
  phone: string;
  source: string;
  receivedAt: string;
  state: "waiting" | "dialing" | "retry_scheduled" | "outside_hours";
  nextAttemptAt: string | null;
}

export interface InstantLeadSettings {
  enabled: boolean;
  employeeId: ID | null;
  delaySeconds: number;
  maxAttempts: number;
  respectWorkingHours: boolean;
}

// ------------------------------------------------------------- Billing ----
export interface Wallet {
  balanceInr: number;
  estimatedMinutes: number;
  ratePerMinute: number;
  lowBalance: boolean;
}

export interface Transaction {
  id: ID;
  type: "credit" | "debit" | string;
  amountInr: number;
  closingBalanceInr: number;
  reference: string | null;
  description: string;
  createdAt: string;
}

// ---------------------------------------------------------- Developers ----
export interface ApiKey {
  id: ID;
  name: string;
  prefix: string;
  active: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface Webhook {
  id: ID;
  url: string;
  description: string | null;
  secret: string;
  events: string[];
  active: boolean;
  createdAt: string;
}

// ----------------------------------------------------------- Workspace ----
export interface Member {
  id: ID;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

export interface Notification {
  id: ID;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href?: string;
}

export interface SearchResult {
  category: "employee" | "lead" | "campaign" | "call" | "page";
  id: ID;
  title: string;
  subtitle: string | null;
  href: string;
}
