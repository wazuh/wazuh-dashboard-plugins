# Providers

A **provider** is a configured AI endpoint the assistant talks to. Providers are managed in
**AI Assistant → Settings → Providers** — authorized by the Wazuh indexer's own RBAC on the
calling user (see
[Security](./security.md#settings-and-providers-authorized-by-indexer-rbac)) — and stored as
`wazuh-ai-assistant-provider` saved objects. Multiple providers can coexist; one is marked as the
default, and the chat header lets the user pick among the configured ones.

Providers are used **purely as transport**: they decide which tool to call and phrase the final
answer, but every query executes locally in the plugin server and only the bounded digest ever
reaches the provider (see [Tool catalog](./tool-catalog.md)).

## Adapter types

All adapters (`plugins/wazuh-ai-assistant/server/providers/`) translate to and from one canonical
internal tool-calling contract — no provider wire format leaks past the adapter boundary.

| Adapter                             | Works with                                                                     | Notes                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| **OpenAI-compatible**               | OpenAI, Groq, Ollama, vLLM, LiteLLM, and any `/chat/completions`-style gateway | `tools` + `tool_choice`, index-based streaming deltas, `parallel_tool_calls: false`.         |
| **Anthropic**                       | Anthropic Messages API                                                         | `tool_use` content blocks + `input_json_delta` streaming, `disable_parallel_tool_use: true`. |
| **Wazuh AI Assistant hosted brain** | The Wazuh-hosted webhook endpoint                                              | Modeled as "another provider" behind the same adapter seam; non-incremental responses.       |

A model with weak function-calling support is handled, not worked around. When a provider rejects
the model's own malformed tool call (the OpenAI-compatible `tool_use_failed` shape),
`server/providers/retry.ts` retries once and then ends the turn with a message naming the likely
cause — the model, not the query — and pointing at the Model field's guidance in Settings. The
plugin does not fall back to asking a tool-less model for JSON in the prompt: an unvalidated
free-text query against the Indexer is exactly what the guardrails exist to prevent.

## Connection lifecycle

- **Test**: `POST /api/wazuh_ai_assistant/providers/{id}/test` performs a connectivity check
  from the Settings UI without sending any Wazuh data.
- **Retry/stall handling** (`server/providers/retry.ts`): transient upstream errors are retried
  with backoff; streams are abandoned after 30 s without a first byte or 120 s idle, and the
  failure is surfaced in the chat as a clear status event rather than a hang.
- **Error hygiene**: upstream error bodies are sanitized before they reach logs or the browser —
  API keys and `Authorization` headers are redacted wherever they appear.

## Outbound URL guard (SSRF)

Every outbound provider fetch goes through `server/providers/url-guard.ts`:

- `http(s)` schemes only; redirects are disabled.
- Cloud-metadata and link-local ranges are blocked — including IPv4-mapped IPv6 forms and DNS
  names that **resolve** into blocked ranges (the guard is DNS-aware).
- Loopback and RFC 1918 ranges stay reachable **on purpose**: self-hosted gateways (Ollama,
  vLLM, LiteLLM) are the primary deployment target and live on private networks.

Combined with the indexer's own write permission required to manage providers (see
[Security](./security.md#required-indexer-permissions)), this bounds who can point the dashboard
at a new URL and where that URL is allowed to reach.

## API keys

- Keys are **write-only** through the plugin API: every provider response carries only a
  `hasApiKey` boolean. No route, log line, or upstream error echo ever contains the key.
- Keys can be **encrypted at rest** (AES-256-GCM, opt-in) — see
  [Security](./security.md#api-key-encryption-at-rest).
