# daily-todo — Personal task dashboard

Skill to manage your daily-todo tasks from any Claude Code session.

> Replace `<REPO_PATH>` below with the absolute path where you cloned `daily-todo`.

## Architecture

- **Server (Express)** at `http://localhost:7847` — REST API + WebSocket
- **Dashboard (React)** at `http://localhost:7848` — visual board
- **CLI** at `<REPO_PATH>/cli/bin/todo.js` — terminal interface
- **DB** SQLite at `~/.todo/todo.db`

## How to use the CLI

All commands are launched with:

```bash
node <REPO_PATH>/cli/bin/todo.js <command>
```

Set `TODO_LANG=en|es|ca|fr` to change CLI language.

### Available commands

```bash
# Add a task
node <REPO_PATH>/cli/bin/todo.js add "Task title" -c <category> -p <high|medium|low>

# List today's tasks
node <REPO_PATH>/cli/bin/todo.js list

# List tasks for a specific date
node <REPO_PATH>/cli/bin/todo.js list --date 2026-03-25

# Mark task as done with a summary
node <REPO_PATH>/cli/bin/todo.js done <id> -s "Short summary of what was done"

# Mark task as in progress
node <REPO_PATH>/cli/bin/todo.js progress <id> -s "Current state"

# Cancel a task
node <REPO_PATH>/cli/bin/todo.js cancel <id>

# Reorder
node <REPO_PATH>/cli/bin/todo.js move <id> --up
node <REPO_PATH>/cli/bin/todo.js move <id> --down

# Manage categories
node <REPO_PATH>/cli/bin/todo.js categories list
node <REPO_PATH>/cli/bin/todo.js categories add "name" "#hexcolor"

# Generate Slack daily update (copies to clipboard)
node <REPO_PATH>/cli/bin/todo.js update

# Show yesterday's standup
node <REPO_PATH>/cli/bin/todo.js standup

# History over last N days (bar chart)
node <REPO_PATH>/cli/bin/todo.js history --days 7
```

## When to use each command

### Starting a work session
If the user starts working on a task, add it to the todo:

```bash
node <REPO_PATH>/cli/bin/todo.js add "Description" -c <category> -p <priority>
```

### During the work
When you actively start a task:

```bash
node <REPO_PATH>/cli/bin/todo.js progress <id> -s "Working on..."
```

### Completing a task
When you finish a task, mark it with a SHORT summary:

```bash
node <REPO_PATH>/cli/bin/todo.js done <id> -s "Short result summary"
```

### End of day
Generate the Slack update:

```bash
node <REPO_PATH>/cli/bin/todo.js update
```

## Important rules

1. **The summary (`-s`) must be SHORT** — one sentence, to the point.
2. **Categories are user-defined** — create them first via `categories add` before using them.
3. **The server must be running** on port 7847. If not, the CLI prints "server unavailable".
4. **You don't need the dashboard open** to manage tasks — the CLI is enough. The dashboard is for visual overview.

## Verify it works

```bash
# Health check
curl -s http://localhost:7847/health

# If not responding, start it manually:
cd <REPO_PATH>/server && node src/index.js &
```

## Installation

Copy this file to `~/.claude/commands/todo.md` (global) or `<your-project>/.claude/commands/todo.md` (per project) and replace `<REPO_PATH>` with the absolute path of your cloned `daily-todo` repository.
