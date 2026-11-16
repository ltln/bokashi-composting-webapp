#!/usr/bin/env bash
# Pull-based deploy for the home server. Run by the bokashi-deploy.timer every
# ~2 minutes, or by hand. Safe to run at any time; does nothing when no new
# image has been published.
#
#   deploy.sh              pull, and deploy if the images changed
#   deploy.sh --no-pull    skip `compose pull` (same as SKIP_PULL=1); used for
#                          local dry runs against locally built images
#
# Environment (all optional):
#   BOKASHI_DIR     directory holding compose.yml/.env/state (default: this script's directory)
#   SKIP_PULL=1     do not pull
#   FORCE=1         deploy even if this exact image pair already failed (.bad)
#   WEB_URL         health check base URL (default http://127.0.0.1:3100)
#   HEALTH_TIMEOUT  seconds to wait for a healthy stack (default 60)
#   KEEP_BACKUPS    number of backups to keep (default 14)
#
# State files in BOKASHI_DIR: .deploy.lock, .last-good, .bad, backups/*.sql.gz
set -euo pipefail

APP_DIR="${BOKASHI_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
WEB_URL="${WEB_URL:-http://127.0.0.1:3100}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-60}"
KEEP_BACKUPS="${KEEP_BACKUPS:-14}"
SKIP_PULL="${SKIP_PULL:-0}"
FORCE="${FORCE:-0}"
SERVICES=(api web)
IMAGE_PREFIX="ghcr.io/ltln/bokashi"

for arg in "$@"; do
  case "$arg" in
    --no-pull) SKIP_PULL=1 ;;
    -h | --help) sed -n '2,17p' "${BASH_SOURCE[0]}"; exit 0 ;;
    *) echo "unknown argument: $arg" >&2; exit 2 ;;
  esac
done

log() { printf '%s deploy: %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"; }
short() { local id="${1#sha256:}"; echo "${id:0:12}"; }
compose() { docker compose -f "$APP_DIR/compose.yml" --project-directory "$APP_DIR" "$@"; }

cd "$APP_DIR"
mkdir -p "$APP_DIR/backups"

# 1. Lock: never run two deploys at once.
command -v flock >/dev/null || { echo "flock not found (apt install util-linux)" >&2; exit 1; }
exec 9>"$APP_DIR/.deploy.lock"
if ! flock -n 9; then
  log "another deploy is running, skipping"
  exit 0
fi

if [[ ! -f "$APP_DIR/.env" ]]; then
  log "ERROR: $APP_DIR/.env is missing (copy .env.example and fill it in)"
  exit 1
fi
if grep -q 'CHANGE_ME' "$APP_DIR/.env"; then
  log "ERROR: $APP_DIR/.env still contains CHANGE_ME placeholders"
  exit 1
fi

# Image ID of what a service is running right now (empty if no container).
running_id() {
  local cid
  cid="$(compose ps -a -q "$1" | head -n 1)"
  [[ -n "$cid" ]] && docker inspect -f '{{.Image}}' "$cid" || true
}
# Image ID of the local :latest tag (after pull).
latest_id() { docker image inspect -f '{{.Id}}' "${IMAGE_PREFIX}-$1:latest" 2>/dev/null || true; }

# Before pulling (which moves :latest and can leave the running image without a
# name), pin whatever is running as :last-good so it can always be rolled back to.
# Drops the previously pinned image if nothing else uses it.
declare -A OLD NEW
for svc in "${SERVICES[@]}"; do
  OLD[$svc]="$(running_id "$svc")"
  [[ -n "${OLD[$svc]}" ]] || continue
  pinned="$(docker image inspect -f '{{.Id}}' "${IMAGE_PREFIX}-$svc:last-good" 2>/dev/null || true)"
  if [[ "$pinned" != "${OLD[$svc]}" ]]; then
    docker tag "${OLD[$svc]}" "${IMAGE_PREFIX}-$svc:last-good"
    [[ -z "$pinned" ]] || docker rmi "$pinned" >/dev/null 2>&1 || true
  fi
done

# 2. Check for new images.
if [[ "$SKIP_PULL" != "1" ]]; then
  if ! compose pull --quiet "${SERVICES[@]}"; then
    log "ERROR: compose pull failed (registry unreachable or GHCR login expired?)"
    exit 1
  fi
fi

changed=0
signature=""
for svc in "${SERVICES[@]}"; do
  NEW[$svc]="$(latest_id "$svc")"
  if [[ -z "${NEW[$svc]}" ]]; then
    log "ERROR: no local image ${IMAGE_PREFIX}-$svc:latest (pull it or build it first)"
    exit 1
  fi
  [[ "${OLD[$svc]}" != "${NEW[$svc]}" ]] && changed=1
  signature+="$svc=${NEW[$svc]} "
done

if [[ "$changed" == "0" ]]; then
  exit 0 # nothing new; stay quiet
fi

if [[ "$FORCE" != "1" && -f "$APP_DIR/.bad" && "$(cat "$APP_DIR/.bad")" == "$signature" ]]; then
  log "skipping: this image pair already failed ($(short "${NEW[api]}") / $(short "${NEW[web]}")); publish a new image or run FORCE=1 deploy.sh"
  exit 0
fi

describe() { # "api abc -> def, web ghi -> jkl"
  local out="" svc
  for svc in "${SERVICES[@]}"; do
    out+="$svc $(short "${OLD[$svc]:-none}") -> $(short "${NEW[$svc]}"), "
  done
  echo "${out%, }"
}
log "new images found: $(describe)"

mark_bad() { printf '%s' "$signature" >"$APP_DIR/.bad"; }

# 3. Back up the database (starts the db first on a fresh install).
if ! compose up -d --wait db >/dev/null; then
  log "ERROR: db did not become healthy; aborting before any change"
  exit 1
fi
backup="$APP_DIR/backups/$(date -u +%Y%m%dT%H%M%SZ).sql.gz"
# shellcheck disable=SC2016  # $POSTGRES_* must expand inside the container
if compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' | gzip >"$backup.tmp"; then
  mv "$backup.tmp" "$backup"
  log "backup written: $backup"
else
  rm -f "$backup.tmp"
  log "ERROR: pg_dump failed; aborting before any change"
  exit 1
fi
# Keep only the newest $KEEP_BACKUPS backups (UTC names sort chronologically).
backups=("$APP_DIR"/backups/*.sql.gz)
if ((${#backups[@]} > KEEP_BACKUPS)); then
  rm -f -- "${backups[@]:0:${#backups[@]}-KEEP_BACKUPS}"
fi

# 4. Migrate with the NEW api image, before touching the running containers.
if ! compose run --rm -T api migrate up; then
  mark_bad
  log "ERROR: migration failed; NOT restarting, old containers keep running. Backup: $backup"
  exit 1
fi

# 5. Record what is running now (the images are already pinned as :last-good).
: >"$APP_DIR/.last-good.tmp"
for svc in "${SERVICES[@]}"; do
  [[ -n "${OLD[$svc]}" ]] || continue
  repo_digest="$(docker image inspect -f '{{if .RepoDigests}}{{index .RepoDigests 0}}{{end}}' "${OLD[$svc]}" 2>/dev/null || true)"
  echo "$svc ${OLD[$svc]} ${repo_digest:-local}" >>"$APP_DIR/.last-good.tmp"
done
mv "$APP_DIR/.last-good.tmp" "$APP_DIR/.last-good"

# 6 + 7. Restart and health check.
healthy() {
  curl -fsS -o /dev/null --max-time 5 "$WEB_URL/login" &&
    compose exec -T web wget -q -O /dev/null --timeout=5 http://api:8080/healthz
}
wait_healthy() {
  local deadline=$((SECONDS + HEALTH_TIMEOUT))
  while ((SECONDS < deadline)); do
    if healthy >/dev/null 2>&1; then return 0; fi
    sleep 2
  done
  return 1
}

compose up -d --remove-orphans
if wait_healthy; then
  rm -f "$APP_DIR/.bad"
  log "OK: deployed $(describe)"
  exit 0
fi

# 8. Failed: roll back the containers (never the database).
mark_bad
log "ERROR: health check failed after ${HEALTH_TIMEOUT}s: $(describe)"
if [[ ! -s "$APP_DIR/.last-good" ]]; then
  log "ERROR: no previous version to roll back to (first deploy); leaving containers as they are"
  exit 1
fi
log "rolling back to last-good: $(tr '\n' ';' <"$APP_DIR/.last-good")"
API_TAG=last-good WEB_TAG=last-good compose up -d --remove-orphans
if wait_healthy; then
  log "ROLLED BACK: previous version is serving again"
else
  log "ERROR: rollback is not healthy either; check 'docker compose logs' in $APP_DIR"
fi
log "WARNING: migrations were NOT rolled back; the database may be ahead of the running code. Pre-deploy backup: $backup"
exit 1
