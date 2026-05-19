import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { mockMovies, mockShows } from "@/lib/mock-media";
import { fetchRecentlyAddedFromPlex } from "@/lib/plex";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const media = await fetchRecentlyAddedFromPlex();
    return NextResponse.json({ ...media, source: "plex" });
  } catch (error) {
    return NextResponse.json({
      movies: mockMovies,
      shows: mockShows,
      source: "mock",
      message: error instanceof Error ? error.message : "Plex could not be reached.",
    });
  }
}
