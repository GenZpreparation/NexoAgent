# 🔌 NexoAgent - Backend API Contracts & Schema Specification
> **Base URL:** `http://127.0.0.1:8000/api/v1`  
> **Auth Header Format:** `Authorization: Bearer <access_token>`  
> **Content-Type:** `application/json` (except CSV uploads which use `multipart/form-data`)

---

## 📌 1. Authentication & Multi-Tenancy Router (`/auth`)

### 1.1 Register Workspace & Admin User
* **Method & Endpoint:** `POST /auth/register`
* **Access:** Public
* **Purpose:** Nayi company ka workspace banata hai, admin user create karta hai aur automatically ₹500 free calling balance credit karta hai.
* **Request Body:**
  ```json
  {
    "company_name": "DLF CyberCity Properties",
    "full_name": "Rajesh Sharma",
    "email": "rajesh@dlf.com",
    "password": "StrongPassword123@"
  }
  ```
* **Success Response (`201 Created`):**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "user": {
      "id": 1,
      "email": "rajesh@dlf.com",
      "full_name": "Rajesh Sharma",
      "role": "admin",
      "workspace_id": 1,
      "is_active": true
    },
    "workspace": {
      "id": 1,
      "name": "DLF CyberCity Properties",
      "slug": "dlf-cybercity-properties",
      "balance_inr": 500.0,
      "is_active": true
    }
  }
  ```
* **Error (`400 Bad Request`):** `{"detail": "A user with this email address already exists"}`

---

### 1.2 User Login
* **Method & Endpoint:** `POST /auth/login`
* **Access:** Public
* **Request Body:**
  ```json
  {
    "email": "rajesh@dlf.com",
    "password": "StrongPassword123@"
  }
  ```
* **Success Response (`200 OK`):** Returns same `TokenResponse` format as register.
* **Error (`401 Unauthorized`):** `{"detail": "Invalid email or password"}`

---

### 1.3 Get Current User Profile & Balance
* **Method & Endpoint:** `GET /auth/me`
* **Access:** Authenticated (Requires Bearer Token)
* **Success Response (`200 OK`):**
  ```json
  {
    "user": {
      "id": 1,
      "email": "rajesh@dlf.com",
      "full_name": "Rajesh Sharma",
      "role": "admin",
      "workspace_id": 1,
      "is_active": true
    },
    "workspace": {
      "id": 1,
      "name": "DLF CyberCity Properties",
      "slug": "dlf-cybercity-properties",
      "balance_inr": 489.0,
      "is_active": true
    }
  }
  ```

---

## 🎙️ 2. Voice Agent Studio Router (`/agents`)

### 2.1 List All Agents of Current Workspace
* **Method & Endpoint:** `GET /agents`
* **Access:** Authenticated
* **Success Response (`200 OK`):**
  ```json
  [
    {
      "id": 1,
      "workspace_id": 1,
      "name": "Pooja - Real Estate Specialist",
      "system_prompt": "Tu Pooja hai, DLF CyberCity ki property specialist...",
      "first_message": "Namaste! DLF CyberCity se Pooja bol rahi hu.",
      "voice_provider": "sarvam",
      "voice_id": "bulbul:v3/pooja",
      "language": "hi-IN",
      "temperature": 0.3,
      "is_active": true,
      "created_at": "2026-11-11T12:00:00Z",
      "updated_at": "2026-11-11T12:00:00Z"
    }
  ]
  ```

---

### 2.2 Create New Voice Agent
* **Method & Endpoint:** `POST /agents`
* **Access:** Authenticated
* **Request Body:**
  ```json
  {
    "name": "Aman - Commercial Leasing",
    "system_prompt": "Tu Aman hai, commercial office space leasing manager...",
    "first_message": "Good morning! DLF commercial leasing se Aman baat kar raha hu.",
    "voice_provider": "sarvam",
    "voice_id": "bulbul:v3/aman",
    "language": "hi-IN",
    "temperature": 0.3
  }
  ```
* **Success Response (`201 Created`):** Returns created `AgentResponse` object.

---

### 2.3 Partial Update Agent (PATCH)
* **Method & Endpoint:** `PATCH /agents/{id}`
* **Access:** Authenticated (Tenant Isolated)
* **Request Body (All fields optional):**
  ```json
  {
    "temperature": 0.2,
    "first_message": "Namaste ji! Updated first message."
  }
  ```
* **Success Response (`200 OK`):** Returns updated `AgentResponse`.
* **Error (`404 Not Found`):** If ID belongs to another company or doesn't exist.

---

### 2.4 Delete Agent
* **Method & Endpoint:** `DELETE /agents/{id}`
* **Access:** Authenticated
* **Success Response (`204 No Content`)**

---

## 📊 3. Call Ledger & Intelligence Router (`/calls`)

### 3.1 List Paginated Calls with Filters
* **Method & Endpoint:** `GET /calls?status={status}&agent_id={id}&limit={20}&offset={0}`
* **Access:** Authenticated
* **Query Params:**
  - `status`: Optional filter (`completed`, `busy`, `in-progress`, `no-answer`)
  - `agent_id`: Optional int filter
  - `limit`: Default 20 (max 100)
  - `offset`: Default 0
* **Success Response (`200 OK`):**
  ```json
  {
    "total": 142,
    "items": [
      {
        "id": 1,
        "call_sid": "CA-DLF-001",
        "workspace_id": 1,
        "agent_id": 1,
        "customer_phone": "+919876543210",
        "direction": "outbound",
        "status": "completed",
        "duration_seconds": 75,
        "cost_inr": 11.0,
        "recording_url": "recordings/workspace_1/CA-DLF-001.mp3",
        "created_at": "2026-11-11T12:30:00Z",
        "log": {
          "id": 1,
          "transcript": "Agent: Namaste! User: Mujhe 3 BHK dekhna hai...",
          "summary": "Customer interested in 3 BHK with 2.4 Cr budget for Sunday visit.",
          "sentiment": "Positive",
          "extracted_data": {
            "budget": "2.4 Crore",
            "bhk": "3 BHK",
            "visit_date": "Sunday",
            "lead_interest": "Hot"
          },
          "whatsapp_status": "sent"
        }
      }
    ]
  }
  ```

---

### 3.2 Get Single Call Details & AI Intelligence
* **Method & Endpoint:** `GET /calls/{id}`
* **Access:** Authenticated
* **Success Response (`200 OK`):** Returns single `CallResponse` with nested `log`.

---

### 3.3 Get Secure Audio Recording Streaming URL (15-min Presigned)
* **Method & Endpoint:** `GET /calls/{id}/recording`
* **Access:** Authenticated
* **Success Response (`200 OK`):**
  ```json
  {
    "call_id": 1,
    "call_sid": "CA-DLF-001",
    "streaming_url": "https://nexoagent-recordings.s3.ap-south-1.amazonaws.com/recordings/workspace_1/CA-DLF-001.mp3?X-Amz-Signature=...",
    "expires_in_seconds": 900
  }
  ```

---

### 3.4 On-Demand Post-Call AI Intelligence Analysis
* **Method & Endpoint:** `POST /calls/{id}/analyze`
* **Access:** Authenticated
* **Request Body:**
  ```json
  {
    "transcript": "Agent: Namaste! User: Mujhe 3 BHK flat dekhna hai budget 2 Cr..."
  }
  ```
* **Success Response (`200 OK`):** Runs Groq LLaMA/GPT extraction, saves into `CallLog`, returns updated call.

---

## 📢 4. Bulk Campaigns Hub Router (`/campaigns`)

### 4.1 Create Outbound Campaign
* **Method & Endpoint:** `POST /campaigns`
* **Access:** Authenticated
* **Request Body:**
  ```json
  {
    "name": "Noida Luxury HNI Leads - Nov 2026",
    "agent_id": 1,
    "concurrency_limit": 5
  }
  ```
* **Success Response (`201 Created`):**
  ```json
  {
    "id": 1,
    "workspace_id": 1,
    "agent_id": 1,
    "name": "Noida Luxury HNI Leads - Nov 2026",
    "status": "draft",
    "concurrency_limit": 5,
    "total_leads": 0,
    "dialed_leads": 0,
    "connected_leads": 0,
    "created_at": "2026-11-11T13:00:00Z"
  }
  ```

---

### 4.2 Upload Leads CSV File
* **Method & Endpoint:** `POST /campaigns/{id}/upload-csv`
* **Access:** Authenticated
* **Content-Type:** `multipart/form-data`
* **Form Field:** `file` (the CSV/Excel file binary)
* **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "campaign_id": 1,
    "total_rows_processed": 5000,
    "leads_added": 4800,
    "dnd_scrubbed_blocked": 150,
    "duplicates_skipped": 35,
    "invalid_numbers_skipped": 15
  }
  ```

---

### 4.3 Start Campaign & Pacing Calling
* **Method & Endpoint:** `POST /campaigns/{id}/start`
* **Access:** Authenticated
* **Success Response (`200 OK`):**
  ```json
  {
    "status": "campaign_running",
    "campaign_id": 1,
    "concurrency_limit": 5,
    "dispatched_count": 5,
    "remaining_slots": 0,
    "dispatched_leads": [
      {"lead_id": 101, "name": "Aman", "phone": "+919876543210", "call_sid": "CA_1234"}
    ]
  }
  ```

---

### 4.4 List Leads in a Campaign
* **Method & Endpoint:** `GET /campaigns/{id}/leads?status={status}&limit={50}&offset={0}`
* **Access:** Authenticated
* **Success Response (`200 OK`):** Returns list of leads with status (`pending`, `dialing`, `completed`, `busy`, `dnd_blocked`).

---

## 💬 5. WhatsApp Automation Router (`/whatsapp`)

### 5.1 On-Demand Brochure Dispatch
* **Method & Endpoint:** `POST /whatsapp/send-brochure`
* **Access:** Authenticated
* **Request Body:**
  ```json
  {
    "customer_phone": "+919876543210",
    "project_name": "Godrej Woods Sector 43",
    "brochure_url": "https://storage.nexoagent.com/brochures/brochure.pdf",
    "call_id": 1
  }
  ```
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "status": "sent",
    "message_id": "wamid.HBgL...",
    "recipient": "+919876543210",
    "project_name": "Godrej Woods Sector 43"
  }
  ```

---

### 5.2 Book Site Visit WhatsApp Slip
* **Method & Endpoint:** `POST /whatsapp/book-visit`
* **Access:** Authenticated
* **Request Body:**
  ```json
  {
    "customer_phone": "+919876543210",
    "project_name": "Godrej Woods Sector 43",
    "visit_date": "This Sunday",
    "time_slot": "Morning (11 AM)",
    "call_id": 1
  }
  ```
* **Success Response (`200 OK`):** Returns `{ "success": true, "status": "sent", "message_id": "..." }`.
