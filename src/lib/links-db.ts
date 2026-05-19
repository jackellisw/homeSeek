import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { defaultStoredLinks, type StoredAppLink } from "@/lib/link-data";

type LinkRow = StoredAppLink & {
  position: number;
};

export type DashboardSettings = {
  defaultBaseUrl: string;
};

export type CreateStoredLinkInput = {
  category: StoredAppLink["category"];
  description?: string;
  href: string;
  name: string;
};

let database: Database.Database | null = null;

const DEFAULT_BASE_URL = "http://localhost";
const customAccents = [
  "from-sky-300 to-cyan-500",
  "from-emerald-300 to-lime-500",
  "from-violet-300 to-fuchsia-500",
  "from-amber-300 to-yellow-500",
  "from-rose-300 to-pink-500",
  "from-teal-300 to-green-500",
];

function databasePath() {
  const configuredPath = process.env.SQLITE_PATH || process.env.DATABASE_PATH || "./data/homeseek.sqlite";
  return isAbsolute(configuredPath) ? configuredPath : join(/*turbopackIgnore: true*/ process.cwd(), configuredPath);
}

function getDatabase() {
  if (database) {
    return database;
  }

  const path = databasePath();
  mkdirSync(dirname(path), { recursive: true });
  database = new Database(path);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  database.exec(`
    CREATE TABLE IF NOT EXISTS links (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      href TEXT NOT NULL,
      category TEXT NOT NULL,
      accent TEXT NOT NULL,
      position INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS deleted_links (
      id TEXT PRIMARY KEY,
      deleted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  seedDefaultLinks(database);
  seedDefaultSettings(database);

  return database;
}

function seedDefaultLinks(db: Database.Database) {
  const statement = db.prepare(`
    INSERT INTO links (id, name, description, href, category, accent, position)
    SELECT @id, @name, @description, @href, @category, @accent, @position
    WHERE NOT EXISTS (SELECT 1 FROM deleted_links WHERE id = @id)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      category = excluded.category,
      accent = excluded.accent,
      position = excluded.position
  `);

  const transaction = db.transaction(() => {
    defaultStoredLinks.forEach((link, position) => {
      statement.run({ ...link, position });
    });
  });

  transaction();
}

function seedDefaultSettings(db: Database.Database) {
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run("defaultBaseUrl", DEFAULT_BASE_URL);
}

function slugify(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "custom-link"
  );
}

function nextCustomId(db: Database.Database, name: string) {
  const base = slugify(name);
  let id = base;
  let suffix = 2;

  while (db.prepare("SELECT 1 FROM links WHERE id = ?").get(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }

  return id;
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("Link URL cannot be empty.");
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
}

export function getStoredLinks() {
  return getDatabase().prepare("SELECT id, name, description, href, category, accent, position FROM links ORDER BY position ASC").all() as LinkRow[];
}

export function updateStoredLinkHref(id: string, href: string) {
  const normalizedHref = normalizeUrl(href);

  const result = getDatabase().prepare("UPDATE links SET href = ? WHERE id = ?").run(normalizedHref, id);
  if (result.changes === 0) {
    throw new Error("Unknown link.");
  }

  return getStoredLinks().find((link) => link.id === id);
}

export function deleteStoredLink(id: string) {
  const db = getDatabase();
  const existing = db.prepare("SELECT id FROM links WHERE id = ?").get(id) as { id: string } | undefined;

  if (!existing) {
    throw new Error("Unknown link.");
  }

  const transaction = db.transaction(() => {
    db.prepare("INSERT OR IGNORE INTO deleted_links (id) VALUES (?)").run(id);
    db.prepare("DELETE FROM links WHERE id = ?").run(id);
  });

  transaction();

  return { id };
}

export function createStoredLink(input: CreateStoredLinkInput) {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Link name is required.");
  }

  const db = getDatabase();
  const position = ((db.prepare("SELECT COALESCE(MAX(position), -1) + 1 AS position FROM links").get() as { position: number }).position);
  const id = nextCustomId(db, name);
  const accent = customAccents[position % customAccents.length];
  const link: LinkRow = {
    id,
    name,
    description: input.description?.trim() || "Custom service",
    href: normalizeUrl(input.href),
    category: input.category,
    accent,
    position,
  };

  db.prepare(`
    INSERT INTO links (id, name, description, href, category, accent, position)
    VALUES (@id, @name, @description, @href, @category, @accent, @position)
  `).run(link);

  return link;
}

export function getDashboardSettings(): DashboardSettings {
  const row = getDatabase().prepare("SELECT value FROM settings WHERE key = ?").get("defaultBaseUrl") as { value: string } | undefined;

  return {
    defaultBaseUrl: row?.value || DEFAULT_BASE_URL,
  };
}

export function updateDashboardSettings(input: Partial<DashboardSettings>) {
  const db = getDatabase();

  if (input.defaultBaseUrl !== undefined) {
    db.prepare(`
      INSERT INTO settings (key, value)
      VALUES ('defaultBaseUrl', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(normalizeUrl(input.defaultBaseUrl).replace(/\/+$/, ""));
  }

  return getDashboardSettings();
}

export function resetLinksDatabaseForTests() {
  database?.close();
  database = null;
}
