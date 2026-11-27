/**
 * NexoAgent — backend WIRE types.
 *
 * These mirror the FastAPI response/request models exactly as implemented in
 * `backend/app/schemas/*` and the inline models in `backend/app/api/v1/*`.
 * Verified against the backend source on 2026-11-27.
 *
 * Rules:
 *  - Only the services layer (`src/services/*`) and adapters may import these.
 *  - UI components consume DOMAIN types from `src/types/domain.ts` instead.
 *  - If the backend changes a schema, update it here and fix the adapter;
 *    the UI should not need to change.
 */

// ---------------------------------------------------------------- Auth ----
export interface ApiUser {
  id: number;
  email: string;
  full_name: string;
  role: string; // backend roles: "admin" | "manager" | "member"
  workspace_id: number;
  is_active: boolean;
}

export interface ApiWorkspace {
  id: number;
  name: string;
  slug: string;
  balance_inr: number;
  is_active: boolean;
}

export interface ApiTokenResponse {
  access_token: string;
  token_type: string;
  user: ApiUser;
  workspace: ApiWorkspace;
}

export interface ApiLoginRequest {
  email: string;
  password: string;
}

export interface ApiRegisterRequest {
  company_name: string;
  full_name: string;
  email: string;
  password: string;
}

/** GET /auth/me */
export interface ApiMeResponse {
  user: ApiUser;
  workspace: ApiWorkspace;
}

// -------------------------------------------------------------- Agents ----
export interface ApiAgent {
  id: number;
  workspace_id: number;
  name: string;
  system_prompt: string;
  first_message: string;
  voice_provider: string;
  voice_id: string;
  language: string;
  temperature: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiAgentCreateRequest {
  name: string; // 2..100
  system_prompt: string; // min 10
  first_message: string; // 5..500
  voice_provider?: string;
  voice_id?: string;
  language?: string;
  temperature?: number; // 0..1
}

export type ApiAgentUpdateRequest = Partial<ApiAgentCreateRequest> & { is_active?: boolean };

// -------------------------------------------------------------- Voices ----
export interface ApiVoice {
  id: string;
  name: string;
  language: string;
  language_code: string;
  provider: string;
  gender: string;
  accent: string;
  tier: string;
  rate_per_min_inr: number;
  description: string;
  sample_audio_url: string;
}

// --------------------------------------------------------------- Calls ----
export interface ApiCallLog {
  id: number;
  transcript: string | null;
  summary: string | null;
  sentiment: string | null;
  extracted_data: Record<string, unknown> | null;
  whatsapp_status: string;
}

export interface ApiCall {
  id: number;
  call_sid: string;
  workspace_id: number;
  agent_id: number | null;
  customer_phone: string;
  direction: string; // "outbound" | "inbound"
  status: string; // initiated, ringing, in-progress, completed, busy, no-answer, failed
  duration_seconds: number;
  cost_inr: number;
  recording_url: string | null;
  created_at: string;
  log: ApiCallLog | null;
}

export interface ApiCallList {
  total: number;
  items: ApiCall[];
}

export interface ApiRecordingStream {
  call_id: number;
  call_sid: string;
  streaming_url: string;
  expires_in_seconds: number;
}

// ----------------------------------------------------------- Campaigns ----
export interface ApiCampaign {
  id: number;
  workspace_id: number;
  agent_id: number;
  name: string;
  status: string; // draft, running, paused, completed
  concurrency_limit: number;
  total_leads: number;
  dialed_leads: number;
  connected_leads: number;
  created_at: string;
}

export interface ApiCampaignCreateRequest {
  name: string;
  agent_id: number;
  concurrency_limit?: number; // 1..50
}

export interface ApiCampaignLead {
  id: number;
  campaign_id: number;
  workspace_id: number;
  full_name: string;
  phone_number: string;
  city: string | null;
  status: string;
  retry_count: number;
  max_retries: number;
  call_sid: string | null;
  last_called_at: string | null;
  next_retry_at: string | null;
  lead_source: string;
}

/** POST /campaigns/{id}/upload-csv — shape per backend docs (dict response). */
export interface ApiCsvUploadResult {
  status: string;
  campaign_id: number;
  total_rows_processed?: number;
  leads_added?: number;
  dnd_scrubbed_blocked?: number;
  duplicates_skipped?: number;
  invalid_numbers_skipped?: number;
  [key: string]: unknown;
}

// --------------------------------------------------------------- Leads ----
export interface ApiLeadItem {
  id: number;
  name: string;
  phone_number: string;
  city: string | null;
  campaign_name: string | null;
  status: string;
  lead_source: string;
  sentiment: string;
  outcome: string;
  captured_info: Record<string, unknown>;
  call_attempts: number;
  call_sid: string | null;
  last_contacted_at: string | null;
  created_at: string;
}

export interface ApiLeadsList {
  summary: { total_leads: number; qualified: number; pending_callback: number; hot_leads: number };
  total: number;
  leads: ApiLeadItem[];
}

// ----------------------------------------------------------- Analytics ----
export interface ApiPerformance {
  summary: {
    total_calls: number;
    calls_change_pct: number;
    connect_rate_pct: number;
    connected_calls: number;
    conversion_rate_pct: number;
    qualified_leads: number;
    avg_call_length_seconds: number;
    total_duration_minutes: number;
    success_rate_pct: number;
    credits_used_inr: number;
    last_hour_calls: number;
    last_24h_calls: number;
  };
  calls_over_time: { date: string; dialed: number; connected: number; qualified: number }[];
  conversion_funnel: { dialed: number; connected: number; engaged_gt_30s: number; qualified: number };
  outcomes: {
    interested: number;
    callback: number;
    not_interested: number;
    busy: number;
    dnd_scrubbed: number;
    failed: number;
  };
}

// ------------------------------------------------------------ Channels ----
export interface ApiChannel {
  id: number;
  phone_number: string;
  friendly_name: string;
  concurrency_limit: number;
  dlt_entity_id: string | null;
  dlt_sender_id: string | null;
  assigned_agent_id: number | null;
  is_active: boolean;
}

export interface ApiChannelCreateRequest {
  phone_number: string;
  friendly_name?: string;
  concurrency_limit?: number;
  dlt_entity_id?: string;
  dlt_sender_id?: string;
  assigned_agent_id?: number;
}

export interface ApiLiveConcurrency {
  active_calls_count: number;
  burn_rate_inr_per_min: number;
  total_channels: number;
  channels_utilized_pct: number;
  status_label: string;
}

// ------------------------------------------------------------- Billing ----
export interface ApiWallet {
  balance_inr: number;
  currency: string;
  estimated_minutes_remaining: number;
  rate_per_minute: number;
  is_low_balance: boolean;
  workspace_name: string;
}

export interface ApiTransaction {
  id: number;
  workspace_id: number;
  transaction_type: string;
  amount_inr: number;
  opening_balance_inr: number;
  closing_balance_inr: number;
  reference_id: string | null;
  description: string;
  created_at: string;
}

// ---------------------------------------------------------- Developers ----
export interface ApiKeyItem {
  id: number;
  name: string;
  key_prefix: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

export interface ApiKeyCreated {
  id: number;
  name: string;
  key_prefix: string;
  api_key: string; // full secret, returned exactly once
  created_at: string;
  message: string;
}

export interface ApiWebhook {
  id: number;
  workspace_id: number;
  target_url: string;
  description: string | null;
  secret: string;
  subscribed_events: string[];
  is_active: boolean;
  created_at: string;
}

export interface ApiWebhookCreateRequest {
  target_url: string;
  description?: string;
  subscribed_events?: string[];
}

// ----------------------------------------------------------- Workspace ----
export interface ApiWorkspaceProfile {
  id: number;
  name: string;
  slug: string;
  balance_inr: number;
  is_active: boolean;
  total_members: number;
}

export interface ApiMember {
  id: number;
  workspace_id: number;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
}

export interface ApiMemberInviteRequest {
  full_name: string;
  email: string;
  password: string;
  role: string;
}

// -------------------------------------------------------------- Search ----
export interface ApiSearchResponse {
  query: string;
  total_results: number;
  results: { category: string; id: number; title: string; subtitle: string | null; url: string }[];
}

/** FastAPI error body: `detail` is a string, or a list for 422 validation errors. */
export interface ApiErrorBody {
  detail?: string | { loc?: (string | number)[]; msg?: string; type?: string }[];
}
