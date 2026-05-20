# HomeSeek

A private home-server dashboard inspired by Homarr, built with Next.js, React, TypeScript, Tailwind CSS, React Router, React Compiler, and a fully TypeScript backend.

## Features

- Local password auth with an httpOnly cookie and a localStorage user hint.
- Linear-inspired dark dashboard for Plex, Overseerr, Radarr, Sonarr, Bazarr, Prowlarr, qBittorrent, Tautulli, Portainer, Grafana, storage, and status links.
- Editable service URLs persisted in SQLite.
- Plex recently added movies and TV shows via `/library/recentlyAdded`.
- Authenticated Plex poster proxy so your token is not exposed to the browser.
- Mock recent media fallback when Plex env vars are not configured.
- Vitest coverage for the Plex XML parser.

## Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

The default dashboard password is `homeseek`. Set `DASHBOARD_PASSWORD` in `.env.local` before using this outside local development.

## Environment

```bash
AUTH_SECRET="replace-with-a-long-random-string"
AUTH_COOKIE_SECURE="false"
DASHBOARD_PASSWORD="homeseek"
PLEX_BASE_URL="http://localhost:32400"
PLEX_TOKEN="your-plex-token"
SQLITE_PATH="./data/homeseek.sqlite"
```

For Docker, `SQLITE_PATH` defaults to `/data/homeseek.sqlite` and is backed by the `homeseek-data` volume.

## Docker

```bash
docker compose up --build
```

Open [http://localhost:4000](http://localhost:4000).

When Plex is running on the Docker host, `PLEX_BASE_URL` can usually be `http://host.docker.internal:32400`. On Linux hosts that do not support `host.docker.internal`, set `PLEX_BASE_URL` to the host or bridge address your container can reach.

## Homeserver Troubleshooting

Open Settings and check **System diagnostics** first. It verifies whether SQLite can write to the configured database path and whether Plex is reachable from the HomeSeek server/container.

Common fixes:

- If diagnostics says `HTTP 401` after login and you access HomeSeek over plain `http://`, set `AUTH_COOKIE_SECURE=false`, recreate the container, then log out/log in or clear the HomeSeek site cookies. Use `AUTH_COOKIE_SECURE=true` only when HomeSeek is behind HTTPS.
- If Plex uses `http://localhost:32400` on the host, do not use that inside Docker. Use `http://host.docker.internal:32400` or the Plex server LAN IP, such as `http://192.168.1.20:32400`.
- On Linux Docker hosts, `docker-compose.yml` maps `host.docker.internal` to `host-gateway`; keep that `extra_hosts` entry.
- If SQLite is not writable, make sure `SQLITE_PATH=/data/homeseek.sqlite` in Docker and that `/data` is mounted as a writable volume.
- If using a bind mount instead of the named volume, the mounted host directory must be writable by container user `1001`.
- Keep `.env` next to `docker-compose.yml`. Compose passes that file into the container via `env_file`.
- If environment changes do not apply, recreate the container with `docker compose up -d --build --force-recreate`.

## Scripts

```bash
pnpm dev
pnpm build
pnpm lint
pnpm test
```
