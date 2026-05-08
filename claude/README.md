# Claude Code integration

This folder contains a slash command template you can install into [Claude Code](https://www.claude.com/product/claude-code) so you can manage your tasks directly from any Claude session.

## What you get

- `/todo` slash command — Claude knows how to add, complete, and summarize tasks via the daily-todo CLI.

## Installation

1. Decide the scope:
   - **Global** (all projects): `~/.claude/commands/todo.md`
   - **Per project**: `<your-project>/.claude/commands/todo.md`

2. Copy the template:

   ```bash
   mkdir -p ~/.claude/commands
   cp claude/commands/todo.md ~/.claude/commands/todo.md
   ```

3. Open `~/.claude/commands/todo.md` and replace every `<REPO_PATH>` placeholder with the absolute path where you cloned this repository (for example `/Users/yourname/code/daily-todo`).

4. Make sure the server is running on port `7847` (see the main README for `npm run server` and the launchd autoload script).

5. In Claude Code, run `/todo` and Claude will use the CLI according to the rules in the command file.
