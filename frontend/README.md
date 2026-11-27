# NexoAgent — Frontend

The web app for **NexoAgent**: an AI-employee platform that calls new leads instantly, works through lead lists, answers incoming calls, qualifies leads and captures results.

| | |
|---|---|
| **Frontend (this folder)** | UI, routing, state, API service layer, mock/demo data, integration contract |
| **Backend (`../backend`)** | FastAPI REST API, database, telephony, voice AI, billing, webhooks — owned by the backend developer |
| **Integration contract** | [`../docs/FRONTEND_BACKEND_CONTRACT.md`](../docs/FRONTEND_BACKEND_CONTRACT.md) |
| **Status** | All 14 app pages + login are implemented. Runs fully on demo data, or against the real backend through a proxy. Features the backend doesn't support yet are visibly gated (see [Known limitations](#known-limitations)). |

---

## Quick start

**Prerequisites:** Node.js ≥ 20.9 (tested on Node 26 / npm 11).

```bash
cd frontend
npm install
cp .env.example .env.local     # optional — defaults to demo mode
npm run dev                    # http://localhost:3000
```

By default the app runs in **demo mode**: realistic, clearly labelled demo data generated in the browser. No backend or sign-in needed.

### Run against the backend

```bash
# terminal 1 — backend (see ../backend/README.md)
cd backend && uvicorn app.main:app --reload --port 8000

# terminal 2 — frontend
cd frontend
# in .env.local:
#   NEXT_PUBLIC_DATA_MODE=api
#   BACKEND_ORIGIN=http://127.0.0.1:8000
npm run dev
```
Open http://localhost:3000 → you'll be redirected to `/login`. Use **Register** to create a workspace, or sign in with an existing account.

> Backend setup note: `backend/requirements.txt` currently omits the web-server packages, and the app needs `OPENAI_API_KEY` set to import. See contract §3 item 10.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build (also type-checks) |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests (adapters, errors, CSV, mock queries, wizard validation) |

> Production preview in demo mode shows a red “DEMO data” banner on purpose. Set `NEXT_PUBLIC_ALLOW_MOCK_IN_PRODUCTION=true` for an intentional public demo.

---

## Environment variables

All are documented in [`.env.example`](.env.example). `NEXT_PUBLIC_*` values are inlined into the browser bundle — **never put secrets in them.**

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_DATA_MODE` | `mock` | `mock` = demo data in the browser; `api` = real backend (requires sign-in) |
| `BACKEND_ORIGIN` | `http://127.0.0.1:8000` | **Server-side only.** Where Next.js proxies `/api/v1/*`. Change this to point at another backend. |
| `NEXT_PUBLIC_API_BASE_URL` | `/api/v1` | Base path the browser calls. Keep the default to use the proxy; set an absolute URL only if the backend enables CORS. |
| `NEXT_PUBLIC_ALLOW_MOCK_IN_PRODUCTION` | `false` | Allows a production build to run on demo data without the warning banner. |

**Why a proxy?** The backend has no CORS middleware. `next.config.mjs` rewrites `/api/v1/:path*` → `${BACKEND_ORIGIN}/api/v1/:path*`, so the browser only talks to the Next.js origin and the backend needs no changes.

---

## Architecture

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 3.4 · lucide-react icons · Recharts (charts) · clsx · Vitest. No other runtime dependencies. There's no global state library: server data lives in a small `useAsync` hook per page, and app-wide state (session, theme, toasts) lives in three React contexts.

```
frontend/
├── next.config.mjs            # /api/v1 proxy + security headers
├── tailwind.config.ts         # maps colour tokens → CSS variables
├── .env.example
└── src/
    ├── app/                   # Routes (App Router)
    │   ├── layout.tsx         # Providers: Theme → Toast → Session
    │   ├── globals.css        # Design tokens (light + dark), chart palette
    │   ├── login/             # Sign in / register (api mode) or "Continue to demo"
    │   └── (app)/             # Authenticated shell (sidebar + top bar)
    │       ├── page.tsx                    # Home
    │       ├── employees/                  # Your team, [id] detail, new (wizard), templates
    │       ├── leads/  conversations/  performance/
    │       ├── campaigns/  instant-leads/  incoming-calls/
    │       ├── channels/  billing/  settings/  developers/
    │       └── error.tsx                   # Route error boundary
    ├── components/
    │   ├── ui/                # Design-system primitives (no data fetching)
    │   ├── layout/            # AppShell, Sidebar, Topbar, CommandPalette, nav config
    │   ├── charts/            # ChartCard, TimeSeriesChart, ColumnChart, BarList, DataTable
    │   ├── domain/            # Status/outcome badges
    │   └── providers/         # SessionProvider (auth guard), ThemeProvider
    ├── features/              # Larger feature modules used by pages
    │   ├── employees/         # Templates, template art, hire wizard, prompt compiler
    │   ├── conversations/     # ConversationSheet (summary, transcript, recording)
    │   └── leads/             # LeadSheet (details, follow-up)
    ├── services/              # ★ API service layer — one file per domain + adapters.ts
    ├── lib/
    │   ├── api/               # client.ts (only place that calls fetch), errors.ts, token.ts
    │   ├── capabilities.ts    # ★ which features the real backend supports
    │   ├── config.ts  labels.ts  utils.ts  csv.ts
    ├── mocks/                 # ★ Demo data layer (seed, in-memory db, query logic, scenarios)
    ├── hooks/useAsync.ts      # data fetching: loading / error / data / refetch / polling
    └── types/
        ├── api.ts             # Backend WIRE types (mirror Pydantic schemas)
        └── domain.ts          # UI DOMAIN types
```

### Data flow

```
Page / component ──► services/<domain>.ts ──┬─► mockImpl  ──► mocks/ (in-memory demo db)
   (domain types)        (one interface)    └─► apiImpl   ──► lib/api/client.ts ──► /api/v1 proxy ──► FastAPI
                                                   └─ adapters.ts maps wire → domain
```

- **Components never call `fetch`** and never import wire types. They call services and render domain types.
- **Each service** exports one object chosen at build time: `isMockMode ? mockImpl : apiImpl`. Both implement the same TypeScript interface, so pages can't tell them apart.
- **`lib/api/client.ts`** adds the bearer token and turns every failure into an `ApiError` with a `kind` (`network`, `validation`, `unauthorized`, …) and a user-safe `message`. 5xx details are never shown.
- **`adapters.ts`** is the only place that knows backend field names. If a backend schema changes, fix the adapter (it's unit-tested), not the pages.
- **Capabilities** (`lib/capabilities.ts`): for things the backend can't do yet, `can("x")` is `false` in API mode, and the UI renders the control disabled with a **“Needs backend”** hint. If a call slips through, the service throws `ApiError("unsupported")` and a toast explains it. Nothing pretends to succeed.

### Every data view has four states
`useAsync` + `States.tsx` give each page: a **loading** skeleton, an **error** state with retry (and a distinct “backend unreachable” variant), an **empty** state with a next step, and **data**. You can see each one using the demo scenarios below.

### Routing
App Router with a route group `(app)` for the authenticated shell. `SessionProvider` guards every route except `/login`. In API mode, users without a valid token go to `/login?next=…`; the `next` param only accepts same-site relative paths. Deep links supported: `/conversations?open=<id>`, `/campaigns?open=<id>&new=1`, `/leads?search=…&hot=1`, `/billing?add=1`, `/settings?tab=team`, `/employees/new?template=real-estate`.

---

## Mock (demo) data

- **Where:** `src/mocks/`. `seed.ts` deterministically generates a demo workspace (5 AI employees, ~100 leads and calls over 30 days, campaigns, numbers, transactions). `db.ts` keeps it in memory, `query.ts` holds the filtering/aggregation logic (unit-tested), and `scenario.ts` simulates latency and failures.
- **Clearly labelled:** a “Demo data” badge is always visible in the header. The production-build guard is described above.
- **Not persisted:** changes you make (hire an employee, create a campaign…) live until the page reloads. Nothing is sent anywhere.
- **No fake credentials or recordings:** demo mode never creates API keys or webhook secrets, and demo calls never have audio.
- **Demo scenarios:** *Settings → Preferences → Demo scenario* switches between **Populated**, **Empty workspace** and **Backend unreachable** so you can review empty and error states. The choice is stored in `localStorage`.
- **Removing mocks later:** delete the `mockImpl` objects and `src/mocks/`; pages don't change.

---

## Pages

| Route | Page | Backend status |
|---|---|---|
| `/` | **Home**: greeting, setup checklist (computed from real counts), 6 KPIs, 14-day call chart, quick actions, recent conversations/leads, employee activity | ✅ live data |
| `/employees` | **Your team**: search; filter by status, mode, language; grid/list; pause/activate, duplicate, delete | ✅ (mode filter needs backend) |
| `/employees/new` | **Hire wizard**, 7 steps: describe (big input, language, natural speech, calling-mode cards, templates) → name & voice → conversation → qualification → follow-ups → working hours → review | ✅ creates via `POST /agents`; structured settings are compiled into the prompt |
| `/employees/templates` | **Templates**: 8 industries with local SVG illustrations; prefills the wizard | frontend-only |
| `/employees/[id]` | **Employee detail**: overview, edit instructions (PATCH), activity (calls by agent) | ✅ |
| `/leads` | **Leads & results**: 4 KPIs, search, sort, filters (channel, employee, date, last contacted, outcome, hot), pipeline/list/grid views, pagination, export, lead detail with follow-up | ✅ (some filters / follow-up need backend) |
| `/conversations` | **Conversations**: filters, refresh, CSV export, detail sheet (summary, captured details, transcript, recording loader, metadata) | ✅ (search/date/channel filters need backend) |
| `/performance` | **Performance**: 7/30/90-day + custom range, employee/channel/issues/min-duration filters, 7 KPIs, calls over time, funnel, outcomes, by channel, business hours, leaderboard; every chart has a table view | ✅ core; breakdowns need backend |
| `/campaigns` | **Campaigns**: status tabs, progress, create (draft + optional CSV), upload, start (with confirmation), detail sheet with leads | ✅ (pause needs backend) |
| `/instant-leads` | **Instant leads**: how-it-works, activity, analytics, queue, sources, configuration, connect dialog | Activity ✅; rest needs backend |
| `/incoming-calls` | **Incoming calls**: KPIs, answering numbers, recent inbound calls, inbound behaviour | ✅ (reassigning needs backend) |
| `/channels` | **Numbers & channels**: list, add number (with DLT fields), configure sheet, channel types | ✅ list/add; edit needs backend |
| `/billing` | **Credits & billing**: balance, usage, daily spend chart, transactions (filter + paging), add-credits dialog | ✅; **checkout not wired** |
| `/settings` | **Settings**: Profile, Workspace, Team (add/role/deactivate/remove), Preferences (theme, data source, demo scenario), Notifications, Security | Team ✅; profile/password need backend |
| `/developers` | **Developers**: API keys (create shows the secret once, revoke), webhooks (masked secrets, test, delete), quickstart, usage | ✅ (api mode only); usage needs backend |
| `/login` | Sign in / register (api mode) or “Continue to demo” | ✅ |

---

## Reusable components

| Component | File | Notes |
|---|---|---|
| `Button`, `LinkButton` | `ui/Button.tsx` | primary/secondary/ghost/danger; loading state |
| `Badge`, `StatusDot` | `ui/Badge.tsx` | 7 semantic tones |
| `Card`, `CardHeader`, `DetailRow` | `ui/Card.tsx` | |
| `Input`, `Textarea`, `Select`, `Field`, `SearchInput` | `ui/Field.tsx` | `Field` wires label/hint/error + `aria-describedby` |
| `Switch`, `SwitchRow` | `ui/Switch.tsx` | `role="switch"` |
| `Tabs`, `Segmented` | `ui/Tabs.tsx` | arrow-key navigation; radio semantics |
| `Dialog`, `Sheet`, `ConfirmDialog` | `ui/Dialog.tsx` | focus trap, Esc, scroll lock, focus restore; bottom sheet on mobile |
| `Popover`, `MenuItem` | `ui/Popover.tsx` | outside-click / Esc close |
| `FilterMenu`, `ToggleChip` | `ui/FilterMenu.tsx` | `disabledReason` for backend-gated filters |
| `Tooltip` | `ui/Tooltip.tsx` | CSS, hover + focus |
| `EmptyState`, `ErrorState`, `Skeleton*` | `ui/States.tsx` | |
| `StatCard`, `PageHeader`, `Pagination`, `Avatar`, `Progress`, `NeedsBackend`, `BackendNotice` | `ui/Misc.tsx` | |
| `useToast` | `ui/Toast.tsx` | `toast.fromError(err)` picks the right message |
| `ChartCard`, `TimeSeriesChart`, `ColumnChart`, `BarList`, `DataTable` | `charts/Charts.tsx` | colour-vision-safe palette; legend + table view |
| `ConversationSheet`, `LeadSheet` | `features/*` | shared detail panels |
| `CommandPalette` | `layout/CommandPalette.tsx` | Ctrl/⌘ + K: pages + record search |

**Design system:** a light theme by default (dark is available) with tokens in `globals.css`. Neutral canvas, white cards, hairline borders, soft shadows, and one violet accent (`#6E56CF`). Chart colours (`--series-1..3`) passed the colour-vision-deficiency validator in both themes.

---

## Backend integration — how to connect a new endpoint

1. Read the relevant section of [`../docs/FRONTEND_BACKEND_CONTRACT.md`](../docs/FRONTEND_BACKEND_CONTRACT.md) (verified vs proposed).
2. Implement the endpoint in the backend.
3. Frontend: update `src/types/api.ts`, implement the `apiImpl` method in `src/services/<domain>.ts`, map it in `adapters.ts` (and add a test).
4. Flip the flag in `src/lib/capabilities.ts`.
5. Test with `NEXT_PUBLIC_DATA_MODE=api`.

### Testing the frontend against the backend
Run both servers as in [Run against the backend](#run-against-the-backend), register a workspace, then walk through: hire an employee → add a number → create a campaign with a CSV → check Leads, Conversations, Performance, Billing, Developers. Every backend call goes through `/api/v1` and is visible in the browser's Network tab.

---

## Collaboration guide

| Frontend developer works in | Backend developer works in |
|---|---|
| `frontend/**` | `backend/**` |
| `docs/FRONTEND_BACKEND_CONTRACT.md` (co-owned; update together) | |

- **Backend developer:** you shouldn't need to edit `frontend/` to ship an endpoint. If you change a response shape, note it in the contract (or ping the frontend developer). The only frontend files tied to backend shapes are `src/types/api.ts` and `src/services/adapters.ts`.
- **Frontend developer:** don't modify `backend/`. If the UI needs something new, add it to the contract as 🟡 PROPOSED and gate the UI with a capability flag.
- **Avoiding conflicts:** keep backend and frontend changes in separate commits/PRs. `package-lock.json` is frontend-only. Contract-doc edits go in their own small commits.

---

## Security notes

- No secrets in the repo or in `NEXT_PUBLIC_*` variables. `.env.local` is git-ignored.
- **Access token:** kept in memory plus `sessionStorage`, so it's cleared when the tab closes. It's never written to `localStorage` or cookies. A 401 clears it everywhere. Recommended upgrade: a backend-set `httpOnly` cookie (contract §1.2).
- **`localStorage` is used only for non-sensitive UI preferences:** theme, sidebar collapsed, demo scenario, and notification toggles. Each use is commented in code.
- **API keys:** the full secret is held only in component state for the one-time reveal dialog. Webhook secrets are masked by default.
- **No `dangerouslySetInnerHTML`** except one static, first-party theme script in `<head>`. All user and backend text is rendered as React text.
- **Exports:** CSV exports escape values and neutralise spreadsheet formula injection.
- **Inputs:** login redirects accept only relative paths; webhook URLs must be https (http only for localhost); phone and email are validated before sending.
- **Error messages:** server errors (5xx) are never shown to users; 4xx `detail` is truncated.
- **Headers:** `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: DENY`, `Permissions-Policy` are set in `next.config.mjs`.
- **Mock mode** is always labelled and is blocked (with a banner) in production builds unless explicitly allowed.
- This is a frontend review only. Authorization, tenant isolation, rate limiting and webhook signing must be reviewed on the backend.

---

## Known limitations

- **Structured AI-employee settings** (calling mode, qualification questions, follow-ups, working hours) are compiled into `system_prompt`, because the backend stores only name/voice/language/prompt/opening line. The detail page shows “Not stored yet” for them in API mode.
- **Payments:** the add-credits dialog doesn't take payments; Razorpay checkout isn't wired.
- **Instant leads:** sources, queue, analytics and settings need backend APIs. The Activity tab works today.
- **Notifications feed, profile/workspace edit, password change and API usage** need backend endpoints.
- **Channel editing and campaign pause** need backend endpoints.
- **Conversations:** search/date/channel/direction filters need backend support, and CSV export covers only the current page.
- **Performance:** custom ranges and the by-channel / hourly / leaderboard breakdowns need backend support.
- **Voice previews:** there's no sample audio yet, so the voice picker shows descriptions only.
- **Realtime:** polling only (15 s header, 30 s incoming calls). SSE is proposed in the contract.
- **i18n:** the UI is English-only. Dates and numbers use the `en-IN` locale.
- Next.js `dev` writes an `AGENTS.md` into this folder automatically; it is harmless.

---

## Progress checklist

- [x] Repository audit; backend contract verified from source
- [x] Next.js + TypeScript + Tailwind scaffold, lint, type-check, tests
- [x] Design tokens (light/dark), UI primitives, responsive shell (collapsible sidebar, mobile drawer, Ctrl+K)
- [x] API client, error normalisation, auth/session guard, proxy
- [x] Mock data layer with scenarios (populated / empty / error)
- [x] Home, Team, Hire wizard, Templates, Employee detail
- [x] Leads, Conversations, Performance
- [x] Campaigns, Instant leads, Incoming calls
- [x] Numbers & channels, Credits & billing, Settings, Developers, Login
- [x] Integration contract + live verification against the backend (42/42 endpoint checks)
- [ ] Razorpay checkout flow (needs agreement on contract §4.10)
- [ ] Structured employee config (needs §4.1)
- [ ] Instant-lead sources / queue / analytics (needs §4.7)
- [ ] Realtime events (needs §4.12)
- [ ] End-to-end browser tests (e.g. Playwright) once flows stabilise

## Historical planning docs
`OUTPERO_EXACT_FRONTEND_BLUEPRINT.md`, `TEAMMATE_COMMANDS_GUIDE.md` and `docs/*.md` in this folder are the original planning notes. `docs/API_CONTRACTS.md` predates the current backend. **The authoritative contract is `../docs/FRONTEND_BACKEND_CONTRACT.md`.** Note that the planning docs describe a dark “obsidian” theme; the implemented product uses a light theme by default (with dark mode), per the latest product direction.
