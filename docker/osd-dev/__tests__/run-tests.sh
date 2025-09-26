#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/__tests__/test.yml"
SERVICE_NAME="dev-sh-tests"
PROJECT_NAME="${COMPOSE_PROJECT_NAME:-devshtests}"

compose_cmd=(docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME")

"${compose_cmd[@]}" build "$SERVICE_NAME"

cmd=("${compose_cmd[@]}" run --rm "${SERVICE_NAME}")

if [[ $# -gt 0 ]]; then
  cmd+=("$@")
fi

exec "${cmd[@]}"
