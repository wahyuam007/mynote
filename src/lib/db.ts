import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

declare global {
  // eslint-disable-next-line no-var
  var __note_db__: Database.Database | undefined;
}

function getDatabase(): Database.Database {
  if (global.__note_db__) {
    return global.__note_db__;
  }

  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, "notes.db");
  const db = new Database(dbPath, { timeout: 15000 });

  db.pragma("busy_timeout = 15000");
  try {
    db.pragma("journal_mode = WAL");
  } catch {
    // If locked by another worker in build, continue
  }
  db.pragma("foreign_keys = ON");

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT DEFAULT '',
        type TEXT DEFAULT 'text',
        color TEXT DEFAULT '#ffffff',
        is_pinned INTEGER DEFAULT 0,
        order_index INTEGER DEFAULT 0,
        tags TEXT DEFAULT '[]',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS checklist_items (
        id TEXT PRIMARY KEY,
        note_id TEXT NOT NULL,
        text TEXT NOT NULL,
        is_completed INTEGER DEFAULT 0,
        order_index INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
      CREATE INDEX IF NOT EXISTS idx_notes_order ON notes(user_id, order_index);
      CREATE INDEX IF NOT EXISTS idx_checklist_note_id ON checklist_items(note_id, order_index);
    `);
  } catch {
    // Already created or locked by concurrent worker
  }

  global.__note_db__ = db;
  return db;
}

const db = getDatabase();

export default db;
