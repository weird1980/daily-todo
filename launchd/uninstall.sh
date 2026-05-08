#!/usr/bin/env bash
# Uninstall the daily-todo LaunchAgent.

set -euo pipefail

TARGET="${HOME}/Library/LaunchAgents/com.dailytodo.server.plist"

if [[ -f "${TARGET}" ]]; then
  launchctl unload "${TARGET}" 2>/dev/null || true
  rm -f "${TARGET}"
  echo "Removed: ${TARGET}"
else
  echo "Nothing to remove."
fi
