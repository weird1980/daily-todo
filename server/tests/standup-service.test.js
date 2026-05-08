import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, unlinkSync } from 'node:fs';
import { initDb, getDb } from '../src/db.js';

const TEST_DB_PATH = '/tmp/todo-standup-service-test.db';
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

let standupService;
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
  standupService = await import('../src/services/standup-service.js');
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

describe('generateStandup', () => {
  it('should generate standup with completed and pending tasks', () => {
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
    taskService.updateTaskStatus(task2.id, 'in_progress', 'Investigating');

    const result = standupService.generateStandup(TEST_DATE);

    expect(result.summary).toContain('Completed:');
    expect(result.summary).toContain('- Deploy API: Deployed to production');
    expect(result.summary).toContain('Pending:');
    expect(result.summary).toContain('- Fix login bug (Investigating)');
    expect(result.tasks_total).toBe(2);
    expect(result.tasks_done).toBe(1);
  });

  it('should save standup to daily_standups table', () => {
    const task = taskService.createTask({
      title: 'Task A',
      category: 'personal',
      priority: 'high',
      date: TEST_DATE,
    });
    taskService.updateTaskStatus(task.id, 'done', 'Done');

    standupService.generateStandup(TEST_DATE);

    const db = getDb();
    const row = db
      .prepare('SELECT * FROM daily_standups WHERE date = ?')
      .get(TEST_DATE);

    expect(row).toBeDefined();
    expect(row.tasks_total).toBe(1);
    expect(row.tasks_done).toBe(1);
    expect(row.summary).toContain('Task A');
  });

  it('should handle empty day gracefully', () => {
    const result = standupService.generateStandup(TEST_DATE);

    expect(result.summary).toBe('No tasks registered.');
    expect(result.tasks_total).toBe(0);
    expect(result.tasks_done).toBe(0);
  });

  it('should count cancelled tasks in total but not done', () => {
    const task1 = taskService.createTask({
      title: 'Done task',
      category: 'personal',
      priority: 'high',
      date: TEST_DATE,
    });
    taskService.updateTaskStatus(task1.id, 'done', 'Finished');

    const task2 = taskService.createTask({
      title: 'Cancelled task',
      category: 'amatv',
      priority: 'low',
      date: TEST_DATE,
    });
    taskService.updateTaskStatus(task2.id, 'cancelled');

    const result = standupService.generateStandup(TEST_DATE);

    expect(result.tasks_total).toBe(2);
    expect(result.tasks_done).toBe(1);
  });
});

describe('getStandup', () => {
  it('should return existing standup for a date', () => {
    const task = taskService.createTask({
      title: 'Task A',
      category: 'personal',
      priority: 'high',
      date: TEST_DATE,
    });
    taskService.updateTaskStatus(task.id, 'done', 'Done');

    standupService.generateStandup(TEST_DATE);
    const result = standupService.getStandup(TEST_DATE);

    expect(result).toBeDefined();
    expect(result.date).toBe(TEST_DATE);
    expect(result.tasks_total).toBe(1);
  });

  it('should return undefined when no standup exists', () => {
    const result = standupService.getStandup('2099-01-01');
    expect(result).toBeUndefined();
  });
});
