# Deploying Camino (Docker, behind an existing Caddy)

**The setup:**
- Camino runs as one container (`camino`) in its own compose project.
- It is reached only through the reverse proxy (Caddy) on a shared external Docker network. **No port is published.**
- Learner progress lives in a host directory mounted at `/data`.
- Course content (`data/course.db`) is baked into the image at `/app/data`.

```
internet ──443──> Caddy (existing) ──proxy network──> camino:3000 ──> /data (host: /srv/camino/data)
                                                                 └─> /app/data/course.db (in the image, read-only)
```

## Environment variables

Secrets go in a file **outside the git checkout**, for example `/srv/camino/camino.env` (`chmod 600`). Compose loads it
at runtime and never bakes it into the image. Nothing is needed at build time.

| Variable | Required | What |
| --- | --- | --- |
| `APP_PASSWORD` | yes | The learner's password (≥ 8 chars). |
| `OWNER_PASSWORD` | yes | The owner's password (≥ 8 chars); it also opens `/admin`. |
| `AUTH_SECRET` | yes | Signs the session cookie (≥ 32 chars): `openssl rand -base64 48`. Changing it signs everyone out. |
| `APP_ORIGIN` | yes in production | The public origin, e.g. `https://camino.sabarca.dev`. Login redirects use it. Without it, they trust the forwarded Host header. |
| `DATA_DIR` | fixed by compose | Always `/data` in the container. Compose sets it, so the secrets file can't move it. |
| `COURSE_DB` | no | Overrides the content path. The default `/app/data/course.db` is right. |

With any required variable missing, a production server answers every page with **503**, so it never runs open.
Generate fresh secrets for the server rather than reusing a laptop's `.env.local`.

Optional compose overrides go in a `.env` file next to `compose.yaml` (git-ignored) or in the shell:

| Variable | Default | What |
| --- | --- | --- |
| `CAMINO_ENV_FILE` | `/srv/camino/camino.env` | The secrets file. |
| `CAMINO_DATA` | `/srv/camino/data` | Host directory for `progress.db` and its backups. |
| `PROXY_NETWORK` | `proxy` | External Docker network shared with Caddy. |
| `CAMINO_TAG` | `latest` | Image tag. Tag each build with the git SHA to roll back. |

## First deployment

Run as root, or with `sudo`, on the VPS.

1. **Look first, changing nothing:**
   ```bash
   uname -m; free -m; df -h /
   docker ps --format '{{.Names}}\t{{.Image}}\t{{.Ports}}'
   docker network ls
   docker stats --no-stream
   ```
2. **Swap.** Recommended on a 2 GB VPS. The build peaks at about 0.8 GB.
   ```bash
   swapon --show                                # skip if swap already exists
   fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
   echo '/swapfile none swap sw 0 0' >> /etc/fstab
   echo 'vm.swappiness=10' > /etc/sysctl.d/99-swappiness.conf && sysctl --system >/dev/null
   ```
3. **Directories, code and secrets:**
   ```bash
   mkdir -p /srv/camino/data
   chown 1000:1000 /srv/camino/data && chmod 700 /srv/camino/data     # uid 1000 = the image's `node` user
   git clone https://github.com/sebasabarca/camino.git /srv/camino/app   # private repo: use a deploy key or token
   install -m 600 /dev/null /srv/camino/camino.env
   nano /srv/camino/camino.env    # APP_PASSWORD=…  OWNER_PASSWORD=…  AUTH_SECRET=…  APP_ORIGIN=https://camino.sabarca.dev
   ```
4. **Optional: bring existing progress.**
   - On the laptop, run `sqlite3 data/progress.db ".backup progress-migrate.db"`. This makes a consistent copy that
     includes the WAL. Never copy the live file on its own.
   - Then copy it to `/srv/camino/data/progress.db` and `chown 1000:1000` it, **before** the first start.
5. **Shared proxy network.**
   - Create the network: `docker network create proxy`.
   - Connecting Caddy to it (`docker network connect proxy <caddy-container>`) and adding the site to the Caddyfile are
     changes to the existing proxy, so they are covered separately in the Caddy section below.
6. **Build and start:**
   ```bash
   cd /srv/camino/app
   docker compose build
   docker tag camino:latest camino:$(git rev-parse --short HEAD)
   docker compose up -d
   docker compose ps                # wait for "(healthy)", about 20 s
   docker compose logs --tail 50
   ```
7. **Check it from inside the proxy network.** It must answer `{"ok":true}`:
   ```bash
   docker run --rm --network proxy curlimages/curl:8.11.1 -s http://camino:3000/api/health
   ```

## Caddy

These are changes to the existing proxy. Back up the Caddyfile first, then validate before reloading.

```bash
docker network connect proxy <caddy-container>          # live, no restart
cp <Caddyfile> <Caddyfile>.bak-$(date +%F)
```

Add the site block. Caddy gets the certificate on its own once DNS points here.

```
camino.sabarca.dev {
    encode zstd gzip
    reverse_proxy camino:3000
}
```

```bash
docker exec <caddy-container> caddy validate --config /etc/caddy/Caddyfile
docker exec <caddy-container> caddy reload   --config /etc/caddy/Caddyfile     # graceful: other sites keep serving
```

**Making the network connection permanent:** a `docker network connect` is lost if the Caddy container is ever
recreated. Add `proxy` (as `external: true`) to the Caddy service's `networks:` in its own compose file at a quiet moment.

**Caddy's forwarded headers:**
- Caddy's defaults are what Camino expects: it sets `X-Forwarded-Proto: https` (so the cookie is `Secure`) and
  `X-Forwarded-For` (used for login rate limiting).
- Do not add `trusted_proxies` unless something like Cloudflare sits in front. If it does, see "Rate limiting" below.

**DNS:** add an `A` record (and an `AAAA` record if there is IPv6) for `camino` pointing at the VPS. Use the same Cloudflare
proxy mode as the other sites. If the record is proxied (orange cloud), set the SSL mode to **Full (strict)**.

## Checks after deploying

- [ ] `https://camino.sabarca.dev/` while logged out goes to `https://camino.sabarca.dev/login?next=%2F`, on the same host.
- [ ] A wrong password gives an error. The right one lands on the home path.
- [ ] The cookie `camino_session` is `Secure; HttpOnly; SameSite=Lax`.
- [ ] Learner `/admin` goes to `/`. Owner `/admin` works.
- [ ] Do one lesson step. `/admin` shows the activity.
- [ ] `docker compose restart`, then `docker compose up -d --force-recreate`: progress is still there.
- [ ] `/srv/camino/data/backups/progress-<today>.db` exists.
- [ ] `docker stats --no-stream`: Camino is well under its 512 MB limit.
- [ ] The other sites on the proxy still work.

## Updates

```bash
cd /srv/camino/app
sqlite3 /srv/camino/data/progress.db ".backup /srv/camino/pre-$(git rev-parse --short HEAD).db"   # needs: apt install sqlite3
git pull
docker compose build && docker tag camino:latest camino:$(git rev-parse --short HEAD)
docker compose up -d --force-recreate
docker compose ps
```

Content updates go the same way. The pipeline exports `data/course.db` on the laptop, you commit and push it, then
pull and rebuild on the server. The app checks the content's schema version at startup.

## Rollback

```bash
docker image ls camino                                  # tags are git SHAs
CAMINO_TAG=<previous-sha> docker compose up -d --force-recreate
```

Rolling back leaves `/srv/camino/data` alone. To restore progress from a backup:
1. Run `docker compose stop`.
2. Copy the backup over `/srv/camino/data/progress.db`.
3. Delete `progress.db-wal` and `progress.db-shm`.
4. Run `chown 1000:1000` on the restored file, then `docker compose start`.

To remove Camino completely:
1. Remove the site block and reload Caddy.
2. Run `docker compose down`.
3. Run `docker network disconnect proxy <caddy-container>`.

Never use `docker compose down -v` habits on data you care about. The data here is a bind mount, so `-v` won't delete
it, but keep the habit anyway.

## Backups

- The app copies `progress.db` once a day into `/srv/camino/data/backups/` and keeps 30 copies.
- Those copies are **on the same disk**, so they don't survive the disk failing.
- To keep copies elsewhere, use one of these:
  - Hetzner Backups;
  - a cron job copying `/srv/camino/data/backups/` off the server;
  - a periodic `scp` to the laptop.
- Test a restore once.

## Security notes

- **Login:**
  - Each failed try waits 1.2 s.
  - After **5 failures in 15 minutes from one IP**, that IP is blocked until the window passes.
  - After **30 failures in 15 minutes across all IPs**, new logins pause for everyone. This guards against guessing spread over many or spoofed IPs.
  - Phones already signed in stay signed in: their cookie lasts a year.
  - The counters are in memory, so a restart clears them.
  - The client IP is the **right-most** `X-Forwarded-For` entry, the one Caddy adds. A client can't forge that entry.
  - With Cloudflare proxying, that IP is a Cloudflare edge address. The global limit still applies. For per-visitor
    limits, configure Caddy's `trusted_proxies` with Cloudflare's ranges.
- **Return paths:** the `next` path after login is limited to paths on this site (`lib/login-guard.ts` `safeNext`).
- **Server actions** that write progress check the session themselves (`lib/session.ts` `requireSession`), in addition to the middleware.
- **`/api/health`** is the only unauthenticated dynamic route. It answers only `{"ok":true|false}`.
- **The container:**
  - runs as uid 1000;
  - has no Linux capabilities;
  - has `no-new-privileges`;
  - is capped at 512 MB and 1 CPU;
  - rotates its logs (3 × 10 MB).
