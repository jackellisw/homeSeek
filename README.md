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

Open [http://localhost:3000](http://localhost:3000).

When Plex is running on the Docker host, `PLEX_BASE_URL` can usually be `http://host.docker.internal:32400`. On Linux hosts that do not support `host.docker.internal`, set `PLEX_BASE_URL` to the host or bridge address your container can reach.

## Scripts

```bash
pnpm dev
pnpm build
pnpm lint
pnpm test
```
