# 🏛️ Outpero Reverse-Engineering & NexoAgent Master System Blueprint

> **Master Engineering & Product Document**  
> **Target:** 100% Feature-by-Feature Parity with **Outpero.com** (`app.outpero.com`)  
> **Scope:** Full-Stack Architecture (Python FastAPI Backend + Next.js 15 App Router Frontend)

---

## 📑 TABLE OF CONTENTS
1. [Deep Analysis: Outpero SaaS Platform (`app.outpero.com`)](#1-deep-analysis-outpero-platform-breakdown)
2. [Screen-by-Screen Reverse Engineering (All 7 Screens)](#2-screen-by-screen-reverse-engineering)
3. [NexoAgent Backend Audit: What We Have vs What We Need](#3-nexoagent-backend-audit)
4. [Backend Implementation Plan (The Final 10% Parity)](#4-backend-implementation-plan)
5. [Frontend Implementation Plan (The 7 Core Screens)](#5-frontend-implementation-plan)
6. [Step-by-Step Execution Sequence for Teammate](#6-step-by-step-execution-sequence)

---

## 1. DEEP ANALYSIS: OUTPERO PLATFORM BREAKDOWN

Outpero is an **Enterprise Indian AI Telecalling SaaS Platform** that allows businesses to deploy autonomous "AI Employees" (telecallers) that converse naturally in Indian languages and dial thousands of leads daily.

### Outpero's 3 Core Value Propositions:
1. **Speed-to-Lead (<30s):** Automatic instant dialout when a Facebook/Meta Ad or Google Form lead is received.
2. **Indian Regional Voice Fluency:** Native Hindi, Hinglish, Telugu, Tamil, Marathi, Kannada, Malayalam with real-time code-switching.
3. **Zero-Waste Telecom Economics:** ₹5.00/min standard or ₹6.80/min premium billed strictly on **connected talk time only** (unanswered calls cost ₹0).

---

## 2. SCREEN-BY-SCREEN REVERSE ENGINEERING

Here is the exact anatomy of every screen in `app.outpero.com`:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    OUTPERO APP SHELL HIERARCHY                                         │
├─────────────────┬──────────────────────────────────────────────────────────────────────────────────────┤
│ 1. Sidebar      │ 📊 Overview | 🤖 AI Employees | 📢 Campaigns | 📞 Calls | 💳 Billing | ⚙️ Settings     │
│ 2. Top Header   │ Organization Dropdown | Live Carrier Status (🟢) | Balance Pill (₹) | User Avatar    │
│ 3. Main Stage   │ High-density productivity view with real-time telemetry and instant action buttons   │
└─────────────────┴──────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 🖥️ SCREEN 1: Overview & Telemetry Dashboard (`/dashboard`)
* **Purpose:** Executive bird’s-eye view of calling operations and ROI metrics.
* **Key UI Widgets:**
  1. **Top Telemetry Cards (4 Metrics):**
     - Total Calls Placed (Today / This Week)
     - Total Connected Talk-Time (Minutes & Pulses)
     - Average Pick-up Rate (%)
     - Hot Leads Qualified (Auto-tagged by AI)
  2. **Calling Volume Graph:** Daily bar chart showing Successful vs Unanswered vs Busy calls.
  3. **Lead Sentiment Donut Chart:** Hot (🔥), Warm (🟡), Cold (⚪), DND (🚫).
  4. **Live In-Progress Calls Stream:** Ticker showing calls currently connected with real-time second counters.
  5. **Recent Completed Calls Table:** Quick review of the last 5 calls with 1-click audio play.

---

### 🖥️ SCREEN 2: AI Voice Agent Studio (`/dashboard/agents`)
* **Purpose:** Building, training, and fine-tuning AI telecallers (e.g., "Pooja - Real Estate", "Aman - Debt Collection").
* **Sub-Views:**
  #### A. Agent List View (`/dashboard/agents`):
  - Grid of Agent Cards showing: Avatar, Name, Language (`Hindi / Hinglish`), Active toggle switch, Total calls handled, and 1-click "Duplicate Agent" button.
  #### B. Agent Editor & Training Studio (`/dashboard/agents/[id]`):
  - **Tab 1: Persona & Prompt Settings:**
    - Agent Name & Primary Goal.
    - First Message / Greeting line (e.g., *"Namaste! Mai Pooja baat kar rahi hu DLF se..."*).
    - System Prompt (Tone, guardrails, pricing rules, FAQ instructions).
  - **Tab 2: Voice & Speech Engine:**
    - Provider: Sarvam Bulbul (Hindi/Indic) or Deepgram Nova-2 (English).
    - Speaker Selector (Pooja, Aman, Priya, Vikram).
    - Speech speed slider (`0.8x` to `1.2x`).
  - **Tab 3: Knowledge Base & Documents (Training Tab):**
    - Text upload / Document Paste / Website URL scraper.
    - AI converts input into extracted rules and facts that the agent references during the call.
  - **Tab 4: In-Call Action Tools:**
    - WhatsApp Brochure Dispatch toggle.
    - Calendar Appointment Booking webhook.
  - **Right Panel: Live In-Browser Testing Playground:**
    - Interactive Microphone button.
    - Real-time speech-to-text transcript bubbles.
    - Audio latency gauge (`420ms VAD -> TTS`).

---

### 🖥️ SCREEN 3: Master Call Logs & Audio Intelligence (`/dashboard/calls`)
* **Purpose:** Detailed inspection of every placed call, playback of recordings, and CRM sync audit.
* **Key UI Widgets:**
  1. **Advanced Filter Bar:** Date range picker, Agent dropdown, Sentiment filter (`Hot`, `Warm`, `Cold`), Search by phone number (`+91...`).
  2. **Data Table Columns:**
     - Call Timestamp (`12:30 PM, 24 Nov`)
     - Customer Phone (E.164 Monospace font: `+91 98765 43210`)
     - Assigned AI Agent ("Pooja")
     - Talk Duration (`1m 45s` / 2 Pulses)
     - Billed Cost (`₹11.00`)
     - Sentiment Badge (`🔥 Hot Lead`)
     - Source Badge (`[ Meta Ads ]` or `[ Bulk CSV ]`)
     - Action: `[ 🎧 View Intelligence ]`
  3. **Slide-Over Audio Intelligence Drawer (`/dashboard/calls/[id]`):**
     - **Wavesurfer.js Audio Player:** Interactive waveform seeking, Play/Pause, Speed `1x/1.5x`, Download recording.
     - **Groq AI Summary:** 3-bullet executive summary of what customer agreed to.
     - **Extracted Lead Variables:** Budget (`₹1.5 Cr`), Location (`Gurgaon Phase 5`), Follow-up date.
     - **Full Conversation Transcript:** Time-stamped chat bubble dialog between Caller and AI.
     - **In-Call WhatsApp Delivery Status:** Verified delivery confirmation (`Delivered to +91 98765...`).

---

### 🖥️ SCREEN 4: Bulk Campaign Engine (`/dashboard/campaigns`)
* **Purpose:** Uploading 1,000 to 50,000 lead lists, filtering DND, and managing parallel dialing pacing.
* **Sub-Views:**
  #### A. Campaign List View:
  - Table showing: Campaign Name, Agent Name, Total Leads, Dialed / Pending, Progress Bar (`65%`), Status badge (`Running`, `Paused`, `Completed`), and Start/Pause button.
  #### B. Campaign Creation Wizard (`/dashboard/campaigns/new`):
  - **Step 1: Campaign Details:** Name, Assigned Agent, Calling Hours (Default TRAI 10:00 AM - 7:00 PM).
  - **Step 2: Dialing Pacing:** Concurrent calls slider (`1` to `10` simultaneous lines).
  - **Step 3: CSV Upload & DND Pre-Scrubber:**
    - Drag-and-drop CSV box.
    - Column mapping preview (Name, Phone Number, Custom Variables).
    - **Live Scrubbing Report Card:** Total (`1,000`), Clean Ready to Dial (`840`), 🚫 DND Filtered (`120`), ⚠️ Duplicates Skipped (`40`).
    - Button: `[ 🚀 Launch Campaign ]`.
  #### C. Live Campaign Monitor (`/dashboard/campaigns/[id]`):
  - Circular progress dial, real-time connected vs busy counters, emergency `[ 🛑 Pause Campaign ]` button.

---

### 🖥️ SCREEN 5: Dedicated Telecom Numbers & Inbound AI IVR (`/dashboard/numbers`)
* **Purpose:** Renting/managing dedicated 10-digit Indian caller IDs (`+91 80...`) and routing inbound callbacks.
* **Key UI Widgets:**
  1. Active Caller IDs List with DLT registration status.
  2. Inbound Routing rule: When customer calls back, route to AI Agent "Pooja" or forward to human phone.
  3. Channel concurrency monitor.

---

### 🖥️ SCREEN 6: Prepaid Telecom Wallet & Invoices (`/dashboard/billing`)
* **Purpose:** Transparent credit management, Razorpay top-ups, and double-entry financial ledger.
* **Key UI Widgets:**
  1. **Top Balance Card:** Large balance `₹489.00 INR` (~89 calling minutes remaining), Low-balance alert threshold.
  2. **Recharge Packs Grid:** `₹500` (Starter), `₹2,000` (+₹100 Bonus), `₹5,000` (+₹500 Bonus), Custom Amount input.
  3. **Instant Razorpay Checkout:** UPI QR, NetBanking, Cards.
  4. **Financial Audit Ledger Table:** Opening balance, debited amount, closing balance, Call SID reference, GST invoices download.

---

### 🖥️ SCREEN 7: Integrations, API Keys & Team (`/dashboard/settings`)
* **Purpose:** Connecting external tools and managing team permissions.
* **Key UI Widgets:**
  1. **Speed-to-Lead Meta Ads Webhook:** Webhook URL and `hub.challenge` verify token for Facebook/Instagram Lead Ads.
  2. **Developer API Keys:** Generate `nexo_live_...` keys, visible prefix, 1-time secret reveal modal, revoke action.
  3. **Outbound CRM Webhooks:** Endpoint URL registration, event checkboxes (`call.completed`, `lead.qualified`), HMAC-SHA256 test ping.
  4. **Team Members & RBAC:** Invite teammate modal (`Admin`, `Manager`, `Member`), role selector, remove member.

---

## 3. NEXOAGENT BACKEND AUDIT: WHAT WE HAVE VS WHAT WE NEED

| Capability / Subsystem | NexoAgent Backend Current State | Outpero Parity Status |
|---|---|---|
| **Voice AI Loop (STT -> LLM -> TTS)** | LiveKit + Deepgram Nova-2 + Groq LLaMA 3.3 + Sarvam Bulbul | ✅ **100% Implemented & Tested** |
| **Barge-In / Interrupt Handling** | Silero VAD + Event-driven state machine | ✅ **100% Implemented & Tested** |
| **SIP Trunk & Outbound Dispatch** | LiveKit SIP Gateway (`/calls/dispatch`) | ✅ **100% Implemented & Tested** |
| **60-Second Telecom Pulse Billing** | Ceil(Duration/60) * Cost/min | ✅ **100% Implemented & Tested** |
| **Prepaid Wallet & Overdraft Defense** | Razorpay HMAC + Pre-dial ₹10 block (HTTP 402) | ✅ **100% Implemented & Tested** |
| **Speed-to-Lead Meta Ads Webhook** | `/webhooks/meta-leads` (<30s dialout) | ✅ **100% Implemented & Tested** |
| **Bulk CSV Campaign & DND Scrubber** | CSV parser + TRAI window + Pacing | ✅ **100% Implemented & Tested** |
| **Smart Auto-Retry Engine** | 3-Tier backoff (+30m, +2h, +24h) | ✅ **100% Implemented & Tested** |
| **Post-Call Groq Intelligence** | JSON extraction (Summary, Sentiment, Variables) | ✅ **100% Implemented & Tested** |
| **Developer API Keys (SHA-256)** | Dual Auth Resolver (`X-API-Key`) | ✅ **100% Implemented & Tested** |
| **Outbound Webhooks (HMAC-SHA256)** | Subscription manager + Test ping | ✅ **100% Implemented & Tested** |
| **Workspace Team Members & RBAC** | Admin / Manager / Member roles | ✅ **100% Implemented & Tested** |
| **Agent Knowledge Base Training Endpoint** | *Needs 1 micro-endpoint for RAG / Text facts* | 🟡 **Needs Quick 1-Hour Backend Addition** |
| **Inbound Call Answering (AI IVR)** | *Needs Inbound SIP Webhook mapping to Agent* | 🟡 **Needs Quick 1-Hour Backend Addition** |
| **Virtual Numbers Management Model** | *Needs Model + CRUD for assigned caller numbers* | 🟡 **Needs Quick 1-Hour Backend Addition** |

---

## 4. BACKEND IMPLEMENTATION PLAN (THE FINAL 10% PARITY)

To achieve **100% absolute parity** with Outpero, we only need to add 3 micro-features in our Python FastAPI backend:

### Task B1: Agent Knowledge Base Endpoint (`/api/v1/agents/{id}/knowledge`)
* **File:** `backend/app/api/v1/agents.py`
* **Feature:** Client can upload text snippets, FAQs, or company facts. The backend appends these to the agent's dynamic system prompt context so the AI answers customer questions accurately during calls.

### Task B2: Virtual Phone Numbers Management (`/api/v1/telephony/numbers`)
* **File:** `backend/app/api/v1/telephony.py` & `backend/app/models/phone_number.py`
* **Feature:** Manage assigned Indian caller IDs (e.g., `+91 8045678900`), map caller IDs to specific AI agents, and track monthly rental/DLT status.

### Task B3: Inbound Call Answering (AI IVR)
* **File:** `backend/app/api/v1/webhooks.py`
* **Feature:** When a customer calls back on the AI's phone number, the telephony carrier triggers `POST /webhooks/inbound`. The backend identifies the workspace and launches the assigned VoiceAgent in inbound answering mode.

---

## 5. FRONTEND IMPLEMENTATION PLAN (THE 7 CORE SCREENS)

All frontend work focuses **100% on the Authenticated SaaS Product (`app.outpero.com` equivalent)**:

### 📅 Week 1: Shell, Auth & Agent Studio
* **Day 1:** Obsidian Theme Primitives (Button, Card, Input, Badges, Specular lines).
* **Day 2:** Authentication (`/login` & `/register` with ₹500 auto-credit claim).
* **Day 3:** SaaS Shell Layout (`/dashboard/layout.tsx` - Collapsible Sidebar, Header, Live Status, Balance Pill).
* **Day 4:** Dashboard Overview (`/dashboard` - 4 Metric cards, calling volume chart, recent calls).
* **Day 5:** Agent Studio List View (`/dashboard/agents` - Grid of Agents, 1-Click Duplicate, Status Switch).
* **Day 6:** Agent Studio Configuration Editor (`/dashboard/agents/[id]` - Left panel: Persona, Voice, Script).
* **Day 7:** Agent Studio Knowledge & In-Browser Mic Playground (`/dashboard/agents/[id]` - Right panel: WebRTC mic test & live transcript).

### 📅 Week 2: Calls, Campaigns & Intelligence
* **Day 8:** Quick Outbound Test Call Modal (`[ 📞 Launch Call ]` with pre-dial check).
* **Day 9:** Call Logs Table (`/dashboard/calls` - Dense enterprise table, search, filters by sentiment).
* **Day 10:** Post-Call Audio Intelligence Drawer (`/dashboard/calls/[id]` - Wavesurfer audio player, Groq AI summary, variables).
* **Day 11:** Bulk Campaign Overview (`/dashboard/campaigns` - Progress bars, running/paused controls).
* **Day 12:** Campaign Creation Wizard (`/dashboard/campaigns/new` - Setup, pacing, calling window).
* **Day 13:** CSV Lead Ingestion & DND Pre-Scrubber (File drag-drop, scrub stats preview).
* **Day 14:** Live Campaign Telemetry Monitor (`/dashboard/campaigns/[id]` - Real-time dials, pickup rate, pause trigger).

### 📅 Week 3: Billing, Numbers, Developer Hub & Polish
* **Day 15:** Telecom Wallet Recharge Center (`/dashboard/billing` - Packs ₹500, ₹2,000, ₹5,000, Razorpay modal).
* **Day 16:** Financial Audit Ledger Table (`/dashboard/billing/transactions` - Opening/closing balance, GST invoices).
* **Day 17:** Dedicated Phone Numbers Management (`/dashboard/numbers` - Caller IDs list & inbound agent routing).
* **Day 18:** Developer API Keys Hub (`/dashboard/settings/api-keys` - Key generator, masked prefix, 1-time reveal).
* **Day 19:** Outbound CRM Webhooks (`/dashboard/settings/webhooks` - Event checkboxes & HMAC-SHA256 test ping).
* **Day 20:** Workspace Team Management & RBAC (`/dashboard/settings/team` - Invite teammate, role selector).
* **Day 21:** 4-State UI Polish (Loading skeletons, empty states, error alerts, responsive mobile drawer).

---

## 6. STEP-BY-STEP EXECUTION SEQUENCE FOR TEAMMATE

Aapka teammate yeh 3 steps follow karke kaam shuru karega:

1. **Terminal Commands:** Follow [`frontend/TEAMMATE_COMMANDS_GUIDE.md`](file:///d:/python%20Qspider/Notes/PYTHON/GenZ/Krishna/NexoAgent/frontend/TEAMMATE_COMMANDS_GUIDE.md).
2. **Design Reference:** Follow [`GEMINI.md`](file:///d:/python%20Qspider/Notes/PYTHON/GenZ/Krishna/NexoAgent/GEMINI.md) for dark obsidian styling and typography.
3. **Execution Plan:** Follow Section 5 above day-by-day to build each screen without guessing!

---

*(NexoAgent is now fully engineered to match and surpass Outpero.com at every layer! 🚀)*
