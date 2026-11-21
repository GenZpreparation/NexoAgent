# 🎙️ NexoAgent - Frontend Developer Master Guide
> **B2B AI Telecalling & Voice Agent SaaS Platform**  
> *Target Model: Outpero.com / Bland.ai Clone*  
> *Backend: 100% Python FastAPI (`http://127.0.0.1:8000/api/v1`)*  
> *Frontend: Next.js 15+ (App Router), TypeScript, Tailwind CSS, Shadcn UI*

---

## 📌 1. Welcome Frontend Developer!
Agar tum NexoAgent ka frontend design aur develop karne ja rahe ho, to yeh folder tumhare liye **Single Source of Truth** hai. 

Yahan tumhe backend ke saare APIs ke contracts, exact JSON payloads, ready-made TypeScript interfaces, wireframes aur 4-week ka day-by-day implementation plan milega. Tumhe backend developer se baar-baar puchne ki koi zaroorat nahi padegi!

---

## 📁 2. Documentation Index in this Folder

| File | Purpose | Description |
| :--- | :--- | :--- |
| **[`docs/API_CONTRACTS.md`](file:///d:/python%20Qspider/Notes/PYTHON/GenZ/Krishna/NexoAgent/frontend/docs/API_CONTRACTS.md)** | **Backend API Specification** | Saare 20+ FastAPI endpoints, Request/Response JSON schemas, Auth Headers, Error Codes. |
| **[`docs/ANTI_AI_DESIGN_GUIDELINES.md`](file:///d:/python%20Qspider/Notes/PYTHON/GenZ/Krishna/NexoAgent/frontend/docs/ANTI_AI_DESIGN_GUIDELINES.md)** | **Signature "Anti-AI-Slop" Guide** | Rules to ensure website NEVER looks like a generic AI template (Linear + Raycast aesthetic). |
| **[`docs/DESIGN_SYSTEM_RULES.md`](file:///d:/python%20Qspider/Notes/PYTHON/GenZ/Krishna/NexoAgent/frontend/docs/DESIGN_SYSTEM_RULES.md)** | **Design System & UI Rules** | Master color system, dark theme hierarchy, typography, border radius, component rules. |
| **[`src/types/api.ts`](file:///d:/python%20Qspider/Notes/PYTHON/GenZ/Krishna/NexoAgent/frontend/src/types/api.ts)** | **Ready-to-Use TypeScript Types** | Copy-paste TypeScript interfaces (matching 100% backend Pydantic models). |
| **[`docs/SCREEN_WIREFRAMES.md`](file:///d:/python%20Qspider/Notes/PYTHON/GenZ/Krishna/NexoAgent/frontend/docs/SCREEN_WIREFRAMES.md)** | **Screen-by-Screen Wireframes** | Visual ASCII & Mermaid wireframes of all 10 pages with component hierarchy. |
| **[`docs/ROADMAP_4_WEEKS.md`](file:///d:/python%20Qspider/Notes/PYTHON/GenZ/Krishna/NexoAgent/frontend/docs/ROADMAP_4_WEEKS.md)** | **Day-by-Day (28 Days) Roadmap** | Day 1 to Day 28 exact implementation tasks with acceptance criteria. |

---

## 🎨 3. Design System & Theme Specs

* **Color Palette:**
  - **Background (Dark):** Slate-950 (`#020617`) / Zinc-900 (`#18181b`)
  - **Cards / Containers:** Slate-900 (`#0f172a`) with subtle 1px border (`#1e293b`)
  - **Primary Brand Color:** Electric Indigo (`#6366f1` / Indigo-500)
  - **Live / Active Call Green:** Emerald-500 (`#10b981`)
  - **Busy / Warning Amber:** Amber-500 (`#f59e0b`)
  - **Failed / Error Red:** Rose-500 (`#f43f5e`)
  - **Text Primary:** White (`#ffffff`) / Slate-100 (`#f1f5f9`)
  - **Text Secondary:** Slate-400 (`#94a3b8`)
* **Typography:**
  - Headings: `Plus Jakarta Sans` ya `Inter` (Font weight 600/700).
  - Body & Data: `Inter` (Font weight 400/500).
  - Code / Telephony SID: `JetBrains Mono` ya `Fira Code`.

---

## ⚙️ 4. Quickstart Local Setup for Frontend

```bash
# 1. Frontend directory me aao
cd frontend

# 2. Next.js 15 App Scaffold karo (agar fresh banana ho)
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir

# 3. Core dependencies install karo
npm install @tanstack/react-query lucide-react clsx tailwind-merge wavesurfer.js framer-motion axios sonner

# 4. Shadcn UI initialize karo
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card dialog dropdown-menu input label slider tabs table badge avatar drawer skeleton

# 5. Environment variable file (.env.local) banao:
# NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
# NEXT_PUBLIC_LIVEKIT_URL=wss://nexoaiagent-hq4iij06.livekit.cloud
```

---

Backend server already running hai at **`http://127.0.0.1:8000`** with interactive docs at **`http://127.0.0.1:8000/docs`**!
