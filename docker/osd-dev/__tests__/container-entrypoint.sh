#!/usr/bin/env bash
set -euo pipefail

cd /workspace/docker/osd-dev

cmd=("bats")
if [[ $# -gt 0 ]]; then
  cmd+=("$@")
fi
cmd+=("__tests__/dev.sh.bats")

exec "${cmd[@]}"
