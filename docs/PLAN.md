# Bếp Gọn – Rác Đúng · Implementation Plan

Monorepo full-stack app: **Next.js + Tailwind CSS** frontend and **Go** backend.
Built from the design canvas "Bếp Gọn – Rác Đúng · Web App Prototype"
(https://claude.ai/artifact/EXpQLcEuR3uSV8xMzb8DVo).

---

## 1. What the design asks for

A Vietnamese-language, mobile-first guide to building a DIY Bokashi compost bin in a rented room. It has three parts:

| Area | Screens in design | Notes |
|---|---|---|
| **Login** | `Login` (mobile), `DeskLogin` | Google OAuth only. Hero SVG bin illustration plus "Tiếp tục với Google". Links to Terms and Privacy. |
| **Tab 1 · Thiết lập thùng** (bin setup) | `Main` (Step 1), `Step2`, `Step3`, `DeskSetup` | 3 steps: false bottom → layered loading → anaerobic seal. Each step has an animated SVG cross-section, pause/replay, a segmented progress bar for sub-steps, a step switcher (1·Đáy giả / 2·Nạp lớp / 3·Khóa khí) and a checklist card. |
| **Tab 2 · Cẩm nang sự cố** (troubleshooting) | `FaqList`, `Faq1`–`Faq5`, `DeskFaq` | 5 issues: smell, fruit flies/maggots, leachate, white vs green/black mold, disposal after fermenting. Each has an animated SVG, 3–4 sub-steps, and "Sự cố tiếp theo". |
| **Admin · Tracking** | `Tracking` (desktop) | Dashboard over `Web_Access_Logs`: KPIs, "most-viewed feature" bar chart, events by type, device split, a recent-logs table with a `Feature_Target` filter, date-range and device filters, CSV export and a chart download for the report. |

Shared shell: a header with the logo and app name, plus a bottom tab nav on mobile. The Share button in the design is dropped. Desktop variants use the full-width layout.

**Visual tokens (from design):**
- Font: Be Vietnam Pro 400/500/600/700
- Colors: ground `#F6F7F2`, ink `#1E2B22`, muted `#56635A`, primary `#2F6B45`, primary-dark `#1F4D31`, surface-tint `#E8EFE2`, border `#D3DCCB`, accent-orange `#E07A2E`, brown `#8A7350` / `#5B4A33`, and a per-FAQ tint pair for each of the five issues
- Radii: 12 / 14 / 18 / 20 / 24 px
- Touch targets: ≥44 px
- Background motif: a tiled image, 280 px

**Animation constraint (design note):** use 2D SVG with CSS that animates only `transform` and `opacity`. No 3D library. Animations must stop under `prefers-reduced-motion`.

**Tracking spec (design notes):**

| Event_Type | When | Feature_Target |
|---|---|---|
| `page_view` | App opened after login | — |
| `switch_tab` | Switching tabs | `Tab_1_Setup`, `Tab_2_FAQ` |
| `view_3d_step` | Selecting a setup step | `3D_Setup_Layer1`, `3D_Setup_Layer2`, `3D_Setup_Layer3` |
| `click_faq_3d` | Opening an FAQ | `FAQ_1_Smell`, `FAQ_2_Maggots`, `FAQ_3_Liquid`, `FAQ_4_Mold`, `FAQ_5_Disposal` |

Every row records: `Timestamp`, `Session_ID` (anonymous), `Event_Type`, `Feature_Target`, `Device_Info`. Logs hold no email or name. If unique users must be counted, store a **hashed** `User_ID`.

**Acceptance criteria (design note "Nghiệm thu Squad 3"):**
1. Deployed on a public domain and smooth in mobile browsers.
2. All 3 setup steps and all 5 FAQ animations are present.
3. 100% of events are stored with a timestamp, and the "most-viewed feature" chart can be exported for the report.

---

## 2. Repository layout

```
bokashi-composting-webapp/
├── apps/
│   ├── web/                    # Next.js (App Router) + Tailwind
│   │   ├── app/
│   │   │   ├── (auth)/login/page.tsx
│   │   │   ├── (app)/layout.tsx          # header + bottom nav / desktop shell, auth guard
│   │   │   ├── (app)/setup/[step]/page.tsx   # step = 1|2|3
│   │   │   ├── (app)/faq/page.tsx
│   │   │   ├── (app)/faq/[slug]/page.tsx     # smell|maggots|liquid|mold|disposal
│   │   │   ├── admin/page.tsx                # tracking dashboard (admin only)
│   │   │   ├── terms/ privacy/               # static legal pages
│   │   │   └── layout.tsx                    # font, globals
│   │   ├── components/
│   │   │   ├── shell/ (Header, BottomNav, DesktopNav)
│   │   │   ├── player/ (AnimationStage, PlayerControls, SegmentProgress)
│   │   │   ├── illustrations/ (BinBase.tsx, setup/Step1..3.tsx, faq/Faq1..5.tsx)
│   │   │   ├── setup/ (StepSwitcher, StepChecklist)
│   │   │   ├── faq/ (FaqCard, FaqDetail)
│   │   │   └── admin/ (KpiTile, FeatureBarChart, EventTypeBars, DeviceSplit, LogsTable, Filters)
│   │   ├── content/            # typed Vietnamese copy: setupSteps.ts, faqs.ts
│   │   ├── lib/ (api.ts, tracking.ts, session.ts)
│   │   ├── app/api/[...path]/route.ts  # runtime proxy → Go API (reads API_INTERNAL_URL)
│   │   ├── middleware.ts       # redirect unauthenticated → /login
│   │   ├── tailwind.config.ts  # design tokens
│   │   └── Dockerfile          # standalone Next build; context = repo root
│   └── api/                    # Go service
│       ├── cmd/api/main.go
│       ├── internal/
│       │   ├── config/         # env parsing
│       │   ├── http/           # router, middleware (CORS, auth, rate limit, logging)
│       │   ├── auth/           # Google OAuth, sessions, admin check (users.is_admin)
│       │   ├── events/         # ingest handler + validation (enum whitelist)
│       │   ├── analytics/      # aggregate queries, CSV export
│       │   └── store/          # sqlc-generated queries (pgx)
│       ├── db/
│       │   ├── migrations/     # goose SQL migrations
│       │   └── queries/        # *.sql for sqlc
│       ├── sqlc.yaml
│       └── Dockerfile
├── packages/
│   └── contracts/              # source of truth shared by both apps
│       ├── openapi.yaml        # API spec
│       ├── events.json         # Event_Type / Feature_Target enums
│       └── ts/                 # generated TS types (openapi-typescript)
├── infra/
│   ├── docker-compose.yml      # postgres for local dev
│   └── deploy/                 # compose/fly files that pull the GHCR images
├── .github/workflows/
│   ├── pr.yml                  # PR → main: build both images, no push
│   └── release.yml             # push to main (merged PR): build + push to GHCR
├── AGENTS.md                   # agent spec: what this project is + hard rules
├── CLAUDE.md                   # "@AGENTS.md" so Claude Code loads the spec
├── package.json  pnpm-workspace.yaml  turbo.json
├── Makefile                    # make dev | build | test | gen | migrate | admin
└── README.md
```

**Tooling choices**
- **pnpm workspaces + Turborepo** for the JS side. Go keeps its own module at `apps/api/go.mod`. A root `Makefile` wraps both stacks: `make dev` runs `docker compose up db`, `air` (Go hot reload) and `next dev` together.
- **Contracts first.** `packages/contracts/events.json` lists the event and target enums. A small generator emits a Go file (`internal/events/enums_gen.go`) and a TS file. This keeps the frontend and the backend validator in sync, which is what guarantees "100% of events" stay valid.
- **OpenAPI → TS types** via `openapi-typescript`. On the Go side, write handlers by hand against the spec, or use `oapi-codegen` for types only.

---

## 3. Backend (Go)

**Stack:**
- Go 1.23+ and `chi` router
- `pgx/v5` + `sqlc`, with `goose` migrations
- `golang.org/x/oauth2` + `google.golang.org/api/idtoken`
- `log/slog`
- `httprate` for rate limiting

### 3.1 Data model (PostgreSQL)

```sql
-- users: only needed for login; PII lives here, never in logs
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_sub    TEXT UNIQUE NOT NULL,
  email         TEXT NOT NULL,
  name          TEXT,
  avatar_url    TEXT,
  is_admin      BOOLEAN NOT NULL DEFAULT false,  -- set manually, see below
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sessions (           -- server-side auth sessions
  id            TEXT PRIMARY KEY, -- random 32 bytes, base64url
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE event_type AS ENUM ('page_view','switch_tab','view_3d_step','click_faq_3d');

CREATE TABLE web_access_logs (
  id             BIGSERIAL PRIMARY KEY,
  ts             TIMESTAMPTZ NOT NULL DEFAULT now(),  -- server receive time (authoritative)
  client_ts      TIMESTAMPTZ,                         -- client-reported time
  session_id     TEXT NOT NULL,                       -- anonymous, rotates per browser session
  user_hash      TEXT,                                -- HMAC-SHA256(user_id, secret), optional
  event_type     event_type NOT NULL,
  feature_target TEXT,                                -- validated against enum list
  device_type    TEXT NOT NULL,                       -- mobile|desktop|tablet
  device_info    TEXT                                 -- trimmed UA / OS / browser
);
CREATE INDEX ON web_access_logs (ts DESC);
CREATE INDEX ON web_access_logs (feature_target, ts);
CREATE INDEX ON web_access_logs (event_type, ts);
```

- Logs are joined to users only through `user_hash` (an HMAC with a server secret). The hash cannot be reversed without the secret, as the design's privacy note asks.
- **Storage is Postgres only.** Any managed Postgres (Neon, Supabase, Fly Postgres) is just a hosting choice.
- **Admins are assigned by hand.** There is no allowlist or admin UI. The person logs in with Google once, then someone runs:
  ```sql
  UPDATE users SET is_admin = true WHERE email = 'someone@example.com';
  ```
  `make admin EMAIL=…` wraps this command, and the README documents it.

### 3.2 API

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/auth/google/login` | — | Redirect to Google (state + PKCE cookie) |
| GET | `/api/auth/google/callback` | — | Exchange code, verify ID token, upsert user, set `sid` cookie, redirect to `/setup/1` |
| POST | `/api/auth/logout` | user | Delete session |
| GET | `/api/me` | user | `{name, avatarUrl, isAdmin}` |
| POST | `/api/events` | user | Batch ingest `[{eventType, featureTarget, clientTs, sessionId}]`, max 50 per call |
| GET | `/api/admin/summary?range=&device=` | admin | KPIs: total events, unique sessions, page_views, mobile % |
| GET | `/api/admin/features?range=&device=&tab=` | admin | Counts per `feature_target`, sorted |
| GET | `/api/admin/event-types?range=&device=` | admin | Counts per type |
| GET | `/api/admin/logs?range=&device=&target=&cursor=` | admin | Paginated recent logs |
| GET | `/api/admin/export.csv?range=&device=` | admin | Streamed CSV of raw logs |
| GET | `/healthz` | — | Liveness |

Events require a valid session. The login screen is not tracked.

**Key behaviors**
- **Ingest validation.** Reject unknown `eventType` and `featureTarget` combinations using the generated enum table. Derive `device_type` and `device_info` on the server from `User-Agent` and `Sec-CH-UA-Mobile`, never trusting the client for this. Rate-limit per session.
- **Server timestamp.** `ts` is stamped on the server so every row has a reliable timestamp. `client_ts` is kept for ordering offline batches.
- **Admin access.** Admin endpoints read `users.is_admin` through the session → user join on every request, so a manual DB change takes effect immediately.
- **Cookies.** `sid` is `HttpOnly; Secure; SameSite=Lax`. Next.js proxies `/api/*` to the Go service through a route handler, so the browser sees one origin: no CORS and no third-party cookie problems.

### 3.3 Caching: no Redis (decision)
Redis is deliberately left out:
- **Sessions:** one indexed primary-key lookup in Postgres per request.
- **Rate limiting:** in-process `httprate` is enough for a single API instance.
- **Dashboard:** aggregates over an indexed `web_access_logs` table, up to low millions of rows, return in milliseconds for a handful of admins.

**When to revisit:**
- several API instances that need a shared rate limiter;
- dashboard queries slower than about 200 ms;
- tens of millions of log rows.

Even then, try a Postgres materialized view of daily rollups first, and add Redis only behind a small `cache` interface.

---

## 4. Frontend (Next.js + Tailwind)

**Stack:**
- Next.js (latest stable, App Router, TypeScript) with Tailwind CSS
- `next/font` for Be Vietnam Pro (subset `vietnamese`)
- Charts in `recharts` (admin only, loaded with a dynamic import)
- Data fetching: `swr` or TanStack Query for the admin page

### 4.1 Routing and auth
- `middleware.ts` checks for the `sid` cookie and redirects to `/login` when it is missing. Server components call `/api/me` to confirm the session. `/admin` returns 404 for non-admins.
- "Tiếp tục với Google" is a plain `<a href="/api/auth/google/login">`.
- **API proxy.** `app/api/[...path]/route.ts` forwards requests, cookies and redirects to `API_INTERNAL_URL`, which it reads when the server starts. A `next.config` rewrite would fix the API address at build time; the proxy lets one web image run in every environment.

### 4.2 Design system in Tailwind
- Put the tokens from §1 in `tailwind.config.ts` under `colors.bk.*`, plus `borderRadius` and `fontFamily`, and add a `motion-safe:` animation utility per keyframe (`drop`, `fall`, `rise`, `hover`, `float`).
- Build the base components once: `Card`, `Pill`, `IconButton` (44 px), `NumberBadge` (done / current / upcoming states, as in the checklists) and `SegmentProgress`.

### 4.3 Animation player (core reusable piece)
- `<AnimationStage>` hosts an illustration and a caption bubble. `<PlayerControls>` provides pause/play, the segmented progress bar, a counter (`2/3`) and replay.
- Each illustration is a React SVG component that takes `activeSubstep` and `paused` props. A small hook (`useSubstepTimeline(durationsMs[])`) advances sub-steps with `requestAnimationFrame` and syncs three things: the caption, the highlighted checklist row (orange "current" state) and the progress bar.
- CSS animations only, on `transform` and `opacity`. Pausing sets `animation-play-state: paused` on the stage. `prefers-reduced-motion` shows the final frame of each sub-step, and the user steps through manually.
- `BinBase.tsx` draws the shared bin cross-section: bin walls, handles, can layer and newspaper balls. Each step and each FAQ only adds its own layers on top, which keeps bundles small.

### 4.4 Content
- `content/setupSteps.ts` and `content/faqs.ts` hold typed objects: title, badge, sub-steps (caption plus checklist text), tint colors, `featureTarget` and slug. The text is copied verbatim from the design boards. No CMS is needed for v1.

### 4.5 Tracking client (`lib/tracking.ts`)
- **Session ID.** `sessionId = crypto.randomUUID()`, stored in `sessionStorage`, so it is anonymous and resets per browser session.
- **Firing points.**
  - `track('page_view')` fires once on the first render of the authenticated `(app)` layout. The tracker is never mounted on `/login`.
  - `track('switch_tab', 'Tab_1_Setup' | 'Tab_2_FAQ')` fires from bottom-nav and desktop-nav clicks.
  - `track('view_3d_step', '3D_Setup_LayerN')` fires on step-route mount.
  - `track('click_faq_3d', 'FAQ_N_…')` fires on FAQ-detail mount.
- **Delivery.** Events are queued in memory and flushed every 3 s or at 10 events. On `visibilitychange=hidden`, the queue is flushed with `navigator.sendBeacon` so no events are lost when the tab closes. Failed sends retry with backoff and are kept in `localStorage` until delivered.

### 4.6 Admin dashboard (`/admin`)
Recreates the `Tracking` board:
- **Filters.** Range segmented control (today / 7 days / 30 days / whole campaign) and device filter (all / mobile / desktop).
- **KPIs.** 4 KPI tiles.
- **Charts.** Horizontal bar chart of features, colored by Tab 1 / Tab 2, plus bars by event type and a device split bar.
- **Recent logs.** Table with a `Feature_Target` search, cursor pagination and horizontal scroll on narrow screens.
- **Exports.**
  - "Xuất CSV" opens `/api/admin/export.csv`.
  - "Tải biểu đồ cho báo cáo" exports the feature chart as a PNG on the client (serialize SVG → canvas → `toBlob`), which meets the report acceptance criterion.
- **Live data.** "Real-time" indicator: poll every 15 s (SSE can be added later if needed).

### 4.7 Responsive behavior
- **Mobile (<768 px).** Matches the 390-wide boards: bottom nav and stacked content.
- **Desktop (≥1024 px).** Matches `DeskSetup` and `DeskFaq`: a top or side nav, the illustration and the checklist side by side, and the step or FAQ list as a left rail. Both breakpoints reuse the same components.

---

## 5. Security and privacy
- No PII in `web_access_logs`. `user_hash` is an HMAC. Device info is trimmed: no full UA fingerprint and no IP stored.
- OAuth `state` plus PKCE, and server-side sessions that can be revoked.
- Same-origin cookies and CSRF protection on POST (`SameSite=Lax` plus an `Origin` header check).
- Rate limiting on `/api/events` and the auth endpoints.
- Static Terms and Privacy pages, both linked from login. The privacy page explains the anonymous tracking.

---

## 6. Dev experience and CI
- `make admin EMAIL=…` promotes an existing user to admin via `psql`.
- `make dev` starts Postgres (docker), the Go API with `air` on :8080 and Next on :3000. The `/api/*` proxy points at `API_INTERNAL_URL=http://localhost:8080`.
- `make build` builds both Docker images locally, the same way PR CI does.
- `make gen` runs sqlc, the enum generator and openapi-typescript.
- `make migrate` runs goose up.
- `.env.example` holds `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `OAUTH_REDIRECT_URL`, `SESSION_SECRET`, `USER_HASH_SECRET` and `APP_ORIGIN`.
- **Git workflow (hard rules, also in `AGENTS.md`):**
  - Never commit or push to `main`. Work on a branch named `feat/…`, `fix/…`, `chore/…` or `docs/…`.
  - Commit messages and PR titles follow Conventional Commits (`type(scope): subject`), for example `feat(web): add faq list`. See `AGENTS.md` for the allowed types and scopes.
  - Every change reaches `main` through a PR (`gh pr create`). PR CI must be green before merging.
  - Enforce this on GitHub with branch protection on `main`: require a PR and the `build (web)` and `build (api)` checks, and block force-pushes.
- **CI (GitHub Actions):**
  - **`pr.yml`** runs on `pull_request` to `main`. It only checks that everything builds: a matrix of `web` and `api` runs `docker/build-push-action` with `push: false` and the GitHub Actions cache. The Dockerfiles run `pnpm build` and `go build`, so this checks both apps and both Dockerfiles. New pushes to a PR cancel the previous run.
  - **`release.yml`** runs on `push` to `main`, which is what a merged PR produces. It logs in to GHCR with `GITHUB_TOKEN` (`packages: write`), then builds and pushes `ghcr.io/ltln/bokashi-web` and `ghcr.io/ltln/bokashi-api`, tagged `latest` and `sha-<short>`.
  - Lint and tests run locally (`make test`) for now and can be added to `pr.yml` later.

---

## 7. Deployment (public domain)

**Recommended setup:**
Both apps ship as the GHCR images that `release.yml` builds. Deploying means pulling a tag.
- **Web.** `ghcr.io/ltln/bokashi-web` (Next standalone on Node), with `API_INTERNAL_URL` set to the API's internal address.
- **API.** `ghcr.io/ltln/bokashi-api` (distroless, about 15 MB). Run goose migrations from the same image on deploy.
- **Where.** Fly.io or Google Cloud Run for both images, or one VPS running docker-compose with Caddy for TLS.
- **DB.** Managed Postgres (Neon, Supabase or Fly Postgres). No cache service.
- **Domain.** `app.<domain>` → web. The API is reached only through the web's `/api` proxy, so cookies stay first-party.

Add a Lighthouse mobile check to CI as a performance guard. Target LCP < 2.5 s on mid-range Android, with 60 fps animations (transform and opacity only).

---

## 8. Milestones

| # | Milestone | Deliverables |
|---|---|---|
| M0 | Scaffold (0.5 d) | Monorepo, pnpm/turbo, Go module, docker-compose, Makefile, Tailwind tokens, both Dockerfiles (so `pr.yml` and `release.yml` start building), branch protection on `main` |
| M1 | Auth (1 d) | Google OAuth flow in Go, sessions, `/api/me`, admin flag read from DB, `make admin`, Next middleware, Login page (mobile and desktop) |
| M2 | App shell + content (1 d) | Header, bottom/desktop nav, typed content files |
| M3 | Animation player + Tab 1 (2 d) | `BinBase`, player and progress hook, Steps 1–3 illustrations and checklists, reduced-motion handling |
| M4 | Tab 2 (2 d) | FAQ list, 5 FAQ illustrations and details, "next issue" navigation |
| M5 | Tracking pipeline (1 d) | Contracts and enum generation, `/api/events`, client tracker with beacon flush, tests proving all 4 event types and 10 targets are stored |
| M6 | Admin dashboard (1.5 d) | Aggregate endpoints, dashboard UI, CSV export, chart PNG download |
| M7 | Hardening + deploy (1 d) | Rate limits, privacy page, Lighthouse pass, prod deploy on public domain, acceptance checklist sign-off |

---

## 9. Decisions

| Topic | Decision |
|---|---|
| Login-screen tracking | Not tracked. All events require an authenticated session. |
| Storage | Postgres only. |
| Admins | Assigned manually: `UPDATE users SET is_admin = true …` or `make admin`. |
| Share button | Dropped. |
| Redis / caching | Not needed now (see §3.3). |
| Git workflow | Branch + PR required. No direct pushes to `main`. |
| CI | PR: build only. Merge to `main`: build and push images to GHCR. |
| Agent spec | `AGENTS.md`, loaded by Claude Code through `CLAUDE.md`. |
| Commit messages | Conventional Commits for every commit and PR title. |

## 10. Open questions
1. **Languages.** Vietnamese only, or add an i18n scaffold now?
2. **Background motif.** The tiled background image is an uploaded asset in the canvas. It needs to be exported into `apps/web/public/`.
