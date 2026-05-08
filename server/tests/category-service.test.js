import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, unlinkSync } from 'node:fs';
import { initDb, getDb } from '../src/db.js';

const TEST_DB_PATH = '/tmp/todo-category-service-test.db';

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

let categoryService;

beforeEach(async () => {
  cleanupTestDb();
  initDb(TEST_DB_PATH);
  categoryService = await import('../src/services/category-service.js');
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

describe('getAllCategories', () => {
  it('should return empty list when nothing has been created', () => {
    const categories = categoryService.getAllCategories();
    expect(categories).toHaveLength(0);
  });

  it('should return categories ordered by name', () => {
    categoryService.createCategory('zeta', '#00ff00');
    categoryService.createCategory('alpha', '#ff0000');
    categoryService.createCategory('mid', '#0000ff');

    const categories = categoryService.getAllCategories();
    expect(categories.map((c) => c.name)).toEqual(['alpha', 'mid', 'zeta']);
  });

  it('should include color field for each category', () => {
    categoryService.createCategory('demo', '#abcdef');
    const categories = categoryService.getAllCategories();

    for (const cat of categories) {
      expect(cat.color).toBeDefined();
      expect(cat.color).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe('createCategory', () => {
  it('should create a new category', () => {
    const category = categoryService.createCategory('devops', '#00ff00');

    expect(category.name).toBe('devops');
    expect(category.color).toBe('#00ff00');
    expect(category.id).toBeDefined();
  });

  it('should appear in getAllCategories after creation', () => {
    categoryService.createCategory('devops', '#00ff00');
    const categories = categoryService.getAllCategories();

    expect(categories).toHaveLength(1);
    const names = categories.map((c) => c.name);
    expect(names).toContain('devops');
  });

  it('should throw on duplicate category name', () => {
    categoryService.createCategory('personal', '#000000');
    expect(() => categoryService.createCategory('personal', '#111111')).toThrow(
      /duplicate/i
    );
  });
});
