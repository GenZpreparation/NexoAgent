# 🤖 NexoAgent - Enterprise B2B Voice AI Telecalling & Agent SaaS Platform

> **Sub-500ms Conversational Voice AI with Native Hindi & Hinglish Regional Accents, 60-Second Telecom Pulse Billing, and In-Call WhatsApp Dispatch.**

NexoAgent is a full-stack, enterprise-grade Voice AI Telecalling platform designed for high-volume sales, lead qualification, debt recovery, and customer support in the Indian market.

---

## 🏛️ Monorepo Structure

```
NexoAgent/
├── 📁 backend/                # 100% Python FastAPI Backend & Voice AI Pipelines
│   ├── app/                  # REST APIs, Async SQLAlchemy Models, Services
│   ├── voice_agent/          # LiveKit WebRTC Worker, Silero VAD, Prompts & Tools
│   ├── test_*.py             # 14 Automated Regression & Integration Test Suites
│   ├── requirements.txt      # Python dependencies
│   ├── .env.example          # Environment template
│   └── README.md             # Backend detailed setup guide
│
├── 📁 frontend/               # Next.js 15 App Router & Obsidian Design System
│   ├── docs/                 # Architecture, 4-Week Roadmap, API Contracts, Wireframes
│   ├── src/                  # Next.js source code (Types, UI, Components)
│   └── README.md             # Frontend architectural overview & guidelines
│
├── 📄 GEMINI.md              # Antigravity AI Absolute Operating Directive & Anti-AI-Slop Manifesto
├── 📄 DAILY_LOG.md           # Day-by-day development audit log
├── 📄 LEARNING_NOTES.md      # Engineering concepts and architectural notes
├── 📄 PROJECT_ROADMAP.md     # High-level product vision & milestone tracker
└── 📄 WORKING_FLOW.md        # Collaboration protocols & standards
```

---

## ⚡ Core Platform Capabilities

1. **Sub-500ms Voice Latency:**
   - Real-time WebRTC audio pipeline using **LiveKit**, **Silero VAD**, and **Deepgram Nova-2**.
   - Sub-second LLM reasoning via **Groq LLaMA 3.3-70B**.
   - Natural Hindi/Hinglish speech synthesis via **Sarvam AI Bulbul**.
   - True conversational **Barge-in** (instant mute when customer interrupts).

2. **Indian Telecom & TRAI Compliance:**
   - Automated **E.164 phone sanitization** (+91 standardization).
   - Strict **60-Second Telecom Pulse Billing** formula.
   - Built-in **TRAI 10 AM – 7 PM calling window** enforcer.
   - Pre-dial **National DND Registry (NDNC)** scrubber.

3. **In-Call Mid-Speech Automation Tools:**
   - LLM function calling mid-conversation to dispatch **instant WhatsApp brochures**, location maps, or booking links while the call is still live.

4. **Post-Call AI Intelligence:**
   - Sub-second Groq post-call extraction: 2-line summary, sentiment scoring (Positive/Neutral/Negative), and lead qualification entities (Budget, BHK, Visit Date).
   - Scrubbable audio waveforms via secure 15-minute S3/Cloudflare R2 presigned URLs.

5. **Multi-Tenant SaaS Security:**
   - Async SQLAlchemy 2.0 with complete multi-tenant database isolation.
   - Bcrypt password hashing, stateless JWT session authentication, and IDOR attack defense.
   - Automated ₹500 prepaid calling credit on workspace signup.

---

## 🚀 Getting Started

### 1. Backend Setup (FastAPI & Voice AI)
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate   # On Windows (or source venv/bin/activate on Linux/Mac)
pip install -r requirements.txt
cp .env.example .env      # Add API credentials
uvicorn app.main:app --reload --port 8000
```
Swagger UI: `http://127.0.0.1:8000/docs`

### 2. Frontend Setup (Next.js 15)
```bash
cd frontend
# Refer to frontend/docs/ROADMAP_4_WEEKS.md for the step-by-step UI implementation
```

---

## 🛡️ License & Confidentiality
Proprietary & Confidential - Built for NexoAgent Enterprise SaaS.
