import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const baseUrl = process.env.PLEX_BASE_URL;
  const token = process.env.PLEX_TOKEN;
  const path = new URL(request.url).searchParams.get("path");

  if (!baseUrl || !token || !path) {
    return new NextResponse("Not found", { status: 404 });
  }

  const url = new URL(path, baseUrl);
  url.searchParams.set("X-Plex-Token", token);

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok || !response.body) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(response.body, {
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "image/jpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
