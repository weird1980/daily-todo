import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, unlinkSync } from 'node:fs';
import { initDb, getDb } from '../src/db.js';

const TEST_DB_PATH = '/tmp/todo-routes-test.db';

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

let createApp;
let server;
let baseUrl;

function seedTestCategories() {
  const db = getDb();
  const insert = db.prepare('INSERT INTO categories (name, color, "group") VALUES (?, ?, ?)');
  insert.run('personal', '#a78bfa', 'personal');
}

beforeEach(async () => {
  cleanupTestDb();
  initDb(TEST_DB_PATH);
  seedTestCategories();
  const mod = await import('../src/index.js');
  createApp = mod.createApp;

  const app = createApp();
  server = app.listen(0);
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
});

afterEach(() => {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => resolve());
    } else {
      resolve();
    }
    try {
      const db = getDb();
      db.close();
    } catch {
      // ignore
    }
    cleanupTestDb();
  });
});

describe('Health endpoint', () => {
  it('GET /health returns ok', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });
});

describe('POST /api/tasks creates task', () => {
  it('returns 201 with the created task', async () => {
    const res = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test task',
        category: 'personal',
        priority: 'high',
        date: '2026-03-25',
      }),
    });

    expect(res.status).toBe(201);
    const task = await res.json();
    expect(task.title).toBe('Test task');
    expect(task.category).toBe('personal');
    expect(task.priority).toBe('high');
    expect(task.date).toBe('2026-03-25');
    expect(task.id).toBeDefined();
  });
});

describe('GET /api/tasks?date= returns tasks', () => {
  it('returns tasks for the given date', async () => {
    // Create a task first
    await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Date task',
        category: 'personal',
        priority: 'medium',
        date: '2026-03-25',
      }),
    });

    const res = await fetch(`${baseUrl}/api/tasks?date=2026-03-25`);
    expect(res.status).toBe(200);
    const tasks = await res.json();
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks.length).toBe(1);
    expect(tasks[0].title).toBe('Date task');
  });
});

describe('PATCH /api/tasks/:id/status updates status', () => {
  it('updates task status and returns updated task', async () => {
    const createRes = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Status task',
        category: 'personal',
        priority: 'low',
        date: '2026-03-25',
      }),
    });
    const created = await createRes.json();

    const res = await fetch(`${baseUrl}/api/tasks/${created.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done', summary: 'Completed it' }),
    });

    expect(res.status).toBe(200);
    const updated = await res.json();
    expect(updated.status).toBe('done');
    expect(updated.summary).toBe('Completed it');
  });
});

describe('GET /api/categories returns categories', () => {
  it('returns categories created in setup', async () => {
    const res = await fetch(`${baseUrl}/api/categories`);
    expect(res.status).toBe(200);
    const categories = await res.json();
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBe(1);
    expect(categories[0].name).toBe('personal');
  });
});

describe('POST /api/updates/generate generates update', () => {
  it('generates and returns update text', async () => {
    // Create a task first so the update has content
    await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Update task',
        category: 'personal',
        priority: 'high',
        date: '2026-03-25',
      }),
    });

    const res = await fetch(`${baseUrl}/api/updates/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2026-03-25' }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.content).toBeDefined();
    expect(body.content).toContain('UPDATE:');
  });
});
