# 🚀 NexoAgent - Frontend Teammate Command & Workflow Guide
> **Welcome to the NexoAgent Engineering Team!**  
> Yeh guide tumhare liye step-by-step handbook hai. Isme bataya gaya hai ki **pehle din (Day 1)** project kaise setup karna hai aur **har roz (Daily Routine)** kaam karte waqt kaunsi Git aur Terminal commands use karni hain.

---

## 📌 Table of Contents
1. [Day 1: Initial One-Time Setup (Pehle Din Kya Karna Hai)](#-day-1-initial-one-time-setup)
2. [Daily Workflow Commands (Roz Ka Kaam Kaise Karna Hai)](#-daily-workflow-commands-roz-ka-routine)
   - [☀️ Subah: Kaam Shuru Karne Se Pehle](#1-subah-kaam-shuru-karne-se-pehle)
   - [💻 Din Me: Development & Code Quality](#2-din-me-coding--testing)
   - [🌙 Shaam Ko: Kaam Save & Push Karna](#3-shaam-ko-kaam-khatam-karke-push-karna)
3. [Local Backend Kaise Chalana Hai (For API Testing)](#-local-backend-kaise-chalana-hai)
4. [Git Rules & Best Practices (Galti Hone Se Bachein)](#-git-rules--best-practices)
5. [Important Reference Docs in this Project](#-important-reference-docs)

---

## 🌟 Day 1: Initial One-Time Setup

Pehle din jab tum project apne system par set up karoge, toh yeh steps sequence me follow karo:

### Step 1: Repository Clone & Branch Switch
Apne terminal / Command Prompt / PowerShell me yeh run karo:

```bash
# 1. Repository clone karo
git clone https://github.com/GenZpreparation/NexoAgent.git

# 2. Project folder ke andar aao
cd NexoAgent

# 3. Dedicated frontend branch par switch karo
git checkout frontend-dev
git pull origin frontend-dev
```

---

### Step 2: Frontend Directory & Dependencies Install
Ensure karo ki tumhare computer me **Node.js (v18 ya v20+)** installed hai (`node -v`).

```bash
# Frontend folder me jao
cd frontend

# Agar fresh Next.js scaffold banana ho (agar pehle se package.json nahi hai):
# npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir

# Core dependencies install karo
npm install @tanstack/react-query zustand lucide-react clsx tailwind-merge framer-motion axios sonner
```

---

### Step 3: Environment Variables Setup (`.env.local`)
Frontend folder ke andar ek nayi file banao `.env.local` aur yeh keys paste karo:

```env
# Backend API Base URL (FastAPI Localhost)
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1

# LiveKit WebRTC Audio Pipeline (Voice Agent Playground)
NEXT_PUBLIC_LIVEKIT_URL=wss://nexoaiagent-hq4iij06.livekit.cloud
```

---

### Step 4: Frontend Development Server Start Karo
```bash
npm run dev
```
Ab browser me **`http://localhost:3000`** open karke verify karo ki Next.js app load ho rahi hai.

---

## 🔄 Daily Workflow Commands (Roz Ka Routine)

Har roz kaam karte waqt tumhara routine 3 stages me hona chahiye:

### 1. ☀️ Subah: Kaam Shuru Karne Se Pehle
Hamesha pehle check karo ki tumhari working branch up-to-date hai:

```bash
# 1. Check karo tum right branch par ho
git status

# 2. Agar frontend-dev par nahi ho to switch karo
git checkout frontend-dev

# 3. Remote GitHub se latest updates pull karo
git pull origin frontend-dev

# 4. Frontend server start karo
npm run dev
```

---

### 2. 💻 Din Me: Coding & Testing
Jab tum components, UI pages, ya hooks bana rahe ho:

```bash
# Agar koi nayi UI library chahiye (e.g. Radix UI, Wavesurfer):
npm install wavesurfer.js

# TypeScript validation run karo (Ensure 0 type errors):
npx tsc --noEmit

# Code linting check karo:
npm run lint

# Production build test karo (Ensure build break na ho):
npm run build
```

---

### 3. 🌙 Shaam Ko: Kaam Khatam Karke Push Karna
Day's work complete hone par code ko safe tarike se GitHub par push karo:

```bash
# 1. Dekho kaun-kaun si files modify hui hain
git status

# 2. Apne changes ka diff review karo
git diff

# 3. Files ko stage karo
git add .

# 4. Meaningful commit message ke sath commit karo
# Example: git commit -m "feat(agents): build voice agent creation modal and sarvam voice selector"
git commit -m "feat(ui): <tumne kya feature banaya uska short description>"

# 5. Push karne se pehle ek baar pull karo (taaki conflicts na aayein)
git pull origin frontend-dev

# 6. Branch ko GitHub par push karo
git push origin frontend-dev
```

---

## ⚡ Local Backend Kaise Chalana Hai

Agar tumhe local backend APIs (`POST /agents`, `POST /calls/dispatch`, `GET /billing/wallet`) ke sath real-time integration test karna hai:

Ek naya terminal window open karo aur root folder se yeh chalao:

```bash
# 1. Root folder se backend directory me jao
cd backend

# 2. Virtual environment activate karo:
# Windows (PowerShell/CMD):
..\venv\Scripts\activate
# Mac/Linux:
# source ../venv/bin/activate

# 3. FastAPI Server launch karo:
uvicorn app.main:app --reload --port 8000
```

- **Interactive API Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **API Base Endpoint:** `http://127.0.0.1:8000/api/v1`

---

## 🛡️ Git Rules & Best Practices (Galti Se Bhi Yeh Mat Karna)

1. ❌ **`main` branch par direct commit/push KABHI mat karna!**
   - Hamesha sirf `frontend-dev` (ya feature branch) par hi commit & push karna hai.
2. ❌ **Secret files commit mat karna:**
   - `.env`, `.env.local`, aur `node_modules` ko kabhi git me add mat karna (yeh `.gitignore` me honi chahiye).
3. ❌ **Broken code push mat karna:**
   - Push karne se pehle hamesha `npm run build` chala kar verify kar lo ki koi TypeScript error ya syntax error na ho.
4. ❌ **Vague commit messages se bacho:**
   - Banned: `git commit -m "updated stuff"` ya `git commit -m "fix"`
   - Instead use: `git commit -m "feat(dashboard): add active calls telecalling bento grid widget"`

---

## 📚 Important Reference Docs

Frontend banate waqt in files ko apna guide banao:

| Document | Path | Kyu Dekhna Hai? |
|---|---|---|
| **Outpero Exact Blueprint** | [`OUTPERO_EXACT_FRONTEND_BLUEPRINT.md`](OUTPERO_EXACT_FRONTEND_BLUEPRINT.md) | **Must Follow:** Exact Outpero theme, layout, sidebar, pages, aur 3-week day-by-day plan. |
| **API Contracts** | [`docs/API_CONTRACTS.md`](docs/API_CONTRACTS.md) | Backend ke sabhi FastAPI endpoints ke request/response schemas. |
| **TypeScript Types** | [`src/types/api.ts`](src/types/api.ts) | Ready-made interfaces (Agent, Call, Lead, Campaign, Wallet). |

---

**Koi bhi doubt ya question ho to team leader ya backend developer se coordinate karo. Happy Coding! 🚀**
