import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { getSqlitePath, runSqliteWriteCheck } from "@/lib/links-db";
import { runPlexDiagnostics } from "@/lib/plex";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let sqlite:
    | {
        error: string;
        linkCount: number;
        ok: boolean;
        path: string;
        writable: boolean;
      }
    | {
        linkCount: number;
        ok: boolean;
        path: string;
        writable: boolean;
      };

  try {
    sqlite = {
      ...runSqliteWriteCheck(),
      ok: true,
    };
  } catch (error) {
    sqlite = {
      error: error instanceof Error ? error.message : "SQLite write check failed.",
      linkCount: 0,
      ok: false,
      path: getSqlitePath(),
      writable: false,
    };
  }

  const plex = await runPlexDiagnostics();

  return NextResponse.json({
    environment: {
      authSecretConfigured: Boolean(process.env.AUTH_SECRET) && process.env.AUTH_SECRET !== "replace-with-a-long-random-string",
      dashboardPasswordConfigured: Boolean(process.env.DASHBOARD_PASSWORD),
      nodeEnv: process.env.NODE_ENV || "development",
      sqlitePath: getSqlitePath(),
    },
    plex,
    sqlite,
  });
}
