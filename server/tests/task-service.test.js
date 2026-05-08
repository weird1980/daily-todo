import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, unlinkSync } from 'node:fs';
import { initDb, getDb } from '../src/db.js';

const TEST_DB_PATH = '/tmp/todo-task-service-test.db';

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

// Lazy import to avoid module-level errors
let taskService;

function seedTestCategories() {
  const db = getDb();
  const insert = db.prepare('INSERT INTO categories (name, color, "group") VALUES (?, ?, ?)');
  insert.run('personal', '#a78bfa', 'personal');
  insert.run('frontend', '#ffd43b', 'work');
  insert.run('amatv', '#ff6b6b', 'work');
}

beforeEach(async () => {
  cleanupTestDb();
  initDb(TEST_DB_PATH);
  seedTestCategories();
  taskService = await import('../src/services/task-service.js');
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

describe('createTask', () => {
  it('should create a task with auto-assigned position 0 when no tasks exist for that date', () => {
    const task = taskService.createTask({
      title: 'First task',
      category: 'personal',
      priority: 'high',
      date: '2026-03-25',
    });

    expect(task.id).toBeDefined();
    expect(task.title).toBe('First task');
    expect(task.category).toBe('personal');
    expect(task.priority).toBe('high');
    expect(task.status).toBe('pending');
    expect(task.date).toBe('2026-03-25');
    expect(task.position).toBe(0);
  });

  it('should auto-increment position within the same date', () => {
    taskService.createTask({
      title: 'Task 1',
      category: 'personal',
      priority: 'high',
      date: '2026-03-25',
    });

    const task2 = taskService.createTask({
      title: 'Task 2',
      category: 'frontend',
      priority: 'medium',
      date: '2026-03-25',
    });

    const task3 = taskService.createTask({
      title: 'Task 3',
      category: 'amatv',
      priority: 'low',
      date: '2026-03-25',
    });

    expect(task2.position).toBe(1);
    expect(task3.position).toBe(2);
  });

  it('should start position at 0 for a different date', () => {
    taskService.createTask({
      title: 'Task on day 1',
      category: 'personal',
      priority: 'high',
      date: '2026-03-25',
    });

    const taskDay2 = taskService.createTask({
      title: 'Task on day 2',
      category: 'personal',
      priority: 'high',
      date: '2026-03-26',
    });

    expect(taskDay2.position).toBe(0);
  });

  it('should reject an invalid category', () => {
    expect(() =>
      taskService.createTask({
        title: 'Bad task',
        category: 'nonexistent',
        priority: 'high',
        date: '2026-03-25',
      })
    ).toThrow(/category/i);
  });
});

describe('getTaskById', () => {
  it('should return a task by id', () => {
    const created = taskService.createTask({
      title: 'Find me',
      category: 'personal',
      priority: 'low',
      date: '2026-03-25',
    });

    const found = taskService.getTaskById(created.id);
    expect(found.title).toBe('Find me');
    expect(found.id).toBe(created.id);
  });

  it('should return undefined for a non-existent id', () => {
    const found = taskService.getTaskById(9999);
    expect(found).toBeUndefined();
  });
});

describe('getTasksByDate', () => {
  it('should return tasks sorted by position', () => {
    taskService.createTask({ title: 'A', category: 'personal', priority: 'high', date: '2026-03-25' });
    taskService.createTask({ title: 'B', category: 'frontend', priority: 'medium', date: '2026-03-25' });
    taskService.createTask({ title: 'C', category: 'amatv', priority: 'low', date: '2026-03-25' });

    const tasks = taskService.getTasksByDate('2026-03-25');

    expect(tasks).toHaveLength(3);
    expect(tasks[0].title).toBe('A');
    expect(tasks[1].title).toBe('B');
    expect(tasks[2].title).toBe('C');
    expect(tasks[0].position).toBe(0);
    expect(tasks[1].position).toBe(1);
    expect(tasks[2].position).toBe(2);
  });

  it('should return empty array for a date with no tasks', () => {
    const tasks = taskService.getTasksByDate('2099-01-01');
    expect(tasks).toEqual([]);
  });
});

describe('updateTaskStatus', () => {
  it('should update status to done with summary and set completed_at', () => {
    const task = taskService.createTask({
      title: 'Complete me',
      category: 'personal',
      priority: 'high',
      date: '2026-03-25',
    });

    const updated = taskService.updateTaskStatus(task.id, 'done', 'All finished');

    expect(updated.status).toBe('done');
    expect(updated.summary).toBe('All finished');
    expect(updated.completed_at).toBeDefined();
    expect(updated.completed_at).not.toBeNull();
  });

  it('should update status to in_progress with summary', () => {
    const task = taskService.createTask({
      title: 'Start me',
      category: 'frontend',
      priority: 'medium',
      date: '2026-03-25',
    });

    const updated = taskService.updateTaskStatus(task.id, 'in_progress', 'Working on it');

    expect(updated.status).toBe('in_progress');
    expect(updated.summary).toBe('Working on it');
    expect(updated.completed_at).toBeNull();
  });

  it('should clear completed_at when moving back from done', () => {
    const task = taskService.createTask({
      title: 'Toggle me',
      category: 'personal',
      priority: 'high',
      date: '2026-03-25',
    });

    taskService.updateTaskStatus(task.id, 'done', 'Done');
    const updated = taskService.updateTaskStatus(task.id, 'in_progress', 'Not done yet');

    expect(updated.status).toBe('in_progress');
    expect(updated.completed_at).toBeNull();
  });
});

describe('updateTaskPosition', () => {
  it('should swap positions when moving up', () => {
    taskService.createTask({ title: 'A', category: 'personal', priority: 'high', date: '2026-03-25' });
    const taskB = taskService.createTask({ title: 'B', category: 'personal', priority: 'high', date: '2026-03-25' });

    taskService.updateTaskPosition(taskB.id, 'up');

    const tasks = taskService.getTasksByDate('2026-03-25');
    expect(tasks[0].title).toBe('B');
    expect(tasks[1].title).toBe('A');
  });

  it('should swap positions when moving down', () => {
    const taskA = taskService.createTask({ title: 'A', category: 'personal', priority: 'high', date: '2026-03-25' });
    taskService.createTask({ title: 'B', category: 'personal', priority: 'high', date: '2026-03-25' });

    taskService.updateTaskPosition(taskA.id, 'down');

    const tasks = taskService.getTasksByDate('2026-03-25');
    expect(tasks[0].title).toBe('B');
    expect(tasks[1].title).toBe('A');
  });

  it('should not change position when moving up at top', () => {
    const taskA = taskService.createTask({ title: 'A', category: 'personal', priority: 'high', date: '2026-03-25' });
    taskService.createTask({ title: 'B', category: 'personal', priority: 'high', date: '2026-03-25' });

    taskService.updateTaskPosition(taskA.id, 'up');

    const tasks = taskService.getTasksByDate('2026-03-25');
    expect(tasks[0].title).toBe('A');
    expect(tasks[1].title).toBe('B');
  });

  it('should not change position when moving down at bottom', () => {
    taskService.createTask({ title: 'A', category: 'personal', priority: 'high', date: '2026-03-25' });
    const taskB = taskService.createTask({ title: 'B', category: 'personal', priority: 'high', date: '2026-03-25' });

    taskService.updateTaskPosition(taskB.id, 'down');

    const tasks = taskService.getTasksByDate('2026-03-25');
    expect(tasks[0].title).toBe('A');
    expect(tasks[1].title).toBe('B');
  });
});

describe('updateTaskDate', () => {
  it('should move task to new date with max position + 1', () => {
    const task = taskService.createTask({ title: 'Move me', category: 'personal', priority: 'high', date: '2026-03-25' });
    taskService.createTask({ title: 'Already here', category: 'personal', priority: 'high', date: '2026-03-26' });

    const updated = taskService.updateTaskDate(task.id, '2026-03-26');

    expect(updated.date).toBe('2026-03-26');
    expect(updated.position).toBe(1);
  });

  it('should assign position 0 when moving to a date with no tasks', () => {
    const task = taskService.createTask({ title: 'Move me', category: 'personal', priority: 'high', date: '2026-03-25' });

    const updated = taskService.updateTaskDate(task.id, '2026-03-28');

    expect(updated.date).toBe('2026-03-28');
    expect(updated.position).toBe(0);
  });
});

describe('deleteTask', () => {
  it('should delete a task', () => {
    const task = taskService.createTask({ title: 'Delete me', category: 'personal', priority: 'high', date: '2026-03-25' });

    const result = taskService.deleteTask(task.id);
    expect(result).toBe(true);

    const found = taskService.getTaskById(task.id);
    expect(found).toBeUndefined();
  });

  it('should return false when deleting a non-existent task', () => {
    const result = taskService.deleteTask(9999);
    expect(result).toBe(false);
  });
});
