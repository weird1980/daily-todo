# daily-todo

> 🌐 **Read this in another language:** [Español](./README.es.md) · [Català](./README.ca.md) · [Français](./README.fr.md)

A local-first daily task manager with three faces:

- 🖥️ **Web dashboard** — React + MUI, drag-and-drop, light/dark themes, two boards (Work / Personal).
- ⌨️ **CLI** — quick commands you can run from any terminal (or from Claude Code, or wherever).
- 🔌 **REST + WebSocket server** — a tiny Express + SQLite backend that ties them together. Everything stays on your machine.

Every part is multilingual: **English**, **Español**, **Català**, **Français**.

---

## Why?

I wanted a single place to:

- Plan today's work in the morning.
- Mark progress through the day.
- Generate a Slack-style daily update at the end of the day with one command.
- Keep history and a per-day chart so I can see where my time actually goes.

No SaaS, no account, no cloud. Just SQLite at `~/.todo/todo.db` and three Node processes you can start with one `npm run dev`.

---

## Architecture

```
┌─────────────┐     WebSocket      ┌──────────────────┐
│  Dashboard  │◄──────────────────►│   API server     │
│  React+Vite │                    │   Express + ws   │
│  port 7848  │                    │   port 7847      │
└─────────────┘                    └────────┬─────────┘
                                            │
┌─────────────┐     HTTP REST              │
│  CLI (todo) │──────────────────────────► │
│  Node.js    │                             │
└─────────────┘                    ┌────────▼─────────┐
                                   │   SQLite (local) │
                                   │  ~/.todo/todo.db │
                                   └──────────────────┘
```

### Stack

- **Frontend** — React 19, MUI v6, Vite, dnd-kit, Recharts.
- **Backend** — Node 20+, Express, `ws`, `better-sqlite3`.
- **CLI** — Commander, Chalk, Clipboardy.
- **Tests** — Vitest.
- **Autostart (macOS)** — optional `launchd` plist.

---

## Quick start

### Requirements

- Node.js 20 or higher
- macOS, Linux, or WSL2 on Windows

### Install

```bash
git clone https://github.com/quim/daily-todo.git
cd daily-todo
npm install
```

### Run everything in dev mode

```bash
npm run dev
```

This starts the API server (`http://localhost:7847`) and the dashboard (`http://localhost:7848`) in parallel.

Open the dashboard at <http://localhost:7848>. The first time you run it there are no categories — go to the **Categories** tab and create at least one before adding tasks.

### Just the server

```bash
npm run server
```

### Just the dashboard

```bash
npm run dashboard
```

### Production build of the dashboard

```bash
npm run build
```

---

## Using the CLI

The CLI talks to the running server over HTTP. It is a normal Node script:

```bash
node cli/bin/todo.js <command>
```

If you prefer a global `todo` binary, run `npm link` inside `cli/`. You can also alias it in your shell.

```bash
# create a category
node cli/bin/todo.js categories add "work" "#748ffc"

# add a task
node cli/bin/todo.js add "Ship daily-todo" -c work -p high

# list today's tasks
node cli/bin/todo.js list

# mark in progress
node cli/bin/todo.js progress 1 -s "Writing the README"

# mark done
node cli/bin/todo.js done 1 -s "README and screenshots ready"

# generate a Slack-style daily update (copies to clipboard)
node cli/bin/todo.js update

# show yesterday's standup
node cli/bin/todo.js standup

# bar-chart history of the last 7 days
node cli/bin/todo.js history --days 7
```

Run `node cli/bin/todo.js --help` for the full command list.

---

## Multi-language

Every surface supports four languages: `en`, `es`, `ca`, `fr`.

| Surface     | How to choose language                                      |
|-------------|-------------------------------------------------------------|
| Dashboard   | Language picker in the navigation bar (saved in `localStorage`). |
| CLI         | Set the `TODO_LANG` environment variable, e.g. `TODO_LANG=es node cli/bin/todo.js list`. Falls back to your system `LANG`, then to English. |
| Server      | Set `TODO_LANG` on the server process. This affects the standup and Slack-update strings. |

Default for everything is **English**.

To add a new language, edit:

- `dashboard/src/i18n/locales.js`
- `cli/src/i18n.js`
- `server/src/i18n.js`

---

## Boards: Work vs Personal

The dashboard has two boards. Each category belongs to one of them (`work` or `personal`). The toggle at the top right swaps both the board and the color theme. Use it to keep your work tasks visually separated from your personal ones, with separate Slack updates per board.

---

## Data and persistence

- All data lives in `~/.todo/todo.db` (a single SQLite file).
- WAL mode is enabled — safe to copy or back up while the server runs.
- Logs from launchd live at `~/.todo/server.log` and `~/.todo/server.err` if you use the autostart script.

To start over:

```bash
rm -rf ~/.todo
```

---

## Autostart on macOS (optional)

If you want the server to be running every time you log in:

```bash
./launchd/install.sh
```

This generates `~/Library/LaunchAgents/com.dailytodo.server.plist` from the template, pointing at the current repo path and your Node binary, and loads it.

To remove it:

```bash
./launchd/uninstall.sh
```

---

## Use it from Claude Code

If you're a [Claude Code](https://www.claude.com/product/claude-code) user there is a ready-made slash command in `claude/commands/todo.md`. It teaches Claude when to add tasks, when to mark progress, and how to generate the daily update without you typing the commands.

See [`claude/README.md`](./claude/README.md) for the install steps.

---

## Tests

The server is the only part with automated tests:

```bash
npm test
```

This runs Vitest for the database, services, and HTTP routes.

---

## Project layout

```
daily-todo/
├── cli/                  # Node CLI (Commander)
│   ├── bin/todo.js
│   └── src/
│       ├── client.js     # API client
│       ├── format.js     # terminal formatting
│       ├── i18n.js       # CLI translations
│       └── commands/     # one file per command
├── dashboard/            # React + Vite frontend
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── api.js
│       ├── theme.js
│       ├── i18n/
│       │   ├── index.jsx
│       │   └── locales.js
│       ├── components/
│       └── pages/
├── server/               # Express + SQLite API
│   ├── src/
│   │   ├── index.js
│   │   ├── db.js
│   │   ├── ws.js
│   │   ├── i18n.js
│   │   ├── routes/
│   │   └── services/
│   └── tests/
├── launchd/              # macOS autostart
│   ├── daily-todo-server.plist.template
│   ├── install.sh
│   └── uninstall.sh
├── claude/               # Claude Code slash command
│   ├── commands/todo.md
│   └── README.md
├── package.json          # workspaces root
├── README.md             # this file
├── README.es.md          # Spanish
├── README.ca.md          # Catalan
├── README.fr.md          # French
└── LICENSE               # MIT
```

---

## Contributing

Pull requests are welcome — bug fixes, new languages, new CLI commands, dashboard improvements. Please open an issue first if it's a non-trivial change so we can agree on the shape before you write code.

---

## License

[MIT](./LICENSE) — do whatever you want, just keep the copyright notice.
