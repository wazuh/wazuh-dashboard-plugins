#!/usr/bin/env bats

setup() {
  REPO_ROOT="$(cd "${BATS_TEST_DIRNAME}/.." && pwd)"
  STUB_PATH="${BATS_TEST_DIRNAME}/__mocks__/bin"
  NO_JQ_PATH="${BATS_TEST_DIRNAME}/__mocks__/path-no-jq"
  SYSTEM_PATH="$PATH"
  DOCKER_LOG="${BATS_TEST_TMPDIR}/docker.log"
}

teardown() {
  rm -f "${REPO_ROOT}/dev.override.generated.yml"
  rm -f "${DOCKER_LOG}"
}

assert_log_contains() {
  local expected="$1"
  if [[ ! -s "$DOCKER_LOG" ]]; then
    echo "docker log is empty" >&2
    return 1
  fi
  grep -F -- "$expected" "$DOCKER_LOG" >/dev/null
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
  assert_log_contains "-f dev.override.generated.yml"
}

@test "trims trailing slashes on external repo override" {
  external_dir="${BATS_TEST_TMPDIR}/with-trailing"
  mkdir -p "$external_dir"
  run env PATH="$STUB_PATH:$SYSTEM_PATH" DOCKER_STUB_LOG="$DOCKER_LOG" /bin/bash -c "cd '$REPO_ROOT' && ./dev.sh -r custom='${external_dir}/' up"
  [ "$status" -eq 0 ]
  [[ "$(cat "$REPO_ROOT/dev.override.generated.yml")" == *"device: $external_dir"* ]]
  assert_log_contains "-f dev.override.generated.yml"
}

@test "creates volumes for multiple external repos" {
  external_dir1="${BATS_TEST_TMPDIR}/external1"
  external_dir2="${BATS_TEST_TMPDIR}/external2"
  mkdir -p "$external_dir1" "$external_dir2"
  run env PATH="$STUB_PATH:$SYSTEM_PATH" DOCKER_STUB_LOG="$DOCKER_LOG" /bin/bash -c "cd '$REPO_ROOT' && ./dev.sh -r custom1='$external_dir1' -r custom2='$external_dir2' up"
  [ "$status" -eq 0 ]
  override_file="$REPO_ROOT/dev.override.generated.yml"
  [[ -f "$override_file" ]]
  [[ "$(cat "$override_file")" == *"custom1:"* ]]
  [[ "$(cat "$override_file")" == *"device: $external_dir1"* ]]
  [[ "$(cat "$override_file")" == *"custom2:"* ]]
  [[ "$(cat "$override_file")" == *"device: $external_dir2"* ]]
  assert_log_contains "-f dev.override.generated.yml"
}

@test "base flag requires existing repository path" {
  missing_dir="${BATS_TEST_TMPDIR}/missing-dashboard"
  run env PATH="$STUB_PATH:$SYSTEM_PATH" /bin/bash -c "cd '$REPO_ROOT' && ./dev.sh -base '$missing_dir' up"
  [ "$status" -eq 255 ]
  [[ "$output" == *"Repository path '$missing_dir' for 'wazuh-dashboard' does not exist."* ]]
}

@test "base flag selects dashboard-src profile" {
  base_dir="${BATS_TEST_TMPDIR}/dashboard-src"
  mkdir -p "$base_dir"
  echo "v18.19.0" > "$base_dir/.nvmrc"
  run env PATH="$STUB_PATH:$SYSTEM_PATH" DOCKER_STUB_LOG="$DOCKER_LOG" /bin/bash -c "cd '$REPO_ROOT' && ./dev.sh -base '$base_dir' up"
  [ "$status" -eq 0 ]
  override_file="$REPO_ROOT/dev.override.generated.yml"
  [[ ! -f "$override_file" ]]
  log_contents="$(cat "$DOCKER_LOG")"
  [[ "$log_contents" == *"--profile dashboard-src"* ]]
  [[ "$log_contents" != *"dev.override.generated.yml"* ]]
  [[ "$output" == *"dashboard-src"* ]]
}

@test "base flag after action is supported" {
  base_dir="${BATS_TEST_TMPDIR}/dashboard-after"
  mkdir -p "$base_dir"
  echo "v18.19.0" > "$base_dir/.nvmrc"
  run env PATH="$STUB_PATH:$SYSTEM_PATH" DOCKER_STUB_LOG="$DOCKER_LOG" /bin/bash -c "cd '$REPO_ROOT' && ./dev.sh up -base '$base_dir'"
  [ "$status" -eq 0 ]
  log_contents="$(cat "$DOCKER_LOG")"
  [[ "$log_contents" == *"--profile dashboard-src"* ]]
  [[ "$log_contents" != *"dev.override.generated.yml"* ]]
  [[ "$output" == *"dashboard-src"* ]]
}

@test "base flag combines with external plugins" {
  base_dir="${BATS_TEST_TMPDIR}/dashboard-combo"
  plugin_dir="${BATS_TEST_TMPDIR}/external-plugin"
  mkdir -p "$base_dir" "$plugin_dir"
  echo "v18.19.0" > "$base_dir/.nvmrc"
  plugin_real="$(realpath "$plugin_dir")"
  run env PATH="$STUB_PATH:$SYSTEM_PATH" DOCKER_STUB_LOG="$DOCKER_LOG" /bin/bash -c "cd '$REPO_ROOT' && ./dev.sh -base '$base_dir' -r custom='$plugin_dir' up"
  [ "$status" -eq 0 ]
  override_file="$REPO_ROOT/dev.override.generated.yml"
  [[ -f "$override_file" ]]
  override_content="$(cat "$override_file")"
  [[ "$override_content" == *"dashboard-src:"* ]]
  [[ "$override_content" == *"custom:/home/node/kbn/plugins/custom"* ]]
  [[ "$override_content" != *"wazuh-dashboard-base"* ]]
  [[ "$override_content" == *"device: $plugin_real"* ]]
  assert_log_contains "-f dev.override.generated.yml"
  [[ "$output" == *"dashboard-src"* ]]
}

@test "removes stale override when no external repos" {
  echo "stale" > "$REPO_ROOT/dev.override.generated.yml"
  run env PATH="$STUB_PATH:$SYSTEM_PATH" DOCKER_STUB_LOG="$DOCKER_LOG" /bin/bash -c "cd '$REPO_ROOT' && ./dev.sh up"
  [ "$status" -eq 0 ]
  [[ ! -f "$REPO_ROOT/dev.override.generated.yml" ]]
}

@test "uses server-local profile based on agents flag" {
  run env PATH="$STUB_PATH:$SYSTEM_PATH" DOCKER_STUB_LOG="$DOCKER_LOG" /bin/bash -c "cd '$REPO_ROOT' && ./dev.sh -a rpm up server-local 2.4.0"
  [ "$status" -eq 0 ]
  assert_log_contains "--profile server-local-rpm"
}

@test "uses server-local-without profile without agents" {
  run env PATH="$STUB_PATH:$SYSTEM_PATH" DOCKER_STUB_LOG="$DOCKER_LOG" /bin/bash -c "cd '$REPO_ROOT' && ./dev.sh -a without up server-local 2.4.0"
  [ "$status" -eq 0 ]
  assert_log_contains "--profile server-local-without"
}

@test "server mode uses server profile" {
  run env PATH="$STUB_PATH:$SYSTEM_PATH" DOCKER_STUB_LOG="$DOCKER_LOG" /bin/bash -c "cd '$REPO_ROOT' && ./dev.sh up server 4.2.0"
  [ "$status" -eq 0 ]
  assert_log_contains "--profile server"
}

@test "down action includes cleanup flags" {
  run env PATH="$STUB_PATH:$SYSTEM_PATH" DOCKER_STUB_LOG="$DOCKER_LOG" /bin/bash -c "cd '$REPO_ROOT' && ./dev.sh down"
  [ "$status" -eq 0 ]
  assert_log_contains "docker compose --profile standard -f dev.yml down -v --remove-orphans"
}

@test "stop action sets compose project name" {
  run env PATH="$STUB_PATH:$SYSTEM_PATH" DOCKER_STUB_LOG="$DOCKER_LOG" /bin/bash -c "cd '$REPO_ROOT' && ./dev.sh stop"
  [ "$status" -eq 0 ]
  assert_log_contains "-p os-dev-123 stop"
}

@test "manager-local-up limits services" {
  run env PATH="$STUB_PATH:$SYSTEM_PATH" DOCKER_STUB_LOG="$DOCKER_LOG" /bin/bash -c "cd '$REPO_ROOT' && ./dev.sh manager-local-up"
  [ "$status" -eq 0 ]
  assert_log_contains "up -d wazuh.manager.local"
}

@test "runs up successfully with stubs" {
  run env PATH="$STUB_PATH:$SYSTEM_PATH" DOCKER_STUB_LOG="$DOCKER_LOG" /bin/bash -c "cd '$REPO_ROOT' && ./dev.sh up"
  [ "$status" -eq 0 ]
  [[ -f "$REPO_ROOT/dev.yml" ]]
  assert_log_contains "docker compose --profile standard -f dev.yml up -Vd"
  [[ "$output" == *"No external repositories provided"* ]]
}
