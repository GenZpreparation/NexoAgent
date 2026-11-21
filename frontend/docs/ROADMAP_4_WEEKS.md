# 📅 NexoAgent - Master 4-Week Day-by-Day (28 Days) Frontend Roadmap

> **Target Audience:** Frontend Engineers, Lead Architects & Antigravity AI Assistant.  
> **Master Directive:** Strict adherence to [`GEMINI.md`](file:///d:/python%20Qspider/Notes/PYTHON/GenZ/Krishna/NexoAgent/GEMINI.md), [`frontend/docs/DESIGN_SYSTEM_RULES.md`](file:///d:/python%20Qspider/Notes/PYTHON/GenZ/Krishna/NexoAgent/frontend/docs/DESIGN_SYSTEM_RULES.md), and [`frontend/docs/API_CONTRACTS.md`](file:///d:/python%20Qspider/Notes/PYTHON/GenZ/Krishna/NexoAgent/frontend/docs/API_CONTRACTS.md).

---

## 🗺️ HIGH-LEVEL ARCHITECTURE & WEEKLY OVERVIEW

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       NEXOAGENT FRONTEND ARCHITECTURE                                  │
├────────────────────────────────┬───────────────────────────────────────────────────────────────────────┤
│ 🟢 WEEK 1 (Days 1 – 7)         │ Public Website, Obsidian Tokens & High-Conversion Audio Samplers       │
│ 🟢 WEEK 2 (Days 8 – 14)        │ Multi-Tenant Auth, SaaS Layout Shell & Voice Agent Studio              │
│ 🟢 WEEK 3 (Days 15 – 21)       │ Bulk Campaign Engine & Post-Call Audio Intelligence Ledger             │
│ 🟢 WEEK 4 (Days 22 – 28)       │ Integrations Hub, Razorpay Wallet Billing & Production Polish          │
└────────────────────────────────┴───────────────────────────────────────────────────────────────────────┘
```

---

## 🟢 WEEK 1: Public Website, Obsidian Tokens & High-Conversion Audio Samplers (Days 1–7)

### 🎯 Week 1 Objective:
Build an ultra-modern, high-converting public marketing website that establishes immediate trust with Indian enterprise founders. Avoid generic AI templates by implementing dark obsidian surfaces (`#070a11`), interactive audio players, dynamic ROI sliders, and a live in-browser WebRTC agent demo.

---

### 📅 Day 1: Next.js 15 Setup, Obsidian Tokens & Base Primitives
* **Route:** `src/app/layout.tsx`, `src/app/page.tsx`
* **Layout & Visual Structure:**
  - Deep Obsidian canvas (`#070a11`), viewport locked min-h-screen, sans font (`Inter`), monospace font (`JetBrains Mono`).
  - Subtle radial background spotlight centered at top (`radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.15), transparent 70%)`).
* **Components to Build:**
  - `src/lib/axios.ts`: Pre-configured Axios instance pointing to `process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1'`.
  - `src/components/ui/button.tsx`: High-tactile button with spring physics, variants: `primary` (Electric Indigo), `secondary` (Dark Card with hairline border), `ghost`, `danger`.
  - `src/components/ui/badge.tsx`: Micro status pills with specular dot (`active`, `subtle`, `warning`, `error`).
  - `src/components/ui/card.tsx`: Card container with 3-layer surface depth (`bg-[#0d121f]/90 border border-white/[0.08]`) and top specular light line.
* **Features & Interactive Controls:**
  - Tailwind configuration with custom Nexo tokens (`surface-canvas`, `surface-card`, `surface-overlay`, `accent-indigo`, `accent-cyan`).
  - Dark mode lock (forced dark theme, no flash of unstyled light content).
* **4-State UI Specification:**
  - `Loading`: CSS skeleton pulse using `bg-white/[0.04]` shimmer animation.
  - `Empty/Data`: Static baseline layout check.
* **Day 1 Acceptance Criteria:**
  - `npm run dev` opens cleanly on `http://localhost:3000` with obsidian theme and zero TypeScript or Tailwind compilation warnings.

---

### 📅 Day 2: Glassmorphic Sticky Navbar & Technical Hero Section
* **Route:** `/` (Public Landing)
* **Layout & Visual Structure:**
  - **Navbar:** Sticky top, `backdrop-blur-md bg-[#070a11]/80`, hairline bottom border (`border-b border-white/[0.08]`).
  - **Hero:** Asymmetric 2-column or centered spotlight hero with glowing status pill, high-contrast H1, subheadline, and primary/secondary CTAs.
* **Components to Build:**
  - `src/components/landing/Navbar.tsx`: Logo with pulsating emerald dot, navigation links ("Features", "Audio Samples", "ROI Calculator", "Pricing", "Docs"), and Right CTA buttons ("Sign In", "Get ₹500 Free").
  - `src/components/landing/Hero.tsx`:
    - Top telemetry badge: `⚡ Sub-500ms Conversational Latency | Native Hindi & Hinglish`.
    - H1 Headline: *"Enterprise Voice AI That Speaks Fluent Hindi & Hinglish."*
    - Subtitle: *"Automate 10,000+ daily telecalling leads with real-time barge-in, instant mid-call WhatsApp dispatch, and 60-second pulse billing."*
    - Action Buttons: `Start Free Trial (₹500 Credits)` + `Schedule Enterprise Demo`.
    - Trust Badges: *"TRAI DND Compliant"*, *"ISO 27001 Data Residency"*, *"99.9% Telephony Uptime"*.
* **Micro-Interactions:**
  - Navbar links highlight on hover with smooth background pill indicator.
  - Primary button features subtle glow shadow on hover (`hover:shadow-[0_0_24px_rgba(99,102,241,0.4)]`).
* **Day 2 Acceptance Criteria:**
  - Fully responsive on desktop and mobile. Smooth scroll to anchor sections (`#features`, `#pricing`).

---

### 📅 Day 3: Interactive Regional Indian Voice Accent Sampler
* **Route:** `/` (Section `#voices`)
* **Layout & Visual Structure:**
  - Responsive Bento grid of 6 interactive voice cards (3 columns on desktop, 1 on mobile).
  - Each card features voice persona avatar, language pill, role description, and custom SVG audio play button.
* **Components to Build:**
  - `src/components/landing/VoiceSampler.tsx`: Master audio container managing single-audio playback state.
  - `src/components/landing/VoiceCard.tsx`: Individual voice card with animated audio frequency equalizer bars when active.
* **Voice Personas to Include:**
  1. **Pooja (Delhi Hindi):** Real Estate Lead Qualifier & Site Visit Booker.
  2. **Aman (Corporate Hinglish):** B2B SaaS Demo Scheduler & Executive Qualifier.
  3. **Priya (Warm Hindi):** Customer Support & Retention Assistant.
  4. **Rahul (Marathi Accent):** BFSI Loan EMI Reminder & Recovery Agent.
  5. **Ananya (Bangalore English):** Fintech Onboarding & KYC Verification.
  6. **Kavita (Tamil / Telugu):** Healthcare Appointment Confirmation Specialist.
* **Features & Audio Controls:**
  - Playing one voice automatically pauses any previously playing card.
  - Dynamic canvas or CSS bar animation that vibrates when audio is playing.
  - Time scrubber and duration indicator (`00:14 / 00:25`).
* **Day 3 Acceptance Criteria:**
  - Client can click any card and hear crisp, lifelike Sarvam/Deepgram synthetic audio without lag or clipping.

---

### 📅 Day 4: Interactive B2B ROI & Telecaller Cost-Savings Calculator
* **Route:** `/` (Section `#calculator`)
* **Layout & Visual Structure:**
  - 2-Column interactive dashboard widget:
    - **Left Column (Inputs):** Sliders and industry preset selector pills.
    - **Right Column (Results Card):** Elevated dark card with glowing net savings metric and side-by-side cost bar comparison.
* **Components to Build:**
  - `src/components/landing/RoiCalculator.tsx`: Master calculator state.
  - `src/components/ui/slider.tsx`: Custom sleek slider with electric indigo track and glowing thumb.
* **Interactive Inputs & Formula:**
  - **Industry Presets:** Buttons for *Real Estate*, *Fintech & Lending*, *EdTech*, *Healthcare*.
  - **Slider 1 - Number of Callers:** 1 to 100 telecallers (Default: 10).
  - **Slider 2 - Average Monthly Salary:** ₹15,000 to ₹50,000 / month (Default: ₹22,000).
  - **Slider 3 - Daily Calls per Caller:** 50 to 200 calls (Default: 120).
* **Outputs & Calculations:**
  - Human Call Center Cost: `(Callers * Salary) + Overhead (20%)`.
  - NexoAgent AI Cost: Calculated at ₹5.50 per 3-min conversation.
  - **Net Annual Savings:** Highlighted in bold emerald font: `e.g. ₹28,40,000 / Year (Saved 78%)`.
  - Payback Period: `Instant (Day 1)`.
* **Day 4 Acceptance Criteria:**
  - Dragging sliders updates output figures instantly with smooth count-up animation without layout shifts.

---

### 📅 Day 5: Live In-Browser WebRTC Voice Agent Demo
* **Route:** `/` (Section `#live-demo`)
* **Layout & Visual Structure:**
  - Interactive "Live Terminal / Voice Console" simulating a live telecall session right inside the browser.
  - Centered circular microphone orb with pulse rings (`animate-ping`) when connected.
  - Bottom dual-panel: Left side = Real-time speech waveform canvas; Right side = Streaming WhatsApp-style transcript.
* **Components to Build:**
  - `src/components/landing/LiveWebRtcDemo.tsx`: WebRTC / WebSocket connection manager.
  - `src/components/landing/AudioOrb.tsx`: Visual feedback orb displaying listening, thinking, speaking states.
  - `src/components/landing/LiveTranscript.tsx`: Auto-scrolling bubble dialogue with typing effect.
* **Features:**
  - "Talk to Pooja (Free 60-Sec Demo)" trigger button.
  - Browser mic permission request handling.
  - Fallback simulation mode if mic is denied (plays simulated audio dialogue with synchronized transcript).
  - Real-time telemetry indicators: `Latency: 420ms`, `VAD: Active`, `STT: Deepgram Nova-2`.
* **Day 5 Acceptance Criteria:**
  - User clicks mic, speaks to browser, and receives conversational voice response in under 600ms.

---

### 📅 Day 6: B2B Pricing Matrix & Feature Checklist Table
* **Route:** `/` (Section `#pricing`)
* **Layout & Visual Structure:**
  - 3-Tier pricing grid (Pay-As-You-Go, Growth, Enterprise).
  - Middle card ("Growth") highlighted with subtle indigo border glow and *"Most Popular"* badge.
  - Full-width feature comparison matrix below with checkmarks (`CheckCircle2`) and cross icons.
* **Components to Build:**
  - `src/components/landing/PricingGrid.tsx`: Master pricing container.
  - `src/components/landing/PricingCard.tsx`: Individual tier card.
  - `src/components/landing/FeatureMatrix.tsx`: Detailed feature breakdown table.
* **Pricing Tiers Defined:**
  1. **Pay-As-You-Go:**
     - ₹5.50 / minute (60-sec pulse).
     - ₹500 free bonus credit on signup.
     - 5 Concurrent calls, Standard Hindi & Hinglish voices, Webhook export.
  2. **Growth (Scaling Teams):**
     - ₹4.20 / minute + ₹4,999 / month platform fee.
     - 25 Concurrent calls, Custom Voice Prompt Builder, In-Call WhatsApp tools, DND Scrubber.
  3. **Enterprise (High Volume):**
     - Custom volume pricing (< ₹3.00 / min).
     - Unlimited concurrency, Dedicated SIP trunk (Tata/Airtel), Custom voice cloning, SLA 99.95%.
* **Day 6 Acceptance Criteria:**
  - Clear CTAs on each card redirecting to `/register?plan=growth` with query param preservation.

---

### 📅 Day 7: Mobile Navigation Drawer, SEO Meta & Lighthouse 95+ Audit
* **Route:** Complete Public Site (`/`)
* **Layout & Polish:**
  - Mobile bottom navigation bar / hamburger drawer with slide-in animation.
  - Structured SEO metadata: OpenGraph image, Twitter Cards, Schema.org `SoftwareApplication` JSON-LD markup.
* **Components to Build:**
  - `src/components/landing/MobileDrawer.tsx`: Slide-over mobile menu with smooth backdrop blur.
  - `src/components/landing/Footer.tsx`: Clean 4-column footer (Product, Solutions, Developers, Legal/TRAI compliance) + copyright bar.
* **Optimization Tasks:**
  - Image optimization (Next/Image with WebP format).
  - Font optimization using `next/font/google`.
  - Zero CLS (Cumulative Layout Shift) verification.
* **Day 7 Acceptance Criteria:**
  - Google Chrome Lighthouse performance score: 95+ on Desktop, 90+ on Mobile. All links functional.

---

## 🟢 WEEK 2: Multi-Tenant Auth, SaaS Layout & Voice Agent Studio (Days 8–14)

### 🎯 Week 2 Objective:
Build the authenticated client SaaS portal where business owners log in, view calling analytics, and build their custom voice AI agents with system prompts, Hindi/Hinglish accents, and mid-call WhatsApp tools.

---

### 📅 Day 8: Authentication Suite (Login & Register with Free Credits)
* **Routes:** `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`
* **Layout & Visual Structure:**
  - Centered auth card on obsidian canvas with subtle top specular highlight.
  - Left/Top branding: NexoAgent logo + secure badge: *"256-Bit Encrypted Multi-Tenant Session"*.
* **Components to Build:**
  - `src/components/auth/LoginForm.tsx`: Email, Password, "Remember Me", Forgot Password link.
  - `src/components/auth/RegisterForm.tsx`: Full Name, Company Name, Work Email, Phone Number, Password.
  - `src/components/ui/input.tsx`: Input with hairline border, focus ring `ring-1 ring-indigo-500`, and error label.
* **Backend API Integration:**
  - `POST /auth/register`: Sends `{ full_name, email, password, company_name, phone }`.
  - `POST /auth/login`: Form-encoded OAuth2 `{ username, password }`.
  - Returns: `{ access_token, token_type: "bearer" }`.
* **State & Cookie Management:**
  - Token stored in secure HttpOnly cookie or secure storage via `src/lib/auth.ts`.
  - Successful registration displays celebratory toast: *"🎉 Welcome to NexoAgent! ₹500 calling balance added to your wallet."* and redirects to `/dashboard`.
* **4-State UI Specification:**
  - `Loading`: Button text replaced with spinner + disabled inputs.
  - `Error`: Amber/Rose callout card: *"Invalid credentials. Please verify your email & password."*
* **Day 8 Acceptance Criteria:**
  - End-to-end registration and login work against running FastAPI backend with token persistence.

---

### 📅 Day 9: Authenticated SaaS Shell Layout & Navigation
* **Route:** `src/app/(dashboard)/layout.tsx` (Applies to all protected `/dashboard/*` routes)
* **Layout & Visual Structure:**
  - Fixed 260px Left Sidebar + Topbar Header + Scrollable Main Content Area (`overflow-y-auto`).
  - Dark surface depth: Canvas `#070a11`, Sidebar `#090e1a`, Topbar `#090e1a/80` with backdrop blur.
* **Components to Build:**
  - `src/components/dashboard/Sidebar.tsx`:
    - Workspace Switcher dropdown (e.g. *"DLF Cybercity Workspace"*).
    - Navigation links with active indicator:
      - 📊 Overview (`/dashboard`)
      - 🤖 Voice Agents (`/dashboard/agents`)
      - 📢 Campaigns (`/dashboard/campaigns`)
      - 📞 Call Ledger (`/dashboard/calls`)
      - 🔌 Integrations (`/dashboard/integrations`)
      - 💳 Billing & Wallet (`/dashboard/billing`)
    - Bottom User Profile pill with Logout trigger.
  - `src/components/dashboard/Topbar.tsx`:
    - Global Search trigger (`Cmd + K`).
    - Quick Action Button: `+ New Call` or `+ New Campaign`.
    - Live Wallet Balance Pill: `💳 ₹489.20` (Click opens instant recharge modal).
    - Notification bell with unread badge.
* **Day 9 Acceptance Criteria:**
  - Smooth page transitions, collapse-to-icon sidebar on medium screens, active route highlighting.

---

### 📅 Day 10: SaaS Executive Overview Dashboard
* **Route:** `src/app/(dashboard)/page.tsx`
* **Layout & Visual Structure:**
  - Top: 4 KPI summary cards in a 4-column bento row.
  - Middle: 2-Column grid (Left: Call Volume 7-day bar chart; Right: Real-time Live Pacing dial).
  - Bottom: Recent Outbound Calls quick table with live status badges.
* **Components to Build:**
  - `src/components/dashboard/KpiCards.tsx`:
    1. **Total Calls Made:** `12,480` (+14% this week).
    2. **Total Talk Time:** `418 hrs 20 mins`.
    3. **Avg. Call Duration:** `1m 48s` (Optimal 60s pulse efficiency).
    4. **Active Wallet Balance:** `₹1,489.20` (~270 mins remaining).
  - `src/components/dashboard/VolumeChart.tsx`: Clean SVG/Recharts bar chart of hourly call volume.
  - `src/components/dashboard/RecentCallsTable.tsx`: Compact 5-row table with link to `/dashboard/calls`.
* **Backend API Integration:**
  - `GET /auth/me`: Loads user profile and current wallet balance.
  - `GET /calls?limit=5`: Fetches most recent calls.
* **4-State UI Specification:**
  - `Loading`: 4 skeleton cards + table skeleton shimmer.
  - `Empty`: Graphic showing *"No calls yet. Launch your first campaign or test an agent."* + CTA.
* **Day 10 Acceptance Criteria:**
  - Dashboard loads live metrics from backend APIs with zero console errors.

---

### 📅 Day 11: Voice Agent Studio - Agent List & Wizard Modal
* **Route:** `src/app/(dashboard)/agents/page.tsx`
* **Layout & Visual Structure:**
  - Header: Title *"Voice Agent Studio"*, search input, filter by language, and `+ Create New Agent` primary button.
  - Body: Responsive 3-column grid of Agent Bento Cards.
* **Components to Build:**
  - `src/components/agents/AgentCard.tsx`:
    - Avatar icon with voice engine badge (`Sarvam Bulbul` / `Deepgram`).
    - Agent Name (e.g. *"Pooja - Real Estate Qualifier"*).
    - Language tag: `Hindi (hi-IN)` / `Hinglish`.
    - Stats footer: Total Calls Handled (`1,240`), Avg Sentiment (`88% Positive`).
    - Action Menu: `Edit Prompt`, `Test Agent`, `Duplicate`, `Delete`.
  - `src/components/agents/CreateAgentModal.tsx`:
    - 2-Step modal: 1. Agent Name & Industry Template; 2. Voice Selection.
* **Backend API Integration:**
  - `GET /agents`: List of tenant's agents.
  - `POST /agents`: Creates new agent with `{ name, voice_id, system_prompt, language }`.
  - `DELETE /agents/{id}`: Deletes agent with confirmation dialog.
* **Day 11 Acceptance Criteria:**
  - Client can view all existing agents, delete an agent, or open the create wizard with TanStack Query cache invalidation.

---

### 📅 Day 12: Visual Prompt Editor & Indian Regional Voice Selector
* **Route:** `src/app/(dashboard)/agents/[id]/page.tsx`
* **Layout & Visual Structure:**
  - 2-Column studio view:
    - **Left Column (Configuration Tabs):** "Prompt & Persona", "Voice & Accent", "Tools", "Advanced".
    - **Right Column (Fixed Simulator):** In-browser live testing sandbox (Day 14).
* **Components to Build:**
  - `src/components/agents/PromptEditor.tsx`:
    - System prompt multi-line editor with variable syntax highlighting (`{{customer_name}}`, `{{property_name}}`).
    - Pre-built Industry Templates dropdown:
      - *Real Estate Lead Qualification*
      - *Loan Payment Reminder (BFSI)*
      - *Automotive Service Booking*
      - *E-Commerce Order Confirmation*
    - First Message / Opening Greeting textarea: *"Namaste {{name}} ji! Mai Pooja baat kar rahi hu DLF se..."*
  - `src/components/agents/VoiceSelector.tsx`:
    - Voice provider dropdown: `Sarvam AI` (Recommended for Indian regional) vs `Deepgram`.
    - Accent selector cards with instantaneous audio preview button.
    - Speech speed slider (`0.8x` to `1.2x`).
* **Backend API Integration:**
  - `GET /agents/{id}`: Loads agent details.
  - `PATCH /agents/{id}`: Auto-saves or manual save button with toast confirmation.
* **Day 12 Acceptance Criteria:**
  - Editing prompt and voice settings updates database via PATCH and retains state on page refresh.

---

### 📅 Day 13: In-Call Mid-Speech Automation Tools Toggles
* **Route:** `src/app/(dashboard)/agents/[id]/page.tsx` (Tools Tab)
* **Layout & Visual Structure:**
  - Card-based tool configuration list with toggle switches and expandable parameter drawers.
* **Components to Build:**
  - `src/components/agents/InCallTools.tsx`: Master tool toggle container.
  - `src/components/agents/WhatsAppToolConfig.tsx`:
    - Toggle: *"Send In-Call WhatsApp Brochure & Location"*.
    - Inputs: PDF Brochure URL, WhatsApp Template Name, Trigger phrase hint (*"when customer asks for floor plan"*).
  - `src/components/agents/CalendarToolConfig.tsx`:
    - Toggle: *"Book Site Visit / Calendar Appointment"*.
    - Inputs: Google Calendar / Calendly webhook URL, available time slots.
  - `src/components/agents/TelephonyTuning.tsx`:
    - Latency optimization toggles (End-of-speech silence detection: `350ms`).
    - Barge-in sensitivity slider (Low, Normal, High).
* **Backend API Integration:**
  - Synchronized with `tools` array in backend `AgentUpdate` schema.
* **Day 13 Acceptance Criteria:**
  - Enabling WhatsApp tool enables function calling definitions in the agent's LLM system instructions.

---

### 📅 Day 14: In-Browser Live Agent Sandbox Simulator
* **Route:** `src/app/(dashboard)/agents/[id]/page.tsx` (Right Simulator Panel)
* **Layout & Visual Structure:**
  - Emulated smartphone / voice console container on the right side of the screen.
  - Top status bar: `Agent: Pooja (Active)`, `Audio Engine: Ready`.
  - Center: Audio waveform visualizer and Big "Start Voice Test" button.
  - Bottom: Live scrolling conversation transcript bubbles (Agent vs Tester).
* **Components to Build:**
  - `src/components/agents/LiveTestPanel.tsx`: Simulator master component.
  - `src/components/agents/SimulatorWaveform.tsx`: Real-time mic audio visualizer.
  - `src/components/agents/SimulatorTranscript.tsx`: Chat transcript with timestamps and latency tags (`Latency: 440ms`).
* **Features:**
  - Uses browser mic to test newly configured system prompt and tools without placing an actual telecom call.
  - Displays detected function calls in real time: `[Tool Executed: send_whatsapp_brochure]`.
* **Day 14 Acceptance Criteria:**
  - Developer/Client can adjust prompt on the left, click "Start Test" on the right, and instantly verify agent behavior.

---

## 🟢 WEEK 3: Bulk Campaign Engine & Post-Call Audio Intelligence Ledger (Days 15–21)

### 🎯 Week 3 Objective:
Build high-throughput outbound campaign management (CSV lead ingestion, TRAI 10 AM–7 PM compliance checks, DND scrubbing, pacing dispatch) and the forensic call intelligence ledger with scrubbable audio waveforms and AI sentiment extraction.

---

### 📅 Day 15: Outbound Campaign Manager & Stepper Wizard
* **Route:** `src/app/(dashboard)/campaigns/page.tsx`
* **Layout & Visual Structure:**
  - Header: Title *"Outbound Campaigns"*, Active Campaigns Counter, `+ Launch New Campaign` primary button.
  - Body: Grid of Campaign Bento Cards with live status badges (`Draft`, `Running`, `Paused`, `Completed`).
* **Components to Build:**
  - `src/components/campaigns/CampaignCard.tsx`:
    - Campaign title, Assigned Agent name, Date created.
    - Progress Bar: `Leads Called: 1,420 / 3,000 (47%)`.
    - Live Telemetry: `Connected: 68%`, `DND Blocked: 240`.
    - Action buttons: `Resume / Pause`, `View Analytics`, `Export Leads`.
  - `src/components/campaigns/NewCampaignModal.tsx`:
    - Step 1: Campaign Name & Description.
    - Step 2: Select Voice Agent.
    - Step 3: Concurrency & Daily Limits (e.g., 10 parallel lines).
* **Backend API Integration:**
  - `GET /campaigns`: List of campaigns.
  - `POST /campaigns`: Creates new campaign record.
* **Day 15 Acceptance Criteria:**
  - Campaign creation updates list and routes to CSV Upload view (`/dashboard/campaigns/[id]/upload`).

---

### 📅 Day 16: Drag-and-Drop CSV Ingestion & Dynamic Field Mapper
* **Route:** `src/app/(dashboard)/campaigns/[id]/upload/page.tsx`
* **Layout & Visual Structure:**
  - Step-based upload view:
    - **Step 1:** Drag-and-drop file upload zone.
    - **Step 2:** Column mapping interface with sample data preview.
* **Components to Build:**
  - `src/components/campaigns/CsvUploader.tsx`: Drag-and-drop box supporting `.csv` files up to 50,000 rows.
  - `src/components/campaigns/ColumnMapper.tsx`:
    - Auto-detects headers: `Name`, `Phone`, `Email`, `City`, `Budget`.
    - Dropdowns to map CSV columns to NexoAgent variables (`{{name}}`, `{{phone}}`, `{{custom_1}}`).
    - Phone number preview showing E.164 sanitization (e.g. `9876543210` -> `+919876543210`).
* **Backend API Integration:**
  - `POST /campaigns/{id}/upload-csv`: Multipart form data upload.
* **4-State UI Specification:**
  - `Loading`: Progress percentage bar (`Uploading 4,200 leads... 78%`).
  - `Error`: Shows invalid rows callout: *"Row 42 has invalid phone number: 'ABC1234'"*.
* **Day 16 Acceptance Criteria:**
  - CSV parses successfully, validates headers, and transmits to FastAPI backend with preview confirmation.

---

### 📅 Day 17: Pre-Dial TRAI/DND Scrubbing Dashboard & Live Pacing Dispatcher
* **Route:** `src/app/(dashboard)/campaigns/[id]/page.tsx`
* **Layout & Visual Structure:**
  - Top: 4 Pre-Dial Scrubbing Metric Cards.
  - Center: Compliance & Calling Hours Banner (TRAI 10 AM – 7 PM IST enforcer).
  - Bottom: Dispatch Controls (Parallel Channels slider, Start/Pause buttons, Real-time logs terminal).
* **Components to Build:**
  - `src/components/campaigns/ScrubbingStats.tsx`:
    - **Total Ingested Leads:** `5,000`
    - **Clean Callable Leads:** `4,180` (✅ Ready)
    - **DND Blocked (TRAI NDNC):** `640` (🚫 Scrubbed)
    - **Duplicates Skipped:** `180` (⚠️ Removed)
  - `src/components/campaigns/PacingDispatcher.tsx`:
    - Parallel Channels Slider: 1 to 50 concurrent calls.
    - Status Indicator: `● Pacing Active: 15 calls/min`.
    - Action Controls: `Start Campaign`, `Emergency Pause`, `Stop & Archive`.
* **Backend API Integration:**
  - `GET /campaigns/{id}`: Detailed campaign telemetry.
  - `POST /campaigns/{id}/start`: Initiates background outbound dispatch worker.
* **Day 17 Acceptance Criteria:**
  - Client can review scrubbed DND stats and hit "Start Campaign" to begin automated dialing.

---

### 📅 Day 18: Enterprise Call Intelligence Ledger Table
* **Route:** `src/app/(dashboard)/calls/page.tsx`
* **Layout & Visual Structure:**
  - Header: Title *"Call Intelligence Ledger"*, Quick Filters (Status, Agent, Sentiment, Date Range), Search Input (by phone number), and Export CSV button.
  - Body: High-density tabular data table with sticky header and pagination controls.
* **Components to Build:**
  - `src/components/calls/CallsTable.tsx`: Tabular ledger with columns:
    1. **Customer Phone:** Monospace formatted (`+91 98765 43210`).
    2. **Agent:** Avatar + Agent name.
    3. **Status:** Badges (`Completed`, `Busy`, `No-Answer`, `Failed`).
    4. **Duration:** Monospace (`02:45`).
    5. **Cost Billed:** Monospace (`₹1.70` - 60s pulse).
    6. **Sentiment:** Pill (`Positive` emerald, `Neutral` cyan, `Negative` rose).
    7. **WhatsApp Status:** Delivered tick (`✓✓ Sent`).
    8. **Actions:** `Play Audio` button, `View Details` chevron.
  - `src/components/calls/CallsFilterBar.tsx`: Status dropdown, date picker, search bar.
* **Backend API Integration:**
  - `GET /calls?status={status}&agent_id={id}&limit=20&offset=0`.
* **4-State UI Specification:**
  - `Loading`: 10-row skeleton shimmer with hairline borders.
  - `Empty`: *"No calls match your filters. Try clearing search parameters."*
* **Day 18 Acceptance Criteria:**
  - Instant filtering by status and phone search with debounce (300ms) and pagination.

---

### 📅 Day 19: Slide-Over Call Metadata Drawer & Telephony Breakdown
* **Route:** Click any row in `/dashboard/calls`
* **Layout & Visual Structure:**
  - Right slide-over drawer (width: 580px on desktop) with backdrop overlay (`#070a11/70`).
  - Smooth spring animation entry (`x: "100%"` -> `x: 0`).
* **Components to Build:**
  - `src/components/calls/CallDetailDrawer.tsx`: Master drawer container with close button and Esc hotkey.
  - `src/components/calls/TelecomTelemetryCard.tsx`:
    - Call SID: Monospace copyable (`call_live_9f8a...`).
    - Telephony Provider: `Tata SIP / Plivo`.
    - SIP Hangup Cause: `NORMAL_CLEARING (200 OK)`.
    - Pulse Calculation Breakdown:
      - Raw Talk Time: `142 seconds`.
      - Billed Pulses: `3 pulses (180s)`.
      - Rate: `₹0.85 / 60s`.
      - **Total Billed:** `₹2.55`.
* **Backend API Integration:**
  - `GET /calls/{id}`: Detailed call record.
* **Day 19 Acceptance Criteria:**
  - Drawer opens smoothly on row click, displays exact mathematical pulse breakdown matching backend records.

---

### 📅 Day 20: Scrubbable Audio Waveform Visualizer & Synchronized Transcript
* **Route:** Inside Call Detail Drawer (`CallDetailDrawer.tsx`)
* **Layout & Visual Structure:**
  - Top: High-fidelity audio player with interactive waveform canvas.
  - Bottom: Scrollable WhatsApp-style chat dialogue between Agent and Customer.
* **Components to Build:**
  - `src/components/calls/WaveformPlayer.tsx`:
    - Powered by `wavesurfer.js` or HTML5 Audio Canvas.
    - Play/Pause toggle, speed controller (`1x`, `1.25x`, `1.5x`), current time vs total time.
    - Scrubbable progress bar with hover timestamp tooltip.
    - Download MP3 recording button.
  - `src/components/calls/TranscriptChat.tsx`:
    - Left-aligned bubbles: Customer speech (Gray card).
    - Right-aligned bubbles: AI Agent speech (Electric indigo card).
    - Timestamps on each bubble (e.g. `[00:14]`). Clicking any bubble scrubs the audio player to that exact second!
* **Backend API Integration:**
  - `GET /calls/{id}/recording`: Fetches 15-minute AWS S3 / Cloudflare R2 pre-signed streaming URL.
* **Day 20 Acceptance Criteria:**
  - Audio plays seamlessly, waveform animates accurately, clicking a transcript line jumps audio playback to that timestamp.

---

### 📅 Day 21: Post-Call AI Intelligence & Extracted Variables Card
* **Route:** Inside Call Detail Drawer (Tabs: "Intelligence & CRM")
* **Layout & Visual Structure:**
  - Bento card layout summarizing Groq LLM post-call JSON extraction.
* **Components to Build:**
  - `src/components/calls/AiIntelligenceCard.tsx`:
    1. **Executive 2-Line Summary:** *"Customer interested in 3 BHK in Sector 62. Scheduled site visit for Saturday at 11:00 AM."*
    2. **Lead Qualification Score:** Badges for `🔥 Hot Lead`, `⚡ Warm Lead`, or `❄️ Cold / Not Interested`.
    3. **Extracted CRM Entity Grid:**
       - *Customer Name:* `Rohit Sharma`
       - *Budget:* `₹2.40 Cr`
       - *Requirement:* `3 BHK High Rise`
       - *Visit Date:* `24-Nov-2026, 11:00 AM`
       - *WhatsApp Brochure:* `Sent & Confirmed ✓✓`
    4. **Customer Objections Detected:** *"Concerned about possession date and maintenance charges."*
* **Day 21 Acceptance Criteria:**
  - All AI intelligence fields render gracefully with copy-to-clipboard buttons and clean formatting.

---

## 🟢 WEEK 4: Integrations Hub, Razorpay Wallet Billing & Final Polish (Days 22–28)

### 🎯 Week 4 Objective:
Complete the ecosystem with real-world integrations (Speed-to-Lead Meta Ads webhooks, CRM connections, API keys), automated prepaid wallet top-up via Razorpay (UPI/Cards), itemized GST invoices, and full-system production hardening.

---

### 📅 Day 22: Speed-to-Lead Meta Ads Webhook Hub
* **Route:** `src/app/(dashboard)/integrations/page.tsx`
* **Layout & Visual Structure:**
  - Integration cards grid with featured top banner for *"Sub-30s Speed-to-Lead Meta Ads Dialout"*.
* **Components to Build:**
  - `src/components/integrations/MetaAdsWebhookCard.tsx`:
    - Workspace Unique Webhook URL box with 1-click copy button (`https://api.nexoagent.com/v1/webhooks/meta-leads?tenant_id=...`).
    - Verify Token display for Facebook Developer App.
    - Toggle: *"Auto-Dial Lead within 30 seconds of form submission"*.
    - Assigned Agent selector dropdown (which agent calls new Facebook leads).
    - Step-by-step accordion guide with screenshots on connecting Facebook Lead Ads.
* **Day 22 Acceptance Criteria:**
  - User can copy webhook URL, select assigned agent, and toggle auto-dialing.

---

### 📅 Day 23: One-Click CRM Sync Cards (HubSpot, Zoho & Google Sheets)
* **Route:** `src/app/(dashboard)/integrations/page.tsx` (CRM Section)
* **Layout & Visual Structure:**
  - 3 Bento cards for enterprise CRMs with connection status pills (`Connected` / `Disconnected`).
* **Components to Build:**
  - `src/components/integrations/CrmCard.tsx`: Reusable integration card.
  - **HubSpot Card:** Syncs qualified leads directly to HubSpot Deals pipeline.
  - **Zoho CRM Card:** Auto-creates contacts and logs call recording URL in Zoho.
  - **Google Sheets Live Sync:** Webhook URL that appends every call result as a new row in a client's Google Sheet in real time.
* **Interactive Features:**
  - "Test Ping" button sending a mock lead to verify webhook connection.
  - Field mapping modal (maps NexoAgent `lead_score` to CRM `lead_status`).
* **Day 23 Acceptance Criteria:**
  - Client can enter webhook endpoint, hit "Test Ping", and receive success toast confirmation.

---

### 📅 Day 24: Tenant API Key Manager & Interactive Developer Docs
* **Route:** `src/app/(dashboard)/integrations/api-keys/page.tsx`
* **Layout & Visual Structure:**
  - 2-Section layout: Top = Active API Keys Table; Bottom = Code Snippet Sandbox (cURL, Python, Node.js).
* **Components to Build:**
  - `src/components/integrations/ApiKeyManager.tsx`:
    - Table of active keys: Key Name, Prefix (`nexo_live_9f8...`), Date Created, Last Used.
    - `+ Generate New Secret Key` button with reveal-once security modal.
    - Revoke key confirmation dialog.
  - `src/components/integrations/CodeSnippetBox.tsx`:
    - Tabbed code viewer (Python, cURL, Node.js) with syntax highlighting and 1-click copy.
    - Shows how to programmatically trigger an outbound AI call via `POST /api/v1/calls/dispatch`.
* **Day 24 Acceptance Criteria:**
  - Generating key displays full secret token once, adds prefix to table, and updates code snippets with tenant credentials.

---

### 📅 Day 25: Prepaid Telecom Calling Wallet Card & Recharge Packs
* **Route:** `src/app/(dashboard)/billing/page.tsx`
* **Layout & Visual Structure:**
  - Top: Big glowing balance card showing current prepaid credits.
  - Middle: 4 Quick-Recharge pack cards with rupee values and bonus credit badges.
  - Bottom: Low balance alert threshold configuration.
* **Components to Build:**
  - `src/components/billing/WalletBalanceCard.tsx`:
    - Large typography: `₹1,489.20`.
    - Estimated calling minutes remaining pill (`~ 270 Minutes`).
    - Low balance warning indicator if balance drops below ₹200.
  - `src/components/billing/RechargePacks.tsx`:
    - **Starter Pack:** `₹1,000` (Standard rate ₹5.50/min).
    - **Growth Pack:** `₹5,000` (+ ₹250 Free Bonus Credits) - *Most Popular*.
    - **Scale Pack:** `₹20,000` (+ ₹2,000 Free Bonus Credits).
    - **Custom Amount Input:** Numeric input for enterprise recharges.
* **Day 25 Acceptance Criteria:**
  - Selecting any pack highlights card and opens Razorpay checkout trigger button.

---

### 📅 Day 26: Razorpay Payment Gateway Integration & Instant Balance Credit
* **Route:** `src/app/(dashboard)/billing/page.tsx` (Checkout Modal)
* **Layout & Visual Structure:**
  - Modal overlay embedding Razorpay Standard Checkout SDK.
* **Components to Build:**
  - `src/components/billing/RazorpayModal.tsx`:
    - Loads Razorpay Checkout script dynamically (`https://checkout.razorpay.com/v1/checkout.js`).
    - Handles payment options: UPI (Google Pay, PhonePe, Paytm, QR code), Debit/Credit Cards, NetBanking.
    - On Payment Success handler: Sends `{ razorpay_payment_id, razorpay_order_id, razorpay_signature }` to backend.
    - Success screen with green checkmark animation and updated wallet balance.
* **Backend API Integration:**
  - `POST /billing/create-order`: Generates Razorpay Order ID.
  - `POST /billing/verify-payment`: Validates HMAC signature and credits user's database wallet.
* **Day 26 Acceptance Criteria:**
  - End-to-end payment simulation triggers wallet increment in real time without page reload.

---

### 📅 Day 27: Itemized Billing Ledger & GST Tax Invoices
* **Route:** `src/app/(dashboard)/billing/page.tsx` (Ledger Tab)
* **Layout & Visual Structure:**
  - Tabbed sub-view: "Recharge History" & "Usage Deductions Ledger".
* **Components to Build:**
  - `src/components/billing/BillingLedgerTable.tsx`:
    - Columns: Transaction ID, Timestamp, Call SID / Recharge, Type (Credit/Debit), Duration, Amount, Closing Balance.
    - Color coding: Credits in Emerald (`+ ₹5,000.00`), Debits in White/Muted (`- ₹2.55`).
  - `src/components/billing/InvoiceDownloadButton.tsx`:
    - Generates or downloads official GST tax invoice PDF with 18% GST breakdown (CGST 9% + SGST 9%) and company tax info.
* **Day 27 Acceptance Criteria:**
  - Ledger accurately reflects all call deductions from Week 3 and recharge transactions with PDF download support.

---

### 📅 Day 28: End-to-End System Audit, Performance Polish & Production Build
* **Route:** Entire Application
* **Tasks & Audits:**
  1. **Strict TypeScript & Build Verification:** Run `npm run build` and ensure zero type errors or lint warnings.
  2. **Responsive Matrix Testing:** Audit on 375px (Mobile), 768px (Tablet), 1440px (Laptop), and 1920px (Desktop).
  3. **Performance Optimization:** Verify bundle sizes, code splitting for heavy libraries (`wavesurfer.js`, `recharts`).
  4. **Error Boundary Screens:** Create custom Obsidian error screens:
     - `src/app/not-found.tsx` (404 Page)
     - `src/app/error.tsx` (500 Error boundary with retry button)
  5. **Security Audit:** Verify protected route middleware (`middleware.ts`) redirects unauthenticated users to `/login`.
* **Day 28 Acceptance Criteria:**
  - Production build succeeds cleanly. All 28 days of features function seamlessly as a cohesive, world-class enterprise SaaS application!

---

*(Har feature complete hone par developer is file me checkbox check karta rahega).*
