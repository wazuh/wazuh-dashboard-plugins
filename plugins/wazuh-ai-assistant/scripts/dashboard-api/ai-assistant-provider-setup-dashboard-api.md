# Provisioning an AI Assistant provider for a locked cloud deployment (dashboard API)

This is the **recommended** way to preconfigure the Wazuh AI Assistant's provider once per
environment and then lock the Settings UI so a customer cannot change it afterward, for a
Kubernetes-hosted (cloud) Wazuh dashboard deployment.

It relies on the new `wazuh_ai_assistant.settingsReadOnly` configuration key (default `false`):
when set to `true`, every AI Assistant settings/provider write route rejects with `403`,
regardless of the calling user's own Wazuh indexer RBAC, and the Settings UI shows a locked
banner with every write control disabled. See
[`docs/ref/modules/ai-assistant/configuration.md`](../../../../docs/ref/modules/ai-assistant/configuration.md)
in the `wazuh-dashboard-plugins` repository for the full reference.

## Why this approach

The script talks only to the Wazuh **dashboard's own** HTTP API
(`/api/wazuh_ai_assistant/providers`), not to the indexer directly. That gets you, for free:

- API key encryption at rest (requires `wazuh_ai_assistant.encryptionKey` to already be
  configured if the provider needs a key).
- The SSRF fail-fast check on the provider's `baseUrl`.
- Provider name-uniqueness validation.
- The `settingsReadOnly` lock guard itself, once it is turned on.

An alternative — calling the Wazuh indexer's own `/_plugins/_setup/ai_assistant/providers`
endpoint directly — is also documented (see the companion
[`ai-assistant-provider-setup-indexer-api.md`](../indexer-api/ai-assistant-provider-setup-indexer-api.md) and its script), but it bypasses all of the above,
**including the lock this guide sets up**, so it is not the default recommendation.

## Prerequisites

- A privileged **dashboard/indexer user**: a Wazuh indexer backend role carrying
  `plugin:wazuh/ai_assistant/settings/write` (see
  [`docs/ref/modules/ai-assistant/security.md`](../../../../docs/ref/modules/ai-assistant/security.md#required-indexer-permissions)).
- If the provider needs an API key: `wazuh_ai_assistant.encryptionKey` already set (keystore
  recommended) on the dashboard. Without it, a write carrying an API key is rejected with `503`.
- `curl`, and optionally `jq` (used for safe JSON construction if present; the script falls back
  to a minimal built-in escaper otherwise).
- Network access from wherever the script runs to the dashboard's HTTP(S) endpoint.

## Sequence

### 1. Deploy unlocked

Start/deploy the dashboard with `wazuh_ai_assistant.settingsReadOnly` unset or explicitly `false`.
This is the state a fresh environment is in by default (the key defaults to `false`).

### 2. Run the provisioning script

```bash
./setup-ai-provider-dashboard-api.sh \
  --dashboard-url https://dashboard.example.internal \
  --user provisioner \
  --password '<privileged-user-password>' \
  --name "Production OpenAI" \
  --type openai_compatible \
  --base-url https://api.openai.com/v1 \
  --model gpt-4o \
  --api-key 'sk-...' \
  --default
```

Every flag also accepts an environment variable instead (`DASHBOARD_URL`, `DASHBOARD_USER`,
`DASHBOARD_PASSWORD`, `PROVIDER_NAME`, `PROVIDER_TYPE`, `PROVIDER_BASE_URL`, `PROVIDER_MODEL`,
`PROVIDER_API_KEY`, `PROVIDER_IS_DEFAULT=true`), which fits a Kubernetes Job/init-container
pattern where the password and API key are injected as Secret-backed env vars rather than passed
as plain CLI arguments. Run it once per provider.

On success the script prints the created provider's id/summary. On a `403` whose body says
settings are already locked, it prints a hint to unlock (`settingsReadOnly: false`) and restart
before retrying.

### 3. Lock and restart

Set `wazuh_ai_assistant.settingsReadOnly: true` through your platform's own configuration
mechanism (Helm values, ConfigMap, whatever your deployment pipeline already uses) and let its
normal rollout restart the dashboard pod(s).

**This step is deliberately outside the script's scope.** The script only ever talks to the
dashboard over `curl` — it never calls `kubectl` or any cluster-admin API, so restarting the pod
to pick up the new config is left to your platform's existing, already-trusted rollout mechanism.

### 4. Verify the lock

```bash
curl -s -u provisioner:'<password>' \
  https://dashboard.example.internal/api/wazuh_ai_assistant/settings/access | jq .settingsLocked
# -> true
```

A retried write (e.g. the same script again, or a UI edit attempt) now returns `403` with:

> AI Assistant settings are locked by your administrator and cannot be changed from this page.
> Contact your administrator if you need a different configuration.

## The script

Also available as `plugins/wazuh-ai-assistant/scripts/dashboard-api/setup-ai-provider-dashboard-api.sh` in this repository.

```bash
#!/usr/bin/env bash
#
# setup-ai-provider-dashboard-api.sh
#
# Provisions one Wazuh AI Assistant provider through the Wazuh DASHBOARD's own HTTP API
# (/api/wazuh_ai_assistant/providers), authenticated as a privileged dashboard/indexer user.
#
# This is the RECOMMENDED approach: the dashboard route handles API key encryption, the SSRF
# fail-fast check, provider name-uniqueness, and (once wazuh_ai_assistant.settingsReadOnly ships)
# the settings/providers lock guard, all for you. See
# ai-assistant-provider-setup-dashboard-api.md for the full operational sequence.
#
# curl-only. No kubectl / cluster-admin calls of any kind are made or required.
#
# Usage:
#   ./setup-ai-provider-dashboard-api.sh \
#     --dashboard-url https://dashboard.example.internal \
#     --user provisioner --password '...' \
#     --name "Production OpenAI" --type openai_compatible \
#     --base-url https://api.openai.com/v1 --model gpt-4o \
#     [--api-key sk-...] [--default] [--insecure]
#
# Every flag also has an environment-variable fallback (used when the flag is omitted):
#   DASHBOARD_URL, DASHBOARD_USER, DASHBOARD_PASSWORD,
#   PROVIDER_NAME, PROVIDER_TYPE, PROVIDER_BASE_URL, PROVIDER_MODEL, PROVIDER_API_KEY,
#   PROVIDER_IS_DEFAULT (set to "true" to mean --default), INSECURE_TLS (set to "true" to mean
#   --insecure).

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: setup-ai-provider-dashboard-api.sh [options]

Required (flag or environment variable):
  --dashboard-url URL     DASHBOARD_URL       Dashboard base URL, e.g. https://dashboard.example.internal
  --user USER             DASHBOARD_USER      Privileged dashboard/indexer user
                                               (backend role with plugin:wazuh/ai_assistant/settings/write)
  --password PASS         DASHBOARD_PASSWORD  That user's password
  --name NAME             PROVIDER_NAME       Provider display name
  --type TYPE             PROVIDER_TYPE       openai_compatible | anthropic
  --base-url URL          PROVIDER_BASE_URL   Provider endpoint root
  --model MODEL           PROVIDER_MODEL      Model identifier

Optional:
  --api-key KEY           PROVIDER_API_KEY    Provider API key (requires the dashboard's
                                               wazuh_ai_assistant.encryptionKey to be configured)
  --default                                   Set PROVIDER_IS_DEFAULT=true to mean the same
  --insecure                                  Set INSECURE_TLS=true to mean the same (adds curl -k;
                                               only for self-signed/dev TLS, never production)
  -h, --help                                  Show this help
EOF
}

DASHBOARD_URL="${DASHBOARD_URL:-}"
DASHBOARD_USER="${DASHBOARD_USER:-}"
DASHBOARD_PASSWORD="${DASHBOARD_PASSWORD:-}"
PROVIDER_NAME="${PROVIDER_NAME:-}"
PROVIDER_TYPE="${PROVIDER_TYPE:-}"
PROVIDER_BASE_URL="${PROVIDER_BASE_URL:-}"
PROVIDER_MODEL="${PROVIDER_MODEL:-}"
PROVIDER_API_KEY="${PROVIDER_API_KEY:-}"
PROVIDER_IS_DEFAULT="${PROVIDER_IS_DEFAULT:-false}"
INSECURE_TLS="${INSECURE_TLS:-false}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dashboard-url) DASHBOARD_URL="$2"; shift 2 ;;
    --user) DASHBOARD_USER="$2"; shift 2 ;;
    --password) DASHBOARD_PASSWORD="$2"; shift 2 ;;
    --name) PROVIDER_NAME="$2"; shift 2 ;;
    --type) PROVIDER_TYPE="$2"; shift 2 ;;
    --base-url) PROVIDER_BASE_URL="$2"; shift 2 ;;
    --model) PROVIDER_MODEL="$2"; shift 2 ;;
    --api-key) PROVIDER_API_KEY="$2"; shift 2 ;;
    --default) PROVIDER_IS_DEFAULT="true"; shift 1 ;;
    --insecure) INSECURE_TLS="true"; shift 1 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage; exit 2 ;;
  esac
done

missing=()
[[ -z "$DASHBOARD_URL" ]] && missing+=("--dashboard-url / DASHBOARD_URL")
[[ -z "$DASHBOARD_USER" ]] && missing+=("--user / DASHBOARD_USER")
[[ -z "$DASHBOARD_PASSWORD" ]] && missing+=("--password / DASHBOARD_PASSWORD")
[[ -z "$PROVIDER_NAME" ]] && missing+=("--name / PROVIDER_NAME")
[[ -z "$PROVIDER_TYPE" ]] && missing+=("--type / PROVIDER_TYPE")
[[ -z "$PROVIDER_BASE_URL" ]] && missing+=("--base-url / PROVIDER_BASE_URL")
[[ -z "$PROVIDER_MODEL" ]] && missing+=("--model / PROVIDER_MODEL")
if [[ ${#missing[@]} -gt 0 ]]; then
  echo "Missing required value(s):" >&2
  printf '  %s\n' "${missing[@]}" >&2
  exit 2
fi

if [[ "$PROVIDER_TYPE" != "openai_compatible" && "$PROVIDER_TYPE" != "anthropic" ]]; then
  echo "Invalid --type/--PROVIDER_TYPE '$PROVIDER_TYPE': must be 'openai_compatible' or 'anthropic'" >&2
  exit 2
fi

# --- JSON body construction -------------------------------------------------------------------
# jq (if present) is the safe path for arbitrary string content (names, urls, api keys) — no
# hand-rolled escaping needed. Falls back to a minimal pure-bash JSON string escaper (backslash,
# double-quote, and control characters) when jq is unavailable, which covers every realistic input
# here (this is deliberately NOT a general-purpose JSON encoder).
json_escape() {
  local s="$1"
  s="${s//\\/\\\\}"
  s="${s//\"/\\\"}"
  s="${s//$'\n'/\\n}"
  s="${s//$'\t'/\\t}"
  printf '%s' "$s"
}

if command -v jq >/dev/null 2>&1; then
  BODY="$(jq -n \
    --arg name "$PROVIDER_NAME" \
    --arg type "$PROVIDER_TYPE" \
    --arg baseUrl "$PROVIDER_BASE_URL" \
    --arg model "$PROVIDER_MODEL" \
    --arg apiKey "$PROVIDER_API_KEY" \
    --argjson isDefault "$([[ "$PROVIDER_IS_DEFAULT" == "true" ]] && echo true || echo false)" \
    '{name: $name, type: $type, baseUrl: $baseUrl, model: $model, isDefault: $isDefault}
     + (if ($apiKey | length) > 0 then {apiKey: $apiKey} else {} end)')"
else
  echo "Warning: jq not found, using a minimal built-in JSON escaper." >&2
  BODY="{\"name\":\"$(json_escape "$PROVIDER_NAME")\","
  BODY+="\"type\":\"$(json_escape "$PROVIDER_TYPE")\","
  BODY+="\"baseUrl\":\"$(json_escape "$PROVIDER_BASE_URL")\","
  BODY+="\"model\":\"$(json_escape "$PROVIDER_MODEL")\","
  BODY+="\"isDefault\":$([[ "$PROVIDER_IS_DEFAULT" == "true" ]] && echo true || echo false)"
  if [[ -n "$PROVIDER_API_KEY" ]]; then
    BODY+=",\"apiKey\":\"$(json_escape "$PROVIDER_API_KEY")\""
  fi
  BODY+="}"
fi

# --- Request -----------------------------------------------------------------------------------
CURL_OPTS=(-sS -X POST
  "${DASHBOARD_URL%/}/api/wazuh_ai_assistant/providers"
  -H "osd-xsrf: true"
  -H "Content-Type: application/json"
  -u "${DASHBOARD_USER}:${DASHBOARD_PASSWORD}"
  -d "$BODY"
  -w '\n%{http_code}')
[[ "$INSECURE_TLS" == "true" ]] && CURL_OPTS+=(-k)

RESPONSE="$(curl "${CURL_OPTS[@]}")"
HTTP_CODE="$(printf '%s' "$RESPONSE" | tail -n1)"
RESPONSE_BODY="$(printf '%s' "$RESPONSE" | sed '$d')"

if [[ "$HTTP_CODE" == "200" ]]; then
  echo "Provider created successfully."
  echo "$RESPONSE_BODY"
  echo
  echo "Next: set wazuh_ai_assistant.settingsReadOnly=true via your platform's own config" \
       "mechanism and let its normal rollout restart the dashboard, then verify with" \
       "GET \${DASHBOARD_URL}/api/wazuh_ai_assistant/settings/access (expect settingsLocked: true)."
  exit 0
fi

if [[ "$HTTP_CODE" == "403" ]] && printf '%s' "$RESPONSE_BODY" | grep -qi "locked by your administrator"; then
  echo "Request refused (403): AI Assistant settings are already locked" \
       "(wazuh_ai_assistant.settingsReadOnly=true)." >&2
  echo "Set it back to false and restart the dashboard before retrying this script." >&2
  echo "$RESPONSE_BODY" >&2
  exit 1
fi

echo "Provider creation failed (HTTP $HTTP_CODE):" >&2
echo "$RESPONSE_BODY" >&2
exit 1
```
