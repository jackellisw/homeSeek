import { NextResponse } from "next/server";
import { createSessionToken, getSessionMaxAge, isValidPassword, SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { password?: string; username?: string } | null;
  const password = body?.password || "";

  if (!isValidPassword(password)) {
    return NextResponse.json({ ok: false, message: "Invalid password" }, { status: 401 });
  }

  const username = body?.username?.trim() || "home";
  const response = NextResponse.json({ ok: true, user: { username } });
  response.cookies.set(SESSION_COOKIE, createSessionToken(username), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: getSessionMaxAge(),
    path: "/",
  });

  return response;
}
