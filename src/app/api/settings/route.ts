import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { getDashboardSettings, updateDashboardSettings } from "@/lib/links-db";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ settings: getDashboardSettings() });
}

export async function PUT(request: Request) {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { defaultBaseUrl?: string } | null;

  try {
    const settings = updateDashboardSettings({
      defaultBaseUrl: body?.defaultBaseUrl,
    });

    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not update settings." },
      { status: 400 },
    );
  }
}
