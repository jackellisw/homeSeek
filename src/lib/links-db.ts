import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { defaultStoredLinks, type StoredAppLink } from "@/lib/link-data";

type LinkRow = StoredAppLink & {
  position: number;
};

let database: Database.Database | null = null;

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
  `);
  seedDefaultLinks(database);

  return database;
}

function seedDefaultLinks(db: Database.Database) {
  const statement = db.prepare(`
    INSERT INTO links (id, name, description, href, category, accent, position)
    VALUES (@id, @name, @description, @href, @category, @accent, @position)
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

export function getStoredLinks() {
  return getDatabase().prepare("SELECT id, name, description, href, category, accent, position FROM links ORDER BY position ASC").all() as LinkRow[];
}

export function updateStoredLinkHref(id: string, href: string) {
  const normalizedHref = href.trim();
  if (!normalizedHref) {
    throw new Error("Link URL cannot be empty.");
  }

  const result = getDatabase().prepare("UPDATE links SET href = ? WHERE id = ?").run(normalizedHref, id);
  if (result.changes === 0) {
    throw new Error("Unknown link.");
  }

  return getStoredLinks().find((link) => link.id === id);
}

export function resetLinksDatabaseForTests() {
  database?.close();
  database = null;
}
