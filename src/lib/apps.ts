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
import { defaultStoredLinks, type StoredAppLink } from "@/lib/link-data";

export type AppLink = StoredAppLink & {
  icon: LucideIcon;
};

const iconsById: Record<string, LucideIcon> = {
  bazarr: RadioTower,
  grafana: BarChart3,
  nas: HardDrive,
  overseerr: Search,
  plex: Film,
  portainer: Box,
  prowlarr: Network,
  qbittorrent: Download,
  radarr: Clapperboard,
  sonarr: Tv,
  status: Monitor,
  tautulli: Activity,
};

export function hydrateAppLinks(links: StoredAppLink[]): AppLink[] {
  return links.map((link) => ({
    ...link,
    icon: iconsById[link.id] || Box,
  }));
}

export const defaultAppLinks: AppLink[] = hydrateAppLinks(defaultStoredLinks);
