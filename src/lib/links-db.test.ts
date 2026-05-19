import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getStoredLinks, resetLinksDatabaseForTests, updateStoredLinkHref } from "@/lib/links-db";

let tempDir = "";

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "homeseek-"));
  process.env.SQLITE_PATH = join(tempDir, "homeseek.sqlite");
  resetLinksDatabaseForTests();
});

afterEach(() => {
  resetLinksDatabaseForTests();
  rmSync(tempDir, { force: true, recursive: true });
  delete process.env.SQLITE_PATH;
});

describe("links database", () => {
  it("seeds default links and persists URL updates", () => {
    const links = getStoredLinks();

    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toMatchObject({
      id: "plex",
      href: "http://localhost:32400/web",
    });

    updateStoredLinkHref("plex", "https://plex.example.test");

    expect(getStoredLinks()[0]).toMatchObject({
      id: "plex",
      href: "https://plex.example.test",
    });
  });
});
