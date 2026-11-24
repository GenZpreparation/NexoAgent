# 🚀 NexoAgent - Master Backend Architecture & API Specification
> **Reverse-Engineered from Outpero's Production SaaS WebApp (`app.outpero.com`)**  
> **Target:** 100% Exact Feature-by-Feature and API-by-API Parity with Outpero  
> **Backend Framework:** 100% Python FastAPI, Async SQLAlchemy, SQLite/PostgreSQL, LiveKit SIP, Deepgram, Groq, Sarvam AI

---

## 📑 TABLE OF CONTENTS
1. [Master System Overview](#1-master-system-overview)
2. [Complete Page-by-Page Feature & API Mapping (All 8 Modules)](#2-complete-page-by-page-feature--api-mapping)
   - [Page 1: Home Dashboard (`/#/home`)](#page-1-home-dashboard)
   - [Page 2: AI Employees — "Your Team" (`/#/team`)](#page-2-ai-employees--your-team)
   - [Page 3: AI Employees — "Hire / Training Studio" (`/#/employees/new`)](#page-3-ai-employees--hire--training-studio)
   - [Page 4: Results — "Leads & Mini-CRM" (`/#/leads`)](#page-4-results--leads--mini-crm)
   - [Page 5: Results — "Conversations & Audio Logs" (`/#/conversations`)](#page-5-results--conversations--audio-logs)
   - [Page 6: Results — "Performance & Analytics" (`/#/performance`)](#page-6-results--performance--analytics)
   - [Page 7: Calling — "Campaigns & Instant Leads" (`/#/campaigns`)](#page-7-calling--campaigns--instant-leads)
   - [Page 8: Developers — "API Keys & Webhooks" (`/#/developers`)](#page-8-developers--api-keys--webhooks)
3. [NexoAgent Backend Audit: Current vs Outpero Parity](#3-nexoagent-backend-audit)
4. [Step-by-Step Backend Implementation Tasks](#4-step-by-step-backend-implementation-tasks)

---

## 1. MASTER SYSTEM OVERVIEW

Outpero's SaaS WebApp (`app.outpero.com`) functions as an **autonomous telecom operating system**. It is structured into 3 distinct operational layers:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   NEXOAGENT BACKEND SYSTEM ARCHITECTURE                                │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                        │
│  [ LAYER 1: CLIENT MANAGEMENT & DEVELOPER API ]                                                        │
│  • Dual-Auth Resolver: JWT Bearer (Browser) OR X-API-Key (Developers & CRMs)                           │
│  • Workspaces & Multi-Tenant IDOR Security Boundary                                                    │
│  • Double-Entry Telecom Wallet Ledger (₹0.85/min Pulse Billing + Razorpay HMAC-SHA256 Top-ups)         │
│                                                                                                        │
│  [ LAYER 2: TELEPHONY ORCHESTRATION & COMPLIANCE ]                                                     │
│  • LiveKit SIP WebRTC Gateway (Outbound Mobile Phone Bridge)                                           │
│  • TRAI 10:00 AM - 7:00 PM Calling Window Enforcer + Automated DND NDNC Registry Scrubber              │
│  • Pacing Dispatcher & Smart 3-Tier Backoff Auto-Retry Scheduler (+30m, +2h, +24h)                     │
│                                                                                                        │
│  [ LAYER 3: REAL-TIME INDIC VOICE ENGINE (<500ms LOOP) ]                                               │
│  • Silero VAD (Speech Detection) + Event-driven Barge-In (Instant Interruption)                         │
│  • Deepgram Nova-2 Streaming STT (Hindi & English Code-Switching)                                      │
│  • Groq LLaMA 3.3-70B Streaming Reasoning Brain                                                        │
│  • Sarvam Bulbul Indic TTS (Natural Indian Cadence)                                                    │
│  • Mid-Speech In-Call WhatsApp Brochure & Calendar Dispatch Tools                                      │
│  • Post-Call Groq JSON Intelligence Extraction (Executive Summary, Sentiment, Custom Variables)        │
│                                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. COMPLETE PAGE-BY-PAGE FEATURE & API MAPPING

---

### PAGE 1: Home Dashboard (`/#/home`)

#### 🎨 Screen Features & User Interactions:
1. **Live Concurrency Ticker:** Real-time indicator (`• 0 on calls · 0.0/min`).
2. **KPI Highlights:** Active employees count, total calls made today, total connected talk minutes.
3. **Credits Balance Badge:** Current balance in INR and estimated remaining minutes.
4. **Recent Calls Stream:** Quick review of the last 5 calls with one-click audio playback.

#### 🔌 Backend APIs Required:

##### `GET /api/v1/workspace/profile` (or `GET /api/v1/me`)
* **Purpose:** Provides workspace identity, credits balance, active status, and active call concurrency.
* **Response Schema (200 OK):**
```json
{
  "id": 1,
  "name": "nexo",
  "slug": "nexo",
  "balance_inr": 489.0,
  "credits": 50,
  "estimated_calling_minutes": 89,
  "is_active": true,
  "active_calls_count": 0,
  "current_burn_rate_per_min": 0.0
}
```

##### `GET /api/v1/calls/stats`
* **Purpose:** Supplies daily call statistics for the home widgets.
* **Response Schema (200 OK):**
```json
{
  "today_calls_placed": 420,
  "today_connected_calls": 319,
  "today_connected_minutes": 482,
  "today_pickup_rate_pct": 76.0,
  "today_hot_leads": 48
}
```

---

### PAGE 2: AI Employees — "Your Team" (`/#/team`)

#### 🎨 Screen Features & User Interactions:
1. **Agents Grid/List:** Displays cards for each created AI employee (e.g. "Pooja", "Aman").
2. **Status Toggle Switch:** 1-Click toggle between `Active` (green) and `Paused` (gray).
3. **1-Click Duplicate Agent:** Clones the agent's prompt, voice, and settings for A/B testing.
4. **Quick Telemetry:** Displays total calls handled and average call duration per agent.

#### 🔌 Backend APIs Required:

##### `GET /api/v1/agents`
* **Purpose:** Lists all AI employees configured in the workspace.
* **Response Schema (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Pooja - Real Estate Specialist",
    "voice_provider": "sarvam",
    "voice_id": "bulbul:v3/pooja",
    "language": "hi-IN",
    "is_active": true,
    "total_calls_handled": 340,
    "avg_duration_seconds": 105,
    "created_at": "2026-11-20T10:00:00Z"
  }
]
```

##### `PATCH /api/v1/agents/{id}`
* **Purpose:** Toggles active status or updates configuration.
* **Request Payload:**
```json
{
  "is_active": false
}
```

##### `POST /api/v1/agents/{id}/duplicate`
* **Purpose:** Creates an exact clone with "(Copy)" suffix.
* **Response Schema (201 Created):** Returns cloned `AgentResponse`.

##### `DELETE /api/v1/agents/{id}`
* **Purpose:** Deletes an agent (guarded if currently linked to active campaigns).

---

### PAGE 3: AI Employees — "Hire / Training Studio" (`/#/employees/new` & `/#/employees/{id}`)

#### 🎨 Screen Features & User Interactions:
1. **Persona & Greeting Tab:** Agent name, first message line, system prompt instructions.
2. **Voice & Language Tab:** Language selector (`Hindi`, `Hinglish`, `Telugu`, etc.), Speaker model, Speaking speed slider.
3. **Training & Knowledge Base Tab:** Upload company FAQs, product specs, or web URLs for RAG distillation.
4. **Mid-Call Tools Tab:** Toggles for WhatsApp flyer dispatch and calendar booking.
5. **Right-Panel In-Browser Sandbox Playground:** WebRTC live microphone testing with real-time streaming transcript.

#### 🔌 Backend APIs Required:

##### `POST /api/v1/agents`
* **Purpose:** Creates a new AI employee.
* **Request Payload:**
```json
{
  "name": "Pooja - Real Estate Specialist",
  "system_prompt": "You are Pooja, a telecaller for DLF. Speak polite Hindi...",
  "first_message": "Namaste! Mai Pooja baat kar rahi hu DLF se.",
  "voice_provider": "sarvam",
  "voice_id": "bulbul:v3/pooja",
  "language": "hi-IN",
  "tools": ["whatsapp_brochure"]
}
```

##### `POST /api/v1/agents/{id}/knowledge` *(New Addition)*
* **Purpose:** Ingests company knowledge, FAQs, or raw text into the agent's context.
* **Request Payload:**
```json
{
  "knowledge_type": "text",
  "content": "DLF CyberCity 3 BHK starts from ₹1.5 Crore. Possession in Dec 2026. 10% booking amount.",
  "source_name": "DLF Pricing Sheet 2026"
}
```

---

### PAGE 4: Results — "Leads & Mini-CRM" (`/#/leads`)

#### 🎨 Screen Features & User Interactions *(From Screenshot 3)*:
1. **Top Counter Bar:** `Total leads`, `Qualified` (green), `Pending callback` (blue), `Hot leads` (red).
2. **Search Input:** Searches name, phone, or captured info.
3. **View Switcher:** 4 views — `Pipeline` (Kanban), `List` (Table), `Cards` (Grid), `Priority`.
4. **Hot-Only Toggle:** 🔥 Filters high-intent buyers in 1 click.
5. **Export Button:** Downloads CSV of filtered leads.

#### 🔌 Backend APIs Required:

##### `GET /api/v1/leads` *(New Master Endpoint)*
* **Purpose:** Powers the Leads & Results CRM view with filters and counters.
* **Query Params:** `search`, `agent_id`, `outcome`, `hot_only`, `sort`, `page`, `limit`.
* **Response Schema (200 OK):**
```json
{
  "summary": {
    "total_leads": 420,
    "qualified": 180,
    "pending_callback": 45,
    "hot_leads": 85
  },
  "leads": [
    {
      "id": 1,
      "name": "Ramesh Kumar",
      "phone_number": "+919876543210",
      "agent_name": "Pooja",
      "sentiment": "Hot",
      "outcome": "interested",
      "captured_info": {
        "budget": "₹1.5 Cr",
        "preferred_location": "Gurgaon Phase 5"
      },
      "call_attempts": 1,
      "last_contacted_at": "2026-11-24T12:30:00Z"
    }
  ]
}
```

##### `GET /api/v1/leads/export`
* **Purpose:** Streams a `text/csv` file containing filtered leads with captured variables.

---

### PAGE 5: Results — "Conversations & Audio Logs" (`/#/conversations`)

#### 🎨 Screen Features & User Interactions:
1. **Call Logs Table:** Call SID, Customer Phone, Agent, Duration, Cost (60s pulse), Sentiment tag.
2. **Slide-Over Audio Drawer:**
   - Wavesurfer.js waveform visualizer (play/pause, seek, 1x/1.5x speed).
   - Groq AI 3-bullet summary.
   - Time-stamped conversation transcript.
   - WhatsApp delivery confirmation badge.

#### 🔌 Backend APIs Required:

##### `GET /api/v1/calls`
* **Purpose:** Paginated list of all placed calls.
* **Response Schema (200 OK):**
```json
[
  {
    "id": 1,
    "call_sid": "CA_c57051db8967d0e3",
    "customer_phone": "+919811122333",
    "agent_name": "Pooja",
    "status": "completed",
    "duration_seconds": 85,
    "billed_pulses": 2,
    "billed_cost_inr": 11.0,
    "sentiment": "Hot",
    "summary": "Customer interested in 3 BHK plots. Requested WhatsApp brochure.",
    "created_at": "2026-11-24T12:00:00Z"
  }
]
```

##### `GET /api/v1/calls/{id}/recording-url`
* **Purpose:** Generates a secure, presigned S3 / Cloudflare R2 audio URL (expires in 900s).

---

### PAGE 6: Results — "Performance & Analytics" (`/#/performance`)

#### 🎨 Screen Features & User Interactions *(From Screenshot 2)*:
1. **Top Filters:** `Last 7/30/90 days`, `All employees`, `All channels`, `Issues only`, `Min duration [s]`.
2. **KPI Metric Cards (7 Cards):** Calls, Connect rate %, Conversion %, Avg call length, Leads, Success rate %, Credits used (₹).
3. **Calls Over Time:** Daily bar chart of dialed vs connected calls.
4. **Conversion Funnel:** Dialed -> Connected -> Engaged > 30s -> Qualified.
5. **Outcomes Breakdown:** Interested, Callback, Not Interested, DND, Busy.

#### 🔌 Backend APIs Required:

##### `GET /api/v1/analytics/performance` *(New Master Aggregator)*
* **Purpose:** Powers the exact Performance screen.
* **Query Params:** `start_date`, `end_date`, `agent_id`, `min_duration`, `issues_only`.
* **Response Schema (200 OK):**
```json
{
  "summary": {
    "total_calls": 1250,
    "calls_change_pct": 12.5,
    "connect_rate_pct": 76.5,
    "connected_calls": 956,
    "conversion_rate_pct": 24.2,
    "qualified_leads": 231,
    "avg_call_length_seconds": 92,
    "total_duration_minutes": 1916,
    "success_rate_pct": 98.4,
    "credits_used_inr": 10538.0,
    "last_hour_calls": 42,
    "last_24h_calls": 310
  },
  "calls_over_time": [
    {"date": "2026-11-20", "dialed": 250, "connected": 190, "qualified": 45},
    {"date": "2026-11-21", "dialed": 300, "connected": 230, "qualified": 58}
  ],
  "conversion_funnel": {
    "dialed": 1250,
    "connected": 956,
    "engaged_gt_30s": 720,
    "qualified": 231
  },
  "outcomes": {
    "interested": 231,
    "callback": 140,
    "not_interested": 350,
    "busy": 194,
    "dnd_scrubbed": 100
  }
}
```

---

### PAGE 7: Calling — "Campaigns & Instant Leads" (`/#/campaigns`)

#### 🎨 Screen Features & User Interactions:
1. **Bulk CSV Upload:** Drag-and-drop file with preview.
2. **Automated DND Scrubber:** TRAI NDNC registry filter.
3. **Pacing Slider:** 1 to 10 concurrent lines.
4. **Smart Auto-Retry Engine:** Automatic redial for busy calls (+30m, +2h, +24h).
5. **Instant Leads View:** Meta Ads webhook setup with sub-30s dialout.

#### 🔌 Backend APIs Required:
* `GET /api/v1/campaigns`: Lists campaigns and progress.
* `POST /api/v1/campaigns`: Creates campaign.
* `POST /api/v1/campaigns/{id}/upload-leads`: Uploads CSV and runs DND filter.
* `POST /api/v1/campaigns/{id}/start` & `pause`: Execution controls.
* `POST /api/v1/webhooks/meta-leads`: Ingestion webhook for Meta Ads leads.

---

### PAGE 8: Developers — "API Keys & Webhooks" (`/#/developers`)

#### 🎨 Screen Features & User Interactions *(From Screenshot 1)*:
1. **Base URL Box:** `https://api.outpero.com/v1` with Copy button.
2. **Quickstart Code Snippets:** Tabs for `cURL`, `Node`, `Python`.
3. **API Keys Tab:** Create key, visible prefix (`nexo_live_...`), 1-time secret reveal, revoke.
4. **Webhooks Tab:** Endpoint URL, event subscriptions (`call.completed`), HMAC test ping.

#### 🔌 Backend APIs Required:

##### `GET /api/v1/me` *(New Outpero Quickstart Route)*
* **Purpose:** Authenticates developer API key and returns workspace identity.
* **Response Schema (200 OK):**
```json
{
  "user": {
    "id": 1,
    "email": "nexo@company.com",
    "full_name": "Nexo Administrator"
  },
  "workspace": {
    "id": 1,
    "name": "nexo",
    "balance_inr": 489.0,
    "credits": 50,
    "estimated_calling_minutes": 89
  }
}
```

##### `POST /api/v1/calls` *(New Route with `dry_run: bool` support)*
* **Purpose:** Matches Outpero's exact calling signature (`POST /v1/calls`).
* **Request Payload:**
```json
{
  "phone_number": "+919876543210",
  "agent_id": 1,
  "dry_run": true
}
```
* **Behavior:** When `dry_run=true`, validates phone, DND, and balance without triggering actual SIP dialing.

---

## 3. NEXOAGENT BACKEND AUDIT

| Outpero Subsystem | Current NexoAgent State | Parity Status |
|---|---|---|
| Voice AI Loop (Deepgram + Groq + Sarvam) | `backend/voice_agent/agent.py` | ✅ **100% Complete** |
| SIP Telephony Bridge & Pulse Billing | `backend/app/services/telephony.py` | ✅ **100% Complete** |
| Prepaid Telecom Wallet & Razorpay | `backend/app/api/v1/billing.py` | ✅ **100% Complete** |
| Campaigns, TRAI Window & Auto-Retries | `backend/app/services/campaign.py` | ✅ **100% Complete** |
| Speed-to-Lead Meta Ads Webhook | `backend/app/api/v1/webhooks.py` | ✅ **100% Complete** |
| Developer API Keys & Webhooks | `backend/app/api/v1/api_keys.py` | ✅ **100% Complete** |
| Team Members & RBAC | `backend/app/api/v1/workspace.py` | ✅ **100% Complete** |
| Quickstart `GET /v1/me` Route | *Missing* | 🟡 **Needs 15-Min Addition** |
| `POST /calls` with `dry_run: bool` | *Missing* | 🟡 **Needs 20-Min Addition** |
| `GET /leads` & `GET /leads/export` | *Missing* | 🟡 **Needs 30-Min Addition** |
| `GET /analytics/performance` | *Missing* | 🟡 **Needs 45-Min Addition** |
| `POST /agents/{id}/knowledge` | *Missing* | 🟡 **Needs 30-Min Addition** |

---

## 4. STEP-BY-STEP BACKEND IMPLEMENTATION TASKS

To achieve **100% absolute, flawless parity** with all screens in the screenshots, we will implement these 5 targeted backend tasks:

1. **Task 1: Add `GET /api/v1/me`** in `backend/app/api/v1/auth.py`.
2. **Task 2: Add `POST /api/v1/calls` with `dry_run` support** in `backend/app/api/v1/calls.py`.
3. **Task 3: Add `GET /api/v1/leads` & `/leads/export`** in `backend/app/api/v1/leads.py`.
4. **Task 4: Add `GET /api/v1/analytics/performance`** in `backend/app/api/v1/analytics.py`.
5. **Task 5: Add `POST /api/v1/agents/{id}/knowledge`** in `backend/app/api/v1/agents.py`.

Once these 5 tasks are implemented, NexoAgent will possess **every single API endpoint** that Outpero's live SaaS application consumes! 🚀
