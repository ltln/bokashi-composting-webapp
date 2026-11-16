# syntax=docker/dockerfile:1
# Build context: repo root (see .github/workflows/pr.yml).
#   docker build -f apps/api/Dockerfile -t ghcr.io/ltln/bokashi-api .
#   docker run --rm -p 8080:8080 -e DATABASE_URL=... ghcr.io/ltln/bokashi-api
#   docker run --rm -e DATABASE_URL=... ghcr.io/ltln/bokashi-api migrate

# Build on the native build platform and cross-compile, so arm64 images are
# not compiled under QEMU.
FROM --platform=$BUILDPLATFORM golang:1.26-alpine AS build
ARG TARGETOS
ARG TARGETARCH
WORKDIR /src
COPY apps/api/go.mod apps/api/go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod go mod download
COPY apps/api/ ./
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH go build -trimpath -ldflags="-s -w" -o /out/api ./cmd/api

FROM gcr.io/distroless/static:nonroot
# Migrations are embedded in the binary (apps/api/db/embed.go); the SQL files
# are also copied here for inspection only.
COPY --from=build /src/db/migrations /migrations
COPY --from=build /out/api /api
USER nonroot:nonroot
ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["/api"]
CMD ["serve"]
