#!/usr/bin/env bash
set -euo pipefail

cd /workspace/docker/osd-dev/scripts

cmd=("jest" "--config" "/workspace/docker/osd-dev/scripts/__tests__/jest.config.js")

if [[ $# -gt 0 ]]; then
  cmd+=("$@")
fi

exec "${cmd[@]}"

