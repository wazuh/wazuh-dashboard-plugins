# Configuration

The AI Assistant needs **one initial setup step** before it is usable: configuring at least one
provider under **AI Assistant → Settings**. Everything else has safe defaults. Who can take that
step is decided by the Wazuh indexer's own RBAC — see
[Security](./security.md#settings-and-providers-authorized-by-indexer-rbac).

## Dashboard configuration keys

The plugin's `configPath` is `wazuh_ai_assistant` (note: the config namespace, not the
`wazuhAiAssistant` plugin id). Keys go in `opensearch_dashboards.yml` or the OpenSearch
Dashboards keystore:

| Key                                      | Default | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wazuh_ai_assistant.enabled`             | `true`  | Enables/disables the plugin.                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `wazuh_ai_assistant.encryptionKey`       | unset   | **Required to save provider API keys** — writes carrying a key are rejected without it. Base64-encoded 32-byte AES-256 key used to encrypt those keys at rest. Generate with `openssl rand -base64 32`. **Prefer the keystore** over the YAML file:                                                                                                                                                                                                               |
| `wazuh_ai_assistant.settingsReadOnly`    | `false` | Locks AI Assistant settings and providers so they cannot be created, edited, deleted, or changed from **AI Assistant → Settings** or the HTTP API — set once (keystore or YAML) to keep a fixed configuration across the environment, regardless of the calling user's own indexer RBAC. Read routes, `POST /providers/{id}/test`, and conversation history are unaffected. See [Settings view](#settings-view) and [HTTP API](#http-api).                        |
| `wazuh_ai_assistant.outOfCreditsMessage` | unset   | Replaces the chat error shown when a provider reports an out-of-credits condition — set it to point users at your own credits or plan-upgrade flow instead of the provider's raw text. A Markdown link (`[label](https://...)`) renders as a link that opens in a new tab; raw HTML is stripped. One value per environment (not per provider), so it is set here rather than from **AI Assistant → Settings**. Unset leaves the provider's own message unchanged. |

```
sudo -u wazuh-dashboard /usr/share/wazuh-dashboard/bin/opensearch-dashboards-keystore \
  add wazuh_ai_assistant.encryptionKey
```

With no `encryptionKey` set, saving a provider API key is rejected — the Settings form warns
before submit and the HTTP API refuses the write — and a warning is logged at startup. Providers
that need no API key can still be saved. Plaintext API keys are never stored, read, or managed: a
key stored in plaintext by an earlier pre-release build is unusable and must be re-entered before
the provider can be edited at all. Neither the key nor any derived material is ever exposed to the browser
or logged. See [Security](./security.md#api-key-encryption-at-rest) for format and rotation
caveats.

## Settings view

**AI Assistant → Settings** has three sections. Provider and privacy management are open to any
authenticated user. Whether a save actually succeeds depends on the calling user's own Wazuh
indexer backend role carrying the relevant `plugin:wazuh/ai_assistant/settings/{read,write}`
permission (see [Security](./security.md#required-indexer-permissions)); a caller without it gets
the indexer's own error message back.

When `wazuh_ai_assistant.settingsReadOnly` is `true`, every write control on this page (add/edit/
delete/set-default provider, save privacy settings, save conversation-history retention) is
disabled and a banner explains the lock. `GET /settings/access` exposes this as `settingsLocked`
for the page to react to; the underlying write routes independently reject with `403` regardless
of the caller's own indexer RBAC — the lock is an additional operator-level control layered above
that RBAC, not a replacement for it.

### Providers

Create, edit, delete, and test providers, and choose the default one.

| Field        | Description                                                                                                                                                             |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Name**     | Display name shown in the chat provider selector.                                                                                                                       |
| **Type**     | `OpenAI-compatible` or `Anthropic` — see [Providers](./providers.md) for which services and models under each type are verified working.                                |
| **Base URL** | Endpoint root. Checked by the SSRF guard on every request; private/loopback addresses are allowed (self-hosted gateways), cloud-metadata and link-local ranges are not. |
| **Model**    | Model identifier passed through to the provider.                                                                                                                        |
| **API key**  | Optional; write-only (the UI only ever shows whether a key is set). Saving one requires `encryptionKey` to be configured; always encrypted at rest.                     |

**Test connection** performs a round-trip against the provider without sending any Wazuh data.

### Privacy

- **Default per provider** — whether privacy mode (pseudonymization) starts ON or OFF for
  conversations using each provider. Recommended ON for external cloud LLMs; OFF is the shipped
  default (self-hosted gateways are the primary target).
- **User override** — whether users may toggle privacy per conversation, or the admin default is
  locked.
- **Field policy** — per-field `Allow` / `Anonymize` / `Never send` matrix applied at the digest
  boundary. `Never send` fields are stripped from digests even with privacy mode off.

### Conversation history

Retention and housekeeping for the caller's stored conversations (per-user cap: 500).

## HTTP API

All routes live under `/api/wazuh_ai_assistant` and enforce the same rules as the UI (indexer RBAC
on provider/settings reads and writes, owner scoping on conversations):

| Route                                                           | Purpose                                                                                                                                                             |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /chat`                                                    | Chat turn; responds as an SSE stream.                                                                                                                               |
| `GET/POST /providers`, `GET/PUT/DELETE /providers/{id}`         | Provider CRUD (writes need the indexer's `.../settings/write` permission; responses carry `hasApiKey`, never keys). Writes also 403 when `settingsReadOnly` is set. |
| `POST /providers/{id}/test`                                     | Connectivity test (same indexer write permission). Persists nothing, so it stays available even when `settingsReadOnly` is set.                                     |
| `POST /providers/{id}/default`                                  | Set the default provider (same indexer write permission). 403 when `settingsReadOnly` is set.                                                                       |
| `GET/PUT /settings`                                             | Singleton assistant settings (PUT needs the same indexer write permission; GET creates defaults on first access). PUT 403s when `settingsReadOnly` is set.          |
| `GET /settings/access`                                          | Non-403 Manager-session liveness probe (not an authorization check) plus capability flags for the Settings page, including `settingsLocked`.                        |
| `GET/POST /conversations`, `GET/PUT/DELETE /conversations/{id}` | Owner-scoped conversation CRUD.                                                                                                                                     |

## Internationalization

**The UI chrome is English-only.** Every UI string carries its English text in the `defaultMessage`
of its `i18n.translate(...)` call, and the plugin ships no translation catalogs, so the interface
renders in English at every `i18n.locale`. Server-composed strings — route errors and tool status
messages — are English too.

Localization is deferred to a general, dashboard-wide effort rather than done one plugin at a time:
a single localized plugin is inconsistent for users and puts a translation cost on every unrelated
PR. The plugin did previously carry `en-US.json` and `es-ES.json`, but neither ever reached a user —
`en-US` is never consulted for the default locale `en`, and `es-ES` was not registered on packaged
installs because the archive did not include the plugin's `.i18nrc.json` — while both had drifted
badly from the source. `plugins/wazuh-ai-assistant/common/i18n-strings.test.ts` now keeps the source
strings sound (namespaced ids, no id reused for two messages, every message valid ICU) and fails if
a catalog is reintroduced outside that wider effort.

**Model answers are a separate matter and are not affected.** The system prompt instructs the
assistant to answer in the language of the user's most recent message, so a Spanish question gets a
Spanish answer even though the surrounding interface is in English, and an English question gets an
English answer. That behaviour comes from the model, not from i18n.
