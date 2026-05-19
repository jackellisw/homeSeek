import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { appCategories } from "@/lib/link-data";
import { createStoredLink, getStoredLinks } from "@/lib/links-db";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ links: getStoredLinks() });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    category?: string;
    description?: string;
    href?: string;
    name?: string;
  } | null;

  if (!body || !body.category || !appCategories.includes(body.category as (typeof appCategories)[number])) {
    return NextResponse.json({ message: "Choose a valid category." }, { status: 400 });
  }

  try {
    const link = createStoredLink({
      category: body.category as (typeof appCategories)[number],
      description: body.description,
      href: body.href || "",
      name: body.name || "",
    });

    return NextResponse.json({ link }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not add link." },
      { status: 400 },
    );
  }
}
