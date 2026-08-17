#!/usr/bin/env bash
set -euo pipefail

cd /workspace/docker/osd-dev/scripts

# Ensure local runtime deps (e.g., chalk@4) are available to avoid ESM-only packages
# from the workspace root leaking into these tests.
if [[ ! -d node_modules/chalk ]]; then
  npm install --no-audit --no-fund --package-lock=false --omit=dev >/dev/null 2>&1 || true
fi

echo "DEBUG typescript version: $(node -e "console.log(require('typescript/package.json').version)")"
echo "DEBUG typescript resolved path: $(node -e "console.log(require.resolve('typescript'))")"
echo "DEBUG tsconfig content:"
cat /workspace/docker/osd-dev/scripts/__tests__/tsconfig.json
echo "DEBUG root tsconfig exists: $(test -f /workspace/tsconfig.json && echo yes || echo no)"
echo "DEBUG PWD: $(pwd)"
echo "DEBUG ts-jest version: $(node -e "console.log(require('ts-jest/package.json').version)")"

cmd=("jest" "--config" "/workspace/docker/osd-dev/scripts/__tests__/jest.config.js")

if [[ $# -gt 0 ]]; then
  cmd+=("$@")
fi

exec "${cmd[@]}"
