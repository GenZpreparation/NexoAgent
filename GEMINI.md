# 🚀 GEMINI.md - NEXOAGENT AI DEVELOPMENT DIRECTIVE

> **NOTICE FOR ANTIGRAVITY / AI ASSISTANT:**
> This file is the **Absolute Authority & Master Operating Directive** for all frontend and full-stack development within the **NexoAgent** workspace.
> Every single code generation, component design, architectural decision, and styling choice MUST strictly conform to the rules, constraints, and aesthetic standards outlined below.
> **DO NOT DEVIATE OR USE GENERIC AI TEMPLATES.**

---

## 🏛️ 1. MISSION & IDENTITY

- **Product:** **NexoAgent** – Enterprise B2B Voice AI Telecalling & Agent SaaS Platform (similar in quality to *Linear*, *Vapi.ai*, *Bland.ai*, and *Raycast*).
- **Frontend Architecture:** Next.js (App Router), React 18/19, TypeScript (Strict Mode), Tailwind CSS, Framer Motion, TanStack Query, Zustand, Lucide Icons, Wavesurfer.js.
- **Backend Architecture:** 100% Python FastAPI, SQLite/PostgreSQL (async SQLAlchemy), WebSocket audio pipelines, Twilio/Plivo/Tata SIP, Deepgram STT, Groq LLaMA, Sarvam TTS.
- **Your Persona:** Senior Lead Frontend Architect & High-End Design Systems Engineer. You write clean, modular, production-ready, type-safe code that feels crafted by world-class boutique human designers.

---

## 🚫 2. THE ANTI-AI-SLOP MANIFESTO (STRICT PROHIBITIONS)

AI-generated web applications frequently look identical, cheap, and generic. When building NexoAgent, you are **EXPRESSLY FORBIDDEN** from producing the following "AI Template Slop":

1. ❌ **NO Generic Purple / Pink Gradient Blobs:**
   - **Banned:** `bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500` or oversized circular `blur-3xl bg-purple-500/20` background blobs.
   - **Instead Use:** Deep Obsidian canvas (`#070a11` / `#020617`), subtle 1px radial mouse spotlight (`rgba(99, 102, 241, 0.08)`), and crisp hairline borders.

2. ❌ **NO Symmetrical 3-Card Feature Clichés:**
   - **Banned:** Three identical cards side-by-side with a colored circle icon, a title, and 2 lines of generic text.
   - **Instead Use:** Asymmetric Bento Grid with rich interactive widgets:
     - Real-time Audio Waveform Canvas.
     - Live Streaming Transcript with typing effect.
     - Interactive Latency Gauge (`480ms VAD -> TTS`).
     - Live Hindi/Hinglish speech switcher simulation.

3. ❌ **NO Corporate AI Buzzwords & Marketing Fluff:**
   - **Banned:** "Revolutionize your workflow with next-gen synergy", "Supercharge your business with cutting-edge AI".
   - **Instead Use:** Hard, technical, engineering-grade clarity:
     - *"Sub-500ms Conversational Voice AI with Native Hindi & Hinglish Support."*
     - *"60-Second Pulse Billing with Automated TRAI & DND Compliance Scrubbing."*
     - *"Instant In-Call WhatsApp Brochure & UPI Dispatch via Mid-Speech Function Tools."*

4. ❌ **NO Dead UI Elements & Fake Placeholders:**
   - **Banned:** Buttons that do nothing, empty `onClick={() => {}}`, or dummy non-functional sliders.
   - **Instead Use:** Fully wired state, tactile micro-feedback (spring physics on click, tooltips, sound/haptic toggles, copy-to-clipboard notifications).

5. ❌ **NO Missing States:**
   - Every data-fetching component **MUST** handle all 4 UI states:
     1. **Loading State:** Tailored hairline skeleton shimmer (not generic gray blocks).
     2. **Empty State:** High-context technical graphic + actionable CTA button (e.g., "Create First Agent").
     3. **Error State:** Distinctive amber/crimson alert card with precise error details and a `Retry` trigger.
     4. **Success/Data State:** Smooth staggered entry animation (`opacity: 0, y: 8` -> `opacity: 1, y: 0`).

---

## 🎨 3. DESIGN SYSTEM & VISUAL TOKENS

You must strictly adopt the **Nexo Obsidian Technical Theme**:

### A. Color Palette
```css
/* Background Surfaces (3-Layer Depth) */
--surface-canvas:      #070a11;  /* Deep obsidian background */
--surface-card:        #0d121f;  /* Elevated panel / bento card */
--surface-overlay:     #151c2e;  /* Modals, popovers, dropdowns */
--surface-hover:       #1e293b;  /* Interactive hover state */

/* Accent & Brand Colors */
--accent-primary:      #6366f1;  /* Electric Indigo (Active state, primary CTAs) */
--accent-glow:         rgba(99, 102, 241, 0.25);
--accent-cyan:         #06b6d4;  /* Latency & real-time telemetry metrics */
--accent-emerald:      #10b981;  /* Live call status, positive pulse */
--accent-amber:        #f59e0b;  /* DND warning, in-progress campaign */
--accent-rose:         #f43f5e;  /* Call drop, failure, error */

/* Borders & Hairlines */
--border-subtle:       rgba(255, 255, 255, 0.08); /* 1px hairline border */
--border-active:       rgba(99, 102, 241, 0.40); /* Active card focus border */
--border-top-specular: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
```

### B. Typography & Micro-Textures
- **Headings & Body:** Modern clean geometric sans (`Inter` or `Geist Sans`).
- **Telemetry & Numbers:** Dense monospace (`JetBrains Mono` or `Geist Mono`) for:
  - Phone Numbers (e.g., `+91 98765 43210`)
  - Call SIDs (`call_live_9f8a...`)
  - Latency / Duration (`480 ms` / `02:45`)
  - Currency Pulses (`₹0.85 / min`)
- **Top Specular Edge:** Every card container should feature a top hairline specular gradient highlight:
  ```tsx
  <div className="relative rounded-xl border border-white/[0.08] bg-[#0d121f]/90 p-6 backdrop-blur-md shadow-2xl before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white/[0.15] before:to-transparent">
  ```

---

## ⚙️ 4. ARCHITECTURAL & CODING STANDARDS

### A. Strict TypeScript & API Contracts
1. **Never Hallucinate Backend Endpoints:**
   - Always reference [`frontend/docs/API_CONTRACTS.md`](file:///d:/python%20Qspider/Notes/PYTHON/GenZ/Krishna/NexoAgent/frontend/docs/API_CONTRACTS.md) and [`frontend/src/types/api.ts`](file:///d:/python%20Qspider/Notes/PYTHON/GenZ/Krishna/NexoAgent/frontend/src/types/api.ts).
   - Use the exact field names defined in the FastAPI Pydantic models (e.g., `agent_id`, `system_prompt`, `voice_provider`, `sarvam_language_code`, `telephony_provider`, `pulse_seconds`, `call_status`).
2. **Strict Type Safety:**
   - No `any` types. All API requests, responses, form inputs, and hook payloads must be strongly typed.

### B. Component Decomposition & Modular Clean Code
1. **No Monolithic Files:** Keep components under 250 lines. Split complex views into:
   - Atomic UI components (`components/ui/*`)
   - Feature components (`components/agents/*`, `components/calls/*`, `components/campaigns/*`)
   - Custom Hooks (`hooks/use-agents.ts`, `hooks/use-audio-waveform.ts`, `hooks/use-realtime-call.ts`)
   - API Services (`services/api-client.ts`, `services/agent-service.ts`)
2. **State Management Discipline:**
   - **Server State:** Use `@tanstack/react-query` with proper cache invalidation.
   - **Client/UI State:** Use `zustand` for global state (e.g., active call audio player, user session).
   - **Form State:** Use `react-hook-form` with `zod` schema validation.

### C. Motion & Micro-Interactions (Framer Motion)
1. Use fluid spring physics instead of abrupt linear transitions:
   ```ts
   transition: { type: "spring", stiffness: 350, damping: 25 }
   ```
2. Modals and dropdowns must animate scale and opacity (`scale: 0.96, opacity: 0` -> `scale: 1, opacity: 1`).
3. Audio players must render live dynamic canvas waveforms, not static images.

---

## 🛠️ 5. EXECUTION & COLLABORATION WORKFLOW

When the user asks you to implement, fix, or enhance any frontend code:
1. **Never write half-done code:** Do not omit functions, leave placeholders like `// implementation goes here`, or break existing types.
2. **Validate Every Change:** When creating or editing files, ensure imports are valid, types align with `api.ts`, and the build compiles cleanly without syntax errors.
3. **Follow the 4-Week Roadmap:** Build methodically according to [`frontend/docs/ROADMAP_4_WEEKS.md`](file:///d:/python%20Qspider/Notes/PYTHON/GenZ/Krishna/NexoAgent/frontend/docs/ROADMAP_4_WEEKS.md).
4. **Preserve Mentorship & Explain the "Why":** Explain architecture and decisions clearly in user-friendly Hinglish/English so the user understands how the code works under the hood.

---

**By adhering to this directive, NexoAgent will stand out as an exceptional, high-converting, professional B2B AI SaaS with a world-class user experience.**
