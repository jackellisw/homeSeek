import {
  Activity,
  BarChart3,
  Box,
  Clapperboard,
  Download,
  Film,
  HardDrive,
  Monitor,
  Network,
  RadioTower,
  Search,
  Tv,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AppLink = {
  id: string;
  name: string;
  description: string;
  href: string;
  category: "Media" | "Downloads" | "Infra" | "Observability";
  accent: string;
  icon: LucideIcon;
};

export const defaultAppLinks: AppLink[] = [
  {
    id: "plex",
    name: "Plex",
    description: "Stream library and manage playback",
    href: "http://localhost:32400/web",
    category: "Media",
    accent: "from-amber-300 to-orange-500",
    icon: Film,
  },
  {
    id: "overseerr",
    name: "Overseerr",
    description: "Requests, discovery, and availability",
    href: "http://localhost:5055",
    category: "Media",
    accent: "from-sky-300 to-blue-500",
    icon: Search,
  },
  {
    id: "radarr",
    name: "Radarr",
    description: "Movie automation and quality profiles",
    href: "http://localhost:7878",
    category: "Media",
    accent: "from-emerald-300 to-teal-500",
    icon: Clapperboard,
  },
  {
    id: "sonarr",
    name: "Sonarr",
    description: "TV automation and episode tracking",
    href: "http://localhost:8989",
    category: "Media",
    accent: "from-violet-300 to-indigo-500",
    icon: Tv,
  },
  {
    id: "bazarr",
    name: "Bazarr",
    description: "Subtitle automation for shows and films",
    href: "http://localhost:6767",
    category: "Media",
    accent: "from-fuchsia-300 to-pink-500",
    icon: RadioTower,
  },
  {
    id: "prowlarr",
    name: "Prowlarr",
    description: "Indexers and search routing",
    href: "http://localhost:9696",
    category: "Downloads",
    accent: "from-lime-300 to-green-500",
    icon: Network,
  },
  {
    id: "qbittorrent",
    name: "qBittorrent",
    description: "Transfers, queues, and ratios",
    href: "http://localhost:8080",
    category: "Downloads",
    accent: "from-cyan-300 to-sky-500",
    icon: Download,
  },
  {
    id: "tautulli",
    name: "Tautulli",
    description: "Plex stats and active sessions",
    href: "http://localhost:8181",
    category: "Observability",
    accent: "from-rose-300 to-red-500",
    icon: Activity,
  },
  {
    id: "portainer",
    name: "Portainer",
    description: "Containers, stacks, and volumes",
    href: "http://localhost:9000",
    category: "Infra",
    accent: "from-blue-300 to-cyan-500",
    icon: Box,
  },
  {
    id: "grafana",
    name: "Grafana",
    description: "Dashboards and server telemetry",
    href: "http://localhost:3000",
    category: "Observability",
    accent: "from-orange-300 to-yellow-500",
    icon: BarChart3,
  },
  {
    id: "nas",
    name: "Storage",
    description: "NAS, shares, and disk health",
    href: "http://localhost",
    category: "Infra",
    accent: "from-zinc-300 to-slate-500",
    icon: HardDrive,
  },
  {
    id: "status",
    name: "Status",
    description: "Uptime, incidents, and pings",
    href: "http://localhost:3001",
    category: "Observability",
    accent: "from-teal-300 to-emerald-500",
    icon: Monitor,
  },
];
