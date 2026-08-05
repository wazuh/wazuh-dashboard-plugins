#!/bin/bash
# Helpers for the local unit tests of tools/changelog_bump.sh and
# tools/repository_bumper.sh.
#
# Every test runs against a throwaway fixture git repository created under
# tmp/: the real scripts are copied into the fixture and executed there,
# with "origin" pointing at the fixture's own local path (offline) and a
# stubbed yarn. The real repository is NEVER modified.

TESTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REAL_TOOLS_DIR="${REAL_TOOLS_DIR:-$(dirname "$TESTS_DIR")}"
TESTS_TMP="${TESTS_DIR}/tmp"
mkdir -p "$TESTS_TMP"

# Plugins present in the fixture; loop over this list so every plugin gets
# the same assertions as plugins/main.
PLUGINS=(main wazuh-core wazuh-check-updates)

PASS=0
FAIL=0
CURRENT_TEST=""

# ====
# Start a named test case; the name is echoed and reused to label the
# fixture directory created by setup_fixture.
# Arguments:
#   $1 - test case name (e.g. "argument validation")
# ====
test_case() { CURRENT_TEST="$1"; echo "-- $1"; }

# ====
# Record a passing assertion and print it.
# Arguments:
#   $1 - assertion message
# ====
pass() { PASS=$((PASS + 1)); echo "   ok: $1"; }

# ====
# Record a failing assertion and print it.
# Arguments:
#   $1 - assertion message (with failure details)
# ====
fail() { FAIL=$((FAIL + 1)); echo "   FAIL: $1"; }

# ====
# Assert that two values are exactly equal.
# Arguments:
#   $1 - expected value
#   $2 - actual value
#   $3 - assertion message
# ====
assert_eq() {
  if [[ "$2" == "$1" ]]; then pass "$3"; else fail "$3 — expected '$1', got '$2'"; fi
}

# ====
# Assert that a string contains a substring.
# Arguments:
#   $1 - haystack (string to search in)
#   $2 - needle (substring that must be present)
#   $3 - assertion message
# ====
assert_contains() {
  if [[ "$1" == *"$2"* ]]; then pass "$3"; else fail "$3 — missing '$2'"; fi
}

# ====
# Assert that a string does NOT contain a substring.
# Arguments:
#   $1 - haystack (string to search in)
#   $2 - needle (substring that must be absent)
#   $3 - assertion message
# ====
assert_not_contains() {
  if [[ "$1" != *"$2"* ]]; then pass "$3"; else fail "$3 — unexpectedly found '$2'"; fi
}

# ====
# Assert that a file contains a fixed string (also fails if the file is
# missing or unreadable).
# Arguments:
#   $1 - file path
#   $2 - fixed string that must be present
#   $3 - assertion message
# ====
assert_file_contains() {
  if grep -qF -- "$2" "$1" 2>/dev/null; then pass "$3"; else fail "$3 — '$2' not in $1"; fi
}

# ====
# Assert that a file does NOT contain a fixed string (also passes if the
# file is missing).
# Arguments:
#   $1 - file path
#   $2 - fixed string that must be absent
#   $3 - assertion message
# ====
assert_file_not_contains() {
  if ! grep -qF -- "$2" "$1" 2>/dev/null; then pass "$3"; else fail "$3 — '$2' present in $1"; fi
}

# ====
# Create a fixture git repository with the minimal structure both scripts
# expect. The path contains "github.com/" so that get_repo_path() resolves
# to "wazuh/test-repo" without hitting the network, and origin points to the
# repo itself so `git ls-remote --tags origin` works offline.
# The fixture directory is named after the current test (set by `test_case`)
# so leftover fixtures in tmp/ are easy to map back to their test case.
# Arguments:
#   none (uses CURRENT_TEST to name the fixture directory)
# Sets:
#   FIXTURE - fixture root (also holds the yarn stub in bin/)
#   WORK    - fixture git repository path (run the scripts from here)
# ====
setup_fixture() {
  local slug
  slug=$(printf '%s' "$CURRENT_TEST" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-')
  slug="${slug#-}"
  slug="${slug%-}"
  FIXTURE=$(mktemp -d "${TESTS_TMP}/${slug:-fixture}.XXXXXX")
  WORK="${FIXTURE}/github.com/wazuh/test-repo"
  mkdir -p "$WORK/tools" \
    "$WORK/plugins/main/common/api-info" \
    "$WORK/plugins/wazuh-core" \
    "$WORK/plugins/wazuh-check-updates" \
    "$WORK/.github/workflows" \
    "$WORK/docker/imposter"

  cp "$REAL_TOOLS_DIR/changelog_bump.sh" "$REAL_TOOLS_DIR/repository_bumper.sh" "$WORK/tools/"

  cat >"$WORK/VERSION.json" <<'EOF'
{
  "version": "5.0.0",
  "stage": "alpha0"
}
EOF

  # NOTE: repository_bumper.sh reads the package.json "version" from line 3,
  # so it must stay there.
  cat >"$WORK/plugins/main/package.json" <<'EOF'
{
  "name": "wazuh",
  "version": "5.0.0",
  "revision": "02",
  "pluginPlatform": {
    "version": "2.19.1"
  }
}
EOF

  cat >"$WORK/plugins/wazuh-core/package.json" <<'EOF'
{
  "name": "wazuh-core",
  "version": "5.0.0",
  "revision": "02"
}
EOF

  cat >"$WORK/plugins/wazuh-check-updates/package.json" <<'EOF'
{
  "name": "wazuh-check-updates",
  "version": "5.0.0",
  "revision": "02"
}
EOF

  cat >"$WORK/plugins/main/opensearch_dashboards.json" <<'EOF'
{
  "id": "wazuh",
  "version": "5.0.0-02"
}
EOF

  cat >"$WORK/plugins/wazuh-core/opensearch_dashboards.json" <<'EOF'
{
  "id": "wazuhCore",
  "version": "5.0.0-02"
}
EOF

  cat >"$WORK/plugins/wazuh-check-updates/opensearch_dashboards.json" <<'EOF'
{
  "id": "wazuhCheckUpdates",
  "version": "5.0.0-02"
}
EOF

  cat >"$WORK/plugins/main/common/api-info/endpoints.json" <<'EOF'
{
  "documentation": "https://documentation.wazuh.com/5.0/user-manual/api/reference.html"
}
EOF

  cat >"$WORK/.github/workflows/dev-environment.yml" <<'EOF'
on:
  workflow_dispatch:
    inputs:
      reference:
        default: main
      reference_single:
        default: 'main'
      reference_double:
        default: "main"
EOF

  cat >"$WORK/docker/imposter/wazuh-config.yml" <<'EOF'
plugin: openapi
specFile: https://raw.githubusercontent.com/wazuh/wazuh/main/api/api/spec/spec.yaml
EOF

  cat >"$WORK/CHANGELOG.md" <<'EOF'
## [v5.0.0]

### Added

| Issue | Comment |
| ----- | ------- |
| [#1](https://github.com/wazuh/test-repo/issues/1) | Some existing feature entry |

### Changed

| Issue | Comment |
| ----- | ------- |

### Removed

| Issue | Comment |
| ----- | ------- |

### Fixed

| Issue | Comment |
| ----- | ------- |

## Prior versions

- [v4.10.0](https://github.com/wazuh/test-repo/blob/v4.10.0/CHANGELOG.md)
EOF

  git -C "$WORK" -c init.defaultBranch=main init -q
  git -C "$WORK" config user.email test@example.com
  git -C "$WORK" config user.name test
  git -C "$WORK" add -A
  git -C "$WORK" -c commit.gpgsign=false commit -qm "fixture"

  # "Released" tags: mix of X.Y.Z, vX.Y.Z and junk that must be filtered out.
  local tag
  for tag in 4.9.0 4.9.1 4.10.0 v4.10.1 4.10.2 5.0.0 not-a-version 4.9; do
    git -C "$WORK" tag "$tag"
  done

  git -C "$WORK" remote add origin "$WORK"

  # yarn stub that always fails: deterministically forces the sed fallback
  # in update_endpoints_json (and avoids touching the network).
  mkdir -p "$FIXTURE/bin"
  printf '#!/bin/sh\nexit 1\n' >"$FIXTURE/bin/yarn"
  chmod +x "$FIXTURE/bin/yarn"
}

# ====
# Run a tools/ script inside the fixture (with the yarn stub on PATH).
# Arguments:
#   $1 - script file name inside tools/ (e.g. "changelog_bump.sh")
#   $@ - remaining arguments are passed through to the script
# Sets:
#   OUTPUT - combined stdout+stderr of the script
#   STATUS - exit code of the script
# ====
run_tool() {
  local script="$1"
  shift
  OUTPUT=$(cd "$WORK" && PATH="$FIXTURE/bin:$PATH" bash "tools/$script" "$@" 2>&1)
  STATUS=$?
}

# ====
# Print the "Prior versions" changelog link line for a version, matching the
# format written by changelog_bump.sh (no trailing newline).
# Arguments:
#   $1 - version (e.g. "5.0.0")
# ====
changelog_link() {
  printf -- '- [v%s](https://github.com/wazuh/test-repo/blob/v%s/CHANGELOG.md)' "$1" "$1"
}

# ====
# Extract the "- ..." lines after the "## Prior versions" heading from the
# fixture's CHANGELOG.md.
# Arguments:
#   none (reads $WORK/CHANGELOG.md)
# ====
prior_versions_block() {
  awk '/^## Prior versions$/{f=1;next} f' "$WORK/CHANGELOG.md" | grep '^- ' || true
}

# ====
# Build the expected "Prior versions" block (one link line per version, in
# the given order) to compare against prior_versions_block.
# Arguments:
#   $@ - versions, newest first (e.g. 5.0.0 4.10.2 4.10.1)
# ====
expected_priors() {
  local v
  for v in "$@"; do
    changelog_link "$v"
    echo
  done
}

# ====
# Print the pass/fail summary for the test file and return non-zero if any
# assertion failed (used as the file's exit code).
# Arguments:
#   none
# ====
summary() {
  echo ""
  echo "== ${PASS} passed, ${FAIL} failed =="
  [[ $FAIL -eq 0 ]]
}
