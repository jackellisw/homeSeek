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
  grandparentRatingKey?: string | number;
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

type PlexDirectoryNode = {
  ratingKey?: string | number;
  type?: string;
  title?: string;
  grandparentTitle?: string;
  parentTitle?: string;
  index?: string | number;
  parentIndex?: string | number;
  addedAt?: string | number;
  year?: string | number;
  thumb?: string;
  parentThumb?: string;
  art?: string;
  leafCount?: string | number;
  viewedLeafCount?: string | number;
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

function formatDirectorySubtitle(directory: PlexDirectoryNode) {
  if (directory.type === "season") {
    const season = Number(directory.index);
    const seasonLabel = Number.isFinite(season) ? `Season ${season}` : directory.title;
    const episodeCount = Number(directory.leafCount);
    const episodeLabel = Number.isFinite(episodeCount) ? `${episodeCount} episode${episodeCount === 1 ? "" : "s"}` : undefined;

    return [seasonLabel, episodeLabel].filter(Boolean).join(" - ");
  }

  const episodeCount = Number(directory.leafCount);
  if (Number.isFinite(episodeCount)) {
    return `${episodeCount} episode${episodeCount === 1 ? "" : "s"}`;
  }

  return "Recently added show";
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
  const parsed = parser.parse(xml) as {
    MediaContainer?: {
      Directory?: PlexDirectoryNode | PlexDirectoryNode[];
      Video?: PlexVideoNode | PlexVideoNode[];
    };
  };
  const directories = asArray(parsed.MediaContainer?.Directory);
  const videos = asArray(parsed.MediaContainer?.Video);

  const mappedVideos = videos
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
    });

  const mappedDirectories = directories
    .filter((directory) => directory.type === "show" || directory.type === "season")
    .map<MediaItem>((directory) => {
      const title =
        directory.type === "season"
          ? directory.parentTitle || directory.grandparentTitle || directory.title || "Unknown show"
          : directory.title || "Unknown show";
      const subtitle = formatDirectorySubtitle(directory);
      const addedAt = Number(directory.addedAt);

      return {
        id: String(directory.ratingKey || `show-${title}-${subtitle}`),
        type: "episode",
        title,
        subtitle,
        addedAt: Number.isFinite(addedAt) ? new Date(addedAt * 1000).toISOString() : new Date().toISOString(),
        year: directory.year ? Number(directory.year) : undefined,
        posterUrl: posterUrl(directory.parentThumb || directory.thumb || directory.art),
      };
    });

  const mapped = [...mappedVideos, ...mappedDirectories].sort((a, b) => Date.parse(b.addedAt) - Date.parse(a.addedAt));

  return {
    movies: mapped.filter((item) => item.type === "movie").slice(0, 8),
    shows: mapped.filter((item) => item.type === "episode").slice(0, 8),
  };
}

async function fetchRecentlyAddedXml(baseUrl: string, token: string, type?: "1" | "4") {
  const url = new URL("/library/recentlyAdded", baseUrl);
  url.searchParams.set("X-Plex-Token", token);
  if (type) {
    url.searchParams.set("type", type);
  }

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Plex responded with ${response.status}.`);
  }

  return response.text();
}

export async function fetchRecentlyAddedFromPlex() {
  const baseUrl = process.env.PLEX_BASE_URL;
  const token = process.env.PLEX_TOKEN;

  if (!baseUrl || !token) {
    throw new Error("Plex is not configured. Set PLEX_BASE_URL and PLEX_TOKEN.");
  }

  const [mixedResult, movieResult, episodeResult] = await Promise.allSettled([
    fetchRecentlyAddedXml(baseUrl, token),
    fetchRecentlyAddedXml(baseUrl, token, "1"),
    fetchRecentlyAddedXml(baseUrl, token, "4"),
  ]);

  if (mixedResult.status === "rejected" && movieResult.status === "rejected" && episodeResult.status === "rejected") {
    throw mixedResult.reason instanceof Error ? mixedResult.reason : new Error("Plex could not be reached.");
  }

  const mixed = mixedResult.status === "fulfilled" ? parseRecentlyAdded(mixedResult.value) : { movies: [], shows: [] };
  const movies = movieResult.status === "fulfilled" ? parseRecentlyAdded(movieResult.value).movies : [];
  const shows = episodeResult.status === "fulfilled" ? parseRecentlyAdded(episodeResult.value).shows : [];

  return {
    movies: movies.length > 0 ? movies : mixed.movies,
    shows: shows.length > 0 ? shows : mixed.shows,
  };
}
