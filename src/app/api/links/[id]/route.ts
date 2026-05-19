import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { updateStoredLinkHref } from "@/lib/links-db";

export const runtime = "nodejs";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { href?: string } | null;

  try {
    const link = updateStoredLinkHref(id, body?.href || "");
    return NextResponse.json({ link });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not update link." },
      { status: 400 },
    );
  }
}
