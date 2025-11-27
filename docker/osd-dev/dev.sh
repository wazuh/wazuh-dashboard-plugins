#!/bin/bash

# dev.sh - Wrapper script to invoke the TypeScript development script via Docker
# All logic has been migrated to scripts/dev.ts

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WDP_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"

if [[ -z "$WDP_ROOT" ]]; then
  WDP_ROOT="$(realpath "${SCRIPT_DIR}/../..")"
fi

SIBLING_ROOT="$(realpath "${WDP_ROOT}/../../..")"

export WDP_ROOT
export SIBLING_ROOT
export CURRENT_REPO_HOST_ROOT="$WDP_ROOT"
export SIBLING_REPO_HOST_ROOT="$SIBLING_ROOT"

DEBUG_MODE=0
SHOW_BUILD_LOGS=0

# Collect pass-through args, stripping dev.sh-only flags
PASS_ARGS=()
for arg in "$@"; do
  case "$arg" in
    --debug)
      DEBUG_MODE=1
      ;;
    -v|--verbose)
      SHOW_BUILD_LOGS=1
      ;;
    *)
      PASS_ARGS+=("$arg")
      ;;
  esac
done

COMPOSE_FILE="${SCRIPT_DIR}/scripts/dev-ts.yml"

# Build the TypeScript container image if it doesn't exist
echo "[INFO] Building TypeScript development container..."
if [[ "$SHOW_BUILD_LOGS" -eq 1 ]]; then
  docker compose -f "${COMPOSE_FILE}" build
else
  # Hide progress/output on success. Keep errors visible.
  # Prefer compose --quiet (v2) to suppress BuildKit progress, fallback to plain build.
  if docker compose -f "${COMPOSE_FILE}" build --quiet >/dev/null; then
    :
  else
    docker compose -f "${COMPOSE_FILE}" build >/dev/null
  fi
fi

# Run the TypeScript script inside Docker, passing all arguments
echo "[INFO] Running development script..."
if [[ $DEBUG_MODE -eq 1 ]]; then
  echo "[INFO] Debug mode enabled: starting container with 'tail -f /dev/null'."
  docker compose -f "${COMPOSE_FILE}" run --rm --entrypoint tail dev-script -f /dev/null
else
  docker compose -f "${COMPOSE_FILE}" run --rm dev-script "${PASS_ARGS[@]}"
fi
