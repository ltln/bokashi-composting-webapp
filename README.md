# bokashi-composting-webapp

**Bếp Gọn – Rác Đúng**: a Vietnamese, mobile-first guide to building a DIY Bokashi
bin in a rented room. Spec: [`AGENTS.md`](AGENTS.md). Plan: [`docs/PLAN.md`](docs/PLAN.md).
Design boards: [`docs/design/`](docs/design/README.md).

## Layout
- `apps/web`: Next.js (App Router) + Tailwind. `/api/*` is proxied to the Go API.
- `apps/api`: Go (chi, pgx + sqlc, goose).
- `packages/contracts`: `events.json` and `openapi.yaml`, the source of truth for generated Go/TS.
- `infra/docker-compose.yml`: local Postgres 16.

## Getting started
Requires Docker and Node 22+ (pnpm via corepack). Go 1.26+ is optional: without it,
Go commands run in a container.

```sh
cp .env.example .env
corepack pnpm install
make db          # start Postgres
make migrate     # goose up
make dev         # API on :8080, web on :3000 (needs Go locally)
```

| Command | What |
|---|---|
| `make build` | Build both Docker images, as PR CI does |
| `make test` | Go tests, web lint and typecheck |
| `make gen` | sqlc, the event-enum generator and openapi-typescript. Commit the output. |
| `make migrate` | Apply migrations (`api migrate up`) |
| `make admin EMAIL=a@b.c` | Promote a user who has logged in once to admin |

## Admins
There is no admin UI. The person logs in with Google once, then run
`make admin EMAIL=someone@example.com`, which executes
`UPDATE users SET is_admin = true WHERE email = …`.
