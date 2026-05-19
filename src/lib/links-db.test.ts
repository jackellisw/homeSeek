import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createStoredLink,
  deleteStoredLink,
  getDashboardSettings,
  getStoredLinks,
  resetLinksDatabaseForTests,
  updateDashboardSettings,
  updateStoredLinkHref,
} from "@/lib/links-db";

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

  it("creates custom links and saves dashboard settings", () => {
    updateDashboardSettings({ defaultBaseUrl: "192.168.1.50/" });

    expect(getDashboardSettings()).toEqual({
      defaultBaseUrl: "http://192.168.1.50",
    });

    const link = createStoredLink({
      category: "Downloads",
      description: "Download queue",
      href: `${getDashboardSettings().defaultBaseUrl}:8080`,
      name: "SABnzbd",
    });

    expect(link).toMatchObject({
      category: "Downloads",
      description: "Download queue",
      href: "http://192.168.1.50:8080",
      name: "SABnzbd",
    });
    expect(getStoredLinks().at(-1)).toMatchObject({
      id: link.id,
      href: "http://192.168.1.50:8080",
    });
  });

  it("deletes links and does not reseed deleted defaults", () => {
    expect(getStoredLinks().some((link) => link.id === "plex")).toBe(true);

    deleteStoredLink("plex");

    expect(getStoredLinks().some((link) => link.id === "plex")).toBe(false);

    resetLinksDatabaseForTests();

    expect(getStoredLinks().some((link) => link.id === "plex")).toBe(false);
  });
});
