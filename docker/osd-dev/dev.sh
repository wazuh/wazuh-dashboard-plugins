#!/bin/bash

# dev.sh - Wrapper script to invoke the TypeScript development script via Docker
# All logic has been migrated to scripts/dev.ts

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WDP_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"

if [[ -z "$WDP_ROOT" ]]; then
  WDP_ROOT="$(realpath "${SCRIPT_DIR}/../..")"
fi

SIBLING_ROOT="$(realpath "${WDP_ROOT}/..")"

export WDP_ROOT
export SIBLING_ROOT
export CURRENT_REPO_HOST_ROOT="$WDP_ROOT"
export SIBLING_REPO_HOST_ROOT="$SIBLING_ROOT"

DEBUG_MODE=0

for arg in "$@"; do
  if [[ "$arg" == "--debug" ]]; then
    DEBUG_MODE=1
  fi
done

COMPOSE_FILE="${SCRIPT_DIR}/scripts/dev-ts.yml"

# Build the TypeScript container image if it doesn't exist
echo "[INFO] Building TypeScript development container..."
docker compose -f "${COMPOSE_FILE}" build

# Run the TypeScript script inside Docker, passing all arguments
echo "[INFO] Running development script..."
if [[ $DEBUG_MODE -eq 1 ]]; then
  echo "[INFO] Debug mode enabled: starting container with 'tail -f /dev/null'."
  docker compose -f "${COMPOSE_FILE}" run --rm --entrypoint "tail -f /dev/null" dev-script
else
  docker compose -f "${COMPOSE_FILE}" run --rm dev-script "$@"
fi
