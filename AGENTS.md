# AGENTS.md — Bếp Gọn – Rác Đúng

Spec for AI agents (and humans) working in this repo. The full product and technical plan is in [`docs/PLAN.md`](docs/PLAN.md). Read it before starting a milestone.

## What this project is
**Bếp Gọn – Rác Đúng** is a Vietnamese, mobile-first web app that teaches people in rented rooms to build and run a DIY **Bokashi compost bin**.

- **Login:** Google OAuth only.
- **Tab 1 · Thiết lập thùng:** 3 bin-setup steps:
  1. false bottom;
  2. layered loading;
  3. anaerobic seal.

  Each step has an animated 2D SVG cross-section, pause/replay, sub-step progress and a checklist.
- **Tab 2 · Cẩm nang sự cố:** 5 troubleshooting FAQs (smell, flies/maggots, leachate, mold, disposal), each with its own animation.
- **Tracking:** anonymous usage events go into `web_access_logs`.

  | Event | Feature_Target values |
  |---|---|
  | `page_view` | — |
  | `switch_tab` | `Tab_1_Setup`, `Tab_2_FAQ` |
  | `view_3d_step` | `3D_Setup_Layer1`–`3D_Setup_Layer3` |
  | `click_faq_3d` | `FAQ_1_Smell` … `FAQ_5_Disposal` |

  The login screen is **not** tracked.
- **Admin dashboard (`/admin`):** KPIs, most-viewed features, a logs table, CSV export and a chart PNG download.

Design source: https://claude.ai/artifact/EXpQLcEuR3uSV8xMzb8DVo

## Stack and layout
| Path | What |
|---|---|
| `apps/web` | Next.js (App Router, TypeScript) + Tailwind CSS. `/api/*` is proxied to the Go API through a route handler that reads `API_INTERNAL_URL`. |
| `apps/api` | Go: chi, pgx + sqlc, goose migrations, Google OAuth, server-side sessions. |
| `packages/contracts` | `openapi.yaml` and `events.json`, the single source of truth. Go and TS code is generated from them. |
| `infra/` | `docker-compose.yml` (local Postgres) and deploy files. |
| `.github/workflows/` | `pr.yml` (build check) and `release.yml` (push images to GHCR). |

**Storage:** PostgreSQL only. **No Redis.** See `docs/PLAN.md` §3.3 before proposing a cache.

## Commands
```
make dev                 # Postgres (docker) + Go API (air, :8080) + Next (:3000)
make build               # build both Docker images locally, the same as PR CI
make test                # Go + web tests
make gen                 # sqlc + enum generator + openapi-typescript
make migrate             # goose up
make admin EMAIL=a@b.c   # promote an existing user to admin
```

## Git workflow (hard rules)
1. **Never commit or push to `main`.** Before the first change, create a branch named `feat/…`, `fix/…`, `chore/…` or `docs/…`.
2. **Every change goes through a pull request** to `main`, opened with `gh pr create`. Never merge locally into `main`, push to it directly, or force-push it.
3. The PR's `build (web)` and `build (api)` checks must pass before merging.
4. Commit only when asked. Keep each commit focused on one change.
5. **Every commit message follows [Conventional Commits](https://www.conventionalcommits.org/):**
   ```
   <type>(<optional scope>): <subject>

   <optional body: what and why>

   <optional footer, e.g. BREAKING CHANGE: …>
   ```
   - **`type`** is one of `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore` or `revert`.
   - **`scope`** (optional) is one of `web`, `api`, `contracts`, `db`, `infra` or `ci`.
   - **Subject:** English, imperative mood, lower case, no trailing period, at most 72 characters.
   - Mark breaking changes with `!` after the type or scope (for example `feat(api)!: …`), or with a `BREAKING CHANGE:` footer.
   - Examples:
     - `feat(web): add step 2 layering animation`
     - `fix(api): reject unknown feature_target`
     - `ci: push images to ghcr on merge`
   - **Branch names** use the same type: `feat/step2-animation`, `fix/event-validation`.
   - **PR titles** follow the same format, because they become the squash-merge commit on `main`.

## CI/CD
- **On a PR to `main`:** `pr.yml` builds the `web` and `api` Docker images **without pushing them**. It's only a "does it build" check.
- **On push to `main`** (a merged PR): `release.yml` builds and pushes `ghcr.io/ltln/bokashi-web` and `ghcr.io/ltln/bokashi-api`, tagged `latest` and `sha-<short>`.
- Do not add steps that push images or deploy from PRs.

## Conventions
- **UI copy:** Vietnamese only. All copy lives in typed files under `apps/web/content/`; don't hardcode strings in components.
- **Design tokens:** colors, radii and the Be Vietnam Pro font come from `tailwind.config.ts`. Don't use ad-hoc hex values.
- **Animations:** 2D SVG plus CSS, animating **only `transform` and `opacity`**. No 3D or animation libraries. Always respect `prefers-reduced-motion`.
- **Touch targets:** at least 44 px. Use real `<button>` and `<a>` elements with `aria-label` on icon-only buttons.
- **Event names:** event types and targets come from `packages/contracts/events.json` and its generated code. Never hand-type them. After changing contracts or SQL, run `make gen` and commit the generated output.
- **Privacy:** no PII in `web_access_logs`. Use the anonymous `session_id` and the HMAC `user_hash` only.
- **Admins:** promoted manually in the database (`users.is_admin`). There is no allowlist or admin-management UI.
- **Out of scope unless asked:** a Share button, tracking on the login screen, Redis.
