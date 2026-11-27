# NexoAgent — Frontend ↔ Backend Integration Contract

**Audience:** both NexoAgent developers (frontend + backend).
**Last updated:** 2026-11-27 (written against the backend in `backend/app` at commit `6101409`).

This document describes **exactly** what the frontend in `frontend/` expects from the backend.

## Status labels used in this document

| Label | Meaning |
|---|---|
| ✅ **VERIFIED** | Exists in `backend/app/api/v1/*` and was exercised end-to-end through the frontend's `/api/v1` proxy (42/42 checks passed on 2026-11-27, see §9). |
| 🟡 **PROPOSED — NOT CONFIRMED BY BACKEND** | The frontend needs this, but it does **not** exist yet. Names, shapes and semantics are suggestions — the backend developer decides. Nothing in this document claims these are implemented. |
| ⚠️ **ISSUE** | Exists, but behaves in a way the frontend has to work around. |

Every proposed feature is wired to a **capability flag** in `frontend/src/lib/capabilities.ts`. While a flag is `false`, the UI shows the control disabled with a “Needs backend” hint — it never fakes success. When an endpoint ships: implement it, flip the flag, and fill in the `apiImpl` branch of the matching service (§8).

---

## 1. Integration basics

### 1.1 Base URL & proxy
- The browser calls **`/api/v1/*` on the Next.js server**; `frontend/next.config.mjs` rewrites to `${BACKEND_ORIGIN}/api/v1/*` (default `http://127.0.0.1:8000`).
- Reason: the backend has **no CORS middleware**. The proxy avoids touching the backend. If you later add CORS and want direct calls, set `NEXT_PUBLIC_API_BASE_URL=https://api.example.com/api/v1`.

### 1.2 Authentication ✅
- `POST /auth/login` / `POST /auth/register` return `{ access_token, token_type, user, workspace }`.
- Frontend sends `Authorization: Bearer <access_token>` on every request.
- Token is kept in memory + `sessionStorage` (cleared when the tab closes). It is never written to cookies/localStorage by the frontend.
- Any **401** clears the session and redirects to `/login`.
- There is no logout/revoke endpoint; sign-out only discards the token client-side.
- 🟡 **PROPOSED:** move to an `httpOnly; Secure; SameSite=Lax` session cookie set by the backend, plus `POST /auth/logout`. The frontend change would be limited to `src/lib/api/token.ts`.
- Developer API keys (`X-API-Key` or `Bearer nexo_live_…`) are for server-to-server use only; the frontend never stores or sends them.

### 1.3 Errors ✅
The frontend normalises FastAPI errors in `src/lib/api/errors.ts`:

| HTTP | Frontend `kind` | Message shown |
|---|---|---|
| 400 / 409 / 422 | `validation` | `detail` (string) or first 422 item; 422 `loc` → per-field errors |
| 401 | `unauthorized` | Generic “session expired” + redirect to login |
| 402 | `payment_required` | `detail` (e.g. insufficient balance) |
| 403 | `forbidden` | `detail` |
| 404 | `not_found` | `detail` |
| 5xx | `server` | Generic message — **5xx `detail` is never displayed** |
| network failure | `network` | “Can't reach the backend” |

Please keep `detail` human-readable and free of stack traces/internal IDs for 4xx responses.

### 1.4 Pagination, filtering, sorting
- Existing endpoints use **`limit` + `offset`** query params. The frontend uses the same.
- 🟡 **PROPOSED convention for new list endpoints:** `GET /things?limit=&offset=&sort=&<filters>` → `{ "items": [...], "total": <count of all matching rows> }`. `total` must be the full match count (not the page length) so pagination can show “1–25 of 340”.
- Booleans as `true`/`false`; dates as ISO-8601 (`2026-11-27` or full timestamps, UTC).
- Empty/false filters are omitted by the frontend (`buildUrl` in `src/lib/api/client.ts`).

### 1.5 IDs and timestamps
- Backend ids are integers; the frontend converts them to strings internally and back to numbers in request bodies (`agent_id: Number(id)`).
- Timestamps must be ISO-8601. **Please include a timezone** (`Z` or offset); naive datetimes are interpreted by browsers as local time.

---

## 2. Verified endpoints the frontend calls ✅

| Method | Path | Frontend service | Used by |
|---|---|---|---|
| POST | `/auth/register` | `authService.register` | Login page (Register) |
| POST | `/auth/login` | `authService.login` | Login page |
| GET | `/auth/me` | `authService.me` | Session bootstrap |
| GET | `/agents` | `employeesService.list` (+ id→name cache) | Team, filters everywhere |
| GET | `/agents/{id}` | `employeesService.get` | Employee detail |
| POST | `/agents` | `employeesService.create` | Hire wizard (see §4.1) |
| PATCH | `/agents/{id}` | `employeesService.update` | Pause/activate, edit instructions |
| POST | `/agents/{id}/duplicate` | `employeesService.duplicate` | Team, detail |
| DELETE | `/agents/{id}` | `employeesService.remove` | Team, detail |
| GET | `/voices` | `employeesService.voices` | Wizard voice picker |
| GET | `/calls?status=&agent_id=&limit=&offset=` | `conversationsService.list` | Conversations, Home, Incoming, employee activity |
| GET | `/calls/{id}` | `conversationsService.get` | Deep link `/conversations?open=<id>` |
| GET | `/calls/{id}/recording` | `conversationsService.recordingUrl` | “Load recording” (only when `recording_url` is set) |
| GET | `/leads?search=&agent_id=&outcome=&hot_only=&sort=&limit=&offset=` | `leadsService.list` | Leads, Home, Instant leads activity |
| GET | `/leads/export` | `leadsService.exportCsv` | Leads → Export |
| GET | `/analytics/performance?days=&agent_id=&min_duration=&issues_only=` | `performanceService.get` | Performance, Home, Billing |
| GET | `/channels` | `channelsService.list` | Numbers, Incoming, filters |
| POST | `/channels` | `channelsService.create` | Numbers → Add number |
| GET | `/channels/live` | `channelsService.live` | Header call-activity pill (polled every 15 s) |
| GET | `/campaigns` | `campaignsService.list` | Campaigns |
| POST | `/campaigns` | `campaignsService.create` | New campaign (created as draft) |
| POST | `/campaigns/{id}/upload-csv` (multipart `file`) | `campaignsService.uploadCsv` | New campaign / Upload leads |
| POST | `/campaigns/{id}/start` | `campaignsService.start` | Start (after an explicit confirmation dialog) |
| GET | `/campaigns/{id}/leads?limit=50` | `campaignsService.leads` | Campaign detail sheet |
| GET | `/billing/wallet` | `billingService.wallet` | Sidebar balance, Billing |
| GET | `/billing/transactions?type=&limit=&offset=` | `billingService.transactions` | Billing |
| GET/POST/DELETE | `/api-keys`, `/api-keys/{id}` | `developersService` | Developers → API keys |
| GET/POST/DELETE | `/integrations/webhooks`, `/{id}` | `developersService` | Developers → Webhooks |
| POST | `/integrations/webhooks/{id}/test-ping` | `developersService.testWebhook` | “Send test” |
| GET/POST/PATCH/DELETE | `/workspace/members`, `/{id}` | `workspaceService` | Settings → Team |
| GET | `/search?q=` | `workspaceService.search` | Ctrl+K palette |

Not used by the frontend (yet): `/billing/create-order`, `/billing/verify-payment`, `/billing/webhook`, `/calls/{id}/analyze`, `POST /calls` / `/calls/dispatch`, `/campaigns/{id}/dispatch-retries`, `/agents/{id}/knowledge`, `/whatsapp/*`, `/webhooks/*`, `/workspace/profile`, `/api/v1/me`.

---

## 3. ⚠️ Issues found in existing endpoints

These are things the frontend currently works around. Fixing them improves accuracy; none block the UI.

1. **`GET /leads` — `total` is the page length**, not the number of matching leads, and `summary.hot_leads` only counts hot leads on the current page. The frontend infers “more pages” from `leads.length === limit`. *Ask:* return the full match count and a workspace-wide hot count.
2. **`GET /leads` — `outcome` filters on `Lead.status`** (values like `pending`, `completed`, `busy`, `no-answer`, `dnd_blocked`, `retry_scheduled`). The frontend's outcome vocabulary is `interested | callback | not_interested | no_answer | busy | dnd | failed | pending | completed`. *Ask:* store a real outcome per lead, or document the accepted values.
3. **`GET /leads` items lack the assigned AI employee** (`agent_id`/name), channel, and follow-up info. The UI shows “—”.
4. **`GET /leads/export` ignores filters** (always exports everything). The UI says “All leads were exported”.
5. **`GET /analytics/performance`:**
   - `calls_change_pct` is hard-coded to `10.0` → the frontend **does not display it**.
   - `outcomes.callback` and `outcomes.not_interested` are always `0`; `interested` counts every call ≥ 30 s or `completed`.
   - `calls_over_time` returns at most 14 daily buckets even for `days=30/90`.
6. **`GET /calls`** has no `direction`, date, channel or text-search filters. Incoming calls currently fetches the latest 100 calls and filters `direction == "inbound"` client-side.
7. **`GET /search`** returns `url` values for an old route scheme (`/dashboard/agents/{id}`). The frontend ignores `url` and builds links from `category` + `id`.
8. **`POST /integrations/webhooks/{id}/test-ping`** only *simulates* delivery (`status: "ping_simulated"`). The UI says so explicitly.
9. **`GET /integrations/webhooks` returns the full `secret` on every list call.** The UI masks it by default. *Suggest:* return the secret only on creation (like API keys) and expose a “rotate secret” endpoint.
10. **Backend setup:** `backend/requirements.txt` does not list `fastapi`, `uvicorn`, `sqlalchemy[asyncio]`/`greenlet`, `aiosqlite`, `pydantic-settings`, `pydantic[email]`, `pyjwt`, `bcrypt`, `boto3`, `httpx`, `openai`, `python-multipart`. The app also fails to import without `OPENAI_API_KEY` set. (Found while running the integration test in §9.)
11. **Security note:** `backend/app/core/config.py` has default values for `SECRET_KEY` and other secrets. Make sure production refuses to start with defaults.
12. **CORS:** none configured — fine with the proxy; required only for direct browser calls.

---

## 4. 🟡 PROPOSED — NOT CONFIRMED BY BACKEND

Everything below is a **proposal**. Field names are suggestions; please reply with the final shape and the frontend adapter (`frontend/src/services/adapters.ts`) will follow it.

### 4.1 AI employee structured configuration — capability `employees.structuredConfig`
Today the hire wizard compiles calling mode, qualification questions, follow-ups and working hours **into `system_prompt`** (`frontend/src/features/employees/prompt.ts`) so nothing is lost. To store them as real fields, extend `AgentCreateRequest` / `AgentUpdateRequest` / `AgentResponse`:

```jsonc
{
  "role": "Property advisor",                // display only
  "description": "Call new property enquiries…",
  "calling_mode": "instant",                 // "instant" | "bulk" | "inbound"
  "natural_speech": true,
  "tone": "friendly",                        // "friendly" | "professional" | "energetic"
  "qualification_questions": [
    { "question": "What is your budget?", "field": "budget", "required": true }
  ],
  "hot_lead_criteria": "Budget above ₹1 Cr and wants to visit this week",
  "follow_up": { "max_attempts": 3, "retry_gap_hours": 4, "honour_callback_requests": true, "send_summary_on_whatsapp": false },
  "working_hours": { "days": [1,2,3,4,5,6], "start": "09:30", "end": "19:00", "timezone": "Asia/Kolkata" },
  "template_id": "real-estate",
  // response-only:
  "channels": ["+918045678900"],
  "stats": { "calls": 13, "qualified": 5, "last_active_at": "2026-11-27T10:12:00Z" }
}
```
`field` keys match `^[a-z][a-z0-9_]{0,39}$`; answers should appear under the same key in `CallLog.extracted_data` / lead `captured_info`.

### 4.2 Leads
- `GET /leads` additional params: `channel` (phone number), `created_after`, `contacted_after` (ISO dates), `sort=last_contacted|name` — capabilities `leads.filter.channel`, `leads.filter.date`, `leads.filter.lastContacted`, `leads.sort.extended`.
- Additional item fields: `agent_id`, `agent_name`, `channel`, `qualified` (bool), `tags` (string[]), `follow_up: { status: "none"|"scheduled"|"overdue"|"done", at: ISO|null }`.
- `GET /leads/export` should accept the same filters as `GET /leads`.
- `PATCH /leads/{id}/follow-up` — body `{ "at": ISO | null }` → updated lead. Capability `leads.followUp`.

### 4.3 Conversations (calls)
- `GET /calls` additional params: `search` (name/phone/summary), `direction`, `from`, `to`, `channel` — capabilities `calls.filter.*`.
- Additional item fields: `caller_name`, `channel` (number used), `outcome` (same vocabulary as leads).
- `GET /calls/export` with the same filters → `text/csv`. Until then the UI exports only the rows on screen.
- Recording/transcript **retention**: please document how long each is kept (e.g. `GET /workspace/retention` → `{ recordings_days, transcripts_days }`). The UI currently says retention is backend-controlled and does not state a number.

### 4.4 Performance — capabilities `analytics.*`
`GET /analytics/performance` additions:
- Params: `from`, `to` (custom range), `channel`.
- Response:
```jsonc
{
  "by_channel": [{ "channel": "+918045678900", "calls": 74, "connected": 44 }],
  "business_hours": [{ "hour": 0, "calls": 0 }, /* … 24 entries, workspace timezone */],
  "leaderboard": [{ "agent_id": 1, "name": "Pooja", "calls": 13, "qualified": 5, "connect_rate_pct": 61.5 }]
}
```

### 4.5 Channels
- `PATCH /channels/{id}` — body any of `{ friendly_name, assigned_agent_id|null, concurrency_limit, is_active }` → `ChannelResponse`. Capability `channels.update` (used by Numbers → Configure and Incoming calls → Assign).
- Optional: WhatsApp / SIP channel records (`type`) — capability `channels.whatsapp`.

### 4.6 Campaigns
- `POST /campaigns/{id}/pause` and `/resume` → `CampaignResponse`. Capability `campaigns.pause`.
- Frontend never dials; it only calls `/start` after the user confirms a dialog stating calls will be placed and credits used.

### 4.7 Instant leads (speed-to-lead) — capabilities `instantLeads.*`
```
GET    /lead-sources                 → [{ id, provider, name, status, agent_id, leads_last_7d, last_lead_at }]
POST   /lead-sources                 { provider, agent_id? } → source (+ OAuth redirect URL if needed)
DELETE /lead-sources/{id}            → 204
GET    /instant-leads/stats          → { leads_received, called_within_60s_pct, median_speed_to_lead_sec, connect_rate_pct, daily:[{date,received,called}] }
GET    /instant-leads/queue          → [{ id, name, phone, source, received_at, state: "waiting"|"dialing"|"retry_scheduled"|"outside_hours", next_attempt_at }]
GET    /instant-leads/settings       → { enabled, agent_id, delay_seconds, max_attempts, respect_working_hours }
PUT    /instant-leads/settings       same body → same
```
`provider` ∈ `meta_ads | google_ads | website_form | webhook | crm`. Today only the inbound Meta webhook (`/webhooks/meta-leads`) exists; leads it creates (`lead_source = "meta_ads"`) already appear in the Activity tab.

### 4.8 Notifications — capability `notifications.feed`
```
GET  /notifications            → [{ id, title, body, created_at, read, href? }]
POST /notifications/read-all   → 204
```

### 4.9 Settings
- `PATCH /auth/me` `{ full_name, email }` — `settings.profileUpdate`
- `PATCH /workspace/profile` `{ name }` — `settings.workspaceUpdate`
- `POST /auth/change-password` `{ current_password, new_password }` — `settings.passwordChange`
- `GET/PUT /auth/me/notification-preferences` `{ hotLead, callback, lowBalance, sourceError, weekly }` — `settings.notificationsSync` (today stored in `localStorage` on the device only)

### 4.10 Billing checkout — capability `billing.checkout`
The backend already has `POST /billing/create-order` and `POST /billing/verify-payment`. To finish the flow the frontend needs to load Razorpay Checkout (`checkout.razorpay.com/v1/checkout.js`), open it with `order_id` + `key_id`, then call `verify-payment`. **Not implemented in the frontend yet**; the “Continue to payment” button stays disabled. Please confirm the order flow and the public `key_id` handling before we wire it.

### 4.11 Developer API usage — capability `developers.usage`
`GET /api-keys/usage?days=30` → `[{ key_id, date, requests, errors }]`.

### 4.12 Realtime (future)
The header polls `GET /channels/live` every 15 s, and Incoming calls polls `/calls` every 30 s. Suggested replacement: **Server-Sent Events** at `GET /events` (auth via cookie or `?token=`), one JSON event per line:
```
event: call.updated   data: { "call_id": 1, "status": "in-progress", "agent_id": 3, "direction": "outbound" }
event: call.completed data: { "call_id": 1, "duration_seconds": 75, "outcome": "interested" }
event: lead.created   data: { "lead_id": 9, "source": "meta_ads" }
event: wallet.updated data: { "balance_inr": 412.5 }
event: live.updated   data: { "active_calls_count": 2, "burn_rate_inr_per_min": 11.0, "total_channels": 5 }
```
Swap point in the frontend: the `pollMs` option of `useAsync` in `components/layout/Topbar.tsx` and `app/(app)/incoming-calls/page.tsx`.

---

## 5. Data structures (domain ↔ wire)

The UI only uses domain types in `frontend/src/types/domain.ts`; wire types live in `frontend/src/types/api.ts`; mappings live in `frontend/src/services/adapters.ts` (unit-tested).

| Domain | Wire source | Notes |
|---|---|---|
| `Employee` | `AgentResponse` | `status = is_active ? "active" : "paused"`; `instructions = system_prompt`; structured fields are `null` until §4.1 |
| `Lead` | `LeadItemResponse` (`/leads`) | `outcome` from `outcome`/`status` via `toOutcome`; `temperature` from `sentiment` (`Hot`→hot, `Warm/Positive`→warm, `Cold/Negative`→cold) or `captured_info.lead_interest`; `capturedInfo` values stringified |
| `Conversation` | `CallResponse` (+ `log`) | `transcript` parsed from `"Agent: … User: …"` into turns; `recordingAvailable = !!recording_url`; employee name from the `/agents` id→name map |
| `Campaign` | `CampaignResponse` | `employeeName` from the id→name map |
| `Channel` | `ChannelResponse` | `type` always `"phone"` today |
| `Performance` | `PerformanceResponse` | `byChannel`, `businessHours`, `leaderboard` are `null` until §4.4 |
| `Wallet` / `Transaction` | `WalletSummaryResponse` / `TransactionItemResponse` | `transaction_type` `credit`/`debit` |
| `ApiKey` / `Webhook` / `Member` | respective responses | full API key secret is shown once and never stored |

Transcript format: the parser accepts speaker labels `Agent|AI|Assistant|Bot` (agent) and `User|Customer|Caller|Human` (customer). 🟡 **PROPOSED:** return structured turns `[{ "speaker": "agent"|"customer", "text": "...", "start_ms": 1200 }]` instead of a single string.

---

## 6. File uploads
- `POST /campaigns/{id}/upload-csv`, multipart field **`file`**, `.csv`, ≤ 10 MB (frontend-side check). Response keys used: `leads_added`, `total_rows_processed`, `duplicates_skipped`, `invalid_numbers_skipped`, `dnd_scrubbed_blocked` ✅.
- 🟡 Please document the accepted CSV columns (the UI tells users: `name`, `phone` required; `city` and any extra columns optional).

## 7. Exports
- Leads: `GET /leads/export` ✅ (downloaded via `fetch` with the auth header, saved as a Blob).
- Conversations: 🟡 `GET /calls/export` proposed; today the UI exports the current page client-side with CSV formula-injection protection.

## 8. How to ship a proposed feature (checklist)
1. Implement the endpoint in the backend.
2. Update `frontend/src/types/api.ts` with the wire shape.
3. Implement the API branch in the matching service (`frontend/src/services/<domain>.ts`, `apiImpl`) and map it in `adapters.ts`.
4. Flip the flag in `frontend/src/lib/capabilities.ts`.
5. Move the item in this document from 🟡 to ✅.

## 9. How this contract was verified
On 2026-11-27 the backend was started locally (SQLite, placeholder `OPENAI_API_KEY`), the frontend dev server was started with `NEXT_PUBLIC_DATA_MODE=api`, and a script exercised **every ✅ endpoint above through the Next.js proxy** — including 401 (bad login / no token), 422 (agent validation), 400 (duplicate phone), multipart CSV upload and CSV export. Result: **42 passed, 0 failed**. No backend files were modified.
