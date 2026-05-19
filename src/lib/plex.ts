import { XMLParser } from "fast-xml-parser";

export type MediaType = "movie" | "episode";

export type MediaItem = {
  id: string;
  type: MediaType;
  title: string;
  subtitle: string;
  addedAt: string;
  year?: number;
  duration?: string;
  posterUrl: string;
  rating?: string;
};

type PlexVideoNode = {
  ratingKey?: string | number;
  type?: string;
  title?: string;
  grandparentTitle?: string;
  parentTitle?: string;
  index?: string | number;
  parentIndex?: string | number;
  addedAt?: string | number;
  year?: string | number;
  duration?: string | number;
  thumb?: string;
  grandparentThumb?: string;
  contentRating?: string;
};

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function formatDuration(value?: string | number) {
  const milliseconds = Number(value);
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) {
    return undefined;
  }
  const totalMinutes = Math.round(milliseconds / 1000 / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function formatEpisodeSubtitle(video: PlexVideoNode) {
  const season = Number(video.parentIndex);
  const episode = Number(video.index);
  const prefix =
    Number.isFinite(season) && Number.isFinite(episode)
      ? `S${String(season).padStart(2, "0")}E${String(episode).padStart(2, "0")}`
      : video.parentTitle;

  return [prefix, video.title].filter(Boolean).join(" - ");
}

function posterUrl(path?: string) {
  if (!path) {
    return "";
  }
  const params = new URLSearchParams({ path });
  return `/api/plex/image?${params.toString()}`;
}

export function parseRecentlyAdded(xml: string) {
  const parser = new XMLParser({
    attributeNamePrefix: "",
    ignoreAttributes: false,
  });
  const parsed = parser.parse(xml) as { MediaContainer?: { Video?: PlexVideoNode | PlexVideoNode[] } };
  const videos = asArray(parsed.MediaContainer?.Video);

  const mapped = videos
    .filter((video) => video.type === "movie" || video.type === "episode")
    .map<MediaItem>((video) => {
      const type = video.type as MediaType;
      const title = type === "episode" ? video.grandparentTitle || "Unknown show" : video.title || "Untitled";
      const subtitle = type === "episode" ? formatEpisodeSubtitle(video) : video.contentRating || "Movie";
      const addedAt = Number(video.addedAt);

      return {
        id: String(video.ratingKey || `${type}-${title}-${subtitle}`),
        type,
        title,
        subtitle,
        addedAt: Number.isFinite(addedAt) ? new Date(addedAt * 1000).toISOString() : new Date().toISOString(),
        year: video.year ? Number(video.year) : undefined,
        duration: formatDuration(video.duration),
        posterUrl: posterUrl(type === "episode" ? video.grandparentThumb || video.thumb : video.thumb),
        rating: video.contentRating,
      };
    })
    .sort((a, b) => Date.parse(b.addedAt) - Date.parse(a.addedAt));

  return {
    movies: mapped.filter((item) => item.type === "movie").slice(0, 8),
    shows: mapped.filter((item) => item.type === "episode").slice(0, 8),
  };
}

export async function fetchRecentlyAddedFromPlex() {
  const baseUrl = process.env.PLEX_BASE_URL;
  const token = process.env.PLEX_TOKEN;

  if (!baseUrl || !token) {
    throw new Error("Plex is not configured. Set PLEX_BASE_URL and PLEX_TOKEN.");
  }

  const url = new URL("/library/recentlyAdded", baseUrl);
  url.searchParams.set("X-Plex-Token", token);

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Plex responded with ${response.status}.`);
  }

  return parseRecentlyAdded(await response.text());
}
