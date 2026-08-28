#!/usr/bin/env bash
#
# manage-ai-assistant-indexer-api.sh
#
# Manages Wazuh AI Assistant providers (list/create/update/delete) and settings (get/update)
# by calling the Wazuh INDEXER's own /_plugins/_setup/ai_assistant/* endpoints directly,
# bypassing the Wazuh dashboard process entirely.
#
# ================================================================================================
# READ THIS FIRST: this path bypasses, PERMANENTLY, for every write made this way:
#   - The SSRF fail-fast check on baseUrl (dashboard-only, server/providers/url-guard.ts) —
#     providers only.
#   - Provider name-uniqueness / blank-name validation (dashboard-only) — providers only.
#   - The wazuh_ai_assistant.settingsReadOnly lock: that flag and its guard
#     (requireSettingsUnlocked) live ONLY in the dashboard process. A provider or settings
#     write CAN happen through this script even while settingsReadOnly is true — and
#     settingsReadOnly itself can NEVER be toggled from here: it is a dashboard plugin config
#     value (opensearch_dashboards.yml/keystore), read once at dashboard startup, with no HTTP
#     route anywhere that writes it.
# Prefer the dashboard's own HTTP API whenever a privileged DASHBOARD user/session is
# available at all. Use this script only when it genuinely isn't (e.g. provisioning happens
# before the dashboard is reachable, or only an indexer-level credential exists at this stage
# of your pipeline). See scripts/indexer-api/manage-ai-assistant-indexer-api.md for details.
#
# `providers update` and `settings update` both hit endpoints whose PUT is a FULL REPLACE, not
# a partial update: this script fetches the existing resource first, merges in any flags you
# passed, and sends the complete merged body. In particular, `providers update` without
# --api-key resends the EXISTING encrypted key unchanged (never re-encrypted/decrypted).
#
# `conversationRetentionDays` (settings) lives on a THIRD mechanism, separate again from the
# other settings fields: an ISM policy governing the conversation-sessions index, edited via
# OpenSearch's own ISM policy API (GET for _seq_no/_primary_term, an optimistic-concurrency
# PUT, then a change_policy POST so already-managed indices pick up the edit).
#
# Encrypting a provider API key (to match exactly what the dashboard would have produced)
# requires Python 3 with the `cryptography` package, since raw bash+openssl cannot do AES-GCM
# with Additional Authenticated Data (AAD) reliably/portably. Only needed for
# `providers create`/`providers update` when an API key is supplied.
#
# Usage: see `manage-ai-assistant-indexer-api.sh --help` or manage-ai-assistant-indexer-api.md.
#
# Every flag also has an environment-variable fallback (used when the flag is omitted):
#   INDEXER_URL, INDEXER_USER, INDEXER_PASSWORD, INSECURE_TLS,
#   PROVIDER_ID, PROVIDER_NAME, PROVIDER_TYPE, PROVIDER_BASE_URL, PROVIDER_MODEL,
#   PROVIDER_API_KEY, ENCRYPTION_KEY, PROVIDER_IS_DEFAULT,
#   SETTINGS_PRIVACY_DEFAULT_ON, SETTINGS_USER_CAN_OVERRIDE,
#   SETTINGS_PRIVACY_DEFAULT_PER_PROVIDER, SETTINGS_FIELD_POLICY,
#   SETTINGS_CONVERSATION_RETENTION_DAYS.
#
# ENCRYPTION_KEY must be the SAME base64-encoded 32-byte AES-256 key configured on the
# dashboard as wazuh_ai_assistant.encryptionKey.

set -euo pipefail

ISM_POLICY_ID="ai-assistant-sessions-policy"
AFFECTED_INDEX_PATTERN="wazuh-ai-assistant-sessions*"
DEFAULT_CONVERSATION_RETENTION_DAYS=7

usage() {
  cat <<'EOF'
Usage: manage-ai-assistant-indexer-api.sh <providers|settings> <action> [options]

Connection (required for every action, flag or environment variable):
  --indexer-url URL       INDEXER_URL         Indexer base URL, e.g. https://indexer.example.internal:9200
  --user USER             INDEXER_USER        Indexer user (backend role with
                                               plugin:wazuh/ai_assistant/settings/{read,write})
  --password PASS         INDEXER_PASSWORD    That user's password
  --insecure              INSECURE_TLS        Adds curl -k (only for self-signed/dev TLS, never production)

providers list [--id ID]
  --id ID                 PROVIDER_ID         Optional: filter to a single provider client-side
                                               (the indexer has no per-id GET, so this fetches the
                                               full list and filters it with jq).

providers create --name --type --base-url --model [--api-key --encryption-key] [--default]
  --name NAME             PROVIDER_NAME       Provider display name
  --type TYPE             PROVIDER_TYPE       openai_compatible | anthropic
  --base-url URL          PROVIDER_BASE_URL   Provider endpoint root
  --model MODEL           PROVIDER_MODEL      Model identifier
  --api-key KEY           PROVIDER_API_KEY    Provider API key. Requires --encryption-key.
  --encryption-key KEY    ENCRYPTION_KEY      Base64 32-byte AES-256 key, same value as the
                                               dashboard's wazuh_ai_assistant.encryptionKey.
                                               Required only when --api-key is given.
  --default                                   Set PROVIDER_IS_DEFAULT=true to mean the same

providers update --id ID [--name] [--type] [--base-url] [--model] [--api-key --encryption-key]
                 [--default | --no-default]
  --id ID                 PROVIDER_ID         Required: id of the provider to update
  (--name/--type/--base-url/--model/--api-key/--encryption-key: same as create, all optional —
   any omitted field keeps its current stored value)
  --default / --no-default                    Explicitly set PROVIDER_IS_DEFAULT to true/false;
                                               if neither is given, the current value is kept.

providers delete --id ID
  --id ID                 PROVIDER_ID         Required: id of the provider to delete

settings get
  Prints the merged current settings (privacy/override/field-policy plus conversation
  retention) as one JSON object.

settings update [options] (at least one of the following is required)
  --privacy-default-on          SETTINGS_PRIVACY_DEFAULT_ON="true"
  --no-privacy-default-on       SETTINGS_PRIVACY_DEFAULT_ON="false"
  --user-can-override           SETTINGS_USER_CAN_OVERRIDE="true"
  --no-user-can-override        SETTINGS_USER_CAN_OVERRIDE="false"
  --privacy-per-provider JSON   SETTINGS_PRIVACY_DEFAULT_PER_PROVIDER
                                 A JSON object of booleans, e.g. '{"openai":true,"anthropic":false}'
  --field-policy JSON           SETTINGS_FIELD_POLICY
                                 A JSON array of {field, action, kind?}, action one of
                                 allow|allow-scan|anonymize|never, kind (if present) one of
                                 HOST|IP|USER|URL|VAL. Example:
                                 '[{"field":"agent.ip","action":"allow-scan","kind":"IP"}]'
  --conversation-retention-days N   SETTINGS_CONVERSATION_RETENTION_DAYS
                                 Non-negative integer; 0 means "keep forever". Edits the ISM
                                 policy governing the conversation-sessions index (a separate
                                 mechanism from the other settings fields above).

Note: wazuh_ai_assistant.settingsReadOnly itself can NEVER be set via this script (or via the
indexer at all) — it is a dashboard-only config value. See the script header comment.

  -h, --help                                  Show this help
EOF
}

# --- Argument parsing --------------------------------------------------------------------------

if [[ $# -eq 0 || "$1" == "-h" || "$1" == "--help" ]]; then
  usage
  exit 0
fi

RESOURCE="$1"
case "$RESOURCE" in
  providers|settings) ;;
  *) echo "Unknown resource: $RESOURCE (expected providers|settings)" >&2; usage; exit 2 ;;
esac
shift 1

if [[ $# -eq 0 ]]; then
  echo "Missing action" >&2
  usage
  exit 2
fi
ACTION="$1"
shift 1

case "$RESOURCE" in
  providers)
    case "$ACTION" in
      list|create|update|delete) ;;
      -h|--help) usage; exit 0 ;;
      *) echo "Unknown providers action: $ACTION (expected list|create|update|delete)" >&2; usage; exit 2 ;;
    esac
    ;;
  settings)
    case "$ACTION" in
      get|update) ;;
      -h|--help) usage; exit 0 ;;
      *) echo "Unknown settings action: $ACTION (expected get|update)" >&2; usage; exit 2 ;;
    esac
    ;;
esac

INDEXER_URL="${INDEXER_URL:-}"
INDEXER_USER="${INDEXER_USER:-}"
INDEXER_PASSWORD="${INDEXER_PASSWORD:-}"
INSECURE_TLS="${INSECURE_TLS:-false}"
PROVIDER_ID="${PROVIDER_ID:-}"
PROVIDER_NAME="${PROVIDER_NAME:-}"
PROVIDER_TYPE="${PROVIDER_TYPE:-}"
PROVIDER_BASE_URL="${PROVIDER_BASE_URL:-}"
PROVIDER_MODEL="${PROVIDER_MODEL:-}"
PROVIDER_API_KEY="${PROVIDER_API_KEY:-}"
ENCRYPTION_KEY="${ENCRYPTION_KEY:-}"
PROVIDER_IS_DEFAULT="${PROVIDER_IS_DEFAULT:-}"
SETTINGS_PRIVACY_DEFAULT_ON="${SETTINGS_PRIVACY_DEFAULT_ON:-}"
SETTINGS_USER_CAN_OVERRIDE="${SETTINGS_USER_CAN_OVERRIDE:-}"
SETTINGS_PRIVACY_DEFAULT_PER_PROVIDER="${SETTINGS_PRIVACY_DEFAULT_PER_PROVIDER:-}"
SETTINGS_FIELD_POLICY="${SETTINGS_FIELD_POLICY:-}"
SETTINGS_CONVERSATION_RETENTION_DAYS="${SETTINGS_CONVERSATION_RETENTION_DAYS:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --indexer-url) INDEXER_URL="$2"; shift 2 ;;
    --user) INDEXER_USER="$2"; shift 2 ;;
    --password) INDEXER_PASSWORD="$2"; shift 2 ;;
    --insecure) INSECURE_TLS="true"; shift 1 ;;
    --id) PROVIDER_ID="$2"; shift 2 ;;
    --name) PROVIDER_NAME="$2"; shift 2 ;;
    --type) PROVIDER_TYPE="$2"; shift 2 ;;
    --base-url) PROVIDER_BASE_URL="$2"; shift 2 ;;
    --model) PROVIDER_MODEL="$2"; shift 2 ;;
    --api-key) PROVIDER_API_KEY="$2"; shift 2 ;;
    --encryption-key) ENCRYPTION_KEY="$2"; shift 2 ;;
    --default) PROVIDER_IS_DEFAULT="true"; shift 1 ;;
    --no-default) PROVIDER_IS_DEFAULT="false"; shift 1 ;;
    --privacy-default-on) SETTINGS_PRIVACY_DEFAULT_ON="true"; shift 1 ;;
    --no-privacy-default-on) SETTINGS_PRIVACY_DEFAULT_ON="false"; shift 1 ;;
    --user-can-override) SETTINGS_USER_CAN_OVERRIDE="true"; shift 1 ;;
    --no-user-can-override) SETTINGS_USER_CAN_OVERRIDE="false"; shift 1 ;;
    --privacy-per-provider) SETTINGS_PRIVACY_DEFAULT_PER_PROVIDER="$2"; shift 2 ;;
    --field-policy) SETTINGS_FIELD_POLICY="$2"; shift 2 ;;
    --conversation-retention-days) SETTINGS_CONVERSATION_RETENTION_DAYS="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage; exit 2 ;;
  esac
done

missing=()
[[ -z "$INDEXER_URL" ]] && missing+=("--indexer-url / INDEXER_URL")
[[ -z "$INDEXER_USER" ]] && missing+=("--user / INDEXER_USER")
[[ -z "$INDEXER_PASSWORD" ]] && missing+=("--password / INDEXER_PASSWORD")
if [[ "$RESOURCE" == "providers" && "$ACTION" == "create" ]]; then
  [[ -z "$PROVIDER_NAME" ]] && missing+=("--name / PROVIDER_NAME")
  [[ -z "$PROVIDER_TYPE" ]] && missing+=("--type / PROVIDER_TYPE")
  [[ -z "$PROVIDER_BASE_URL" ]] && missing+=("--base-url / PROVIDER_BASE_URL")
  [[ -z "$PROVIDER_MODEL" ]] && missing+=("--model / PROVIDER_MODEL")
fi
if [[ "$RESOURCE" == "providers" && ( "$ACTION" == "update" || "$ACTION" == "delete" ) ]]; then
  [[ -z "$PROVIDER_ID" ]] && missing+=("--id / PROVIDER_ID")
fi
if [[ ${#missing[@]} -gt 0 ]]; then
  echo "Missing required value(s):" >&2
  printf '  %s\n' "${missing[@]}" >&2
  exit 2
fi

if [[ -n "$PROVIDER_TYPE" && "$PROVIDER_TYPE" != "openai_compatible" && "$PROVIDER_TYPE" != "anthropic" ]]; then
  echo "Invalid --type/PROVIDER_TYPE '$PROVIDER_TYPE': must be 'openai_compatible' or 'anthropic'" >&2
  exit 2
fi

if [[ -n "$PROVIDER_API_KEY" && -z "$ENCRYPTION_KEY" ]]; then
  echo "--api-key was given but --encryption-key/ENCRYPTION_KEY is missing." >&2
  echo "The stored value must be encrypted with the SAME key the dashboard uses" \
       "(wazuh_ai_assistant.encryptionKey), or the dashboard will fail to decrypt it later." >&2
  exit 2
fi

if [[ "$RESOURCE" == "settings" && "$ACTION" == "update" ]]; then
  if [[ -z "$SETTINGS_PRIVACY_DEFAULT_ON" && -z "$SETTINGS_USER_CAN_OVERRIDE" \
        && -z "$SETTINGS_PRIVACY_DEFAULT_PER_PROVIDER" && -z "$SETTINGS_FIELD_POLICY" \
        && -z "$SETTINGS_CONVERSATION_RETENTION_DAYS" ]]; then
    echo "Nothing to update: pass at least one of --privacy-default-on/--no-privacy-default-on," \
         "--user-can-override/--no-user-can-override, --privacy-per-provider, --field-policy," \
         "--conversation-retention-days." >&2
    exit 2
  fi
  if [[ -n "$SETTINGS_CONVERSATION_RETENTION_DAYS" && ! "$SETTINGS_CONVERSATION_RETENTION_DAYS" =~ ^[0-9]+$ ]]; then
    echo "--conversation-retention-days must be a non-negative integer." >&2
    exit 2
  fi
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required for this script (safe JSON construction/parsing)." >&2
  exit 1
fi

# --- Helpers -------------------------------------------------------------------------------

generate_uuid() {
  if command -v python3 >/dev/null 2>&1; then
    python3 -c 'import uuid; print(uuid.uuid4())'
  elif command -v uuidgen >/dev/null 2>&1; then
    uuidgen | tr '[:upper:]' '[:lower:]'
  elif [[ -r /proc/sys/kernel/random/uuid ]]; then
    cat /proc/sys/kernel/random/uuid
  else
    echo "No UUID generator found (need python3, uuidgen, or /proc/sys/kernel/random/uuid)." >&2
    exit 1
  fi
}

# encrypt_api_key <id> <key_b64> <plaintext>
# Reimplements server/crypto/api-key-cipher.ts's exact wire format so the dashboard can
# decrypt what this script writes:
#   AES-256-GCM, key = raw 32 bytes of base64-decoded key_b64 (used directly, no KDF),
#   IV = 12 random bytes per call, AAD = "wazuh-ai-assistant-provider:<id>:apiKey",
#   wire = "enc:v1:" + base64(iv[12] || authTag[16] || ciphertext).
encrypt_api_key() {
  local id="$1" key_b64="$2" plaintext="$3"
  if ! command -v python3 >/dev/null 2>&1; then
    echo "python3 is required to encrypt the API key (no working bash+openssl AES-GCM+AAD path)." >&2
    exit 1
  fi
  if ! python3 -c 'import cryptography' >/dev/null 2>&1; then
    echo "The Python 'cryptography' package is required. Install it with: pip install cryptography" >&2
    exit 1
  fi
  PROVIDER_ID="$id" ENCRYPTION_KEY="$key_b64" PROVIDER_API_KEY="$plaintext" python3 <<'PYEOF'
import base64
import os
import sys

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

provider_id = os.environ["PROVIDER_ID"]
key_b64 = os.environ["ENCRYPTION_KEY"]
plaintext = os.environ["PROVIDER_API_KEY"]

key = base64.b64decode(key_b64)
if len(key) != 32:
    sys.stderr.write(
        f"ENCRYPTION_KEY must decode (base64) to exactly 32 bytes, got {len(key)}.\n"
    )
    sys.exit(1)

aad = f"wazuh-ai-assistant-provider:{provider_id}:apiKey".encode("utf-8")
iv = os.urandom(12)
aesgcm = AESGCM(key)
# cryptography's AESGCM.encrypt returns ciphertext with the 16-byte tag appended at the end;
# the wire format wants iv || tag || ciphertext, so split and reorder.
ct_and_tag = aesgcm.encrypt(iv, plaintext.encode("utf-8"), aad)
ciphertext, tag = ct_and_tag[:-16], ct_and_tag[-16:]
wire = base64.b64encode(iv + tag + ciphertext).decode("ascii")
print(f"enc:v1:{wire}")
PYEOF
}

# http_request <METHOD> <path> [body]
# Sets HTTP_CODE and RESPONSE_BODY globals.
http_request() {
  local method="$1" path="$2" body="${3:-}"
  local curl_opts=(-sS -X "$method" "${INDEXER_URL%/}${path}"
    -H "Content-Type: application/json"
    -u "${INDEXER_USER}:${INDEXER_PASSWORD}"
    -w '\n%{http_code}')
  [[ -n "$body" ]] && curl_opts+=(-d "$body")
  [[ "$INSECURE_TLS" == "true" ]] && curl_opts+=(-k)

  local response
  response="$(curl "${curl_opts[@]}")"
  HTTP_CODE="$(printf '%s' "$response" | tail -n1)"
  RESPONSE_BODY="$(printf '%s' "$response" | sed '$d')"
}

warn_bypass() {
  echo "WARNING: writing directly to the indexer bypasses $1." >&2
}

# jq library for reading/editing the ISM policy's conversation-retention transition. Mirrors
# server/settings/ism-policy.ts's extractRetentionDays/applyRetentionDays exactly.
read -r -d '' ISM_JQ_DEFS <<'JQDEFS' || true
def find_delete_transition_path:
  (.states // []) as $states
  | ([ range(0; ($states|length)) as $si
       | ($states[$si].transitions // []) as $trans
       | range(0; ($trans|length)) as $ti
       | select(($trans[$ti].state_name // "") | ascii_downcase == "delete")
       | [$si, $ti]
     ]) as $matches
  | if ($matches|length) > 0 then $matches[0] else null end;

def extract_retention_days:
  find_delete_transition_path as $p
  | if $p == null then 0
    else
      (.states[$p[0]].transitions[$p[1]].conditions.min_index_age // null) as $mia
      | if $mia == null then 0
        else
          ($mia | capture("^(?<n>[0-9]+)d$")?) as $cap
          | if $cap == null then 0 else ($cap.n | tonumber) end
        end
    end;

def apply_retention_days(days):
  find_delete_transition_path as $p
  | if (days|tonumber) <= 0 then
      if $p == null then .
      else
        (.states[$p[0]].transitions[$p[1]].conditions // {}) as $cond
        | ($cond | keys - ["min_index_age"]) as $others
        | if ($others|length) > 0 then
            delpaths([["states", $p[0], "transitions", $p[1], "conditions", "min_index_age"]])
          else
            (.states[$p[0]].transitions) as $trans
            | (($trans | to_entries | map(select(.key != $p[1])) | map(.value))) as $newTrans
            | setpath(["states", $p[0], "transitions"]; $newTrans)
          end
      end
    else
      if $p != null then
        setpath(["states", $p[0], "transitions", $p[1], "conditions", "min_index_age"]; "\(days)d")
      else
        ([.states | to_entries[] | select((.value.name // "") | ascii_downcase != "delete")]) as $nonDelete
        | if ($nonDelete|length) != 1 then
            error("Cannot set conversation retention: the ISM policy has no unambiguous non-delete state to attach a transition to.")
          else
            ($nonDelete[0].key) as $si
            | (.states[$si].transitions // []) as $trans
            | setpath(["states", $si, "transitions"]; $trans + [{state_name: "delete", conditions: {min_index_age: "\(days)d"}}])
          end
      end
    end;
JQDEFS

# --- Actions -------------------------------------------------------------------------------

if [[ "$RESOURCE" == "providers" ]]; then
case "$ACTION" in

  list)
    http_request GET "/_plugins/_setup/ai_assistant/providers"
    if [[ "$HTTP_CODE" != "200" ]]; then
      echo "Listing providers failed (HTTP $HTTP_CODE):" >&2
      echo "$RESPONSE_BODY" >&2
      exit 1
    fi
    if [[ -n "$PROVIDER_ID" ]]; then
      FILTERED="$(printf '%s' "$RESPONSE_BODY" | jq --arg id "$PROVIDER_ID" \
        '{providers: [.providers[] | select(._id == $id)]}')"
      if [[ "$(printf '%s' "$FILTERED" | jq '.providers | length')" == "0" ]]; then
        echo "No provider found with id '$PROVIDER_ID'." >&2
        exit 1
      fi
      printf '%s\n' "$FILTERED" | jq .
    else
      printf '%s\n' "$RESPONSE_BODY" | jq .
    fi
    exit 0
    ;;

  create)
    warn_bypass "the dashboard's SSRF check, name-uniqueness check, and the settingsReadOnly lock (if it is set, this write still succeeds)"
    # The create endpoint requires `id` in the body, validated server-side as a UUID.
    # Generated CLIENT-SIDE and used BEFORE encryption (not after): the API key's AAD is
    # bound to this exact id, so the id must exist first.
    PROVIDER_ID="$(generate_uuid)"

    ENCRYPTED_API_KEY=""
    if [[ -n "$PROVIDER_API_KEY" ]]; then
      ENCRYPTED_API_KEY="$(encrypt_api_key "$PROVIDER_ID" "$ENCRYPTION_KEY" "$PROVIDER_API_KEY")"
    fi

    IS_DEFAULT_BOOL="false"
    [[ "$PROVIDER_IS_DEFAULT" == "true" ]] && IS_DEFAULT_BOOL="true"

    BODY="$(jq -n \
      --arg id "$PROVIDER_ID" \
      --arg name "$PROVIDER_NAME" \
      --arg type "$PROVIDER_TYPE" \
      --arg base_url "$PROVIDER_BASE_URL" \
      --arg model "$PROVIDER_MODEL" \
      --arg api_key "$ENCRYPTED_API_KEY" \
      --argjson is_default "$IS_DEFAULT_BOOL" \
      '{id: $id, name: $name, type: $type, base_url: $base_url, model: $model, is_default: $is_default}
       + (if ($api_key | length) > 0 then {api_key: $api_key} else {} end)')"

    http_request POST "/_plugins/_setup/ai_assistant/providers" "$BODY"
    if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
      echo "✅ Provider created successfully (id: $PROVIDER_ID)."
      echo "$RESPONSE_BODY"
      exit 0
    fi
    echo "Provider creation failed (HTTP $HTTP_CODE):" >&2
    echo "$RESPONSE_BODY" >&2
    exit 1
    ;;

  update)
    warn_bypass "the dashboard's SSRF check, name-uniqueness check, and the settingsReadOnly lock (if it is set, this write still succeeds)"
    # The indexer's PUT .../providers/{id} is a full replace with no merge semantics, so we
    # fetch the existing provider first and merge any given flags into the complete body
    # ourselves (the same thing the dashboard's own PUT route does server-side).
    http_request GET "/_plugins/_setup/ai_assistant/providers"
    if [[ "$HTTP_CODE" != "200" ]]; then
      echo "Fetching existing providers failed (HTTP $HTTP_CODE):" >&2
      echo "$RESPONSE_BODY" >&2
      exit 1
    fi
    EXISTING="$(printf '%s' "$RESPONSE_BODY" | jq --arg id "$PROVIDER_ID" '.providers[] | select(._id == $id)')"
    if [[ -z "$EXISTING" ]]; then
      echo "No provider found with id '$PROVIDER_ID'." >&2
      exit 1
    fi

    FINAL_NAME="$PROVIDER_NAME"
    [[ -z "$FINAL_NAME" ]] && FINAL_NAME="$(printf '%s' "$EXISTING" | jq -r '.name')"
    FINAL_TYPE="$PROVIDER_TYPE"
    [[ -z "$FINAL_TYPE" ]] && FINAL_TYPE="$(printf '%s' "$EXISTING" | jq -r '.type')"
    FINAL_BASE_URL="$PROVIDER_BASE_URL"
    [[ -z "$FINAL_BASE_URL" ]] && FINAL_BASE_URL="$(printf '%s' "$EXISTING" | jq -r '.base_url')"
    FINAL_MODEL="$PROVIDER_MODEL"
    [[ -z "$FINAL_MODEL" ]] && FINAL_MODEL="$(printf '%s' "$EXISTING" | jq -r '.model')"

    if [[ -n "$PROVIDER_IS_DEFAULT" ]]; then
      FINAL_IS_DEFAULT="$PROVIDER_IS_DEFAULT"
    else
      FINAL_IS_DEFAULT="$(printf '%s' "$EXISTING" | jq -r 'if .is_default == true then "true" else "false" end')"
    fi

    EXISTING_API_KEY="$(printf '%s' "$EXISTING" | jq -r '.api_key // empty')"
    if [[ -n "$PROVIDER_API_KEY" ]]; then
      FINAL_API_KEY="$(encrypt_api_key "$PROVIDER_ID" "$ENCRYPTION_KEY" "$PROVIDER_API_KEY")"
    elif [[ -n "$EXISTING_API_KEY" ]]; then
      if [[ "$EXISTING_API_KEY" == enc:v1:* ]]; then
        # Reused verbatim: it is already-encrypted ciphertext, never re-encrypt/decrypt it.
        FINAL_API_KEY="$EXISTING_API_KEY"
      else
        echo "Provider '$PROVIDER_ID' has a stored API key that is not in the expected" \
             "'enc:v1:' encrypted format (legacy/unrecognized). Refusing to resend it" \
             "unchanged — pass --api-key (and --encryption-key) to replace it with a" \
             "properly encrypted value." >&2
        exit 1
      fi
    else
      FINAL_API_KEY=""
    fi

    BODY="$(jq -n \
      --arg name "$FINAL_NAME" \
      --arg type "$FINAL_TYPE" \
      --arg base_url "$FINAL_BASE_URL" \
      --arg model "$FINAL_MODEL" \
      --arg api_key "$FINAL_API_KEY" \
      --argjson is_default "$FINAL_IS_DEFAULT" \
      '{name: $name, type: $type, base_url: $base_url, model: $model, is_default: $is_default}
       + (if ($api_key | length) > 0 then {api_key: $api_key} else {} end)')"

    http_request PUT "/_plugins/_setup/ai_assistant/providers/${PROVIDER_ID}" "$BODY"
    if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
      echo "✅ Provider updated successfully (id: $PROVIDER_ID)."
      echo "$RESPONSE_BODY"
      exit 0
    fi
    echo "Provider update failed (HTTP $HTTP_CODE):" >&2
    echo "$RESPONSE_BODY" >&2
    exit 1
    ;;

  delete)
    warn_bypass "the dashboard's SSRF check, name-uniqueness check, and the settingsReadOnly lock (if it is set, this write still succeeds)"
    http_request DELETE "/_plugins/_setup/ai_assistant/providers/${PROVIDER_ID}"
    if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "204" ]]; then
      echo "✅ Provider deleted successfully (id: $PROVIDER_ID)."
      [[ -n "$RESPONSE_BODY" ]] && echo "$RESPONSE_BODY"
      exit 0
    fi
    echo "Provider deletion failed (HTTP $HTTP_CODE):" >&2
    echo "$RESPONSE_BODY" >&2
    exit 1
    ;;

esac
fi

if [[ "$RESOURCE" == "settings" ]]; then
case "$ACTION" in

  get)
    http_request GET "/_plugins/_setup/ai_assistant/settings"
    if [[ "$HTTP_CODE" == "200" ]]; then
      SIMPLE_JSON="$RESPONSE_BODY"
    elif [[ "$HTTP_CODE" == "404" ]]; then
      SIMPLE_JSON='{}'
    else
      echo "Fetching settings failed (HTTP $HTTP_CODE):" >&2
      echo "$RESPONSE_BODY" >&2
      exit 1
    fi

    http_request GET "/_plugins/_ism/policies/${ISM_POLICY_ID}"
    if [[ "$HTTP_CODE" == "200" ]]; then
      RETENTION_DAYS="$(printf '%s' "$RESPONSE_BODY" | jq '.policy' | jq "${ISM_JQ_DEFS} extract_retention_days")"
    elif [[ "$HTTP_CODE" == "404" ]]; then
      RETENTION_DAYS="$DEFAULT_CONVERSATION_RETENTION_DAYS"
    else
      echo "Fetching the conversation retention policy failed (HTTP $HTTP_CODE):" >&2
      echo "$RESPONSE_BODY" >&2
      exit 1
    fi

    printf '%s' "$SIMPLE_JSON" | jq --argjson retention "$RETENTION_DAYS" '{
      privacy_default_on: (.privacy_default_on // false),
      privacy_default_per_provider: (.privacy_default_per_provider // {}),
      user_can_override: (.user_can_override // false),
      field_policy: (.field_policy // []),
      conversation_retention_days: $retention
    }'
    exit 0
    ;;

  update)
    HAVE_SIMPLE_CHANGE=false
    if [[ -n "$SETTINGS_PRIVACY_DEFAULT_ON" || -n "$SETTINGS_USER_CAN_OVERRIDE" \
          || -n "$SETTINGS_PRIVACY_DEFAULT_PER_PROVIDER" || -n "$SETTINGS_FIELD_POLICY" ]]; then
      HAVE_SIMPLE_CHANGE=true
    fi

    if [[ "$HAVE_SIMPLE_CHANGE" == "true" ]]; then
      warn_bypass "the settingsReadOnly lock (if it is set, this write still succeeds)"
      http_request GET "/_plugins/_setup/ai_assistant/settings"
      if [[ "$HTTP_CODE" == "200" ]]; then
        EXISTING_SIMPLE="$RESPONSE_BODY"
      elif [[ "$HTTP_CODE" == "404" ]]; then
        EXISTING_SIMPLE='{}'
      else
        echo "Fetching existing settings failed (HTTP $HTTP_CODE):" >&2
        echo "$RESPONSE_BODY" >&2
        exit 1
      fi

      FINAL_PRIVACY_DEFAULT_ON="$SETTINGS_PRIVACY_DEFAULT_ON"
      [[ -z "$FINAL_PRIVACY_DEFAULT_ON" ]] && FINAL_PRIVACY_DEFAULT_ON="$(printf '%s' "$EXISTING_SIMPLE" | jq -r '(.privacy_default_on // false)')"
      FINAL_USER_CAN_OVERRIDE="$SETTINGS_USER_CAN_OVERRIDE"
      [[ -z "$FINAL_USER_CAN_OVERRIDE" ]] && FINAL_USER_CAN_OVERRIDE="$(printf '%s' "$EXISTING_SIMPLE" | jq -r '(.user_can_override // false)')"

      if [[ -n "$SETTINGS_PRIVACY_DEFAULT_PER_PROVIDER" ]]; then
        if ! printf '%s' "$SETTINGS_PRIVACY_DEFAULT_PER_PROVIDER" | jq -e 'type=="object" and ([.[]]|all(type=="boolean"))' >/dev/null 2>&1; then
          echo "--privacy-per-provider must be a JSON object whose values are all booleans." >&2
          exit 2
        fi
        FINAL_PRIVACY_PER_PROVIDER="$SETTINGS_PRIVACY_DEFAULT_PER_PROVIDER"
      else
        FINAL_PRIVACY_PER_PROVIDER="$(printf '%s' "$EXISTING_SIMPLE" | jq -c '(.privacy_default_per_provider // {})')"
      fi

      if [[ -n "$SETTINGS_FIELD_POLICY" ]]; then
        if ! printf '%s' "$SETTINGS_FIELD_POLICY" | jq -e '
            type=="array" and all(.[];
              . as $entry
              | ($entry.field != null and ($entry.field|type=="string") and ($entry.field|length>0))
                and (["allow","allow-scan","anonymize","never"] | index($entry.action) != null)
                and (if ($entry|has("kind")) then (["HOST","IP","USER","URL","VAL"] | index($entry.kind) != null) else true end)
            )' >/dev/null 2>&1; then
          echo "--field-policy must be a JSON array of {field, action, kind?} entries with" \
               "action in allow|allow-scan|anonymize|never and kind (if present) in HOST|IP|USER|URL|VAL." >&2
          exit 2
        fi
        FINAL_FIELD_POLICY="$SETTINGS_FIELD_POLICY"
      else
        FINAL_FIELD_POLICY="$(printf '%s' "$EXISTING_SIMPLE" | jq -c '(.field_policy // [])')"
      fi

      SIMPLE_BODY="$(jq -n \
        --argjson privacy_default_on "$FINAL_PRIVACY_DEFAULT_ON" \
        --argjson privacy_default_per_provider "$FINAL_PRIVACY_PER_PROVIDER" \
        --argjson user_can_override "$FINAL_USER_CAN_OVERRIDE" \
        --argjson field_policy "$FINAL_FIELD_POLICY" \
        '{privacy_default_on: $privacy_default_on, privacy_default_per_provider: $privacy_default_per_provider, user_can_override: $user_can_override, field_policy: $field_policy}')"

      http_request PUT "/_plugins/_setup/ai_assistant/settings" "$SIMPLE_BODY"
      if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
        echo "✅ Settings updated."
        echo "$RESPONSE_BODY"
      else
        echo "Settings update failed (HTTP $HTTP_CODE):" >&2
        echo "$RESPONSE_BODY" >&2
        exit 1
      fi
    fi

    if [[ -n "$SETTINGS_CONVERSATION_RETENTION_DAYS" ]]; then
      warn_bypass "the settingsReadOnly lock (if it is set, this write still succeeds)"
      http_request GET "/_plugins/_ism/policies/${ISM_POLICY_ID}"
      if [[ "$HTTP_CODE" == "404" ]]; then
        echo "Cannot update conversation retention: ISM policy '${ISM_POLICY_ID}' was not found." >&2
        exit 1
      elif [[ "$HTTP_CODE" != "200" ]]; then
        echo "Fetching the conversation retention policy failed (HTTP $HTTP_CODE):" >&2
        echo "$RESPONSE_BODY" >&2
        exit 1
      fi
      SEQ_NO="$(printf '%s' "$RESPONSE_BODY" | jq -r '._seq_no')"
      PRIMARY_TERM="$(printf '%s' "$RESPONSE_BODY" | jq -r '._primary_term')"
      CURRENT_POLICY="$(printf '%s' "$RESPONSE_BODY" | jq -c '.policy')"

      if ! NEXT_POLICY="$(printf '%s' "$CURRENT_POLICY" | jq -c --argjson days "$SETTINGS_CONVERSATION_RETENTION_DAYS" "${ISM_JQ_DEFS} apply_retention_days(\$days)")"; then
        echo "Failed to compute the updated conversation retention policy (see jq error above)." >&2
        exit 1
      fi

      PUT_BODY="$(jq -n --argjson policy "$NEXT_POLICY" '{policy: $policy}')"
      http_request PUT "/_plugins/_ism/policies/${ISM_POLICY_ID}?if_seq_no=${SEQ_NO}&if_primary_term=${PRIMARY_TERM}" "$PUT_BODY"
      if [[ "$HTTP_CODE" != "200" ]]; then
        echo "Updating the conversation retention policy failed (HTTP $HTTP_CODE):" >&2
        echo "$RESPONSE_BODY" >&2
        exit 1
      fi

      CHANGE_BODY="$(jq -n --arg id "$ISM_POLICY_ID" '{policy_id: $id}')"
      http_request POST "/_plugins/_ism/change_policy/${AFFECTED_INDEX_PATTERN}" "$CHANGE_BODY"
      if [[ "$HTTP_CODE" != "200" ]]; then
        echo "Policy updated, but re-applying it to existing indices failed (HTTP $HTTP_CODE):" >&2
        echo "$RESPONSE_BODY" >&2
        exit 1
      fi

      if [[ "$SETTINGS_CONVERSATION_RETENTION_DAYS" == "0" ]]; then
        echo "✅ Conversation retention updated: conversations are now kept forever."
      else
        echo "✅ Conversation retention updated to $SETTINGS_CONVERSATION_RETENTION_DAYS days."
      fi
    fi

    exit 0
    ;;

esac
fi
