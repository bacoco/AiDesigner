#!/usr/bin/env bash
set -euo pipefail

# Determine repository root (directory containing this script)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

log() {
  printf '\n\033[1;34m[final]\033[0m %s\n' "$1"
}

run_step() {
  local description="$1"
  shift
  log "${description}"
  "$@"
}

if [ ! -d "node_modules" ]; then
  run_step "Installing dependencies" npm install
else
  log "Dependencies already installed — skipping npm install"
fi

run_step "Running format check" npm run format:check
run_step "Running lint" npm run lint
run_step "Running unit tests" npm test
run_step "Building MCP server" npm run build:mcp

log "All steps completed successfully!"
