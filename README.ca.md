# daily-todo

> 🌐 **Llegeix-ho en un altre idioma:** [English](./README.md) · [Español](./README.es.md) · [Français](./README.fr.md)

Un gestor de tasques diàries **local-first** amb tres cares:

- 🖥️ **Dashboard web** — React + MUI, drag-and-drop, temes clar/fosc, dos taulers (Feina / Personal).
- ⌨️ **CLI** — comandes ràpides des de qualsevol terminal (o des de Claude Code).
- 🔌 **Servidor REST + WebSocket** — un Express + SQLite minimalista que ho enllaça tot. Tot es queda a la teva màquina.

Tot és multiidioma: **English**, **Español**, **Català**, **Français**.

---

## Per què?

Volia un sol lloc per:

- Planificar la feina del dia al matí.
- Marcar progrés durant la jornada.
- Generar un update tipus Slack al final del dia amb una sola comanda.
- Tenir històric i un gràfic per dia per veure on se me'n va realment el temps.

Sense SaaS, sense comptes, sense núvol. Només SQLite a `~/.todo/todo.db` i tres processos Node que arrenques amb un sol `npm run dev`.

---

## Arquitectura

```
┌─────────────┐     WebSocket      ┌──────────────────┐
│  Dashboard  │◄──────────────────►│  Servidor API    │
│  React+Vite │                    │  Express + ws    │
│  port 7848  │                    │  port 7847       │
└─────────────┘                    └────────┬─────────┘
                                            │
┌─────────────┐     HTTP REST              │
│  CLI (todo) │──────────────────────────► │
│  Node.js    │                             │
└─────────────┘                    ┌────────▼─────────┐
                                   │  SQLite (local)  │
                                   │  ~/.todo/todo.db │
                                   └──────────────────┘
```

### Stack

- **Frontend** — React 19, MUI v6, Vite, dnd-kit, Recharts.
- **Backend** — Node 20+, Express, `ws`, `better-sqlite3`.
- **CLI** — Commander, Chalk, Clipboardy.
- **Tests** — Vitest.
- **Autoarrencada (macOS)** — plist de `launchd` opcional.

---

## Començar ràpid

### Requisits

- Node.js 20 o superior
- macOS, Linux o WSL2 a Windows

### Instal·lar

```bash
git clone https://github.com/weird1980/daily-todo.git
cd daily-todo
npm install
```

### Arrencar tot en mode dev

```bash
npm run dev
```

Això arrenca el servidor API (`http://localhost:7847`) i el dashboard (`http://localhost:7848`) en paral·lel.

Obre el dashboard a <http://localhost:7848>. La primera vegada no hi ha categories — ves a la pestanya **Categories** i crea'n almenys una abans d'afegir tasques.

### Només el servidor

```bash
npm run server
```

### Només el dashboard

```bash
npm run dashboard
```

### Build de producció del dashboard

```bash
npm run build
```

---

## Usar la CLI

La CLI parla amb el servidor per HTTP. És un script Node normal:

```bash
node cli/bin/todo.js <comanda>
```

Si prefereixes un binari `todo` global, executa `npm link` dins de `cli/`. També pots crear un àlies al teu shell.

```bash
# crear categoria
node cli/bin/todo.js categories add "feina" "#748ffc"

# afegir tasca
node cli/bin/todo.js add "Publicar daily-todo" -c feina -p high

# llistar tasques d'avui
node cli/bin/todo.js list

# marcar en progrés
node cli/bin/todo.js progress 1 -s "Escrivint el README"

# marcar com a feta
node cli/bin/todo.js done 1 -s "README i captures llestes"

# generar update tipus Slack (copia al porta-retalls)
node cli/bin/todo.js update

# mostrar standup d'ahir
node cli/bin/todo.js standup

# històric en gràfic de barres dels últims 7 dies
node cli/bin/todo.js history --days 7
```

Executa `node cli/bin/todo.js --help` per la llista sencera.

---

## Multiidioma

Totes les superfícies suporten quatre idiomes: `en`, `es`, `ca`, `fr`.

| Superfície | Com escollir l'idioma |
|------------|-----------------------|
| Dashboard  | Selector d'idioma a la barra de navegació (es guarda al `localStorage`). |
| CLI        | Variable d'entorn `TODO_LANG`, p. ex. `TODO_LANG=ca node cli/bin/todo.js list`. Si no, usa la `LANG` del sistema i, finalment, anglès. |
| Servidor   | `TODO_LANG` en arrencar el servidor. Afecta els textos del standup i de l'update de Slack. |

L'idioma per defecte és **anglès**.

Per afegir un idioma nou, edita:

- `dashboard/src/i18n/locales.js`
- `cli/src/i18n.js`
- `server/src/i18n.js`

---

## Taulers: Feina vs Personal

El dashboard té dos taulers. Cada categoria pertany a un (`work` o `personal`). El toggle de dalt a la dreta canvia tauler i tema de cop. Útil per separar feina i personal, amb un update de Slack independent per cada tauler.

---

## Dades i persistència

- Tot viu a `~/.todo/todo.db` (un sol fitxer SQLite).
- WAL activat — pots copiar o fer backup amb el servidor en marxa.
- Els logs de launchd estan a `~/.todo/server.log` i `~/.todo/server.err` si uses l'autoarrencada.

Per començar de zero:

```bash
rm -rf ~/.todo
```

---

## Autoarrencada a macOS (opcional)

Si vols que el servidor arrenqui en iniciar sessió:

```bash
./launchd/install.sh
```

Genera `~/Library/LaunchAgents/com.dailytodo.server.plist` a partir de la plantilla, apuntant al repo actual i al teu Node, i el carrega.

Per treure'l:

```bash
./launchd/uninstall.sh
```

---

## Usar-ho des de Claude Code

Si fas servir [Claude Code](https://www.claude.com/product/claude-code) hi ha un slash command llest a `claude/commands/todo.md`. Ensenya a Claude quan afegir tasques, quan marcar progrés i com generar l'update diari sense haver d'escriure tu les comandes.

Mira [`claude/README.md`](./claude/README.md) pels passos d'instal·lació.

---

## Tests

Només el servidor té tests automatitzats:

```bash
npm test
```

Executa Vitest sobre la base de dades, els serveis i les rutes HTTP.

---

## Estructura del projecte

```
daily-todo/
├── cli/                  # CLI Node (Commander)
├── dashboard/            # React + Vite
├── server/               # Express + SQLite
├── launchd/              # autoarrencada macOS
├── claude/               # slash command per Claude Code
├── package.json          # arrel dels workspaces
├── README.md             # anglès
├── README.es.md          # castellà
├── README.ca.md          # aquest fitxer
├── README.fr.md          # francès
└── LICENSE               # MIT
```

---

## Contribuir

Les pull requests són benvingudes — fixes, idiomes nous, comandes CLI noves, millores al dashboard. Per canvis no trivials, obre primer una issue per acordar la forma.

---

## Llicència

[MIT](./LICENSE) — fes el que vulguis, només respecta el copyright.
