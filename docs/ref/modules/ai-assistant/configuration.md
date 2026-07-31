# Configuration

The AI Assistant needs **one administrator action** before it is usable: configuring at least one
provider under **AI Assistant → Settings**. Everything else has safe defaults.

## Dashboard configuration keys

The plugin's `configPath` is `wazuh_ai_assistant` (note: the config namespace, not the
`wazuhAiAssistant` plugin id). Keys go in `opensearch_dashboards.yml` or the OpenSearch
Dashboards keystore:

| Key                                | Default | Description                                                                                                                                                                                                                                         |
| ---------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wazuh_ai_assistant.enabled`       | `true`  | Enables/disables the plugin.                                                                                                                                                                                                                        |
| `wazuh_ai_assistant.encryptionKey` | unset   | **Required to save provider API keys** — writes carrying a key are rejected without it. Base64-encoded 32-byte AES-256 key used to encrypt those keys at rest. Generate with `openssl rand -base64 32`. **Prefer the keystore** over the YAML file: |

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

**AI Assistant → Settings** has three sections. Provider and privacy management require an
**administrator**; the page detects a non-admin on mount and disables the save actions with an
explanatory warning instead of failing on submit.

### Providers

Create, edit, delete, and test providers, and choose the default one.

| Field        | Description                                                                                                                                                             |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Name**     | Display name shown in the chat provider selector.                                                                                                                       |
| **Type**     | `OpenAI-compatible`, `Anthropic`, or `Wazuh hosted brain`.                                                                                                              |
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

All routes live under `/api/wazuh_ai_assistant` and enforce the same rules as the UI (admin gate
on provider/settings writes, owner scoping on conversations):

| Route                                                           | Purpose                                                                              |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `POST /chat`                                                    | Chat turn; responds as an SSE stream.                                                |
| `GET/POST /providers`, `GET/PUT/DELETE /providers/{id}`         | Provider CRUD (writes admin-only; responses carry `hasApiKey`, never keys).          |
| `POST /providers/{id}/test`                                     | Connectivity test (admin-only).                                                      |
| `POST /providers/{id}/default`                                  | Set the default provider (admin-only).                                               |
| `GET/PUT /settings`                                             | Singleton assistant settings (PUT admin-only; GET creates defaults on first access). |
| `GET /settings/access`                                          | Non-403 admin probe used by the Settings page on mount.                              |
| `GET/POST /conversations`, `GET/PUT/DELETE /conversations/{id}` | Owner-scoped conversation CRUD.                                                      |

## Internationalization

The UI ships with full English/Spanish parity (`translations/en-US.json`, `es-ES.json`), and the
assistant answers in the language of the question.
