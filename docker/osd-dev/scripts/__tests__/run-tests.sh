#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/docker/osd-dev/scripts/__tests__/test.yml"
SERVICE_NAME="script-tests"
PROJECT_NAME="${COMPOSE_PROJECT_NAME:-scripttests}"

# Build logs are hidden by default; show them when -v/--verbose is present.
SHOW_BUILD_LOGS=0
for arg in "$@"; do
  if [[ "$arg" == "-v" || "$arg" == "--verbose" ]]; then
    SHOW_BUILD_LOGS=1
    break
  fi
done

compose_cmd=(docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME")

if [[ "$SHOW_BUILD_LOGS" == "1" ]]; then
  "${compose_cmd[@]}" build "$SERVICE_NAME"
else
  # Hide progress/output on success. Keep errors visible.
  if "${compose_cmd[@]}" build --quiet "$SERVICE_NAME" >/dev/null; then
    :
  else
    "${compose_cmd[@]}" build "$SERVICE_NAME" >/dev/null
  fi
fi

cmd=("${compose_cmd[@]}" run --rm "$SERVICE_NAME" "$@")

exec "${cmd[@]}"
