# syntax=docker/dockerfile:1
# Build context: repo root (see .github/workflows/pr.yml).
#   docker build -f apps/web/Dockerfile -t ghcr.io/ltln/bokashi-web .
#   docker run --rm -p 3000:3000 -e API_INTERNAL_URL=http://api:8080 ghcr.io/ltln/bokashi-web

FROM node:22-alpine AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    NEXT_TELEMETRY_DISABLED=1 \
    PNPM_HOME=/pnpm
RUN corepack enable
WORKDIR /repo

# Install deps from manifests only, for layer caching.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/contracts/package.json packages/contracts/
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile --filter web...

FROM deps AS build
COPY packages/contracts packages/contracts
COPY apps/web apps/web
RUN pnpm --filter web build

# Next standalone output: server.js plus the traced node_modules.
FROM node:22-alpine AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /repo/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /repo/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
