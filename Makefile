# Bếp Gọn – Rác Đúng: one entry point for both stacks.
#   make dev | build | test | gen | migrate | admin EMAIL=a@b.c
#
# Docker is required (Postgres, sqlc). Go and pnpm are optional locally:
# without Go, Go commands run in a golang container; without pnpm, corepack is used.

SHELL := /bin/bash
.DEFAULT_GOAL := help

-include .env
export

GO_VERSION   := 1.26
SQLC_VERSION := 1.31.0
WEB_IMAGE    ?= ghcr.io/ltln/bokashi-web:dev
API_IMAGE    ?= ghcr.io/ltln/bokashi-api:dev
COMPOSE      := docker compose -f infra/docker-compose.yml
COMPOSE_NET  := bokashi_default
DATABASE_URL ?= postgres://bokashi:bokashi@localhost:5432/bokashi?sslmode=disable

DOCKER_USER := $(shell id -u):$(shell id -g)
PNPM := $(shell command -v pnpm >/dev/null 2>&1 && echo pnpm || echo "corepack pnpm")
HAVE_GO := $(shell command -v go >/dev/null 2>&1 && echo yes)

ifeq ($(HAVE_GO),yes)
GO := cd apps/api && go
else
GO := docker run --rm -u $(DOCKER_USER) -e HOME=/tmp -e GOCACHE=/tmp/go-build -e GOMODCACHE=/tmp/gomod \
	-v bokashi-gomod:/tmp/gomod -v $(CURDIR):/src -w /src/apps/api golang:$(GO_VERSION)-alpine go
endif

# Pinned so `make gen` output is identical on every machine.
SQLC := docker run --rm -u $(DOCKER_USER) -v $(CURDIR):/src -w /src/apps/api sqlc/sqlc:$(SQLC_VERSION)

.PHONY: help dev dev-api dev-web db build build-web build-api test gen migrate admin

help: ## Show targets
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  %-10s %s\n", $$1, $$2}'

db: ## Start local Postgres and wait until it is healthy
	$(COMPOSE) up -d --wait db

dev: db ## Postgres + Go API (air, :8080) + Next (:3000)
	@$(MAKE) -j2 --no-print-directory dev-api dev-web

dev-api:
	@if command -v air >/dev/null 2>&1; then cd apps/api && air; \
	elif command -v go >/dev/null 2>&1; then echo "air not found, using go run (no hot reload)"; cd apps/api && go run ./cmd/api serve; \
	else echo "make dev needs Go (and ideally air) installed locally"; exit 1; fi

dev-web:
	API_INTERNAL_URL=$${API_INTERNAL_URL:-http://localhost:8080} $(PNPM) --filter web dev

build: build-web build-api ## Build both Docker images (same as PR CI)

build-web:
	docker build -f apps/web/Dockerfile -t $(WEB_IMAGE) .

build-api:
	docker build -f apps/api/Dockerfile -t $(API_IMAGE) .

test: ## Go tests + web lint/typecheck
	$(GO) test ./...
	$(PNPM) --filter web lint
	$(PNPM) --filter web typecheck

gen: ## sqlc + enum generator + openapi-typescript
	$(SQLC) generate
	node packages/contracts/scripts/gen-enums.mjs
	$(PNPM) --filter @bokashi/contracts gen:openapi

migrate: ## goose up against $$DATABASE_URL
ifeq ($(HAVE_GO),yes)
	cd apps/api && go run ./cmd/api migrate up
else
	@# No local Go: run the API image on the compose network (db host = "db").
	docker build -q -f apps/api/Dockerfile -t $(API_IMAGE) . >/dev/null
	docker run --rm --network $(COMPOSE_NET) \
		-e DATABASE_URL="$(subst @localhost:,@db:,$(subst @127.0.0.1:,@db:,$(DATABASE_URL)))" \
		$(API_IMAGE) migrate up
endif

admin: ## Promote an existing user: make admin EMAIL=a@b.c
	@test -n "$(EMAIL)" || { echo "usage: make admin EMAIL=someone@example.com"; exit 1; }
	@if command -v psql >/dev/null 2>&1; then \
		echo "UPDATE users SET is_admin = true WHERE email = :'email';" | psql "$(DATABASE_URL)" -v ON_ERROR_STOP=1 -v email="$(EMAIL)"; \
	else \
		echo "UPDATE users SET is_admin = true WHERE email = :'email';" | $(COMPOSE) exec -T db psql -U bokashi -d bokashi -v ON_ERROR_STOP=1 -v email="$(EMAIL)"; \
	fi
