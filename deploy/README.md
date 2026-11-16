# Deploying to the home server

Pull-based auto-deploy. GitHub never connects to the server and holds no deploy secrets.

```
merge to main -> release.yml pushes ghcr.io/ltln/bokashi-{web,api}:latest (+ sha-<short>)
                     ^
server: systemd user timer (every 2 min) -> /opt/bokashi/deploy.sh
        pull -> new image? -> backup -> migrate -> restart -> health check -> (rollback)
```

| File | Purpose |
|---|---|
| `compose.yml` | The stack: `db` (Postgres 16), `api`, `web`. Project `bokashi`. Only `web` is published, on `127.0.0.1:3100`. |
| `.env.example` | Every setting the stack needs. Copy to `.env` on the server. |
| `deploy.sh` | The deploy script (see "What deploy.sh does"). |
| `systemd/bokashi-deploy.{service,timer}` | User units that run the script every 2 minutes. |

Server assumptions: Ubuntu 22.04, Docker with Compose v2, user `lt` in the `docker` group, `/opt` writable by `lt`, `flock` (util-linux) and `curl` installed. The images must be published for the server's architecture (arm64).

The stack uses its own project name (`bokashi`), network (`bokashi_internal`) and volume (`bokashi_pgdata`). It never touches other compose projects on the machine.

## 1. One-time setup

Run as user `lt` on the server, from a checkout or copy of this repo's `deploy/` directory.

```bash
# 1. Files
mkdir -p /opt/bokashi
cp deploy/compose.yml deploy/deploy.sh deploy/.env.example /opt/bokashi/
chmod +x /opt/bokashi/deploy.sh

# 2. Settings: fill in every value (see docs/setup/google-oauth.md for Google)
cd /opt/bokashi
cp .env.example .env
chmod 600 .env
$EDITOR .env        # replace CHANGE_ME, set the hostname, secrets and Google credentials
```

Generate secrets with `openssl rand -base64 32` (`SESSION_SECRET`, `USER_HASH_SECRET`) and `openssl rand -hex 24` (`POSTGRES_PASSWORD`). `deploy.sh` refuses to run while `.env` still contains `CHANGE_ME`.

```bash
# 3. GHCR login. Create a token that has ONLY read:packages (a fine-grained or
#    classic PAT) and paste it when prompted. It is stored in ~/.docker/config.json.
docker login ghcr.io -u <github-username>

# 4. Run the units as lt without an active login (needs sudo once)
sudo loginctl enable-linger lt

# 5. Install and start the timer
mkdir -p ~/.config/systemd/user
cp deploy/systemd/bokashi-deploy.service deploy/systemd/bokashi-deploy.timer ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now bokashi-deploy.timer
```

If `/opt/bokashi/.env` or the GHCR login is missing, the first timer run fails with a clear log line instead of changing anything.

Before the first deploy, make sure `release.yml` has run at least once so `:latest` exists in GHCR, and that the package is visible to your token (private packages need `read:packages` access to the repo).

## 2. First deploy

Do it by hand once so you can watch it. The timer would do the same within 2 minutes.

```bash
/opt/bokashi/deploy.sh
```

It starts the database, takes a (tiny) backup, runs migrations, starts `api` and `web`, and checks that they answer. Then check `curl -I http://127.0.0.1:3100/login`.

## 3. Operations

| Task | Command |
|---|---|
| Follow the deploy log | `journalctl --user -u bokashi-deploy -f` |
| Timer status / next run | `systemctl --user list-timers bokashi-deploy.timer` |
| Deploy now | `/opt/bokashi/deploy.sh` (or `systemctl --user start bokashi-deploy.service`) |
| Pause auto-deploy | `systemctl --user stop bokashi-deploy.timer` |
| Resume | `systemctl --user start bokashi-deploy.timer` |
| Container status | `cd /opt/bokashi && docker compose ps` |
| App logs | `cd /opt/bokashi && docker compose logs -f api web` |
| Retry an image pair that was rolled back | `FORCE=1 /opt/bokashi/deploy.sh` |

### What deploy.sh does

1. Takes a lock (`/opt/bokashi/.deploy.lock`) so two runs never overlap.
2. Pins the images that are running now as `ghcr.io/ltln/bokashi-{api,web}:last-good`, then runs `docker compose pull api web` and compares image IDs with the running containers. **Nothing new: exit 0, no output.**
3. Starts `db` if needed and writes `backups/<UTC timestamp>.sql.gz` with `pg_dump` (the newest 14 are kept).
4. Runs `docker compose run --rm api migrate up` with the new image. **If this fails, it stops here and the old containers keep running.**
5. Records what is running in `.last-good` (image ID and registry digest).
6. `docker compose up -d --remove-orphans`.
7. Health check, retried for about 60 s: `http://127.0.0.1:3100/login` through `web`, and the API's `/healthz` from inside the `web` container (the API image has no shell or curl).
8. On failure it restarts both services from the `:last-good` images and exits non-zero. It **never rolls back the database**. The log says so and prints the backup path.
9. Every step logs one timestamped line, with old and new short image IDs and the result.

A failed image pair is remembered in `.bad`, so the timer does not retry (and take a backup) every 2 minutes. The next published image is deployed normally. Use `FORCE=1` to retry the same pair.

Migrations run **before** the restart, while the old code is still serving. Write migrations so the previous version keeps working against them (add columns and tables first, remove things in a later release).

For local testing without a registry: `SKIP_PULL=1 deploy.sh` (or `deploy.sh --no-pull`). `BOKASHI_DIR`, `WEB_URL`, `HEALTH_TIMEOUT`, `KEEP_BACKUPS` and `COMPOSE_PROJECT_NAME` can be overridden, see the header of the script.

### Roll back to a specific version

Stop the timer first, or it will move you back to `:latest`.

```bash
systemctl --user stop bokashi-deploy.timer
cd /opt/bokashi
API_TAG=sha-abc1234 WEB_TAG=sha-abc1234 docker compose pull api web
API_TAG=sha-abc1234 WEB_TAG=sha-abc1234 docker compose up -d
```

If the newer version already ran migrations, check that the older code still works with that schema, or restore a backup (below). To go back to automatic deploys: `docker compose up -d` (back to `latest`), then start the timer.

### Restore a backup

This replaces the whole database with the backup (data written since then is lost).

```bash
cd /opt/bokashi
systemctl --user stop bokashi-deploy.timer
docker compose stop api web
docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 \
  -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"'
gunzip -c backups/<timestamp>.sql.gz | docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1'
docker compose up -d
systemctl --user start bokashi-deploy.timer
```

Make sure the running image matches the schema in the backup (see the rollback section).

## 4. Cloudflare Tunnel (public hostname)

`cloudflared` already runs on the host and is managed from the dashboard, so it can reach `127.0.0.1:3100` directly.

1. Open the Cloudflare **Zero Trust** dashboard, then **Networks -> Tunnels** and pick the existing tunnel.
2. Open **Published application routes** (older UI: **Public Hostname**) and click **Add**.
3. **Subdomain** `bokashi`, **Domain** your domain, **Service type** `HTTP`, **URL** `127.0.0.1:3100`. Save.
4. Set `APP_ORIGIN=https://bokashi.<domain>` and `OAUTH_REDIRECT_URL=https://bokashi.<domain>/api/auth/google/callback` in `/opt/bokashi/.env`, add the same redirect URI in Google Cloud ([`docs/setup/google-oauth.md`](../docs/setup/google-oauth.md)), then `cd /opt/bokashi && docker compose up -d` to apply the new `.env`.

## 5. Uninstall

```bash
systemctl --user disable --now bokashi-deploy.timer
rm ~/.config/systemd/user/bokashi-deploy.{service,timer}
systemctl --user daemon-reload

cd /opt/bokashi
docker compose down            # stops and removes containers and the network; KEEPS the database volume
```

Removing the data is a separate, explicit decision. Only when you are sure (and have a backup you want):

```bash
docker compose down -v         # also deletes the bokashi_pgdata volume
rm -rf /opt/bokashi            # backups, .env and everything else
```

## Tested

The pieces that need a registry, systemd or the real server (`docker compose pull`, GHCR login, the timer, Cloudflare) are not covered below. The deploy logic was exercised locally, in a Linux container (Alpine, bash 5, util-linux `flock`) against the Docker socket, with a separate compose project name and `SKIP_PULL=1`: first deploy, no-op run, healthy upgrade, failed health check with rollback, the retry guard, and a failing migration.
