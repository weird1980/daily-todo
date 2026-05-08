import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, unlinkSync } from 'node:fs';
import { initDb, getDb } from '../src/db.js';

const TEST_DB_PATH = '/tmp/todo-update-service-test.db';
const TEST_DATE = '2026-03-25';

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

let updateService;
let taskService;

function seedTestCategories() {
  const db = getDb();
  const insert = db.prepare('INSERT INTO categories (name, color, "group") VALUES (?, ?, ?)');
  insert.run('personal', '#a78bfa', 'personal');
  insert.run('frontend', '#ffd43b', 'work');
  insert.run('amatv', '#ff6b6b', 'work');
  insert.run('chatserver', '#51cf66', 'work');
}

beforeEach(async () => {
  cleanupTestDb();
  initDb(TEST_DB_PATH);
  seedTestCategories();
  taskService = await import('../src/services/task-service.js');
  updateService = await import('../src/services/update-service.js');
});

afterEach(() => {
  try {
    const db = getDb();
    if (db) db.close();
  } catch {
    // db may already be closed
  }
  cleanupTestDb();
});

describe('generateUpdate', () => {
  it('should generate update with done and pending tasks', () => {
    const task1 = taskService.createTask({
      title: 'Deploy API',
      category: 'amatv',
      priority: 'high',
      date: TEST_DATE,
    });
    taskService.updateTaskStatus(task1.id, 'done', 'Deployed to production');

    const task2 = taskService.createTask({
      title: 'Fix login bug',
      category: 'frontend',
      priority: 'medium',
      date: TEST_DATE,
    });
    taskService.updateTaskStatus(task2.id, 'in_progress', 'Investigating root cause');

    const task3 = taskService.createTask({
      title: 'Review PR',
      category: 'chatserver',
      priority: 'low',
      date: TEST_DATE,
    });
    // task3 stays pending

    const result = updateService.generateUpdate(TEST_DATE);

    expect(result).toContain('UPDATE:');
    expect(result).toContain('[amatv] Deploy API ✅ Deployed to production');
    expect(result).toContain('[frontend] Fix login bug 🔄 Investigating root cause');
    expect(result).toContain('[chatserver] Review PR 🔄');
    expect(result).toContain('Tomorrow: Fix login bug, Review PR');
  });

  it('should generate update with cancelled tasks', () => {
    const task1 = taskService.createTask({
      title: 'Cancelled feature',
      category: 'personal',
      priority: 'low',
      date: TEST_DATE,
    });
    taskService.updateTaskStatus(task1.id, 'cancelled');

    const task2 = taskService.createTask({
      title: 'Done task',
      category: 'amatv',
      priority: 'high',
      date: TEST_DATE,
    });
    taskService.updateTaskStatus(task2.id, 'done', 'Completed');

    const result = updateService.generateUpdate(TEST_DATE);

    expect(result).toContain('[personal] Cancelled feature ❌');
    expect(result).toContain('[amatv] Done task ✅ Completed');
  });

  it('should generate empty update when no tasks exist', () => {
    const result = updateService.generateUpdate(TEST_DATE);

    expect(result).toBe('UPDATE:\n\nNo tasks registered today.');
  });

  it('should generate empty update when all tasks are cancelled', () => {
    const task1 = taskService.createTask({
      title: 'Cancelled 1',
      category: 'personal',
      priority: 'low',
      date: TEST_DATE,
    });
    taskService.updateTaskStatus(task1.id, 'cancelled');

    const task2 = taskService.createTask({
      title: 'Cancelled 2',
      category: 'amatv',
      priority: 'high',
      date: TEST_DATE,
    });
    taskService.updateTaskStatus(task2.id, 'cancelled');

    const result = updateService.generateUpdate(TEST_DATE);

    expect(result).toBe('UPDATE:\n\nNo tasks registered today.');
  });

  it('should save the update to daily_updates table', () => {
    const task = taskService.createTask({
      title: 'Some task',
      category: 'personal',
      priority: 'high',
      date: TEST_DATE,
    });
    taskService.updateTaskStatus(task.id, 'done', 'Done');

    updateService.generateUpdate(TEST_DATE);

    const db = getDb();
    const row = db
      .prepare('SELECT * FROM daily_updates WHERE date = ?')
      .get(TEST_DATE);

    expect(row).toBeDefined();
    expect(row.content).toContain('UPDATE:');
    expect(row.date).toBe(TEST_DATE);
  });

  it('should update existing entry on regeneration (upsert)', () => {
    const task = taskService.createTask({
      title: 'Task A',
      category: 'personal',
      priority: 'high',
      date: TEST_DATE,
    });
    taskService.updateTaskStatus(task.id, 'done', 'First pass');

    updateService.generateUpdate(TEST_DATE);
    taskService.updateTaskStatus(task.id, 'done', 'Second pass');
    updateService.generateUpdate(TEST_DATE);

    const db = getDb();
    const rows = db
      .prepare('SELECT * FROM daily_updates WHERE date = ?')
      .all(TEST_DATE);

    expect(rows).toHaveLength(1);
    expect(rows[0].content).toContain('Second pass');
  });
});
