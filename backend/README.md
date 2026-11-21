# 🚀 NexoAgent - Backend Engine (Python FastAPI)

This directory contains the complete backend infrastructure for **NexoAgent**, an Enterprise B2B Voice AI Telecalling & Agent SaaS Platform.

---

## 🏗️ Architecture & Tech Stack

* **Web Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Async, Pydantic V2)
* **Real-time Voice AI:** [LiveKit](https://livekit.io/) WebRTC, [Silero VAD](https://github.com/snakers4/silero-vad), [Deepgram Nova-2](https://deepgram.com/) STT, [Groq LLaMA 3.3-70B](https://groq.com/), [Sarvam AI Bulbul](https://sarvam.ai/) (Hindi & Hinglish TTS)
* **Database & ORM:** SQLite / PostgreSQL via [SQLAlchemy 2.0 Async](https://docs.sqlalchemy.org/) (`aiosqlite` / `asyncpg`)
* **Telephony Integration:** Plivo / Twilio / Tata SIP with automated E.164 sanitization and 60-second telecom pulse billing
* **Security:** Bcrypt password hashing, stateless JWT authentication, IDOR tenant isolation

---

## 📁 Directory Structure

```
backend/
├── app/
│   ├── api/v1/         # REST API routers (auth, agents, calls, campaigns, webhooks, whatsapp)
│   ├── core/           # Security, async database engine, config & deps
│   ├── models/         # SQLAlchemy ORM models (Workspace, User, VoiceAgent, Call, Campaign)
│   ├── schemas/        # Pydantic request/response validation schemas
│   ├── services/       # Business logic (telephony, intelligence, storage, campaigns, whatsapp)
│   └── main.py         # FastAPI application entrypoint & lifespan
├── voice_agent/        # Real-time WebRTC Voice Agent worker & function calling tools
├── test_*.py           # 14 automated unit & integration test suites
├── requirements.txt    # Python dependencies
├── .env.example        # Environment variable template
└── nexoagent.db        # Local SQLite database (ignored in git)
```

---

## ⚡ Quickstart Setup

1. **Activate Virtual Environment:**
   ```bash
   # From project root
   .\venv\Scripts\activate
   # Or create new: python -m venv venv
   ```

2. **Install Dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Configure Environment:**
   ```bash
   cp .env.example .env
   # Add your GROQ_API_KEY, DEEPGRAM_API_KEY, SARVAM_API_KEY, LIVEKIT credentials
   ```

4. **Run FastAPI Server:**
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   * Interactive Swagger API Docs: `http://127.0.0.1:8000/docs`
   * ReDoc Documentation: `http://127.0.0.1:8000/redoc`

5. **Run Test Suites:**
   ```bash
   python test_database.py
   python test_auth.py
   python test_agents_api.py
   python test_calls_ledger.py
   python test_campaigns.py
   ```
