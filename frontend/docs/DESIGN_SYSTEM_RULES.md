# 🎨 NexoAgent - Frontend Design System, UI/UX Guidelines & Component Rules
> **Single Source of Truth for Visual Design, Layout Consistency & Component Standards**  
> *Target Aesthetic: Linear + Vapi.ai + Supabase Dark Enterprise Clean*  
> *Stack: Next.js 15, Tailwind CSS, Shadcn UI, Lucide React, Framer Motion*

---

## 📌 1. Design Philosophy & Core Principles

NexoAgent ek high-ticket B2B Enterprise Voice AI platform hai. Iska design **chalta-phirta casual nahi lagna chahiye**, balki **Linear, Vapi, aur Stripe** jaisa polished, dark-mode first, ultra-fast aur confident lagna chahiye.

### 3 Golden Rules:
1. **Never Cluttered, Always Breathable:** 8px grid system follow hoga. Content ke beech proper breathing room (`gap-4`, `gap-6`, `p-6`) hona zaroori hai.
2. **Semantic Visual Hierarchy:** Important cheezein (Active Call Green, AI Hot Lead Flame, Critical Balance) foran aankho ko attract karein. Baki UI subtle slate/zinc me rahe.
3. **Zero Dead Ends (Every State Accounted For):** Har table, drawer aur page ke **4 states** strictly handle honge:
   - `Loading` (Skeleton Loaders, never blank white screen).
   - `Empty` (Helpful illustration + 1-Click CTA button).
   - `Error` (Clean red toast with Retry button).
   - `Success` (Smooth Sonner toast).

---

## 🎨 2. Master Color System (Tailwind Tokens)

### 2.1 Background & Surface Hierarchy (Dark Mode First)
UI me depth lane ke liye 3 distinct surface layers use karni hain:

```text
Layer 0 (App Canvas):        #020617 (slate-950) -> Pura background
Layer 1 (Card / Container):  #0f172a (slate-900) -> Border: 1px solid #1e293b (slate-800)
Layer 2 (Elevated / Hover):  #1e293b (slate-800) -> Modals, Dropdowns, Hovered rows
Layer 3 (Glassmorphic Top):  rgba(15, 23, 42, 0.75) + backdrop-blur-md -> Sticky Navbar/Topbar
```

### 2.2 Semantic Accent & Status Palette

| Role | Color Name | Hex Code | Tailwind Class | Where to Use |
| :--- | :--- | :--- | :--- | :--- |
| **Brand Primary** | Electric Indigo | `#6366f1` | `bg-indigo-500` / `text-indigo-400` | Primary CTA buttons, Active tabs, Brand logo |
| **Brand Glow** | Violet Accent | `#8b5cf6` | `bg-violet-500` / `from-indigo-500 to-violet-500` | Hero gradient text, Feature glowing borders |
| **Connected / Live** | Emerald Green | `#10b981` | `bg-emerald-500` / `text-emerald-400` | Live active calls, Positive sentiment, Wallet balance |
| **Warning / Busy** | Amber Yellow | `#f59e0b` | `bg-amber-500` / `text-amber-400` | Busy calls, Low wallet balance warning, Neutral leads |
| **Danger / Failed** | Rose Red | `#f43f5e` | `bg-rose-500` / `text-rose-400` | Failed calls, DND blocked numbers, Delete buttons |
| **AI Intelligence** | Sky / Cyan | `#0284c7` | `bg-sky-500` / `text-sky-400` | Groq AI summaries, Extracted variables, WhatsApp tags |

---

## ✍️ 3. Typography & Text Standards

* **Heading Font:** `Plus Jakarta Sans` ya `Inter` (Weights: `font-semibold` / `font-bold`).
* **Body Font:** `Inter` (Weights: `font-normal` / `font-medium`).
* **Telephony & Monospace Font:** `JetBrains Mono` ya `Geist Mono` (Call SIDs, Phone numbers, Durations, Billed amounts).

### Sizing Scale & Usage Rules:
* `text-3xl` / `text-4xl` (`font-bold`, `tracking-tight`): Hero headline, big KPI numbers (`₹489.00`).
* `text-xl` / `text-2xl` (`font-semibold`): Section titles, modal headers.
* `text-base` (`font-medium`, `text-slate-200`): Primary body text, card titles.
* `text-sm` (`font-normal`, `text-slate-400`): Secondary descriptions, table body, input labels.
* `text-xs font-mono` (`text-slate-500`): Timestamps (`12:30 PM`), Call SIDs (`CA-DLF-001`), Phone numbers (`+91 98765 43210`).

---

## 📐 4. Layout & Grid Rules

### 4.1 Padding & Spacing Standard
* Page Padding: `px-6 py-8` (Desktop) / `px-4 py-6` (Mobile).
* Card Internal Padding: `p-6` (Standard) / `p-4` (Dense widgets).
* Grid Gaps: `gap-6` between major cards, `gap-4` between form inputs.

### 4.2 Rounded Corners (Border Radius)
* Cards & Containers: `rounded-xl` (`12px` / `0.75rem`) — Never sharp boxy corners.
* Buttons & Inputs: `rounded-lg` (`8px` / `0.5rem`).
* Status Pills & Badges: `rounded-full` (Capsule shape).

### 4.3 Borders & Elevation
* Sabhi cards par border hoga: `border border-slate-800` (Light dark contrast).
* Hover State: `hover:border-slate-700 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-200`.

---

## 🧩 5. UI Component Rules & Standards

### 5.1 Buttons (`Button`)
* **Primary Button:** `bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-sm shadow-indigo-600/30`.
* **Secondary Button:** `bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700`.
* **Destructive Button:** `bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20`.
* **Loading State:** Jab button submit kare, text replace hoke spinner + *"Saving..."* dikhana zaroori hai (`disabled={isLoading}`).

### 5.2 Status Pills & Badges (`Badge`)
Har call aur lead ka status pill dot indicator ke sath aayega:
* **Completed / Connected:**  
  `<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">`  
  `<span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Completed</span>`
* **Busy / In-Progress:**  
  `<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">`  
  `<span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Busy</span>`
* **Hot Lead:**  
  `<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">🔥 Hot Lead</span>`

### 5.3 Data Tables (`Table`)
* **Header:** `bg-slate-900/50 text-slate-400 text-xs font-medium uppercase tracking-wider border-b border-slate-800`.
* **Row Hover:** `hover:bg-slate-850/50 transition-colors cursor-pointer`.
* **Empty State:** Jab data na ho, table blank nahi rahegi. Beech me icon + *"No calls found for this filter"* + *"Clear Filters"* button aayega.

### 5.4 Slide-Over Drawers (Call Details & Transcripts)
* Modal popup ke bajaye right side se **Slide-over Drawer (`w-[520px] max-w-full bg-slate-900 border-l border-slate-800`)** open hoga.
* Drawer me:
  - Header with Customer Number + Status Pill.
  - Audio Player with scrubbable waveform.
  - Groq AI Summary box with Cyan left accent bar (`border-l-4 border-sky-500 bg-sky-950/20 p-4 rounded-r-lg`).
  - WhatsApp chat bubbles for dialogue turns.

### 5.5 Audio Waveform Player (`Wavesurfer.js`)
* Waveform Colors:
  - Wave Color (Unplayed): `#334155` (slate-700)
  - Progress Color (Played): `#6366f1` (electric indigo)
  - Cursor Color: `#f1f5f9` (white)
  - Bar Width: `3px`, Bar Gap: `2px`, Bar Radius: `2px`.

---

## 🛡️ 6. Error Handling & UX Safety Rules

1. **No Silent Failures:** Agar backend API fail ho (e.g. 401 unauthorized, 404 not found, 500 server error), to screen crash nahi hogi — `sonner` toast notification se user ko readable message milega:  
   `toast.error("Could not load calls: Session expired. Please login again.")`
2. **Double-Click Protection:** Form submit button click hote hi `disabled` ho jayega taaki duplicate calls ya double payment triggers na hon.
3. **Phone Masking Option:** Privacy ke liye customer phone numbers by default partially masked dikh sakte hain (`+91 98765 *****`) with an eye icon to unmask.

---

## 📁 7. File Organization Checklist for Developers

```text
frontend/src/
├── app/                        # Next.js Pages
├── components/
│   ├── ui/                     # Shadcn Primitives (Button, Table, Dialog)
│   ├── shared/                 # Navbar, Sidebar, Topbar, WaveformPlayer
│   └── modules/                # Feature modules:
│       ├── agents/             # PromptEditor, VoiceSelector, AgentCard
│       ├── campaigns/          # CsvUploader, PacingMonitor, ScrubbingBadge
│       ├── calls/              # CallsTable, CallDetailDrawer, ChatTranscript
│       └── billing/            # WalletCard, RazorpayCheckoutModal
├── hooks/
│   ├── useAuth.ts              # Login state & JWT decode
│   ├── useAudioPlayer.ts       # Audio stream controls
│   └── useCampaignMonitor.ts   # Paced calling live progress polling
├── lib/
│   ├── axios.ts                # API client with auto Bearer token header
│   └── utils.ts                # cn() class merger
└── types/
    └── api.ts                  # Pure TypeScript interfaces
```

---

Yeh rulebook frontend developer ko ensure karegi ki website ka **ek-ek pixel consistent, enterprise-grade aur visually cohesive** bane!
