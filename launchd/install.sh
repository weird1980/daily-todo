#!/usr/bin/env bash
# Install the daily-todo server as a macOS LaunchAgent so it starts at login.
# Usage:
#   ./launchd/install.sh

set -euo pipefail

REPO_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NODE_PATH="$(command -v node || true)"
HOME_DIR="${HOME}"

if [[ -z "${NODE_PATH}" ]]; then
  echo "Error: node not found in PATH. Install Node.js first." >&2
  exit 1
fi

mkdir -p "${HOME_DIR}/.todo"
mkdir -p "${HOME_DIR}/Library/LaunchAgents"

TEMPLATE="${REPO_PATH}/launchd/daily-todo-server.plist.template"
TARGET="${HOME_DIR}/Library/LaunchAgents/com.dailytodo.server.plist"

sed -e "s|__NODE_PATH__|${NODE_PATH}|g" \
    -e "s|__REPO_PATH__|${REPO_PATH}|g" \
    -e "s|__HOME__|${HOME_DIR}|g" \
    "${TEMPLATE}" > "${TARGET}"

launchctl unload "${TARGET}" 2>/dev/null || true
launchctl load "${TARGET}"

echo "Installed: ${TARGET}"
echo "Server should be running on http://localhost:7847"
echo "Logs: ${HOME_DIR}/.todo/server.log"
