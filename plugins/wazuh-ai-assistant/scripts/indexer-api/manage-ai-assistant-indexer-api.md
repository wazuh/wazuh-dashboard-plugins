# manage-ai-assistant-indexer-api.sh

Manages Wazuh AI Assistant **providers** and **settings** by calling the Wazuh indexer's own
`/_plugins/_setup/ai_assistant/*` endpoints directly, bypassing the Wazuh dashboard process
entirely. Prefer the dashboard's own HTTP API whenever a privileged dashboard user/session is
available at all — use this script only when it genuinely isn't (e.g. provisioning before the
dashboard is reachable, or only an indexer-level credential exists at that stage of your
pipeline).

## Read this first

Every write made through this script permanently bypasses:

- The SSRF fail-fast check on a provider's `baseUrl` (providers only).
- Provider name-uniqueness / blank-name validation (providers only).
- The `wazuh_ai_assistant.settingsReadOnly` lock: that flag lives only in the dashboard
  process, so a write can happen here even while it's set to `true`.

`settingsReadOnly` itself can **never** be toggled from here (or from the indexer at all) — it
is a dashboard plugin config value (`opensearch_dashboards.yml`/keystore), read once at
dashboard startup, with no HTTP route anywhere that writes it.

Both `providers update` and `settings update` hit endpoints whose `PUT` is a **full replace**,
not a partial update — the script fetches the existing resource first and merges in only the
fields you pass. In particular, `providers update` without `--api-key` resends the existing
encrypted key unchanged (it is never re-encrypted or decrypted).

`conversationRetentionDays` is a third, separate mechanism again: it lives on the ISM policy
governing the conversation-sessions index, not on the settings document, and is edited via
OpenSearch's own ISM policy API (read `_seq_no`/`_primary_term`, an optimistic-concurrency
`PUT`, then a `change_policy` call so already-managed indices pick up the edit).

Encrypting a provider API key requires Python 3 with the `cryptography` package (only needed
for `providers create`/`providers update` when `--api-key` is given).

## Usage

```bash
# Providers
./manage-ai-assistant-indexer-api.sh providers list \
  --indexer-url https://indexer.example.internal:9200 --user provisioner --password '...' --insecure

./manage-ai-assistant-indexer-api.sh providers create \
  --indexer-url https://indexer.example.internal:9200 --user provisioner --password '...' --insecure \
  --name "Production OpenAI" --type openai_compatible \
  --base-url https://api.openai.com/v1 --model gpt-4o \
  --api-key sk-... --encryption-key '<base64 32-byte key>' --default

./manage-ai-assistant-indexer-api.sh providers update \
  --indexer-url https://indexer.example.internal:9200 --user provisioner --password '...' --insecure \
  --id <uuid> --model gpt-4o-mini

./manage-ai-assistant-indexer-api.sh providers delete \
  --indexer-url https://indexer.example.internal:9200 --user provisioner --password '...' --insecure \
  --id <uuid>

# Settings
./manage-ai-assistant-indexer-api.sh settings get \
  --indexer-url https://indexer.example.internal:9200 --user provisioner --password '...' --insecure

./manage-ai-assistant-indexer-api.sh settings update \
  --indexer-url https://indexer.example.internal:9200 --user provisioner --password '...' --insecure \
  --field-policy '[{"field":"agent.ip","action":"allow-scan","kind":"IP"}]'

./manage-ai-assistant-indexer-api.sh settings update \
  --indexer-url https://indexer.example.internal:9200 --user provisioner --password '...' --insecure \
  --conversation-retention-days 30
```

Run `./manage-ai-assistant-indexer-api.sh --help` for the full flag reference.

## Environment variable fallbacks

Every flag also has an environment-variable fallback: `INDEXER_URL`, `INDEXER_USER`,
`INDEXER_PASSWORD`, `INSECURE_TLS`, `PROVIDER_ID`, `PROVIDER_NAME`, `PROVIDER_TYPE`,
`PROVIDER_BASE_URL`, `PROVIDER_MODEL`, `PROVIDER_API_KEY`, `ENCRYPTION_KEY`,
`PROVIDER_IS_DEFAULT`, `SETTINGS_PRIVACY_DEFAULT_ON`, `SETTINGS_USER_CAN_OVERRIDE`,
`SETTINGS_PRIVACY_DEFAULT_PER_PROVIDER`, `SETTINGS_FIELD_POLICY`,
`SETTINGS_CONVERSATION_RETENTION_DAYS`.

`ENCRYPTION_KEY` must be the same base64-encoded 32-byte AES-256 key configured on the
dashboard as `wazuh_ai_assistant.encryptionKey`.
