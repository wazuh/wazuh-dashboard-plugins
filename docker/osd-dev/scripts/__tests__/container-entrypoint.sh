#!/usr/bin/env bash
set -euo pipefail

cd /workspace/docker/osd-dev/scripts

# Ensure local runtime deps (e.g., chalk@4) are available to avoid ESM-only packages
# from the workspace root leaking into these tests.
if [[ ! -d node_modules/chalk ]]; then
  npm install --no-audit --no-fund --package-lock=false --omit=dev >/dev/null 2>&1 || true
fi

cmd=("jest" "--config" "/workspace/docker/osd-dev/scripts/__tests__/jest.config.js")

if [[ $# -gt 0 ]]; then
  cmd+=("$@")
fi

exec "${cmd[@]}"
