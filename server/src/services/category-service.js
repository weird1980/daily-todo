import { getDb } from '../db.js';

/**
 * Returns all categories ordered by name.
 * @returns {object[]} Array of category rows
 */
export function getAllCategories() {
  const db = getDb();
  return db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
}

/**
 * Creates a new category. Throws on duplicate name.
 * @param {string} name
 * @param {string} color - Hex color string
 * @returns {object} The created category row
 */
export function createCategory(name, color, group = 'work') {
  const db = getDb();

  const existing = db
    .prepare('SELECT id FROM categories WHERE name = ?')
    .get(name);

  if (existing) {
    throw new Error(`Duplicate category: "${name}" already exists`);
  }

  const result = db
    .prepare('INSERT INTO categories (name, color, "group") VALUES (?, ?, ?)')
    .run(name, color, group);

  return db
    .prepare('SELECT * FROM categories WHERE id = ?')
    .get(result.lastInsertRowid);
}
