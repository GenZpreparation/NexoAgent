/**
 * NexoAgent - TypeScript API Contract Types
 * 100% synchronized with Python FastAPI Backend Pydantic Schemas.
 * Any frontend developer can directly import and consume these interfaces.
 */

// ---------------------------------------------------------------------------
// 1. Auth & Multi-Tenancy Types
// ---------------------------------------------------------------------------

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: "admin" | "agent" | "viewer";
  workspace_id: number;
  is_active: boolean;
}

export interface Workspace {
  id: number;
  name: string;
  slug: string;
  balance_inr: number;
  is_active: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: "bearer";
  user: User;
  workspace: Workspace;
}

export interface UserRegisterRequest {
  company_name: string;
  full_name: string;
  email: string;
  password: string;
}

export interface UserLoginRequest {
  email: string;
  password: string;
}

// ---------------------------------------------------------------------------
// 2. Voice Agent Studio Types
// ---------------------------------------------------------------------------

export interface VoiceAgent {
  id: number;
  workspace_id: number;
  name: string;
  system_prompt: string;
  first_message: string;
  voice_provider: "sarvam" | "deepgram" | "elevenlabs";
  voice_id: string; // e.g. "bulbul:v3/pooja"
  language: string; // e.g. "hi-IN"
  temperature: number; // 0.0 - 1.0
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgentCreateRequest {
  name: string;
  system_prompt: string;
  first_message: string;
  voice_provider?: string;
  voice_id?: string;
  language?: string;
  temperature?: number;
}

export interface AgentUpdateRequest {
  name?: string;
  system_prompt?: string;
  first_message?: string;
  voice_provider?: string;
  voice_id?: string;
  language?: string;
  temperature?: number;
  is_active?: boolean;
}

// ---------------------------------------------------------------------------
// 3. Call Ledger & Post-Call AI Intelligence Types
// ---------------------------------------------------------------------------

export type CallStatus =
  | "initiated"
  | "ringing"
  | "in-progress"
  | "completed"
  | "busy"
  | "no-answer"
  | "failed";

export type SentimentType = "Positive" | "Neutral" | "Negative" | "Busy";
export type LeadScore = "Hot" | "Warm" | "Cold";

export interface ExtractedVariables {
  budget?: string | null;
  bhk?: string | null;
  preferred_location?: string | null;
  visit_date?: string | null;
  lead_interest?: LeadScore;
  action_items?: string[];
  [key: string]: any;
}

export interface CallLog {
  id: number;
  transcript: string | null;
  summary: string | null;
  sentiment: SentimentType | null;
  extracted_data: ExtractedVariables | null;
  whatsapp_status: "none" | "queued" | "sent" | "failed";
}

export interface Call {
  id: number;
  call_sid: string;
  workspace_id: number;
  agent_id: number | null;
  customer_phone: string;
  direction: "outbound" | "inbound";
  status: CallStatus;
  duration_seconds: number;
  cost_inr: number;
  recording_url: string | null;
  created_at: string;
  log?: CallLog | null;
}

export interface CallListResponse {
  total: number;
  items: Call[];
}

export interface RecordingStreamResponse {
  call_id: number;
  call_sid: string;
  streaming_url: string;
  expires_in_seconds: number;
}

// ---------------------------------------------------------------------------
// 4. Bulk Outbound Campaign Types
// ---------------------------------------------------------------------------

export type CampaignStatus = "draft" | "running" | "paused" | "completed";

export type LeadStatus =
  | "pending"
  | "dialing"
  | "completed"
  | "busy"
  | "no-answer"
  | "dnd_blocked"
  | "failed";

export interface Campaign {
  id: number;
  workspace_id: number;
  agent_id: number;
  name: string;
  status: CampaignStatus;
  concurrency_limit: number;
  total_leads: number;
  dialed_leads: number;
  connected_leads: number;
  created_at: string;
}

export interface CampaignCreateRequest {
  name: string;
  agent_id: number;
  concurrency_limit?: number;
}

export interface Lead {
  id: number;
  campaign_id: number;
  workspace_id: number;
  full_name: string;
  phone_number: string;
  city: string | null;
  status: LeadStatus;
  retry_count: number;
  max_retries: number;
  call_sid: string | null;
  last_called_at: string | null;
}

export interface CsvUploadStats {
  status: "success" | "failed";
  campaign_id: number;
  total_rows_processed: number;
  leads_added: number;
  dnd_scrubbed_blocked: number;
  duplicates_skipped: number;
  invalid_numbers_skipped: number;
}

// ---------------------------------------------------------------------------
// 5. WhatsApp Automation Types
// ---------------------------------------------------------------------------

export interface SendBrochureRequest {
  customer_phone: string;
  project_name?: string;
  brochure_url?: string;
  call_id?: number;
}

export interface BookVisitRequest {
  customer_phone: string;
  project_name?: string;
  visit_date: string;
  time_slot?: string;
  call_id?: number;
}

export interface WhatsAppResponse {
  success: boolean;
  status: "sent" | "failed";
  message_id?: string;
  recipient: string;
  error?: string;
}
