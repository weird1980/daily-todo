import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { mkdirSync } from 'node:fs';
import { initDb } from './db.js';
import { initWebSocket } from './ws.js';
import tasksRouter from './routes/tasks.js';
import categoriesRouter from './routes/categories.js';
import updatesRouter from './routes/updates.js';
import standupsRouter from './routes/standups.js';

/**
 * Creates and configures the Express app with all middleware and routes.
 * Exported for use in tests.
 * @returns {import('express').Application}
 */
export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/tasks', tasksRouter);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/updates', updatesRouter);
  app.use('/api/standups', standupsRouter);

  return app;
}

/**
 * Starts the server when run directly (not imported by tests).
 */
function startServer() {
  const todoDir = join(homedir(), '.todo');
  mkdirSync(todoDir, { recursive: true });

  const dbPath = join(todoDir, 'todo.db');
  initDb(dbPath);

  const app = createApp();
  const httpServer = createServer(app);
  initWebSocket(httpServer);

  const port = process.env.TODO_API_PORT || 7847;

  httpServer.listen(port, () => {
    console.log(`Todo API server listening on port ${port}`);
  });
}

// Only start server when run directly
const isMainModule = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));
if (isMainModule) {
  startServer();
}
