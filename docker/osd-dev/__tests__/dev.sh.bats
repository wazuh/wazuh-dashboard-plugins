#!/usr/bin/env bats

setup() {
  REPO_ROOT="$(cd "${BATS_TEST_DIRNAME}/.." && pwd)"
  STUB_PATH="${BATS_TEST_DIRNAME}/fixtures/bin"
  NO_JQ_PATH="${BATS_TEST_DIRNAME}/fixtures/path-no-jq"
  SYSTEM_PATH="$PATH"
  DOCKER_LOG="${BATS_TEST_TMPDIR}/docker.log"
}

teardown() {
  rm -f "${REPO_ROOT}/dev.override.generated.yml"
  rm -f "${DOCKER_LOG}"
}

@test "fails when jq is missing" {
  run env PATH="$NO_JQ_PATH" /bin/bash -c "cd '$REPO_ROOT' && ./dev.sh up"
  [ "$status" -eq 1 ]
  [[ "$output" == *"[ERROR] jq is not installed."* ]]
}

@test "shows usage when no action is provided" {
  run env PATH="$STUB_PATH:$SYSTEM_PATH" /bin/bash -c "cd '$REPO_ROOT' && ./dev.sh"
  [ "$status" -eq 255 ]
  [[ "$output" == *"[ERROR] Incorrect number of arguments"* ]]
  [[ "$output" == *"action is one of"* ]]
}

@test "rejects invalid agents flag value" {
  run env PATH="$STUB_PATH:$SYSTEM_PATH" /bin/bash -c "cd '$REPO_ROOT' && ./dev.sh -a invalid up"
  [ "$status" -eq 255 ]
  [[ "$output" == *"Invalid value for -a option"* ]]
}

@test "fails for unsupported mode" {
  run env PATH="$STUB_PATH:$SYSTEM_PATH" /bin/bash -c "cd '$REPO_ROOT' && ./dev.sh up imaginary"
  [ "$status" -eq 255 ]
  [[ "$output" == *"Unsupported mode"* ]]
}

@test "requires server version for server-local" {
  run env PATH="$STUB_PATH:$SYSTEM_PATH" /bin/bash -c "cd '$REPO_ROOT' && ./dev.sh up server-local"
  [ "$status" -eq 255 ]
  [[ "$output" == *"server-local mode requires the server_version argument"* ]]
}

@test "requires server version for server mode" {
  run env PATH="$STUB_PATH:$SYSTEM_PATH" /bin/bash -c "cd '$REPO_ROOT' && ./dev.sh up server"
  [ "$status" -eq 255 ]
  [[ "$output" == *"server mode requires the server_version argument"* ]]
}

@test "fails when action is unknown" {
  run env PATH="$STUB_PATH:$SYSTEM_PATH" /bin/bash -c "cd '$REPO_ROOT' && ./dev.sh nonsense"
  [ "$status" -eq 255 ]
  [[ "$output" == *"Action must be up | down | stop | start | manager-local-up"* ]]
}

@test "fails when repo override format is invalid" {
  run env PATH="$STUB_PATH:$SYSTEM_PATH" /bin/bash -c "cd '$REPO_ROOT' && ./dev.sh -r invalid up"
  [ "$status" -eq 255 ]
  [[ "$output" == *"Invalid repository specification"* ]]
}

@test "fails when default repo root does not exist" {
  nonexistent="${BATS_TEST_TMPDIR}/missing-root"
  run env PATH="$STUB_PATH:$SYSTEM_PATH" /bin/bash -c "cd '$REPO_ROOT' && ./dev.sh '$nonexistent' up"
  [ "$status" -eq 255 ]
  [[ "$output" == *"does not exist"* ]]
}

@test "fails when jq cannot provide plugin version" {
  run env PATH="$STUB_PATH:$SYSTEM_PATH" JQ_STUB_PLUGIN_PLATFORM_VERSION="" /bin/bash -c "cd '$REPO_ROOT' && ./dev.sh up"
  [ "$status" -eq 1 ]
  [[ "$output" == *"Could not retrieve the OS version"* ]]
}

@test "fails on unknown option" {
  run env PATH="$STUB_PATH:$SYSTEM_PATH" /bin/bash -c "cd '$REPO_ROOT' && ./dev.sh -z up"
  [ "$status" -eq 255 ]
  [[ "$output" == *"Invalid option: -z"* ]]
}

@test "fails when option argument is missing" {
  run env PATH="$STUB_PATH:$SYSTEM_PATH" /bin/bash -c "cd '$REPO_ROOT' && ./dev.sh -o"
  [ "$status" -eq 255 ]
  [[ "$output" == *"The -o option requires an argument."* ]]
}

@test "fails when extra arguments are provided" {
  run env PATH="$STUB_PATH:$SYSTEM_PATH" /bin/bash -c "cd '$REPO_ROOT' && ./dev.sh up server 1.2.3 unexpected"
  [ "$status" -eq 255 ]
  [[ "$output" == *"Unexpected arguments"* ]]
}

@test "creates override file for external repo" {
  external_dir="${BATS_TEST_TMPDIR}/external"
  mkdir -p "$external_dir"
  run env PATH="$STUB_PATH:$SYSTEM_PATH" DOCKER_STUB_LOG="$DOCKER_LOG" /bin/bash -c "cd '$REPO_ROOT' && ./dev.sh -r custom='$external_dir' up"
  [ "$status" -eq 0 ]
  [[ -f "$REPO_ROOT/dev.override.generated.yml" ]]
  [[ "$(cat "$REPO_ROOT/dev.override.generated.yml")" == *"device: $external_dir"* ]]
}

@test "trims trailing slashes on external repo override" {
  external_dir="${BATS_TEST_TMPDIR}/with-trailing"
  mkdir -p "$external_dir"
  run env PATH="$STUB_PATH:$SYSTEM_PATH" DOCKER_STUB_LOG="$DOCKER_LOG" /bin/bash -c "cd '$REPO_ROOT' && ./dev.sh -r custom='${external_dir}/' up"
  [ "$status" -eq 0 ]
  [[ "$(cat "$REPO_ROOT/dev.override.generated.yml")" == *"device: $external_dir"* ]]
}

@test "uses server-local profile based on agents flag" {
  run env PATH="$STUB_PATH:$SYSTEM_PATH" DOCKER_STUB_LOG="$DOCKER_LOG" /bin/bash -c "cd '$REPO_ROOT' && ./dev.sh -a rpm up server-local 2.4.0"
  [ "$status" -eq 0 ]
  [[ "$(cat "$DOCKER_LOG")" == *"--profile server-local-rpm"* ]]
}

@test "uses server-local-without profile without agents" {
  run env PATH="$STUB_PATH:$SYSTEM_PATH" DOCKER_STUB_LOG="$DOCKER_LOG" /bin/bash -c "cd '$REPO_ROOT' && ./dev.sh -a without up server-local 2.4.0"
  [ "$status" -eq 0 ]
  [[ "$(cat "$DOCKER_LOG")" == *"--profile server-local-without"* ]]
}

@test "runs up successfully with stubs" {
  run env PATH="$STUB_PATH:$SYSTEM_PATH" DOCKER_STUB_LOG="$DOCKER_LOG" /bin/bash -c "cd '$REPO_ROOT' && ./dev.sh up"
  [ "$status" -eq 0 ]
  [[ -f "$REPO_ROOT/dev.yml" ]]
  [[ -s "$DOCKER_LOG" ]]
  [[ "$output" == *"No external repositories provided"* ]]
}
