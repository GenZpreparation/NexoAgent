# 📐 NexoAgent - Master Day-by-Day Frontend UI Blueprint (28 Days)

> **FOR FRONTEND ENGINEERS & TEAMMATES:**  
> Tumhe page ka design ya features sochna nahi hai! Har din ke section me likha hai:
> 1. Kaun sa **Page & Route** banana hai
> 2. Page ka **Visual Layout kaisa dikhega** (Layout wireframe)
> 3. Uss page me **kaun-kaun se Components & UI Elements** honge
> 4. **User actions & features** (Click karne par kya hoga, API call kya hogi)
> 5. **Done When (Acceptance Criteria)** - Kaise pata chalega ki din ka kaam finish ho gaya.

---

## 🧭 WEEK 1: Public Website & Voice Samplers (Days 1 – 7)

---

### 📅 Day 1: Project Setup, Obsidian Theme & Base UI Primitives
* **Route:** `src/app/layout.tsx`, `src/app/globals.css`
* **Page Type / Layout:** Global root layout, forced dark theme, canvas background `#070a11`.
* **Visual Components to Build:**
  - `src/components/ui/Button.tsx`: Variants (`primary` Indigo `#6366f1`, `secondary` dark card with hairline border, `ghost`, `danger`). Spring physics on hover & click.
  - `src/components/ui/Card.tsx`: Background `#0d121f`, border `border-white/[0.08]`, rounded `rounded-xl`, top specular line (`before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white/[0.15] before:to-transparent`).
  - `src/components/ui/Badge.tsx`: Status pills (Active Emerald, Warning Amber, Error Rose, Indigo).
  - `src/components/ui/Input.tsx`: Dark background input with focus ring `focus:border-indigo-500`.
* **Done When:** `npm run dev` opens `http://localhost:3000` with dark obsidian canvas and base components render with zero errors.

---

### 📅 Day 2: Glassmorphic Sticky Navbar & Technical Hero Section
* **Route:** `/` (Public Landing)
* **Visual Layout:**
  - **Top Navbar:** Sticky top, height 64px, `backdrop-blur-md bg-[#070a11]/80`, bottom border `border-white/[0.08]`.
    - Left: NexoAgent Logo with pulsating emerald dot (`🟢 Live Voice AI`).
    - Center: Links: "Features", "Voice Samples", "ROI Calculator", "Pricing", "Docs".
    - Right: "Sign In" link + "Get ₹500 Free" CTA button.
  - **Hero Section:** Centered high-impact technical copy:
    - Top Pill: `⚡ Sub-500ms Conversational Latency | Native Hindi & Hinglish`
    - H1: *"Enterprise Voice AI That Speaks Fluent Hindi & Hinglish."*
    - Subtitle: *"Automate 10,000+ outbound sales calls daily with real-time barge-in, mid-call WhatsApp dispatch, and 60-second pulse billing."*
    - 2 Action Buttons: `[ Start Free Trial (₹500 Credits) ]` + `[ 📞 Talk to Pooja Live (Demo) ]`
    - Trust Badges: `🛡️ TRAI & DND Scrubbed`, `⚡ 99.9% Uptime`, `🔒 Enterprise Telecom Security`.
* **Done When:** Navbar and Hero section look clean, responsive on mobile & desktop, and CTAs scroll or navigate properly.

---

### 📅 Day 3: Regional Indian Voice Accent Sampler (Bento Grid)
* **Route:** `/` (Section `#voices`)
* **Visual Layout:** 6-card bento grid (3 columns on desktop, 1 on mobile).
* **Components to Build:**
  - `VoiceSampler.tsx` & `VoiceCard.tsx`:
    - Card 1: **Pooja (Delhi Hindi)** - Real Estate Lead Qualifier & Site Visit Booker.
    - Card 2: **Aman (Corporate Hinglish)** - B2B SaaS Demo Scheduler & Executive Qualifier.
    - Card 3: **Priya (Warm Hindi)** - Customer Support & Retention Assistant.
    - Card 4: **Rahul (Marathi Accent)** - BFSI Loan EMI Reminder & Recovery Agent.
    - Card 5: **Ananya (Bangalore English)** - Fintech Onboarding & KYC Verification.
    - Card 6: **Kavita (Tamil / Telugu Accent)** - Healthcare Appointment Confirmation Specialist.
* **Features:**
  - Play/Pause button on each card.
  - Playing one card automatically pauses any other audio.
  - Animated soundwave equalizer bars (vibrate when audio plays).
* **Done When:** User can click any card, hear the voice sample, and see the equalizer bars animate.

---

### 📅 Day 4: Interactive B2B ROI & Telecaller Cost Savings Calculator
* **Route:** `/` (Section `#calculator`)
* **Visual Layout:** 2-column card widget:
  - **Left Column (Inputs):**
    - Slider 1: Number of Human Telecallers (`1` to `100`, default `10`).
    - Slider 2: Average Monthly Salary per Caller (`₹15,000` to `₹50,000`, default `₹22,000`).
    - Dropdown: Industry Preset (Real Estate, EdTech, BFSI, Healthcare).
  - **Right Column (Results Card):**
    - Current Human Cost: `₹2,20,000 / month`
    - NexoAgent AI Cost: `₹38,500 / month`
    - **Green Highlight Box:** `🚀 You Save: ₹21,78,000 / year (82% Cost Reduction!)`
* **Features:** Moving sliders dynamically updates the calculations in real-time without page reload.
* **Done When:** Sliders update smoothly, numbers format in Indian currency (`₹`), and savings update instantly.

---

### 📅 Day 5: Asymmetric Bento Grid Features Section
* **Route:** `/` (Section `#features`)
* **Visual Layout:** Asymmetric Bento Grid (4 feature cards of varying widths):
  - **Card 1 (Large - Real-time Waveform Canvas):** Shows live voice waveform + `<480ms` VAD-to-TTS latency metric.
  - **Card 2 (Mid - Live Hinglish Speech Switcher):** Interactive toggle between Pure Hindi, Hinglish, and English showing agent response.
  - **Card 3 (Mid - Instant In-Call WhatsApp Dispatch):** Mock chat animation showing WhatsApp brochure arriving during call.
  - **Card 4 (Large - TRAI & DND Auto-Scrubbing):** Graphic showing CSV upload filtering out DND numbers automatically before dialing.
* **Done When:** Bento grid renders with hairline borders, top specular highlight, and crisp typography.

---

### 📅 Day 6: Transparent Pulse Pricing & Comparison Matrix
* **Route:** `/` (Section `#pricing`)
* **Visual Layout:** 3-Tier Pricing Cards:
  - **Card 1: Starter (₹0 Platform Fee):** Pay-as-you-go, ₹0.85/min pulse, 1 AI Agent, Community support.
  - **Card 2: Growth (Recommended - Indigo Border):** ₹4,999/mo, ₹0.65/min pulse, 10 AI Agents, Meta Ads Speed-to-lead, WhatsApp tools.
  - **Card 3: Enterprise:** Custom pricing, Dedicated SIP Trunk, Custom fine-tuned voice models, SLA 99.99%.
* **Features:** Toggle between Monthly and Annual billing (with 20% discount tag).
* **Done When:** Pricing cards highlight the Growth tier, buttons route to `/register`, and comparison table is responsive.

---

### 📅 Day 7: In-Browser WebRTC Live Voice Demo Modal
* **Route:** Floating button on Landing Page: `[ 🎙️ Talk to Pooja Live ]`
* **Visual Layout:** Center modal with backdrop blur:
  - Animated pulsing voice orb (Indigo/Cyan glowing ring that expands when AI speaks).
  - Live transcript bubble: User message on right, AI Pooja response on left.
  - Call controls: Microphone Mute/Unmute toggle, Red "End Call" button.
* **Features:** Uses WebRTC to connect to LiveKit Cloud (`NEXT_PUBLIC_LIVEKIT_URL`) for an actual 60-second live test conversation.
* **Done When:** Clicking "Talk to Pooja Live" requests mic permission, connects audio, and allows speaking with the AI in browser.

---

## 🔐 WEEK 2: Auth, SaaS Layout & Voice Agent Studio (Days 8 – 14)

---

### 📅 Day 8: Multi-Tenant Auth Pages (Sign Up & Login)
* **Routes:** `/register` and `/login`
* **Visual Layout:** Split-screen layout (Left: Product value props & testimonial; Right: Obsidian dark login card).
* **Features on `/register`:**
  - Fields: Full Name, Company/Workspace Name, Work Email, Password.
  - Automatic banner: *"🎉 ₹500 Free Calling Credits will be credited to your wallet instantly upon registration!"*
  - API Call: `POST /api/v1/auth/register` (returns JWT + workspace + ₹500 balance).
* **Features on `/login`:**
  - Fields: Email, Password.
  - API Call: `POST /api/v1/auth/login`. Stores token in `localStorage` / cookie and redirects to `/dashboard`.
* **Done When:** User can register, receive token, and login with proper error handling on invalid credentials.

---

### 📅 Day 9: Authenticated SaaS Shell Layout
* **Route:** `src/app/dashboard/layout.tsx`
* **Visual Layout:**
  - **Left Sidebar (240px wide, dark obsidian `#070a11`):**
    - Company Logo & Workspace switcher dropdown (`🏢 DLF CyberCity [v]`).
    - Navigation Items with Lucide Icons:
      - 📊 Overview (`/dashboard`)
      - 🎙️ AI Agents (`/dashboard/agents`)
      - 📢 Campaigns (`/dashboard/campaigns`)
      - 📞 Call Logs (`/dashboard/calls`)
      - 💳 Billing & Wallet (`/dashboard/billing`)
      - ⚙️ Settings & API (`/dashboard/settings`)
    - Bottom: User Avatar, Name, Role badge (`admin`), Logout button.
  - **Top Bar (Height 60px):**
    - Breadcrumbs (e.g. `Dashboard > AI Agents`).
    - Live Telephony Server Status: `🟢 Telecom Carrier Online`.
    - Wallet Pill: `💳 ₹489.00 Balance` + `[ + Recharge ]` quick button.
* **Done When:** Shell renders cleanly, active route highlights in sidebar, and wallet balance displays dynamically.

---

### 📅 Day 10: Dashboard Analytics Overview Page
* **Route:** `/dashboard`
* **Visual Layout:**
  - **Row 1 (4 Metric Cards):**
    1. Wallet Balance: `₹489.00` (~89 mins left).
    2. Total Connected Minutes: `1,240 mins` (+12% this week).
    3. Calls Placed Today: `420 calls` (Pick-up rate: 76%).
    4. Hot Leads Identified: `48 Leads` (Auto-tagged by Groq AI).
  - **Row 2 (2 Charts):**
    - Left: Daily Calling Volume Bar Chart (Last 7 days).
    - Right: Lead Qualification Donut Chart (60% Hot, 25% Warm, 15% Cold).
  - **Row 3 (Recent Calls Table):** Last 5 calls with phone number, agent name, duration, cost, sentiment badge, and "View" button.
* **Done When:** Overview loads data via `GET /api/v1/calls` and `GET /api/v1/billing/wallet`.

---

### 📅 Day 11: Voice Agents Management & List View
* **Route:** `/dashboard/agents`
* **Visual Layout:**
  - Header: Title "AI Voice Agents" + Subtitle + `[ + Create New Agent ]` button.
  - Grid of Agent Cards (3 per row):
    - Agent Avatar & Name (e.g. "Pooja - Real Estate Specialist").
    - Language & Voice Badge: `Sarvam Bulbul (Hindi)` or `Deepgram (English)`.
    - Active Status Toggle Switch: `🟢 Active` / `⏸️ Paused`.
    - Stats: Total Calls Handled (e.g. `340 calls`), Avg Duration (`1m 45s`).
    - 3-Dot Menu Actions: `Edit Agent`, `Duplicate Agent (1-Click)`, `Delete Agent`.
* **Features:**
  - Clicking `Duplicate` calls `POST /api/v1/agents/{id}/duplicate` and refreshes list.
  - Toggling switch calls `PATCH /api/v1/agents/{id}` to pause/resume agent.
* **Done When:** List renders all agents from `GET /api/v1/agents` with working search bar and duplicate action.

---

### 📅 Day 12: Voice Agent Studio - Configuration Editor (Left Panel)
* **Route:** `/dashboard/agents/[id]`
* **Visual Layout:** 2-Panel Split Studio Screen (60% Left Configuration, 40% Right Playground).
* **Left Panel Sections:**
  - **General Settings:** Agent Name, Language Selector (`hi-IN`, `en-IN`, `hinglish`).
  - **Speech Engine Selector:** Voice Provider (`Sarvam AI` / `Deepgram`), Voice Speaker (`Pooja`, `Aman`, `Priya`), Speaking Rate slider (`0.8x` to `1.2x`).
  - **First Message Input:** Exact opening line (e.g., *"Namaste! Mai Pooja baat kar rahi hu DLF CyberCity se..."*).
  - **System Prompt & Persona Editor:** Large code-highlighted textarea with auto-fill templates ("Lead Qualification", "Payment Reminder", "Site Visit Booking").
  - **In-Call Tools Toggle:** Enable WhatsApp Brochure Dispatch checkbox.
  - Top Action: `[ Save Agent Changes ]` button (calls `PATCH /api/v1/agents/{id}`).
* **Done When:** Agent details load, inputs update state, and clicking save persists changes via API.

---

### 📅 Day 13: Voice Agent Studio - In-Browser Test Playground (Right Panel)
* **Route:** `/dashboard/agents/[id]` (Right 40% Panel)
* **Visual Layout:**
  - Header: "Live Audio Playground" + Latency indicator (`⏱️ Latency: 440ms`).
  - Animated Audio Visualizer Orb (pulsing waves).
  - Real-time Streaming Transcript Box:
    - User speech bubble (Right, Indigo).
    - AI Agent response bubble (Left, Slate card).
  - Controls: Big "Start Test Call" button (turns to Red "Hangup" during call), Mute Mic toggle.
* **Features:** Connects browser mic to LiveKit room for instant prompt tuning without dialing real phone.
* **Done When:** User can speak into mic, see live transcript, and hear agent respond with the newly edited prompt.

---

### 📅 Day 14: Single Outbound Call Dispatch Modal
* **Route:** Triggered from `/dashboard/agents` or `/dashboard/calls` via `[ 📞 Dial Test Call ]` button.
* **Visual Layout:** Center modal:
  - Phone Number Input with `+91` prefix (auto-sanitizes to E.164).
  - Customer Name input: "Deepak Sharma".
  - Agent Selector dropdown: Select active agent.
  - Pre-Dial Balance Check Pill: `Available Balance: ₹489.00 (Ready)`.
  - Button: `[ 🚀 Launch Outbound Call ]`.
* **Features:**
  - Calls `POST /api/v1/calls/dispatch`.
  - If balance < ₹10.00, shows amber alert: *"Insufficient balance (₹3.00). Please recharge wallet."*
  - On success, shows green banner: *"Call queued! Carrier SID: CA_9f8a..."* with link to call logs.
* **Done When:** Modal triggers call dispatch API and handles both success and low-balance states gracefully.

---

## 📢 WEEK 3: Bulk Campaigns & Call Intelligence Ledger (Days 15 – 21)

---

### 📅 Day 15: Bulk Campaigns Overview & List Page
* **Route:** `/dashboard/campaigns`
* **Visual Layout:**
  - Header: "Telecalling Campaigns" + `[ + New Campaign ]` button.
  - Summary Metric Cards: Active Campaigns (`2`), Total Leads Queued (`4,500`), Completed Today (`1,200`).
  - Table of Campaigns:
    - Campaign Name (e.g. "DLF 3BHK Weekend Drive").
    - Assigned Agent (e.g. "Pooja").
    - Progress Bar: `65% (650 / 1000 Dialed)`.
    - Status Badge: `🟢 Running`, `⏸️ Paused`, `✅ Completed`.
    - Actions: `Start`, `Pause`, `View Report`.
* **Done When:** Campaign list fetches from `GET /api/v1/campaigns` with responsive progress bars.

---

### 📅 Day 16: Campaign Creation Wizard (Step 1 & 2)
* **Route:** `/dashboard/campaigns/new`
* **Visual Layout:** 3-Step Wizard Navigation (`1. Details -> 2. Agent & Schedule -> 3. Upload Leads`):
  - **Step 1:** Campaign Name, Campaign Goal description.
  - **Step 2:** Select Voice Agent, Dialing Pacing (1 to 5 concurrent calls), Calling Window (Default TRAI 10:00 AM - 7:00 PM).
* **Done When:** Steps validate inputs and user can move forward/backward in the wizard.

---

### 📅 Day 17: Campaign Wizard Step 3: CSV Lead Ingestion & DND Pre-Scrubber
* **Route:** `/dashboard/campaigns/new` (Step 3)
* **Visual Layout:**
  - Drag-and-drop CSV Upload zone with sample template download link (`Download Sample CSV`).
  - After upload, shows **Pre-Dial Scrubbing Summary Card**:
    - Total Uploaded: `500 Leads`
    - Valid Clean Leads: `440 Leads` (Ready to dial)
    - 🚫 TRAI DND Blocked: `45 Leads` (Scrubbed automatically)
    - ⚠️ Duplicates Removed: `15 Leads`
  - Action Button: `[ 🚀 Launch Campaign (440 Leads) ]`.
* **Done When:** Uploading CSV calls `POST /api/v1/campaigns/{id}/upload-leads`, shows scrub stats, and starts campaign.

---

### 📅 Day 18: Live Campaign Execution Monitor
* **Route:** `/dashboard/campaigns/[id]`
* **Visual Layout:** Real-time telemetry dashboard:
  - Big Circular Progress Dial: `45% Completed`.
  - Live Counter Grid: `Connected: 180`, `Busy: 42`, `No Answer: 30`, `DND Skipped: 45`.
  - Live Calling Feed: Stream showing active calls currently in-progress with live second timers (`00:45s`).
  - Emergency Action: Red `[ 🛑 Pause Campaign ]` button.
* **Done When:** Page polls/updates stats every 5s and reflects campaign progress live.

---

### 📅 Day 19: Master Call Logs & Telephony Ledger Table
* **Route:** `/dashboard/calls`
* **Visual Layout:** Dense, enterprise data table:
  - Filters: Date Range picker, Agent filter dropdown, Sentiment filter (`Hot`, `Warm`, `Cold`), Search by phone number.
  - Columns:
    - Call Time (e.g. `12:30 PM, 23 Nov`)
    - Customer Phone (E.164 Monospace font: `+91 98765 43210`)
    - Agent Name ("Pooja")
    - Duration (`1m 25s` - Monospace)
    - Billed Cost (`₹11.00` - 2 pulses)
    - Sentiment Badge (`🔥 Hot Lead`, `🟡 Warm`, `⚪ Neutral`, `❌ Failed`)
    - Action: `[ View Intelligence ]` button.
* **Done When:** Table loads from `GET /api/v1/calls`, supports search and filters, and handles empty/loading states.

---

### 📅 Day 20: Post-Call Audio Intelligence & Transcript Drawer
* **Route:** Drawer / Slide-over Modal on `/dashboard/calls/[id]`
* **Visual Layout:** Side drawer (500px wide):
  - **Section 1: Audio Recording Player:**
    - Wavesurfer.js waveform visualizer (interactive seek bar, play/pause, speed toggle `1x / 1.5x`).
    - Audio source loaded via presigned S3/R2 URL (`GET /api/v1/calls/{id}/recording-url`).
  - **Section 2: Groq AI Intelligence Card:**
    - Executive Summary: 3-bullet summary of conversation.
    - Qualification Tag: `Hot Lead` (Interest in 3 BHK Luxury Flat).
    - Extracted Variables: Budget: `₹1.5 Cr`, Preferred Location: `Gurgaon Phase 5`.
    - WhatsApp Delivery Status: `✅ Brochure Delivered via WhatsApp (+91 98765...)`.
  - **Section 3: Full Time-Stamped Transcript:** Chat bubble dialogue between Caller and AI.
* **Done When:** Drawer opens smoothly, audio plays with interactive scrubber, and AI summary renders cleanly.

---

### 📅 Day 21: Inbound Speed-to-Lead Telemetry View
* **Route:** `/dashboard/calls?filter=meta_ads`
* **Visual Layout:**
  - Special highlight card on top of Call Logs:
    - Title: `⚡ Speed-to-Lead Performance (Meta Lead Ads)`
    - Average Dialout Latency: `18 Seconds` (from form submission to phone ringing).
    - Inbound Leads Converted: `84%`.
  - Calls list with `[ Meta Ads ]` purple tag next to customer name.
* **Done When:** Speed-to-lead calls show distinct badge and latency metric is visible.

---

## 💳 WEEK 4: Wallet Billing, Developer Hub & Polish (Days 22 – 28)

---

### 📅 Day 22: Telecom Wallet & Razorpay Top-Up Center
* **Route:** `/dashboard/billing`
* **Visual Layout:**
  - **Top Wallet Card:**
    - Large Monospace Balance: `₹489.00 INR`
    - Estimated Minutes: `~89 calling minutes remaining`
    - Low Balance Alert threshold indicator.
  - **Recharge Packs Grid (3 Cards):**
    - Pack 1: `₹500` (Starter Pack - ~90 mins)
    - Pack 2 (Popular): `₹2,000` (+ ₹100 Free Bonus Credits = ₹2,100)
    - Pack 3: `₹5,000` (+ ₹500 Free Bonus Credits = ₹5,500)
    - Custom Amount input box (Minimum ₹100).
  - Button on each card: `[ Recharge via UPI / Card ]`.
* **Features:**
  - Clicking recharge calls `POST /api/v1/billing/create-order` to get Razorpay `order_id`.
  - Opens Razorpay Checkout modal in browser.
  - On payment success, calls `POST /api/v1/billing/verify-payment` and refreshes wallet balance instantly.
* **Done When:** Razorpay checkout opens, dummy/test payment verifies, and balance updates on screen.

---

### 📅 Day 23: Immutable Financial Audit Ledger & Invoices
* **Route:** `/dashboard/billing` (Tab: "Transaction History")
* **Visual Layout:** Financial ledger table with 6 columns:
  - Date & Time
  - Type Badge: `[ 🟢 CREDIT (Recharge) ]` / `[ 🔴 DEBIT (Call Usage) ]`
  - Opening Balance (`₹500.00`)
  - Amount (`-₹11.00` or `+₹5,000.00`)
  - Closing Balance (`₹489.00`)
  - Reference / Call SID (`CA_9f8a...` or `pay_order_...`)
* **Done When:** Table fetches from `GET /api/v1/billing/transactions` showing complete financial audit trail.

---

### 📅 Day 24: Developer API Keys Center
* **Route:** `/dashboard/settings/api-keys`
* **Visual Layout:**
  - Header: Title "Developer API Keys" + `[ + Generate New API Key ]` button.
  - Description: *"Use API keys to trigger calls from your CRM (Salesforce, HubSpot, custom scripts)."*
  - Table of Existing Keys:
    - Key Name ("Zapier Production")
    - Key Prefix (`nexo_live_e9d0...`)
    - Created Date & Last Used Timestamp (`2 mins ago`)
    - Action: Red `[ Revoke ]` button.
  - **One-Time Secret Reveal Modal:** When user generates a key, shows full secret with a "Copy to Clipboard" button and warning: *"This secret will never be shown again!"*
* **Done When:** User can generate, copy, view prefixes, and revoke keys via `/api/v1/api-keys`.

---

### 📅 Day 25: Outbound CRM Webhook Subscriptions
* **Route:** `/dashboard/settings/webhooks`
* **Visual Layout:**
  - Header: "Outbound CRM Webhooks" + `[ + Add Webhook URL ]` button.
  - Registration Form Modal:
    - Webhook Endpoint URL: `https://crm.mycompany.com/api/nexo-lead`
    - Subscribed Events checkboxes: `[x] call.completed`, `[x] lead.qualified`, `[x] call.failed`.
  - Active Subscriptions List:
    - Shows URL, event badges, and HMAC secret.
    - Action: `[ 🏓 Send Test Ping ]` button (calls `/api/v1/integrations/webhooks/{id}/test-ping`).
* **Done When:** User can register webhook, send test ping, and receive green success notification.

---

### 📅 Day 26: Workspace Team Members & RBAC Settings
* **Route:** `/dashboard/settings/team`
* **Visual Layout:**
  - Header: "Team Members & Permissions" + `[ + Invite Teammate ]` button.
  - Invite Modal: Full Name, Email, Role Selector (`Admin`, `Manager`, `Member/Caller`).
  - Teammates Table:
    - Avatar, Name, Email
    - Role badge (`Admin` Indigo, `Manager` Cyan, `Member` Slate)
    - Status: `Active`
    - Action: `Remove Member` (with warning modal).
* **Done When:** Admin can invite teammates via `/api/v1/workspace/members` and member roles display accurately.

---

### 📅 Day 27: 4-State UI Audit, Skeletons & Responsive Mobile Polish
* **Scope:** Entire App UI Review
* **Checklist for Teammate:**
  1. **Loading Skeletons:** Har table aur card me data load hote waqt generic spinner ki jagah hairline skeleton pulse dikhana.
  2. **Empty States:** Jab koi agent, call, ya campaign na ho, toh high-context technical graphic + actionable CTA dikhana (e.g. "No agents found - Create your first voice agent").
  3. **Error Alerts:** API fail hone par red/amber card with "Retry" trigger.
  4. **Mobile Navigation:** Mobile view me hamburger menu drawer open hona chahiye.
* **Done When:** App handles network disconnects, empty databases, and mobile screen sizes smoothly.

---

### 📅 Day 28: End-to-End Production Verification & Deployment
* **Scope:** Final Release
* **Checklist:**
  - `npm run build` runs with zero TypeScript or ESLint errors.
  - Lighthouse performance score > 90.
  - Deploy to Vercel with environment variables (`NEXT_PUBLIC_API_BASE_URL`).
* **Done When:** Production URL is live and full user journey works from registration to voice agent creation.

---

## 🚀 Teammate Summary Checklist
Agar tum kaam shuru kar rahe ho:
1. `Day 1` se start karo.
2. Har din ka target sirf uss din ka task complete karna hai.
3. Kisi bhi design ya color confusion me `GEMINI.md` dekho.
4. Kisi bhi API payload confusion me `docs/API_CONTRACTS.md` dekho.
