# HomeSeek

A private home-server dashboard inspired by Homarr, built with Next.js, React, TypeScript, Tailwind CSS, React Router, React Compiler, and a fully TypeScript backend.

## Features

- Local password auth with an httpOnly cookie and a localStorage user hint.
- Linear-inspired dark dashboard for Plex, Overseerr, Radarr, Sonarr, Bazarr, Prowlarr, qBittorrent, Tautulli, Portainer, Grafana, storage, and status links.
- Editable service URLs saved in localStorage per browser.
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
```

## Scripts

```bash
pnpm dev
pnpm build
pnpm lint
pnpm test
```
