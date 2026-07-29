# Wazuh AI Assistant (`wazuhAiAssistant`)

OpenSearch Dashboards plugin that brings the Wazuh AI Assistant chat experience into the Wazuh
dashboard as a native, provider-agnostic plugin: an analyst asks a security question in plain
language, the plugin turns it into read-only queries against the Wazuh Indexer / Manager API,
and streams back a short answer plus the real result table.

**Target platform: Wazuh 5.0 / OpenSearch Dashboards 3.6.0** (React 18, `@elastic/eui` aliased to
`@opensearch-project/oui` 1.22.1, Node 22.22.0).

## What it does

- **Chat UI** (EUI/OUI) streaming over SSE end to end: provider → this plugin's server → browser.
- **29 read-only tools** (`server/tools/catalog/`) covering alerts/findings, vulnerabilities, FIM,
  SCA, MITRE, PCI DSS, syscollector inventory and agent status, plus a general `search_wazuh_data`
  escape hatch. Every tool is `tier: 'T1'` — **there are no mutating tools**.
- **Two-stage router** (`server/tools/router.ts`) that narrows the tool set per turn to cut tokens.
  It is a cost optimisation, not an access control: the escape hatch is always available.
- **Guardrails** (`server/tools/guardrails.ts`) on every Indexer query — index allowlist, mandatory
  bounded time window, size/aggregation caps, no scripts/regexp/leading wildcards.
- **Digests** (`server/tools/digest.ts`): the model sees a small capped summary; the user sees the
  full table. This keeps token cost bounded and independent of result size.
- **Optional pseudonymisation** (`server/tools/privacy.ts`) of data leaving the cluster, with a
  per-turn badge in the UI. Off by default — see "What leaves the cluster" below.
- **Persistent conversations** as owner-scoped saved objects, with optimistic concurrency.
- **Provider settings** (admin-only) for three adapters, each used purely as a transport:
  OpenAI-compatible (OpenAI, Ollama, vLLM, LiteLLM…), Anthropic Messages API, and the Wazuh AI
  Assistant hosted brain (n8n webhook). Provider API keys can be encrypted at rest.

## Layout

```
common/            Shared contract: types.ts (chat/stream events), constants, pure helpers
                   (conversation-merge, draft-stash, discover-url, http-status, errors)
public/            Browser plugin: React app
  components/chat/     message list/bubble, chat input, result table, conversation list
  components/settings/ provider CRUD + connection test, privacy/field-policy settings
  services/            chat-service (SSE), conversations-service, settings-service
server/            Server plugin
  routes/              chat.ts (SSE orchestration), conversations.ts, settings.ts, route-helpers.ts
  tools/               registry, router, executor, guardrails, digest, privacy, schema-validator
    catalog/           the 29 tool definitions
  providers/           adapter interface + 3 adapters, url-guard (SSRF), retry/stall handling
  crypto/              api-key-cipher.ts (AES-256-GCM, enc:v1 read / enc:v2 write)
  saved_objects/       provider-settings, conversation, assistant-settings (all hidden types)
  prompts.ts           the system prompt
translations/      en-US.json / es-ES.json
eval/              Test + measurement harness (see eval/README.md)
docs/              ENCRYPTION.md (API-key encryption at rest), CI.md (test gates & harness)
```

## Building

This plugin is **not** standalone-buildable; it builds inside a `wazuh-dashboard` checkout, the
same way Wazuh's own `main` / `wazuh-core` / `wazuh-check-updates` plugins do.

1. Get a `wazuh-dashboard` checkout matching your target (Wazuh 5.0 → OSD **3.6.0**).
2. Use the Node version pinned by that checkout's `.nvmrc` (**22.22.0** for 5.0): `nvm use`.
3. Copy this folder into `wazuh-dashboard/plugins/wazuh_ai_assistant`.
4. From the `wazuh-dashboard` repo root:
   ```
   yarn osd bootstrap          # slow; once per checkout
   cd plugins/wazuh_ai_assistant
   node ../../scripts/plugin_helpers.js build --opensearch-dashboards-version=3.6.0
   ```
   Note the value is the **OSD** version (`3.6.0`), not the Wazuh version.
5. The installable zip lands in `build/`.

## Installing into a running Wazuh dashboard (AIO)

```
sudo -u wazuh-dashboard /usr/share/wazuh-dashboard/bin/opensearch-dashboards-plugin \
  install file:///path/to/wazuhAiAssistant-3.6.0.zip
sudo systemctl restart wazuh-dashboard
```

"AI Assistant" then appears in the left nav. An **administrator** must configure at least one
provider under its Settings tab before the Chat tab is usable.

## Security posture

The full security model is documented in `docs/ref/modules/ai-assistant/security.md` (repo root).

- **Every** Indexer and Manager query runs as `asCurrentUser` — the plugin has no service-account
  or elevated path, so a user can never read data their own RBAC forbids. This is the boundary the
  whole design rests on.
- **No mutating tools** and no code-execution sink; the worst an injected instruction (e.g. text
  smuggled in through an ingested alert) can achieve is another read the user could already do.
- **Provider management is admin-gated** (create/update/set-default/delete/test). `GET /providers`
  stays readable because the Chat tab needs the list; it never returns a key.
- **SSRF guard** (`server/providers/url-guard.ts`) on every outbound provider fetch: http(s) only,
  cloud-metadata / link-local ranges blocked (including IPv4-mapped IPv6 and DNS names that
  _resolve_ into them), redirects disabled. Loopback/RFC1918 stay reachable on purpose — that is
  where self-hosted gateways live.
- **API keys** are never returned by any route (only a `hasApiKey` boolean), never logged, and
  redacted from upstream error echoes. Encryption at rest is opt-in; `enc:v2` binds the ciphertext
  to its saved object via AES-GCM AAD so a blob cannot be moved between providers. See
  `docs/ENCRYPTION.md` — prefer the OSD keystore for the key.
- **Concurrency cap**: 5 in-flight chat streams per user, 30 server-wide, and per-provider stall
  timeouts (30 s to first byte, 120 s idle).

## What leaves the cluster

Answering a question sends the user's prompt plus a capped tool-result digest to the **configured
third-party provider**. That digest can include hostnames, source/destination IPs, usernames,
process command lines and rule/alert text — and, via the escape hatch, any field the model selects.
Pseudonymisation mitigates this and is **off by default** (the primary deployment target is a
self-hosted gateway). The Settings page names the field categories involved and the chat header
carries a privacy on/off badge.

## Limits enforced server-side

| Limit                            | Value                                                  |
| -------------------------------- | ------------------------------------------------------ |
| Time window per query            | bounded both sides, ≤ 90 days                          |
| Result rows per query            | 500 (`size` clamped)                                   |
| Aggregation buckets / `top_hits` | 100; ≤ 5 top-level aggregations                        |
| Digest sent to the model         | 6 000 chars, 5 sample rows                             |
| Table rendered to the user       | 500 rows                                               |
| Tool rounds per turn             | 3                                                      |
| Concurrent streams               | 5 per user, 30 global                                  |
| Conversations per user           | 500 (title 200 chars, message 100 000, 1 000 messages) |

## Testing

Unit tests run under Jest via the platform runner (`yarn test:jest`, same as the sibling
plugins), colocated as `*.test.ts` beside the modules they test (`common/`, `server/`). The rest
of `eval/` is a zero-dependency harness (see `eval/README.md` for full usage):

| Suite                | What it covers                                                      |
| -------------------- | ------------------------------------------------------------------- |
| `run_lint.js`        | guardrail bypass corpus (adversarial DSL cases)                     |
| `run_plumbing.js`    | full chat route against a scripted zero-token mock provider         |
| `run_persistence.js` | conversation saved-object CRUD + owner scoping                      |
| `run_live.js`        | live measurement set against a real provider                        |
| `run_load.js`        | concurrency/footprint load driver (stream/tool/mixed/429 modes)     |
| `browser_probe.mjs`  | headless-Chrome checks: per-tab heap, stream cap, stored-XSS render |

## Dev notes

- **Zero npm runtime dependencies** — everything comes from the host `wazuh-dashboard` bundle;
  only devDependencies (TypeScript, ESLint, Prettier) are declared, and no lifecycle scripts.
- Import UI components only from `@elastic/eui`, never `@opensearch-project/oui` directly.
- The chat route streams SSE; the browser client uses `window.fetch` with a manual
  `ReadableStream` reader — not `core.http.post` (buffers the whole response) and not
  `EventSource` (cannot send a POST body).
- The three saved-object types are `hidden: true`, so they are invisible to the generic
  saved-objects API — which also means they are **not** captured by the Saved Objects export UI;
  back them up at the index/snapshot level.
