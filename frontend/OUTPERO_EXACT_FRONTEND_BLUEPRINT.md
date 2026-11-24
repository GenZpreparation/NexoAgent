# 🎨 NexoAgent - Outpero Exact Frontend Master Blueprint & Plan

> **SINGLE SOURCE OF TRUTH FOR FRONTEND DEVELOPMENT**  
> **Target:** 100% Exact Design Pattern, Layout, Theme, Pages & Features of **Outpero (`app.outpero.com`)**  
> **Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide React, Framer Motion, Wavesurfer.js, TanStack Query

---

## 📑 TABLE OF CONTENTS
1. [Outpero Design System & Theme Tokens (Exact Look & Feel)](#1-outpero-design-system--theme-tokens)
2. [Global App Shell & Navigation Hierarchy (Exact Sidebar & Header)](#2-global-app-shell--navigation-hierarchy)
3. [Page-by-Page Detailed Wireframes & Component Specs (All 8 Core Pages)](#3-page-by-page-detailed-wireframes--component-specs)
   - [Page 1: Developers Center (`/dashboard/developers`)](#page-1-developers-center)
   - [Page 2: Leads & Results Mini-CRM (`/dashboard/leads`)](#page-2-leads--results-mini-crm)
   - [Page 3: Performance & Analytics (`/dashboard/performance`)](#page-3-performance--analytics)
   - [Page 4: Home Dashboard (`/dashboard`)](#page-4-home-dashboard)
   - [Page 5: AI Employees — "Your team" (`/dashboard/agents`)](#page-5-ai-employees--your-team)
   - [Page 6: AI Employees — "Hire / Training Studio" (`/dashboard/agents/new`)](#page-6-ai-employees--hire--training-studio)
   - [Page 7: Conversations & Call Audio Logs (`/dashboard/calls`)](#page-7-conversations--call-audio-logs)
   - [Page 8: Calling — "Campaigns & Instant Leads" (`/dashboard/campaigns`)](#page-8-calling--campaigns--instant-leads)
4. [Day-by-Day Implementation Roadmap (3-Week Teammate Plan)](#4-day-by-day-implementation-roadmap)

---

## 1. OUTPERO DESIGN SYSTEM & THEME TOKENS

Outpero uses a high-end, modern dark technical theme with deep charcoal-obsidian surfaces, violet/purple primary accents, and crisp hairline borders.

### A. Color Palette Tokens (`tailwind.config.ts`)
```css
/* Background Surfaces (3-Layer Depth) */
--surface-canvas:      #0b0d14;  /* Deep dark canvas background */
--surface-sidebar:     #0e111a;  /* Sidebar dark background */
--surface-card:        #131724;  /* Elevated panel / card surface */
--surface-overlay:     #191e30;  /* Dropdowns, modals, popovers */
--surface-hover:       #1e243a;  /* Interactive hover state */

/* Accent & Brand Colors */
--accent-purple:       #7c3aed;  /* Outpero Signature Purple (Primary CTAs, Active Tabs) */
--accent-purple-hover: #8b5cf6;  /* Purple hover glow */
--accent-emerald:      #10b981;  /* Live status pill, Qualified leads */
--accent-blue:         #3b82f6;  /* Pending callbacks */
--accent-coral:        #f97316;  /* Hot leads indicator (🔥) */
--accent-rose:         #ef4444;  /* Failed calls, Errors */

/* Borders & Dividers */
--border-subtle:       rgba(255, 255, 255, 0.08); /* 1px hairline border */
--border-card:         #23283b;  /* Crisp card border */
```

### B. Typography & Micro-Textures
- **Body & Headings:** `Inter` or `Geist Sans` (Font weight 400, 500, 600).
- **Telemetry, Numbers & Phone Numbers:** `JetBrains Mono` for:
  - Phone numbers (`+91 98765 43210`)
  - Concurrency ticker (`• 0 on calls · 0.0/min`)
  - SIDs (`CA_9f8a...`) and Currency (`₹0.85 / min`, `₹489.00`).

---

## 2. GLOBAL APP SHELL & NAVIGATION HIERARCHY

Every authenticated page renders inside this exact Outpero App Shell:

```text
+----------------------------------------------------------------------------------------------------+
| OUTPERO | [v] nexo          | • 0 on calls · 0.0/min | (i) Take the tour | [Theme] [Bell] [Avatar] |
+---------+-------------------+----------------------------------------------------------------------+
| [Search Ctrl+K]             |                                                                      |
| 🏠 Home                     |                                                                      |
|                             |                                                                      |
| AI EMPLOYEES                |                                                                      |
|   👥 Your team              |                    ( ACTIVE PAGE CONTENT RENDERS HERE )              |
|   ➕ Hire your first        |                                                                      |
|                             |                                                                      |
| RESULTS                     |                                                                      |
|   🪪 Leads                  |                                                                      |
|   💬 Conversations          |                                                                      |
|   📈 Performance            |                                                                      |
|                             |                                                                      |
| CALLING                     |                                                                      |
|   📢 Campaigns              |                                                                      |
|   ⚡ Instant leads          |                                                                      |
|                             |                                                                      |
| --------------------------- |                                                                      |
| [ 50 CREDITS (7-10 min) ]   |                                                                      |
| [ + Add credits ]           |                                                                      |
+----------------------------------------------------------------------------------------------------+
```

---

## 3. PAGE-BY-PAGE DETAILED WIREFRAMES & API SPECIFICATIONS

---

### PAGE 1: Developers Center (`/dashboard/developers`)
*(Exact match with user screenshot 1)*

* **Route:** `src/app/dashboard/developers/page.tsx`
* **Layout & Visual Structure:**
  - Header: Icon `</>` + Title `Developers` + Subtitle *"Use your employees from your own systems"* + Right button `[ 📖 API documentation ]`.
  - **4 Navigation Tabs:** `Overview` (Active) | `API keys` | `Webhooks` | `API activity`.
* **Features Checklist:**
  1. **Quickstart Code Box:** Copyable snippets with tabs for `cURL`, `Node`, `Python`.
  2. **Base URL Copy Card:** Copies `https://api.nexoagent.com/v1` to clipboard with toast notification.
  3. **Generate API Key Modal:** Opens dialog, takes key name ("Zapier Integration"), returns masked prefix `nexo_live_...` and shows full secret once with copy button.
  4. **Revoke API Key Button:** Confirmation dialog -> deletes key.
  5. **Register Webhook Modal:** URL input + checkboxes for events (`call.completed`, `lead.qualified`).
  6. **Test Webhook Ping:** Sends HMAC-SHA256 signed ping to customer's URL and shows success badge.
* **Exact APIs Handled on this Page:**

| Action | Method & Endpoint | Request Payload | Response Schema | Status Code |
|---|---|---|---|---|
| **Verify Identity** | `GET /api/v1/me` | *None (Header: Bearer $KEY)* | `{ user: { id, email, full_name }, workspace: { id, name, balance_inr, credits } }` | `200 OK` |
| **List API Keys** | `GET /api/v1/api-keys` | *None* | `[ { id, name, prefix, last_used_at, is_active } ]` | `200 OK` |
| **Create API Key** | `POST /api/v1/api-keys` | `{ "name": "Zapier Production" }` | `{ id, name, prefix, raw_key: "nexo_live_...", is_active }` | `201 Created` |
| **Revoke API Key** | `DELETE /api/v1/api-keys/{id}` | *None* | `{ "status": "revoked" }` | `200 OK` |
| **List Webhooks** | `GET /api/v1/integrations/webhooks` | *None* | `[ { id, target_url, subscribed_events, is_active } ]` | `200 OK` |
| **Register Webhook** | `POST /api/v1/integrations/webhooks` | `{ "target_url": "https://crm.com/api", "subscribed_events": ["call.completed"] }` | `{ id, target_url, secret_key: "whsec_..." }` | `201 Created` |
| **Test Ping** | `POST /api/v1/integrations/webhooks/{id}/test-ping` | *None* | `{ "status": "ping_dispatched", "signature": "sha256=..." }` | `200 OK` |

---

### PAGE 2: Leads & Results Mini-CRM (`/dashboard/leads`)
*(Exact match with user screenshot 3)*

* **Route:** `src/app/dashboard/leads/page.tsx`
* **Layout & Visual Structure:**
  - Header: Icon `🪪` + Tag `RESULTS` + Title `Leads & Results` + Subtitle *"Everyone your employees have spoken with."* + Right actions: `[ 🔄 Refresh ]` and `[ 📥 Export ]`.
* **Features Checklist:**
  1. **Top 4 KPI Counters:** `Total leads`, `Qualified` (green), `Pending callback` (blue), `Hot leads` (orange 🔥).
  2. **Debounced Search Bar:** Searches by customer name, phone number, or city.
  3. **4-View Switcher:**
     - `Pipeline`: Kanban columns (*New Leads -> Dialed -> Connected -> Hot Qualified*).
     - `List`: Dense enterprise table with sortable columns.
     - `Cards`: Bento grid of contact cards.
     - `Priority`: Sorts high-intent leads to the top.
  4. **Hot Only Toggle:** 1-Click filter displaying only leads with `sentiment == "Hot"`.
  5. **Direct Dial Button:** Click `[ 📞 Dial Now ]` on any lead row to launch outbound call.
  6. **Export CSV Button:** Triggers browser download of `nexo_leads_export.csv`.
  7. **Empty State:** High-context graphic + `[ Go to my employees ]` CTA.
* **Exact APIs Handled on this Page:**

| Action | Method & Endpoint | Query Params / Request | Response Schema | Status Code |
|---|---|---|---|---|
| **Fetch Leads & Counts** | `GET /api/v1/leads` | `?search=...&outcome=...&hot_only=true&sort=recent&limit=50` | `{ summary: { total_leads, qualified, pending_callback, hot_leads }, leads: [ ... ] }` | `200 OK` |
| **Download CSV** | `GET /api/v1/leads/export` | *None* | File stream `text/csv` (Content-Disposition: attachment) | `200 OK` |
| **Direct Dial Lead** | `POST /api/v1/calls` | `{ "phone_number": "+919876543210", "agent_id": 1, "dry_run": false }` | `{ status: "dispatched", call_sid: "CA_..." }` | `201 Created` |

---

### PAGE 3: Performance & Analytics (`/dashboard/performance`)
*(Exact match with user screenshot 2)*

* **Route:** `src/app/dashboard/performance/page.tsx`
* **Layout & Visual Structure:**
  - Header: Icon `📈` + Title `Performance` + Subtitle `25 Oct 2026 - 24 Nov 2026 · 0 calls` + Refresh button.
* **Features Checklist:**
  1. **Date Range Filter Pills:** Toggle between `Last 7 days`, `Last 30 days`, `Last 90 days`, `Custom`.
  2. **Employee Filter Dropdown:** Select `All employees` or filter by single agent (e.g. Pooja).
  3. **Channels Filter Dropdown:** Filter by caller SIM / phone line (`All channels` or specific `+91 80...`).
  4. **Issues Only Checkbox:** Shows only dropped, busy, or failed calls.
  5. **Min Duration Input:** Filters calls lasting >= X seconds (e.g. 30s).
  6. **The 7 KPI Metric Cards:** `Calls`, `Connect rate %`, `Conversion %`, `Avg call length`, `Leads`, `Success rate %`, `Credits used ₹`.
  7. **Calls Over Time Chart:** Recharts bar chart showing daily dialed vs connected calls.
  8. **Conversion Funnel:** Visual funnel: Total Dialed -> Answered -> Engaged > 30s -> Hot Qualified.
  9. **Outcomes Breakdown:** Pie / Progress bars for Interested, Callback, Not Interested, Busy, DND.
* **Exact APIs Handled on this Page:**

| Action | Method & Endpoint | Query Params | Response Schema | Status Code |
|---|---|---|---|---|
| **Fetch Performance KPIs** | `GET /api/v1/analytics/performance` | `?days=30&agent_id=...&min_duration=0&issues_only=false` | `{ summary: { total_calls, connect_rate_pct, conversion_rate_pct, avg_call_length_seconds, credits_used_inr, ... }, calls_over_time: [ ... ], conversion_funnel: { ... }, outcomes: { ... } }` | `200 OK` |

---

### PAGE 4: Home Dashboard (`/dashboard`)
* **Route:** `src/app/dashboard/page.tsx`
* **Features Checklist:**
  1. **Top Bar Live Ticker:** `• 0 on calls · 0.0/min` (Updates every 10s).
  2. **Quick Launch Buttons:** `[ + Hire AI Employee ]`, `[ 📢 Start Campaign ]`, `[ 📞 Dial Test Call ]`.
  3. **Credits Balance Widget:** Shows wallet balance (`₹489.00`) and remaining minutes estimate.
  4. **Recent Calls Table:** Quick review of the last 5 calls with play audio button.
* **Exact APIs Handled on this Page:**

| Action | Method & Endpoint | Parameters | Response Schema | Status Code |
|---|---|---|---|---|
| **Workspace Info & Balance** | `GET /api/v1/workspace/profile` | *None* | `{ id, name, balance_inr, total_members, is_active }` | `200 OK` |
| **Daily Call Stats** | `GET /api/v1/calls/stats` | *None* | `{ today_calls_placed, today_connected_calls, today_connected_minutes, today_pickup_rate_pct }` | `200 OK` |
| **Live Concurrency Ticker** | `GET /api/v1/channels/live` | *None* | `{ active_calls_count, burn_rate_inr_per_min, status_label: "• 0 on calls · 0.0/min" }` | `200 OK` |
| **Recent Calls Feed** | `GET /api/v1/calls` | `?limit=5&offset=0` | `{ total: 5, items: [ ... ] }` | `200 OK` |

---

### PAGE 5: AI Employees — "Your team" (`/dashboard/agents`)
* **Route:** `src/app/dashboard/agents/page.tsx`
* **Features Checklist:**
  1. **Agent Cards Grid:** Displays all created AI callers with voice engine badge (`Sarvam Bulbul`).
  2. **Active Toggle Switch:** 1-Click pause/resume agent (`🟢 Active` vs `⏸️ Paused`).
  3. **1-Click Duplicate Button:** Clones the agent's prompt, voice, and tools for A/B testing.
  4. **Delete Agent Action:** Deletes agent with confirmation dialog.
* **Exact APIs Handled on this Page:**

| Action | Method & Endpoint | Payload | Response Schema | Status Code |
|---|---|---|---|---|
| **List Employees** | `GET /api/v1/agents` | *None* | `[ { id, name, voice_provider, voice_id, language, is_active, ... } ]` | `200 OK` |
| **Toggle Status** | `PATCH /api/v1/agents/{id}` | `{ "is_active": false }` | Updated `AgentResponse` | `200 OK` |
| **1-Click Clone** | `POST /api/v1/agents/{id}/duplicate` | *None* | Cloned `AgentResponse` with `name: "... (Copy)"` | `201 Created` |
| **Delete Employee** | `DELETE /api/v1/agents/{id}` | *None* | `{ "message": "Voice agent deleted successfully" }` | `200 OK` |

---

### PAGE 6: AI Employees — "Hire / Training Studio" (`/dashboard/agents/new` & `/agents/[id]`)
* **Route:** `src/app/dashboard/agents/[id]/page.tsx`
* **Features Checklist:**
  1. **Tab 1: Basic Info:** Agent name, First message greeting input.
  2. **Tab 2: Voice & Accent Selector:** Voice dropdown fetching from `/api/v1/voices` (Pooja, Aman, Priya), Speaking speed slider (`0.8x - 1.2x`).
  3. **Tab 3: Training (Knowledge Base):** Text paste / FAQ upload input that appends facts to agent context.
  4. **Tab 4: Mid-Call Tools:** WhatsApp brochure dispatch checkbox toggle.
  5. **Right-Panel In-Browser Sandbox Playground:**
     - WebRTC Microphone button.
     - Real-time live transcript bubbles.
     - Conversational latency badge (`420ms`).
* **Exact APIs Handled on this Page:**

| Action | Method & Endpoint | Payload | Response Schema | Status Code |
|---|---|---|---|---|
| **Fetch Voice Library** | `GET /api/v1/voices` | *None* | `[ { id, name, language, tier: "standard/premium", rate_per_min_inr, sample_audio_url } ]` | `200 OK` |
| **Create Employee** | `POST /api/v1/agents` | `{ "name": "...", "system_prompt": "...", "first_message": "...", "voice_provider": "sarvam", "voice_id": "bulbul:v3/pooja", "language": "hi-IN" }` | New `AgentResponse` | `201 Created` |
| **Update Employee** | `PATCH /api/v1/agents/{id}` | `{ "system_prompt": "...", "first_message": "..." }` | Updated `AgentResponse` | `200 OK` |
| **Ingest Knowledge** | `POST /api/v1/agents/{id}/knowledge` | `{ "knowledge_type": "text", "content": "Price is ₹1.5 Cr...", "source_name": "Pricing Sheet" }` | `{ status: "ingested", appended_characters: 120 }` | `200 OK` |

---

### PAGE 7: Conversations & Call Audio Logs (`/dashboard/calls`)
* **Route:** `src/app/dashboard/calls/page.tsx`
* **Features Checklist:**
  1. **Dense Enterprise Table:** Phone number (Monospace), Agent name, Duration (`1m 45s`), Cost (`₹11.00`), Sentiment tag (`🔥 Hot`, `🟡 Warm`).
  2. **Slide-Over Audio Intelligence Drawer:**
     - **Wavesurfer.js Audio Player:** Seek bar, Play/Pause, Speed toggle `1x / 1.5x`, Download MP3.
     - **Groq AI Summary:** 3-bullet concise summary of conversation.
     - **Extracted Variables:** Budget, Preferred Location, Callback Date.
     - **Full Transcript:** Time-stamped dialogue bubbles.
     - **WhatsApp Delivery Badge:** Confirmation status (`Delivered to +91 98...`).
* **Exact APIs Handled on this Page:**

| Action | Method & Endpoint | Query / Param | Response Schema | Status Code |
|---|---|---|---|---|
| **List Calls** | `GET /api/v1/calls` | `?status=completed&agent_id=...&limit=20&offset=0` | `{ total: 100, items: [ { id, call_sid, customer_phone, duration_seconds, cost_inr, log: { ... } } ] }` | `200 OK` |
| **Get Call Details** | `GET /api/v1/calls/{id}` | *None* | Detailed `CallResponse` with full `CallLog` transcript | `200 OK` |
| **Get Audio Stream URL** | `GET /api/v1/calls/{id}/recording-url` | *None* | `{ call_id, streaming_url: "https://...s3...", expires_in_seconds: 900 }` | `200 OK` |

---

### PAGE 8: Calling — "Campaigns & Instant Leads" (`/dashboard/campaigns`)
* **Route:** `src/app/dashboard/campaigns/page.tsx`
* **Features Checklist:**
  1. **Campaigns List:** Table showing active campaigns, progress bars (`65% (650/1000)`), Start/Pause controls.
  2. **Campaign Wizard:** Name, assigned agent, calling window (TRAI 10 AM - 7 PM), pacing slider (1 to 10 concurrent lines).
  3. **CSV Upload & Live DND Scrubber:** Drag-and-drop CSV -> Shows clean leads ready to dial vs TRAI DND blocked numbers.
  4. **Auto-Retry Trigger:** Dispatches busy leads according to +30m, +2h, +24h backoff schedule.
* **Exact APIs Handled on this Page:**

| Action | Method & Endpoint | Payload / FormData | Response Schema | Status Code |
|---|---|---|---|---|
| **List Campaigns** | `GET /api/v1/campaigns` | *None* | `[ { id, name, status, total_leads, dialed_leads, connected_leads, concurrency_limit } ]` | `200 OK` |
| **Create Campaign** | `POST /api/v1/campaigns` | `{ "name": "Drive 2026", "agent_id": 1, "concurrency_limit": 5 }` | Created `CampaignResponse` | `201 Created` |
| **Upload Leads CSV** | `POST /api/v1/campaigns/{id}/upload-leads` | `FormData: file=leads.csv` | `{ total_rows: 500, clean_leads_added: 440, dnd_scrubbed: 45, duplicates_skipped: 15 }` | `200 OK` |
| **Start Campaign** | `POST /api/v1/campaigns/{id}/start` | *None* | `{ "status": "started", "concurrency_limit": 5 }` | `200 OK` |
| **Pause Campaign** | `POST /api/v1/campaigns/{id}/pause` | *None* | `{ "status": "paused" }` | `200 OK` |
| **Dispatch Retries**| `POST /api/v1/campaigns/{id}/dispatch-retries` | *None* | `{ "matured_retries_dispatched": 12 }` | `200 OK` |
| **Meta Ads Webhook**| `POST /api/v1/webhooks/meta-leads` | Meta Webhook JSON Payload | `{ "status": "dispatched", "call_sid": "CA_..." }` | `200 OK` |

---

### PAGE 9: Credits & Recharge Modal (Bottom Sidebar Widget)
* **Features Checklist:**
  1. **Credits Widget:** Bottom sidebar box: `50 CREDITS (7-10 min of calls)` + `[ + Add credits ]`.
  2. **Recharge Modal:** Packs grid: `₹500` (Starter), `₹2,000` (+₹100 bonus), `₹5,000` (+₹500 bonus).
  3. **Razorpay Checkout:** Seamless UPI QR, Card, NetBanking modal.
  4. **Instant Balance Update:** On payment success, balance updates immediately without page reload.
* **Exact APIs Handled on this Component:**

| Action | Method & Endpoint | Payload | Response Schema | Status Code |
|---|---|---|---|---|
| **Fetch Balance** | `GET /api/v1/billing/wallet` | *None* | `{ balance_inr: 489.0, credits: 50, estimated_calling_minutes: 89 }` | `200 OK` |
| **Create Order** | `POST /api/v1/billing/create-order` | `{ "amount_inr": 2000.0 }` | `{ order_id: "order_...", amount_paise: 200000, key_id: "rzp_..." }` | `201 Created` |
| **Verify Payment** | `POST /api/v1/billing/verify-payment` | `{ "razorpay_order_id": "...", "razorpay_payment_id": "...", "razorpay_signature": "..." }` | `{ status: "verified", new_balance_inr: 2589.0 }` | `200 OK` |
| **Audit Ledger** | `GET /api/v1/billing/transactions` | *None* | `[ { id, type, amount_inr, opening_balance_inr, closing_balance_inr, reference_id } ]` | `200 OK` |

---

## 4. DAY-BY-DAY IMPLEMENTATION ROADMAP (3-WEEK TEAMMATE PLAN)

---

### 🟢 WEEK 1: Outpero Shell, Your Team & Hire Employee Studio
* **Day 1: Design Tokens & Base Primitives**
  - Setup Tailwind tokens (`surface-canvas`, `surface-card`, `accent-purple`).
  - Build base UI components: `Button` (with purple variant), `Card` with hairline border, `Badge`, `Input`.
* **Day 2: Authentication (`/login` & `/register`)**
  - Build clean dark auth card with instant ₹500 free credit auto-claim.
* **Day 3: Global Outpero App Shell**
  - Build Sidebar matching screenshot (`Home`, `AI Employees`, `Results`, `Calling`, `Developers`, `Credits`).
  - Build Top Bar with workspace dropdown (`nexo`) and live ticker (`• 0 on calls · 0.0/min`).
* **Day 4: Home Dashboard Overview (`/dashboard`)**
  - Overview cards, quick action buttons, and recent calls table.
* **Day 5: AI Employees — "Your team" (`/dashboard/agents`)**
  - Grid of employee cards with status toggle and 1-click duplicate action.
* **Day 6: Hire Employee Studio — Configuration (`/dashboard/agents/new`)**
  - Tabs: Basic info, Voice & Accent selector (Sarvam Bulbul), and Mid-call tools.
* **Day 7: Hire Employee Studio — Training & Mic Playground**
  - Knowledge Base facts uploader + Live WebRTC in-browser microphone test.

---

### 🟢 WEEK 2: Results Hub (Leads Mini-CRM, Conversations & Performance)
* **Day 8: Leads & Results — Top Bar & 4 View Switcher (`/dashboard/leads`)**
  - Build 4 counter cards (Total, Qualified, Pending, Hot).
  - Build View Switcher (`Pipeline`, `List`, `Cards`, `Priority`).
* **Day 9: Leads & Results — Search, Filters & CSV Export**
  - Implement search bar, hot-only toggle, and `[ 📥 Export ]` CSV button.
* **Day 10: Conversations & Call Logs Table (`/dashboard/calls`)**
  - Dense call logs table with phone numbers in monospace font, duration, cost, sentiment badge.
* **Day 11: Slide-over Audio Intelligence Drawer**
  - Wavesurfer.js waveform audio player, Groq AI 3-bullet summary, and full transcript.
* **Day 12: Performance & Analytics — Filters & 7 KPI Cards (`/dashboard/performance`)**
  - Date pills (`Last 30 days`), employee filter, and the 7 KPI cards.
* **Day 13: Performance & Analytics — Charts & Funnel**
  - Calls over time graph, Conversion funnel, and Outcomes breakdown.
* **Day 14: Quick Outbound Test Call Modal**
  - `[ 📞 Dial Call ]` modal with pre-dial ₹10 balance check and dry-run toggle.

---

### 🟢 WEEK 3: Campaigns, Developers Center & Credits Top-up
* **Day 15: Campaigns Hub — List View (`/dashboard/campaigns`)**
  - Active campaigns, progress bars, start/pause controls.
* **Day 16: Campaign CSV Upload & Live DND Scrubber**
  - Drag-and-drop CSV upload with live scrub report (Valid leads vs TRAI DND blocked).
* **Day 17: Instant Leads Telemetry (`/dashboard/instant-leads`)**
  - Meta Lead Ads webhook setup with sub-30s speed-to-lead latency indicator.
* **Day 18: Developers Center — Overview & Code Snippets (`/dashboard/developers`)**
  - Exact recreation of Screenshot 1: 3-step guide, cURL/Node/Python tabs, Base URL copy box.
* **Day 19: Developers Center — API Keys & Webhooks Tabs**
  - Generate API keys, masked prefix list, and webhook subscription HMAC test ping.
* **Day 20: Credits & Wallet Top-up Modal**
  - Bottom sidebar credits widget (`50 CREDITS`) + Razorpay recharge pack modal (₹500, ₹2,000).
* **Day 21: Polish, Skeletons & Responsive Mobile Drawer**
  - Add hairline skeleton shimmer to all loading states and verify full mobile responsiveness.

---

**Follow this blueprint strictly to build an identical, world-class clone of Outpero! 🚀**
