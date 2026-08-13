# AI Assistant

The **Wazuh AI Assistant** module adds a provider-agnostic AI chat experience to the Wazuh
dashboard. An analyst asks a security question in plain language (English or Spanish), the
assistant turns it into **read-only** queries against the Wazuh Indexer and the Wazuh Server API,
and streams back a short grounded answer together with the real result table.

The module is delivered by its own plugin, `wazuh-ai-assistant` (plugin id `wazuhAiAssistant`),
and appears in the left navigation as **AI Assistant** under the **Wazuh** category.

This module exposes the following views:

- **Chat** — The conversation view: a message thread with SSE-streamed answers, per-turn result
  tables with an **Open in Discover** deep link, a conversation list with persistent history, and
  a privacy on/off badge in the header.
- **Settings** — Configuration split into three sections: **Providers** (CRUD + connection test
  for the AI providers), **Privacy** (pseudonymization defaults and the per-field policy), and
  **Conversation history**. Authorized by the Wazuh indexer's own RBAC on the calling user.

## How it fits together

| Area                 | Role in the AI Assistant                                                                                                                                                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Wazuh Indexer**    | Queried server-side through `context.core.opensearch.client.asCurrentUser` — every query runs with the requesting user's own permissions, never a service account.                                                                  |
| **Wazuh Server API** | Reached through the `wazuh-core` plugin's request context (`context.wazuh_core.api.client.asCurrentUser`), riding the existing dashboard session.                                                                                   |
| **AI provider**      | A configurable external endpoint (OpenAI-compatible, Anthropic, or the Wazuh-hosted brain) used purely as a transport: it decides _which_ tool to call; the plugin executes the query locally and sends back only a bounded digest. |
| **Discover**         | Truncated result tables link out to Discover with the same index pattern, time range, and filters rebuilt from the tool's typed parameters.                                                                                         |

The design principle behind every data path: **data never leaves the cluster in bulk**. Queries
execute locally in the plugin server; the model receives a capped digest (aggregates plus at most
five whitelisted sample rows); the full result renders locally as a table in the browser.

## Reference pages

- [Architecture](./architecture.md) — client/server split, the SSE chat pipeline, saved objects,
  and the wazuh-core integration points.
- [Tool catalog](./tool-catalog.md) — the 32 read-only tools, the in-process registry, and the
  two-stage router.
- [Providers](./providers.md) — the three provider adapters, retry/stall handling, and the SSRF
  guard on outbound traffic.
- [Security](./security.md) — the RBAC boundary, required indexer permissions for settings and
  providers, API-key encryption at rest, guardrails, and what leaves the cluster.
- [Configuration](./configuration.md) — dashboard configuration keys and the Settings UI.

---

## Concepts

### Conversations

Chat history is persisted as **owner-scoped saved objects** (`wazuh-ai-assistant-conversation`).
Each user only ever sees their own conversations; a request for another owner's conversation
returns `404` (never `403`), so cross-owner existence is not leaked. Updates use optimistic
concurrency so two tabs cannot silently overwrite each other.

### Providers

A **provider** is a configured AI endpoint (base URL, model, optional API key). Three adapter
types are supported; all of them speak one canonical internal tool-calling contract, so switching
providers never changes plugin behavior — a better model answers better, a weaker model still
answers correctly. Provider management is authorized by the Wazuh indexer's own RBAC on the
calling user; API keys are write-only through the API (`hasApiKey` boolean out, never the key)
and can be encrypted at rest.

### Tools, digests, and tables

The assistant cannot run free-form actions. It picks from a fixed catalog of 32 **read-only,
declarative tools** (plus a guarded free-search escape hatch limited to `wazuh-events-v5-*`,
`wazuh-findings-v5-*`, and `wazuh-states-*` indices). Every query is linted and clamped by
server-side guardrails before execution. The model sees a **digest** capped at 6,000 characters;
the user sees the **full table** (up to 500 rows) rendered from the tool's own `tableSpec` — the
table shape is deterministic and never controlled by the model.

### Privacy mode

An optional pseudonymization layer, configured in Settings, replaces sensitive values (hostnames,
IPs, usernames…) with consistent placeholders (`HOST_1`, `IP_2`…) before anything reaches the
provider, and restores the real values locally in the rendered answer. Whoever configures
Settings sets the default per provider and decides whether users may override it per
conversation; a badge in the
chat header always shows the current state. It is **off by default** — the primary deployment
target is a self-hosted gateway.
