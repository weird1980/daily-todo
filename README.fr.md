# daily-todo

> 🌐 **Lire dans une autre langue :** [English](./README.md) · [Español](./README.es.md) · [Català](./README.ca.md)

Un gestionnaire de tâches quotidiennes **local-first**, avec trois facettes :

- 🖥️ **Tableau de bord web** — React + MUI, drag-and-drop, thèmes clair/sombre, deux tableaux (Travail / Personnel).
- ⌨️ **CLI** — commandes rapides depuis n'importe quel terminal (ou depuis Claude Code).
- 🔌 **Serveur REST + WebSocket** — un Express + SQLite minimal qui relie tout. Tout reste sur votre machine.

Toutes les surfaces sont multilingues : **English**, **Español**, **Català**, **Français**.

---

## Pourquoi ?

Je voulais un seul endroit pour :

- Planifier la journée le matin.
- Marquer la progression au fil de la journée.
- Générer un récapitulatif type Slack en fin de journée en une commande.
- Garder un historique et un graphique par jour pour voir où passe vraiment mon temps.

Pas de SaaS, pas de compte, pas de cloud. Juste SQLite dans `~/.todo/todo.db` et trois processus Node lancés avec un seul `npm run dev`.

---

## Architecture

```
┌─────────────┐     WebSocket      ┌──────────────────┐
│  Dashboard  │◄──────────────────►│   Serveur API    │
│  React+Vite │                    │   Express + ws   │
│  port 7848  │                    │   port 7847      │
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
- **Démarrage automatique (macOS)** — plist `launchd` optionnel.

---

## Démarrage rapide

### Prérequis

- Node.js 20 ou plus
- macOS, Linux ou WSL2 sous Windows

### Installation

```bash
git clone https://github.com/weird1980/daily-todo.git
cd daily-todo
npm install
```

### Tout lancer en mode dev

```bash
npm run dev
```

Ceci démarre le serveur API (`http://localhost:7847`) et le dashboard (`http://localhost:7848`) en parallèle.

Ouvrez le dashboard sur <http://localhost:7848>. La première fois il n'y a aucune catégorie — allez dans l'onglet **Catégories** et créez-en au moins une avant d'ajouter des tâches.

### Serveur seul

```bash
npm run server
```

### Dashboard seul

```bash
npm run dashboard
```

### Build de production du dashboard

```bash
npm run build
```

---

## Utiliser la CLI

La CLI parle au serveur via HTTP. C'est un script Node classique :

```bash
node cli/bin/todo.js <commande>
```

Pour un binaire `todo` global, exécutez `npm link` dans `cli/`. Vous pouvez aussi créer un alias dans votre shell.

```bash
# créer une catégorie
node cli/bin/todo.js categories add "travail" "#748ffc"

# ajouter une tâche
node cli/bin/todo.js add "Publier daily-todo" -c travail -p high

# lister les tâches du jour
node cli/bin/todo.js list

# marquer en cours
node cli/bin/todo.js progress 1 -s "Rédaction du README"

# marquer comme terminée
node cli/bin/todo.js done 1 -s "README et captures prêts"

# générer un update Slack (copié dans le presse-papiers)
node cli/bin/todo.js update

# afficher le standup d'hier
node cli/bin/todo.js standup

# historique en barres des 7 derniers jours
node cli/bin/todo.js history --days 7
```

Exécutez `node cli/bin/todo.js --help` pour la liste complète.

---

## Multilingue

Toutes les surfaces supportent quatre langues : `en`, `es`, `ca`, `fr`.

| Surface   | Comment choisir la langue |
|-----------|---------------------------|
| Dashboard | Sélecteur dans la barre de navigation (sauvegardé dans `localStorage`). |
| CLI       | Variable d'environnement `TODO_LANG`, par ex. `TODO_LANG=fr node cli/bin/todo.js list`. Sinon, utilise `LANG`, puis l'anglais. |
| Serveur   | `TODO_LANG` au démarrage du serveur. Affecte les textes du standup et de l'update Slack. |

La langue par défaut est l'**anglais**.

Pour ajouter une nouvelle langue, modifiez :

- `dashboard/src/i18n/locales.js`
- `cli/src/i18n.js`
- `server/src/i18n.js`

---

## Tableaux : Travail vs Personnel

Le dashboard a deux tableaux. Chaque catégorie appartient à l'un d'eux (`work` ou `personal`). Le toggle en haut à droite change tableau et thème en même temps. Pratique pour séparer pro et perso, avec un update Slack distinct par tableau.

---

## Données et persistance

- Tout vit dans `~/.todo/todo.db` (un seul fichier SQLite).
- WAL activé — vous pouvez copier ou sauvegarder pendant que le serveur tourne.
- Les logs de launchd sont dans `~/.todo/server.log` et `~/.todo/server.err` si vous utilisez le démarrage automatique.

Pour repartir de zéro :

```bash
rm -rf ~/.todo
```

---

## Démarrage automatique sur macOS (optionnel)

Pour que le serveur démarre à la connexion :

```bash
./launchd/install.sh
```

Génère `~/Library/LaunchAgents/com.dailytodo.server.plist` à partir du template, en pointant sur le dépôt courant et votre Node, puis le charge.

Pour le retirer :

```bash
./launchd/uninstall.sh
```

---

## Utilisation depuis Claude Code

Pour les utilisateurs de [Claude Code](https://www.claude.com/product/claude-code), un slash command est prêt dans `claude/commands/todo.md`. Il indique à Claude quand ajouter des tâches, quand marquer la progression et comment générer l'update quotidien sans avoir à taper les commandes.

Voir [`claude/README.md`](./claude/README.md) pour l'installation.

---

## Tests

Seul le serveur dispose de tests automatisés :

```bash
npm test
```

Exécute Vitest sur la base de données, les services et les routes HTTP.

---

## Structure du projet

```
daily-todo/
├── cli/                  # CLI Node (Commander)
├── dashboard/            # React + Vite
├── server/               # Express + SQLite
├── launchd/              # démarrage automatique macOS
├── claude/               # slash command pour Claude Code
├── package.json          # racine des workspaces
├── README.md             # anglais
├── README.es.md          # espagnol
├── README.ca.md          # catalan
├── README.fr.md          # ce fichier
└── LICENSE               # MIT
```

---

## Contribuer

Les pull requests sont bienvenues — corrections, nouvelles langues, nouvelles commandes CLI, améliorations du dashboard. Pour les changements non triviaux, ouvrez d'abord une issue afin d'accorder la forme.

---

## Licence

[MIT](./LICENSE) — faites-en ce que vous voulez, gardez juste la mention de copyright.
