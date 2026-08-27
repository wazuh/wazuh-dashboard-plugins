# Provisioning an AI Assistant provider for a locked cloud deployment (indexer API, direct)

This is the **alternative** approach: it calls the Wazuh **indexer's** own
`/_plugins/_setup/ai_assistant/providers` endpoint directly, bypassing the Wazuh dashboard process
entirely. It only needs an indexer-level credential (no dashboard session), which is useful when
provisioning happens at a pipeline stage where the dashboard isn't reachable yet, or only an
indexer service credential is available.

**Prefer [`ai-assistant-provider-setup-dashboard-api.md`](../dashboard-api/ai-assistant-provider-setup-dashboard-api.md)
whenever a privileged dashboard user/session is available at all.** Read the tradeoffs below
before using this one.

## What this bypasses — read before using

Every safeguard below lives **only** in the Wazuh dashboard's own route handlers
(`server/routes/settings.ts` in `wazuh-dashboard-plugins`). The indexer's provider-write endpoint
has no equivalent for any of them:

- **SSRF fail-fast check** on the provider's `baseUrl` (`assertProviderUrlAllowed`). A save-time
  rejection of an obviously-bad URL is skipped; the adapter's own fetch-time guard still applies
  whenever the provider is actually _used_ (chat, or a connectivity test), so this is a smaller
  gap than it sounds, but it is a gap.
- **Provider name-uniqueness / blank-name validation.** The indexer has no unique constraint on
  provider names; this script can create duplicate or blank-named providers freely.
- **The `wazuh_ai_assistant.settingsReadOnly` lock.** This is the important one: that
  configuration flag and its guard (`requireSettingsUnlocked`) exist only in the dashboard
  process. **A provider can be written or overwritten through this script even while
  `settingsReadOnly` is `true`.** If your whole point is to lock the configuration down, writing
  through this path defeats that lock.

Use this script only when Approach A genuinely isn't available at the point in your pipeline
where provisioning happens.

## How the API key encryption works

The dashboard never stores a provider's API key in plaintext — it encrypts it first
(`server/crypto/api-key-cipher.ts` in `wazuh-dashboard-plugins`) using:

- **AES-256-GCM**, key = the raw 32 bytes of the base64-decoded
  `wazuh_ai_assistant.encryptionKey` (used directly — no key derivation).
- A fresh random 12-byte IV per encryption.
- **Additional Authenticated Data (AAD)** = `wazuh-ai-assistant-provider:<provider id>:apiKey` —
  binding the ciphertext to the exact provider id it will be stored under. This means the
  provider's `id` must be minted **before** encrypting (the script generates its own UUID first,
  the same "create-before-id" sequencing the dashboard route itself uses).
- Wire format: `enc:v1:` + base64(`iv` ‖ 16-byte auth tag ‖ ciphertext).

If a provider needs an API key, this script reproduces that exact format so the dashboard can
decrypt it later — using a small embedded Python 3 script (via the `cryptography` package), since
plain bash+`openssl` cannot do AES-GCM with AAD reliably or portably.

### Obtaining `wazuh_ai_assistant.encryptionKey`

This is genuinely the awkward part of this approach. The dashboard is meant to hold this key only
in its OpenSearch Dashboards keystore, which is deliberately not simple to read back out (no
plain "print the value" subcommand — reading it back requires shell/exec access into the
dashboard container to run `opensearch-dashboards-keystore` there, which defeats the point of
avoiding the dashboard). In practice, this only works cleanly when your deployment pipeline is the
one that **generated** the key in the first place (e.g. `openssl rand -base64 32` in a setup step)
and can hand that same plaintext value to both the dashboard's keystore provisioning _and_ this
script independently — i.e., you already have the key from your own secret manager, not something
you extract from a running dashboard.

If the provider does not need an API key (e.g. a self-hosted gateway that requires no credential),
none of this applies — omit `--api-key`/`--encryption-key` entirely.

## Prerequisites

- An indexer user (backend role with `plugin:wazuh/ai_assistant/settings/write`) — see
  [`docs/ref/modules/ai-assistant/security.md`](../../../../docs/ref/modules/ai-assistant/security.md#required-indexer-permissions)
  in `wazuh-dashboard-plugins`.
- `curl` and `jq`.
- If provisioning an API key: `python3` with the `cryptography` package (`pip install
cryptography`), and the same `wazuh_ai_assistant.encryptionKey` value already configured on the
  dashboard.
- Network access from wherever the script runs to the indexer's HTTP(S) endpoint (commonly
  `:9200`).

## Sequence

### 1. Run the provisioning script

```bash
./setup-ai-provider-indexer-api.sh \
  --indexer-url https://indexer.example.internal:9200 \
  --user provisioner \
  --password '<indexer-user-password>' \
  --name "Production OpenAI" \
  --type openai_compatible \
  --base-url https://api.openai.com/v1 \
  --model gpt-4o \
  --api-key 'sk-...' \
  --encryption-key '<the same base64 key configured as wazuh_ai_assistant.encryptionKey>' \
  --default
```

Every flag also accepts an environment variable instead (`INDEXER_URL`, `INDEXER_USER`,
`INDEXER_PASSWORD`, `PROVIDER_NAME`, `PROVIDER_TYPE`, `PROVIDER_BASE_URL`, `PROVIDER_MODEL`,
`PROVIDER_API_KEY`, `ENCRYPTION_KEY`, `PROVIDER_IS_DEFAULT=true`) for Secret-backed injection in a
Kubernetes Job/init-container.

### 2. Verify from the dashboard

Once the dashboard is reachable, confirm the provider looks right and behaves as expected — this
script's write skipped the dashboard's own validation, so this check matters more here than with
Approach A:

```bash
curl -s -u '<dashboard-user>:<password>' \
  https://dashboard.example.internal/api/wazuh_ai_assistant/providers | jq .
```

### 3. Lock (if not already)

If you still intend to lock the configuration, set `wazuh_ai_assistant.settingsReadOnly: true`
through your platform's own configuration mechanism and let its normal rollout restart the
dashboard — same as Approach A's step 3. Remember this lock does **not** retroactively protect
against another future direct-indexer write; it only guards the dashboard's own routes.

## The script

Also available as `plugins/wazuh-ai-assistant/scripts/indexer-api/setup-ai-provider-indexer-api.sh` in this repository.

```bash
#!/usr/bin/env bash
#
# setup-ai-provider-indexer-api.sh
#
# Provisions one Wazuh AI Assistant provider by calling the Wazuh INDEXER's own
# /_plugins/_setup/ai_assistant/providers endpoint directly, bypassing the Wazuh dashboard
# process entirely.
#
# ================================================================================================
# READ THIS FIRST: this path bypasses, PERMANENTLY, for every provider written this way:
#   - The SSRF fail-fast check on baseUrl (dashboard-only, server/providers/url-guard.ts).
#   - Provider name-uniqueness / blank-name validation (dashboard-only).
#   - The wazuh_ai_assistant.settingsReadOnly lock: that flag and its guard
#     (requireSettingsUnlocked) live ONLY in the dashboard process. A provider CAN be written or
#     overwritten through this script even while settingsReadOnly is true.
# Prefer setup-ai-provider-dashboard-api.sh whenever a privileged DASHBOARD user/session is
# available at all. Use this script only when it genuinely isn't (e.g. provisioning happens
# before the dashboard is reachable, or only an indexer-level credential exists at this stage of
# your pipeline). See ai-assistant-provider-setup-indexer-api.md for the full writeup.
# ================================================================================================
#
# curl-only for the HTTP call. No kubectl / cluster-admin calls of any kind are made or required.
# Encrypting the API key (to match exactly what the dashboard would have produced) requires
# Python 3 with the `cryptography` package, since raw bash+openssl cannot do AES-GCM with
# Additional Authenticated Data (AAD) reliably/portably. Only needed when --api-key is supplied.
#
# Usage:
#   ./setup-ai-provider-indexer-api.sh \
#     --indexer-url https://indexer.example.internal:9200 \
#     --user provisioner --password '...' \
#     --name "Production OpenAI" --type openai_compatible \
#     --base-url https://api.openai.com/v1 --model gpt-4o \
#     [--api-key sk-... --encryption-key '<base64 32-byte key>'] [--default] [--insecure]
#
# Every flag also has an environment-variable fallback (used when the flag is omitted):
#   INDEXER_URL, INDEXER_USER, INDEXER_PASSWORD,
#   PROVIDER_NAME, PROVIDER_TYPE, PROVIDER_BASE_URL, PROVIDER_MODEL, PROVIDER_API_KEY,
#   ENCRYPTION_KEY, PROVIDER_IS_DEFAULT (set to "true" to mean --default), INSECURE_TLS (set to
#   "true" to mean --insecure).
#
# ENCRYPTION_KEY must be the SAME base64-encoded 32-byte AES-256 key configured on the dashboard
# as wazuh_ai_assistant.encryptionKey — obtainable either from wherever your deployment pipeline
# originally generated it (the value handed to the dashboard's keystore), or, if you must read it
# back out of an already-provisioned dashboard, only via shell/exec access into that dashboard
# container running its own `opensearch-dashboards-keystore` tooling (there is no simple "print
# the value" keystore subcommand — see ai-assistant-provider-setup-indexer-api.md).

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: setup-ai-provider-indexer-api.sh [options]

Required (flag or environment variable):
  --indexer-url URL       INDEXER_URL         Indexer base URL, e.g. https://indexer.example.internal:9200
  --user USER             INDEXER_USER        Indexer user (backend role with
                                               plugin:wazuh/ai_assistant/settings/write)
  --password PASS         INDEXER_PASSWORD    That user's password
  --name NAME             PROVIDER_NAME       Provider display name
  --type TYPE             PROVIDER_TYPE       openai_compatible | anthropic
  --base-url URL          PROVIDER_BASE_URL   Provider endpoint root
  --model MODEL           PROVIDER_MODEL      Model identifier

Optional:
  --api-key KEY           PROVIDER_API_KEY    Provider API key. Requires --encryption-key.
  --encryption-key KEY    ENCRYPTION_KEY      Base64 32-byte AES-256 key, same value as the
                                               dashboard's wazuh_ai_assistant.encryptionKey.
                                               Required only when --api-key is given.
  --default                                   Set PROVIDER_IS_DEFAULT=true to mean the same
  --insecure                                  Set INSECURE_TLS=true to mean the same (adds curl -k;
                                               only for self-signed/dev TLS, never production)
  -h, --help                                  Show this help
EOF
}

INDEXER_URL="${INDEXER_URL:-}"
INDEXER_USER="${INDEXER_USER:-}"
INDEXER_PASSWORD="${INDEXER_PASSWORD:-}"
PROVIDER_NAME="${PROVIDER_NAME:-}"
PROVIDER_TYPE="${PROVIDER_TYPE:-}"
PROVIDER_BASE_URL="${PROVIDER_BASE_URL:-}"
PROVIDER_MODEL="${PROVIDER_MODEL:-}"
PROVIDER_API_KEY="${PROVIDER_API_KEY:-}"
ENCRYPTION_KEY="${ENCRYPTION_KEY:-}"
PROVIDER_IS_DEFAULT="${PROVIDER_IS_DEFAULT:-false}"
INSECURE_TLS="${INSECURE_TLS:-false}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --indexer-url) INDEXER_URL="$2"; shift 2 ;;
    --user) INDEXER_USER="$2"; shift 2 ;;
    --password) INDEXER_PASSWORD="$2"; shift 2 ;;
    --name) PROVIDER_NAME="$2"; shift 2 ;;
    --type) PROVIDER_TYPE="$2"; shift 2 ;;
    --base-url) PROVIDER_BASE_URL="$2"; shift 2 ;;
    --model) PROVIDER_MODEL="$2"; shift 2 ;;
    --api-key) PROVIDER_API_KEY="$2"; shift 2 ;;
    --encryption-key) ENCRYPTION_KEY="$2"; shift 2 ;;
    --default) PROVIDER_IS_DEFAULT="true"; shift 1 ;;
    --insecure) INSECURE_TLS="true"; shift 1 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage; exit 2 ;;
  esac
done

missing=()
[[ -z "$INDEXER_URL" ]] && missing+=("--indexer-url / INDEXER_URL")
[[ -z "$INDEXER_USER" ]] && missing+=("--user / INDEXER_USER")
[[ -z "$INDEXER_PASSWORD" ]] && missing+=("--password / INDEXER_PASSWORD")
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
  echo "Invalid --type/PROVIDER_TYPE '$PROVIDER_TYPE': must be 'openai_compatible' or 'anthropic'" >&2
  exit 2
fi

if [[ -n "$PROVIDER_API_KEY" && -z "$ENCRYPTION_KEY" ]]; then
  echo "--api-key was given but --encryption-key/ENCRYPTION_KEY is missing." >&2
  echo "The stored value must be encrypted with the SAME key the dashboard uses" \
       "(wazuh_ai_assistant.encryptionKey), or the dashboard will fail to decrypt it later." >&2
  exit 2
fi

echo "WARNING: writing directly to the indexer bypasses the dashboard's SSRF check, name-" >&2
echo "uniqueness check, and the settingsReadOnly lock (if it is set, this write still succeeds)." >&2
echo "See ai-assistant-provider-setup-indexer-api.md before using this in production." >&2

# --- Provider id -----------------------------------------------------------------------------
# The create endpoint requires `id` in the body, validated server-side as a UUID. Generated
# CLIENT-SIDE and used BEFORE encryption (not after): the API key's AAD is bound to this exact id
# (see the encryption step below), so the id must exist first — the same "create-before-id"
# sequencing the dashboard route itself uses.
if command -v python3 >/dev/null 2>&1; then
  PROVIDER_ID="$(python3 -c 'import uuid; print(uuid.uuid4())')"
elif command -v uuidgen >/dev/null 2>&1; then
  PROVIDER_ID="$(uuidgen | tr '[:upper:]' '[:lower:]')"
elif [[ -r /proc/sys/kernel/random/uuid ]]; then
  PROVIDER_ID="$(cat /proc/sys/kernel/random/uuid)"
else
  echo "No UUID generator found (need python3, uuidgen, or /proc/sys/kernel/random/uuid)." >&2
  exit 1
fi

# --- API key encryption (only if an API key was given) -------------------------------------
# Reimplements server/crypto/api-key-cipher.ts's exact wire format so the dashboard can decrypt
# what this script writes:
#   AES-256-GCM, key = raw 32 bytes of base64-decoded ENCRYPTION_KEY (used directly, no KDF),
#   IV = 12 random bytes per call, AAD = "wazuh-ai-assistant-provider:<id>:apiKey",
#   wire = "enc:v1:" + base64(iv[12] || authTag[16] || ciphertext).
ENCRYPTED_API_KEY=""
if [[ -n "$PROVIDER_API_KEY" ]]; then
  if ! command -v python3 >/dev/null 2>&1; then
    echo "python3 is required to encrypt the API key (no working bash+openssl AES-GCM+AAD path)." >&2
    exit 1
  fi
  if ! python3 -c 'import cryptography' >/dev/null 2>&1; then
    echo "The Python 'cryptography' package is required. Install it with: pip install cryptography" >&2
    exit 1
  fi
  ENCRYPTED_API_KEY="$(
    PROVIDER_ID="$PROVIDER_ID" \
    ENCRYPTION_KEY="$ENCRYPTION_KEY" \
    PROVIDER_API_KEY="$PROVIDER_API_KEY" \
    python3 <<'PYEOF'
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
  )"
fi

# --- JSON body construction -------------------------------------------------------------------
if command -v jq >/dev/null 2>&1; then
  BODY="$(jq -n \
    --arg id "$PROVIDER_ID" \
    --arg name "$PROVIDER_NAME" \
    --arg type "$PROVIDER_TYPE" \
    --arg base_url "$PROVIDER_BASE_URL" \
    --arg model "$PROVIDER_MODEL" \
    --arg api_key "$ENCRYPTED_API_KEY" \
    --argjson is_default "$([[ "$PROVIDER_IS_DEFAULT" == "true" ]] && echo true || echo false)" \
    '{id: $id, name: $name, type: $type, base_url: $base_url, model: $model, is_default: $is_default}
     + (if ($api_key | length) > 0 then {api_key: $api_key} else {} end)')"
else
  echo "jq is required for this script (safe JSON construction of the encrypted api_key field)." >&2
  exit 1
fi

# --- Request -----------------------------------------------------------------------------------
CURL_OPTS=(-sS -X POST
  "${INDEXER_URL%/}/_plugins/_setup/ai_assistant/providers"
  -H "Content-Type: application/json"
  -u "${INDEXER_USER}:${INDEXER_PASSWORD}"
  -d "$BODY"
  -w '\n%{http_code}')
[[ "$INSECURE_TLS" == "true" ]] && CURL_OPTS+=(-k)

RESPONSE="$(curl "${CURL_OPTS[@]}")"
HTTP_CODE="$(printf '%s' "$RESPONSE" | tail -n1)"
RESPONSE_BODY="$(printf '%s' "$RESPONSE" | sed '$d')"

if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
  echo "Provider created successfully (id: $PROVIDER_ID)."
  echo "$RESPONSE_BODY"
  echo
  echo "Reminder: this write bypassed the dashboard's SSRF check, name-uniqueness check, and the" \
       "settingsReadOnly lock. Verify the result from the dashboard (GET" \
       "/api/wazuh_ai_assistant/providers) before relying on it."
  exit 0
fi

echo "Provider creation failed (HTTP $HTTP_CODE):" >&2
echo "$RESPONSE_BODY" >&2
exit 1
```
