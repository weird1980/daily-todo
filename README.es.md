# daily-todo

> 🌐 **Léelo en otro idioma:** [English](./README.md) · [Català](./README.ca.md) · [Français](./README.fr.md)

Un gestor de tareas diarias **local-first** con tres caras:

- 🖥️ **Dashboard web** — React + MUI, drag-and-drop, temas claro/oscuro, dos tableros (Trabajo / Personal).
- ⌨️ **CLI** — comandos rápidos desde cualquier terminal (o desde Claude Code, o donde quieras).
- 🔌 **Servidor REST + WebSocket** — un Express + SQLite minimalista que conecta las dos puntas. Todo se queda en tu máquina.

Todas las superficies son multiidioma: **English**, **Español**, **Català**, **Français**.

---

## ¿Por qué?

Quería un único sitio donde:

- Planificar el trabajo del día por la mañana.
- Marcar progreso durante la jornada.
- Generar un update tipo Slack al final del día con un solo comando.
- Tener histórico y un gráfico diario para ver dónde se me va realmente el tiempo.

Sin SaaS, sin cuentas, sin nube. Solo SQLite en `~/.todo/todo.db` y tres procesos Node que arrancas con un único `npm run dev`.

---

## Arquitectura

```
┌─────────────┐     WebSocket      ┌──────────────────┐
│  Dashboard  │◄──────────────────►│  Servidor API    │
│  React+Vite │                    │  Express + ws    │
│  puerto 7848│                    │  puerto 7847     │
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
- **Autoarranque (macOS)** — plist de `launchd` opcional.

---

## Empezar rápido

### Requisitos

- Node.js 20 o superior
- macOS, Linux o WSL2 en Windows

### Instalar

```bash
git clone https://github.com/weird1980/daily-todo.git
cd daily-todo
npm install
```

### Arrancar todo en modo dev

```bash
npm run dev
```

Esto arranca el servidor API (`http://localhost:7847`) y el dashboard (`http://localhost:7848`) en paralelo.

Abre el dashboard en <http://localhost:7848>. La primera vez no hay categorías — ve a la pestaña **Categorías** y crea al menos una antes de añadir tareas.

### Solo el servidor

```bash
npm run server
```

### Solo el dashboard

```bash
npm run dashboard
```

### Build de producción del dashboard

```bash
npm run build
```

---

## Usar la CLI

La CLI habla con el servidor por HTTP. Es un script Node normal:

```bash
node cli/bin/todo.js <comando>
```

Si prefieres un binario `todo` global, ejecuta `npm link` dentro de `cli/`. También puedes crear un alias en tu shell.

```bash
# crear una categoría
node cli/bin/todo.js categories add "trabajo" "#748ffc"

# añadir una tarea
node cli/bin/todo.js add "Publicar daily-todo" -c trabajo -p high

# listar las tareas de hoy
node cli/bin/todo.js list

# marcar en progreso
node cli/bin/todo.js progress 1 -s "Escribiendo el README"

# marcar como hecha
node cli/bin/todo.js done 1 -s "README y capturas listas"

# generar update tipo Slack (copia al portapapeles)
node cli/bin/todo.js update

# mostrar el standup de ayer
node cli/bin/todo.js standup

# histórico en gráfico de barras de los últimos 7 días
node cli/bin/todo.js history --days 7
```

Ejecuta `node cli/bin/todo.js --help` para ver la lista completa.

---

## Multiidioma

Todas las superficies soportan cuatro idiomas: `en`, `es`, `ca`, `fr`.

| Superficie | Cómo elegir el idioma |
|------------|----------------------|
| Dashboard  | Selector de idioma en la barra de navegación (se guarda en `localStorage`). |
| CLI        | Variable de entorno `TODO_LANG`, p. ej. `TODO_LANG=es node cli/bin/todo.js list`. Si no, usa la `LANG` del sistema y, en último caso, inglés. |
| Servidor   | `TODO_LANG` al arrancar el servidor. Afecta a los textos del standup y del update de Slack. |

El idioma por defecto es **inglés**.

Para añadir un idioma nuevo, edita:

- `dashboard/src/i18n/locales.js`
- `cli/src/i18n.js`
- `server/src/i18n.js`

---

## Tableros: Trabajo vs Personal

El dashboard tiene dos tableros. Cada categoría pertenece a uno de ellos (`work` o `personal`). El toggle de la parte superior derecha cambia tablero y tema de color a la vez. Útil para separar tareas profesionales y personales, con un update de Slack independiente por tablero.

---

## Datos y persistencia

- Todo vive en `~/.todo/todo.db` (un único fichero SQLite).
- WAL activado — puedes copiar o backupear con el servidor en marcha.
- Los logs de launchd están en `~/.todo/server.log` y `~/.todo/server.err` si usas el autoarranque.

Para empezar de cero:

```bash
rm -rf ~/.todo
```

---

## Autoarranque en macOS (opcional)

Si quieres que el servidor arranque al iniciar sesión:

```bash
./launchd/install.sh
```

Genera `~/Library/LaunchAgents/com.dailytodo.server.plist` a partir de la plantilla, apuntando a la ruta del repo y a tu binario de Node, y lo carga.

Para quitarlo:

```bash
./launchd/uninstall.sh
```

---

## Usarlo desde Claude Code

Si usas [Claude Code](https://www.claude.com/product/claude-code) hay un slash command listo en `claude/commands/todo.md`. Le enseña a Claude cuándo añadir tareas, cuándo marcar progreso y cómo generar el update diario sin que tengas que escribir los comandos a mano.

Mira [`claude/README.md`](./claude/README.md) para los pasos de instalación.

---

## Tests

Solo el servidor tiene tests automatizados:

```bash
npm test
```

Ejecuta Vitest sobre la base de datos, los servicios y las rutas HTTP.

---

## Estructura del proyecto

```
daily-todo/
├── cli/                  # CLI Node (Commander)
├── dashboard/            # React + Vite
├── server/               # Express + SQLite
├── launchd/              # autoarranque macOS
├── claude/               # slash command para Claude Code
├── package.json          # raíz de los workspaces
├── README.md             # inglés
├── README.es.md          # este archivo
├── README.ca.md          # catalán
├── README.fr.md          # francés
└── LICENSE               # MIT
```

---

## Contribuir

Las pull requests son bienvenidas — fixes, idiomas nuevos, comandos CLI nuevos, mejoras del dashboard. Para cambios no triviales abre antes una issue para acordar la forma.

---

## Licencia

[MIT](./LICENSE) — haz lo que quieras, solo respeta el copyright.
