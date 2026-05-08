import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, unlinkSync } from 'node:fs';
import { initDb, getDb } from '../src/db.js';

const TEST_DB_PATH = '/tmp/todo-test.db';

function cleanupTestDb() {
  const filesToRemove = [
    TEST_DB_PATH,
    `${TEST_DB_PATH}-wal`,
    `${TEST_DB_PATH}-shm`,
  ];
  for (const file of filesToRemove) {
    if (existsSync(file)) {
      unlinkSync(file);
    }
  }
}

describe('Database initialization', () => {
  beforeEach(() => {
    cleanupTestDb();
  });

  afterEach(() => {
    const db = getDb();
    if (db) {
      db.close();
    }
    cleanupTestDb();
  });

  it('should create all required tables', () => {
    initDb(TEST_DB_PATH);
    const db = getDb();

    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
      )
      .all()
      .map((row) => row.name);

    expect(tables).toContain('tasks');
    expect(tables).toContain('categories');
    expect(tables).toContain('daily_standups');
    expect(tables).toContain('daily_updates');
  });

  it('should start with no categories seeded', () => {
    initDb(TEST_DB_PATH);
    const db = getDb();

    const count = db
      .prepare('SELECT COUNT(*) as count FROM categories')
      .get();

    expect(count.count).toBe(0);
  });

  it('should preserve existing categories on re-init', () => {
    initDb(TEST_DB_PATH);
    let db = getDb();
    db.prepare('INSERT INTO categories (name, color, "group") VALUES (?, ?, ?)').run('demo', '#748ffc', 'work');
    db.close();

    initDb(TEST_DB_PATH);
    const db2 = getDb();

    const count = db2.prepare('SELECT COUNT(*) as count FROM categories').get();
    expect(count.count).toBe(1);
  });

  it('should have proper tasks table schema with constraints', () => {
    initDb(TEST_DB_PATH);
    const db = getDb();

    // Need a category first because of FK
    db.prepare('INSERT INTO categories (name, color, "group") VALUES (?, ?, ?)').run('personal', '#748ffc', 'personal');

    const insert = db.prepare(`
      INSERT INTO tasks (title, category, priority, status, date, position)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    expect(() => {
      insert.run('Test task', 'personal', 'high', 'pending', '2026-03-25', 0);
    }).not.toThrow();

    expect(() => {
      insert.run('Bad task', 'personal', 'urgent', 'pending', '2026-03-25', 1);
    }).toThrow();

    expect(() => {
      insert.run('Bad task', 'personal', 'high', 'archived', '2026-03-25', 2);
    }).toThrow();
  });

  it('should have indexes on tasks.date and tasks.status', () => {
    initDb(TEST_DB_PATH);
    const db = getDb();

    const indexes = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='tasks'"
      )
      .all()
      .map((row) => row.name);

    expect(indexes).toContain('idx_tasks_date');
    expect(indexes).toContain('idx_tasks_status');
  });

  it('should enable WAL mode', () => {
    initDb(TEST_DB_PATH);
    const db = getDb();

    const journalMode = db.prepare('PRAGMA journal_mode').get();
    expect(journalMode.journal_mode).toBe('wal');
  });

  it('should enable foreign keys', () => {
    initDb(TEST_DB_PATH);
    const db = getDb();

    const fkStatus = db.prepare('PRAGMA foreign_keys').get();
    expect(fkStatus.foreign_keys).toBe(1);
  });
});
