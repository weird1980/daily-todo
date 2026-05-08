import Database from 'better-sqlite3';

let db = null;

/**
 * Initializes the database: creates tables and indexes.
 * No categories are seeded — the user creates them from the dashboard or CLI.
 * @param {string} dbPath - Path to the SQLite database file
 * @returns {Database} The database instance
 */
export function initDb(dbPath) {
  if (db) db.close();
  db = new Database(dbPath);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL,
      "group" TEXT NOT NULL DEFAULT 'work'
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL REFERENCES categories(name),
      priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
      status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'done', 'cancelled')) DEFAULT 'pending',
      summary TEXT,
      date TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS daily_standups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      summary TEXT,
      tasks_total INTEGER,
      tasks_done INTEGER,
      generated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS daily_updates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      content TEXT,
      copied INTEGER NOT NULL DEFAULT 0,
      generated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
  `);

  const columns = db.prepare("PRAGMA table_info(categories)").all();
  if (!columns.find((c) => c.name === 'group')) {
    db.exec('ALTER TABLE categories ADD COLUMN "group" TEXT NOT NULL DEFAULT \'work\'');
  }

  return db;
}

/**
 * Returns the current database instance.
 * @returns {Database|null}
 */
export function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}
