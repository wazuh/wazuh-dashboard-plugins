#!/usr/bin/env bash
#
# test-manage-ai-assistant-indexer-api.sh
#
# Runs manage-ai-assistant-indexer-api.sh's actual commands against a REAL Wazuh indexer and
# prints expected vs actual for every check, so a human can confirm the behavior end to end
# (the main script's own review so far only ever exercised it against a mocked curl).
#
# ================================================================================================
# READ THIS FIRST:
#   - This PERMANENTLY DELETES every AI Assistant provider currently on the target indexer, as
#     its very first step, so every test starts from a known empty state. Provider API keys
#     are encrypted with an AAD bound to the provider's id, so once a provider is deleted its
#     key can NEVER be recovered or restored under a new id — not even by this script. A
#     snapshot of what existed is written before deleting anything (see SNAPSHOT_DIR below),
#     but it is a record for your reference only, not a way to undo the deletion.
#   - Settings (privacy/override/field-policy/conversation-retention) ARE safely reversible:
#     the pre-run values are captured in that same snapshot and restored automatically when
#     this script exits, success or failure, via a trap.
#   - Any provider THIS script itself creates during the run is deleted again before exit.
#
# Defaults to the local dev stack (docker/osd-dev) so it can be run with no flags at all:
#   INDEXER_URL=https://localhost:9200, INDEXER_USER=admin, INDEXER_PASSWORD=admin,
#   INSECURE_TLS=true. Override the same way as the target script (flags or environment
#   variables) to point this at a different indexer.
#
# Usage: ./test-manage-ai-assistant-indexer-api.sh [--indexer-url URL] [--user USER]
#                                                    [--password PASS] [--insecure|--no-insecure]

set -uo pipefail   # deliberately NOT -e: one failing test must not stop the rest from running

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_SCRIPT="$SCRIPT_DIR/manage-ai-assistant-indexer-api.sh"

if [[ ! -x "$TARGET_SCRIPT" ]]; then
  echo "Cannot find or execute $TARGET_SCRIPT" >&2
  exit 1
fi
if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required." >&2
  exit 1
fi
if ! command -v openssl >/dev/null 2>&1; then
  echo "openssl is required (used to generate a throwaway encryption key for the API-key tests)." >&2
  exit 1
fi

if [[ -t 1 ]]; then
  COLOR_GREEN=$'\033[0;32m'
  COLOR_RED=$'\033[0;31m'
  COLOR_BOLD=$'\033[1m'
  COLOR_RESET=$'\033[0m'
else
  COLOR_GREEN=""
  COLOR_RED=""
  COLOR_BOLD=""
  COLOR_RESET=""
fi

INDEXER_URL="${INDEXER_URL:-https://localhost:9200}"
INDEXER_USER="${INDEXER_USER:-admin}"
INDEXER_PASSWORD="${INDEXER_PASSWORD:-admin}"
INSECURE_TLS="${INSECURE_TLS:-true}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --indexer-url) INDEXER_URL="$2"; shift 2 ;;
    --user) INDEXER_USER="$2"; shift 2 ;;
    --password) INDEXER_PASSWORD="$2"; shift 2 ;;
    --insecure) INSECURE_TLS="true"; shift 1 ;;
    --no-insecure) INSECURE_TLS="false"; shift 1 ;;
    -h|--help)
      cat <<EOF
Usage: $(basename "$0") [--indexer-url URL] [--user USER] [--password PASS] [--insecure|--no-insecure]

Runs manage-ai-assistant-indexer-api.sh against a real indexer end to end (providers +
settings), printing expected vs actual for every check. Defaults to the local dev stack:
INDEXER_URL=https://localhost:9200, INDEXER_USER=admin, INDEXER_PASSWORD=admin, --insecure.

WARNING: permanently deletes every existing AI Assistant provider on the target indexer as
its first step. See the header comment in this file for why that cannot be undone.
EOF
      exit 0
      ;;
    *) echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
done

CONN_ARGS=(--indexer-url "$INDEXER_URL" --user "$INDEXER_USER" --password "$INDEXER_PASSWORD")
[[ "$INSECURE_TLS" == "true" ]] && CONN_ARGS+=(--insecure)

echo "Target indexer: $INDEXER_URL (user: $INDEXER_USER, insecure: $INSECURE_TLS)"
echo

# --- Helpers -------------------------------------------------------------------------------

CALL_STDOUT=""
CALL_STDERR=""
CALL_EXIT=0

# call_target <args...>
# Invokes the target script with the connection flags appended. Sets CALL_STDOUT/CALL_STDERR/
# CALL_EXIT. Note: when used inside a command substitution ($(...)), these globals only stay
# visible within that same subshell.
call_target() {
  local out err rc
  out="$(mktemp)"
  err="$(mktemp)"
  "$TARGET_SCRIPT" "$@" "${CONN_ARGS[@]}" >"$out" 2>"$err"
  rc=$?
  CALL_STDOUT="$(cat "$out")"
  CALL_STDERR="$(cat "$err")"
  CALL_EXIT=$rc
  rm -f "$out" "$err"
}

extract_id() {
  printf '%s' "$1" | grep -oE '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}' | head -n1
}

# norm_json: reads JSON on stdin, prints it compact with all object keys sorted recursively.
# Used on both sides of every JSON comparison so real-indexer key-ordering quirks (a raw
# field_policy/privacy_default_per_provider value echoed straight through from the indexer)
# never cause a false FAIL.
norm_json() {
  jq -cS .
}

get_providers_list() {
  call_target providers list
  printf '%s' "$CALL_STDOUT"
}

get_settings() {
  call_target settings get
  printf '%s' "$CALL_STDOUT"
}

TEST_NUM=0
PASS_COUNT=0
FAIL_COUNT=0

# assert_eq <expected> <actual> <description>
assert_eq() {
  local expected="$1" actual="$2" desc="$3"
  TEST_NUM=$((TEST_NUM + 1))
  echo "TEST $TEST_NUM: $desc"
  echo "  Expected: $expected"
  echo "  Actual:   $actual"
  if [[ "$actual" == "$expected" ]]; then
    echo "  Result:   ${COLOR_GREEN}✅ PASS${COLOR_RESET}"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    echo "  Result:   ${COLOR_RED}❌ FAIL${COLOR_RESET}"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
  echo
}

# --- Snapshot (always taken, never gated behind a prompt) -------------------------------------

SNAPSHOT_DIR="/tmp/manage-ai-assistant-indexer-api-snapshots"
mkdir -p "$SNAPSHOT_DIR"
SNAPSHOT_FILE="$SNAPSHOT_DIR/snapshot-$(date +%Y%m%dT%H%M%S).json"

echo "Capturing pre-run snapshot of providers + settings..."
PRE_PROVIDERS_JSON="$(get_providers_list)"
PRE_SETTINGS_JSON="$(get_settings)"
jq -n --argjson providers "$PRE_PROVIDERS_JSON" --argjson settings "$PRE_SETTINGS_JSON" \
  '{providers: $providers, settings: $settings}' > "$SNAPSHOT_FILE"
echo "Snapshot written to: $SNAPSHOT_FILE"

PRE_PROVIDER_COUNT="$(printf '%s' "$PRE_PROVIDERS_JSON" | jq '.providers | length')"
if [[ "$PRE_PROVIDER_COUNT" -gt 0 ]]; then
  echo "WARNING: $PRE_PROVIDER_COUNT existing provider(s) will be PERMANENTLY deleted (see the snapshot above for what they were)."
fi
echo

# --- Cleanup (unconditional) -------------------------------------------------------------------

echo "Deleting all existing providers..."
printf '%s' "$PRE_PROVIDERS_JSON" | jq -r '.providers[]._id' | while read -r pid; do
  [[ -z "$pid" ]] && continue
  call_target providers delete --id "$pid" >/dev/null
done

echo "Resetting settings to a deterministic baseline..."
call_target settings update \
  --no-privacy-default-on --no-user-can-override \
  --privacy-per-provider '{}' --field-policy '[]' \
  --conversation-retention-days 7 >/dev/null

echo "Clean state established."
echo

# --- Post-run restore (always runs, success or failure) ---------------------------------------

CREATED_PROVIDER_IDS=()

cleanup() {
  echo
  echo "--- Post-run cleanup ---"
  local pid
  for pid in "${CREATED_PROVIDER_IDS[@]:-}"; do
    [[ -z "$pid" ]] && continue
    call_target providers delete --id "$pid" >/dev/null 2>&1
  done

  local orig_pdo orig_uco orig_pdpp orig_fp orig_crd default_flag override_flag
  orig_pdo="$(printf '%s' "$PRE_SETTINGS_JSON" | jq -r '(.privacy_default_on // false)')"
  orig_uco="$(printf '%s' "$PRE_SETTINGS_JSON" | jq -r '(.user_can_override // false)')"
  orig_pdpp="$(printf '%s' "$PRE_SETTINGS_JSON" | jq -c '(.privacy_default_per_provider // {})')"
  orig_fp="$(printf '%s' "$PRE_SETTINGS_JSON" | jq -c '(.field_policy // [])')"
  orig_crd="$(printf '%s' "$PRE_SETTINGS_JSON" | jq -r '(.conversation_retention_days // 7)')"

  [[ "$orig_pdo" == "true" ]] && default_flag="--privacy-default-on" || default_flag="--no-privacy-default-on"
  [[ "$orig_uco" == "true" ]] && override_flag="--user-can-override" || override_flag="--no-user-can-override"

  call_target settings update "$default_flag" "$override_flag" \
    --privacy-per-provider "$orig_pdpp" --field-policy "$orig_fp" \
    --conversation-retention-days "$orig_crd" >/dev/null 2>&1

  echo "Settings restored to their pre-run values."
  if [[ "$PRE_PROVIDER_COUNT" -gt 0 ]]; then
    echo "$PRE_PROVIDER_COUNT pre-existing provider(s) were permanently deleted and could NOT be restored (see $SNAPSHOT_FILE for what they were)."
  fi
}
trap cleanup EXIT

# --- Tests: providers ------------------------------------------------------------------------

echo "=== Providers ==="
echo

ACTUAL="$(get_providers_list | norm_json)"
EXPECTED="$(printf '%s' '{"providers":[]}' | norm_json)"
assert_eq "$EXPECTED" "$ACTUAL" "providers list on clean state is empty"

call_target providers create --name "smoke-test-1" --type openai_compatible \
  --base-url "https://smoke-test.invalid/v1" --model "test-model"
assert_eq "0" "$CALL_EXIT" "providers create (no api key) exits 0"
PROVIDER1_ID="$(extract_id "$CALL_STDOUT")"
[[ -n "$PROVIDER1_ID" ]] && CREATED_PROVIDER_IDS+=("$PROVIDER1_ID")

ACTUAL="$(get_providers_list | jq -c --arg id "$PROVIDER1_ID" \
  '[.providers[] | select(._id == $id) | {name, type, base_url, model, is_default, has_key: (.api_key != null)}][0]' | norm_json)"
EXPECTED="$(printf '%s' '{"name":"smoke-test-1","type":"openai_compatible","base_url":"https://smoke-test.invalid/v1","model":"test-model","is_default":false,"has_key":false}' | norm_json)"
assert_eq "$EXPECTED" "$ACTUAL" "providers list shows the created provider with expected fields"

THROWAWAY_KEY="$(openssl rand -base64 32)"
call_target providers create --name "smoke-test-2" --type anthropic \
  --base-url "https://smoke-test.invalid/v2" --model "test-model-2" \
  --api-key "sk-smoke-test" --encryption-key "$THROWAWAY_KEY"
PROVIDER2_ID="$(extract_id "$CALL_STDOUT")"
[[ -n "$PROVIDER2_ID" ]] && CREATED_PROVIDER_IDS+=("$PROVIDER2_ID")

ACTUAL="$(get_providers_list | jq -r --arg id "$PROVIDER2_ID" '.providers[] | select(._id == $id) | .api_key' | cut -c1-7)"
assert_eq "enc:v1:" "$ACTUAL" "providers create with --api-key stores an enc:v1: ciphertext"

call_target providers list --id "$PROVIDER2_ID"
ACTUAL="$(printf '%s' "$CALL_STDOUT" | jq '.providers | length')"
assert_eq "1" "$ACTUAL" "providers list --id filters to exactly the requested provider"

call_target providers update --id "$PROVIDER1_ID" --name "smoke-test-1-renamed"
ACTUAL="$(get_providers_list | jq -c --arg id "$PROVIDER1_ID" \
  '[.providers[] | select(._id == $id) | {name, type, base_url, model, has_key: (.api_key != null)}][0]' | norm_json)"
EXPECTED="$(printf '%s' '{"name":"smoke-test-1-renamed","type":"openai_compatible","base_url":"https://smoke-test.invalid/v1","model":"test-model","has_key":false}' | norm_json)"
assert_eq "$EXPECTED" "$ACTUAL" "providers update (name only) changes the name, leaves everything else untouched"

OLD_KEY_CIPHERTEXT="$(get_providers_list | jq -r --arg id "$PROVIDER2_ID" '.providers[] | select(._id == $id) | .api_key')"
call_target providers update --id "$PROVIDER2_ID" --api-key "sk-smoke-test-rotated" --encryption-key "$THROWAWAY_KEY"
NEW_KEY_CIPHERTEXT="$(get_providers_list | jq -r --arg id "$PROVIDER2_ID" '.providers[] | select(._id == $id) | .api_key')"
if [[ "$NEW_KEY_CIPHERTEXT" == enc:v1:* && "$NEW_KEY_CIPHERTEXT" != "$OLD_KEY_CIPHERTEXT" ]]; then
  ACTUAL="different-enc:v1:-ciphertext"
else
  ACTUAL="$NEW_KEY_CIPHERTEXT"
fi
assert_eq "different-enc:v1:-ciphertext" "$ACTUAL" "providers update --api-key rotates to a new enc:v1: ciphertext"

call_target providers update --id "$PROVIDER1_ID" --default
ACTUAL="$(get_providers_list | jq -r --arg id "$PROVIDER1_ID" '.providers[] | select(._id == $id) | .is_default')"
assert_eq "true" "$ACTUAL" "providers update --default sets is_default (this script does not clear other providers' is_default — the raw indexer has no uniqueness constraint on it, unlike the dashboard)"

call_target providers delete --id "$PROVIDER2_ID"
CREATED_PROVIDER_IDS=("${CREATED_PROVIDER_IDS[@]/$PROVIDER2_ID/}")
ACTUAL="$(get_providers_list | jq --arg id "$PROVIDER2_ID" '[.providers[] | select(._id == $id)] | length')"
assert_eq "0" "$ACTUAL" "providers delete removes the provider from the list"

call_target providers list --id "$PROVIDER2_ID"
assert_eq "1" "$CALL_EXIT" "providers list --id for a just-deleted id fails"

call_target providers create --name x --type bogus --base-url y --model z
assert_eq "2" "$CALL_EXIT" "providers create with an invalid --type is rejected locally"

call_target providers update --id "not-a-real-id" --name "irrelevant"
assert_eq "1" "$CALL_EXIT" "providers update against a nonexistent id fails"

call_target providers delete --id "$PROVIDER1_ID"
CREATED_PROVIDER_IDS=("${CREATED_PROVIDER_IDS[@]/$PROVIDER1_ID/}")
ACTUAL="$(get_providers_list | norm_json)"
EXPECTED="$(printf '%s' '{"providers":[]}' | norm_json)"
assert_eq "$EXPECTED" "$ACTUAL" "providers list is empty again after deleting the last test provider"

# --- Tests: settings -------------------------------------------------------------------------

echo "=== Settings ==="
echo

ACTUAL="$(get_settings | norm_json)"
EXPECTED="$(printf '%s' '{"privacy_default_on":false,"privacy_default_per_provider":{},"user_can_override":false,"field_policy":[],"conversation_retention_days":7}' | norm_json)"
assert_eq "$EXPECTED" "$ACTUAL" "settings get matches the deterministic baseline right after cleanup"

call_target settings update --privacy-default-on --user-can-override
ACTUAL="$(get_settings | norm_json)"
EXPECTED="$(printf '%s' '{"privacy_default_on":true,"privacy_default_per_provider":{},"user_can_override":true,"field_policy":[],"conversation_retention_days":7}' | norm_json)"
assert_eq "$EXPECTED" "$ACTUAL" "settings update sets both booleans, leaves the other three fields at baseline"

call_target settings update --privacy-per-provider '{"openai_compatible":true}'
ACTUAL="$(get_settings | norm_json)"
EXPECTED="$(printf '%s' '{"privacy_default_on":true,"privacy_default_per_provider":{"openai_compatible":true},"user_can_override":true,"field_policy":[],"conversation_retention_days":7}' | norm_json)"
assert_eq "$EXPECTED" "$ACTUAL" "settings update --privacy-per-provider merges without clobbering the earlier booleans"

call_target settings update --field-policy '[{"field":"agent.ip","action":"allow-scan","kind":"IP"}]'
ACTUAL="$(get_settings | norm_json)"
EXPECTED="$(printf '%s' '{"privacy_default_on":true,"privacy_default_per_provider":{"openai_compatible":true},"user_can_override":true,"field_policy":[{"field":"agent.ip","action":"allow-scan","kind":"IP"}],"conversation_retention_days":7}' | norm_json)"
assert_eq "$EXPECTED" "$ACTUAL" "settings update --field-policy merges without clobbering the earlier fields"

BEFORE_INVALID="$(get_settings | norm_json)"
call_target settings update --field-policy '[{"field":"bad","action":"not-a-real-action"}]'
assert_eq "2" "$CALL_EXIT" "invalid --field-policy action is rejected locally (exit 2)"
AFTER_INVALID="$(get_settings | norm_json)"
assert_eq "$BEFORE_INVALID" "$AFTER_INVALID" "settings are unchanged after the rejected --field-policy call"

call_target settings update --conversation-retention-days 21
ACTUAL="$(get_settings | jq -r '.conversation_retention_days')"
assert_eq "21" "$ACTUAL" "settings update --conversation-retention-days sets the ISM retention window"

call_target settings update --conversation-retention-days 0
ACTUAL="$(get_settings | jq -r '.conversation_retention_days')"
assert_eq "0" "$ACTUAL" "settings update --conversation-retention-days 0 removes the retention transition (kept forever)"

call_target settings update --conversation-retention-days 21
ACTUAL="$(get_settings | jq -r '.conversation_retention_days')"
assert_eq "21" "$ACTUAL" "settings update --conversation-retention-days re-attaches a transition after it was removed (real ISM policy, not a mocked fixture)"

# --- Summary ---------------------------------------------------------------------------------

echo "=================================================================="
if [[ "$FAIL_COUNT" -eq 0 ]]; then
  echo "${COLOR_GREEN}${COLOR_BOLD}✅ PASS: $PASS_COUNT  FAIL: $FAIL_COUNT  TOTAL: $TEST_NUM${COLOR_RESET}"
else
  echo "${COLOR_RED}${COLOR_BOLD}❌ PASS: $PASS_COUNT  FAIL: $FAIL_COUNT  TOTAL: $TEST_NUM${COLOR_RESET}"
fi
echo "=================================================================="

exit "$FAIL_COUNT"
