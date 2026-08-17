# Providers

A **provider** is a configured AI endpoint the assistant talks to. Providers are managed in
**AI Assistant → Settings → Providers** — authorized by the Wazuh indexer's own RBAC on the
calling user (see
[Security](./security.md#settings-and-providers-authorized-by-indexer-rbac)). Multiple providers can coexist; one is marked as the
default, and the chat header lets the user pick among the configured ones.

Providers are used **purely as transport**: they decide which tool to call and phrase the final
answer, but every query executes locally in the plugin server and only the bounded digest ever
reaches the provider (see [Tool catalog](./tool-catalog.md)).

Configuring a provider asks for two close-to-free-text choices: a **provider type** and a
**model name**. A wrong choice can cause problems. A model that cannot call tools does not fail visibly: it invents an answer with fake data instead
of an error. A model or provider that rejects something the assistant always sends ends the turn
with no answer at all. Either way, the chat window gives no hint of whether the provider or the
model is the cause — which is why the rest of this page states plainly which providers and models
are **verified working**, which are **verified not working** (and why), and which are **expected
to work but have not been verified yet**. If anything here ever disagrees with the guidance shown
directly in the Settings form — a base URL, a key format, or a model name — trust the Settings
form; it reflects the current behavior and this page should be corrected to match it.

## Adapter types

All adapters translate to and from one canonical
internal tool-calling contract — no provider wire format leaks past the adapter boundary. The following provider types can be selected:

| Adapter               | Works with                                                                                               | Base URL                                                                                                                                                                                    | Notes                                                                                        |
| --------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **OpenAI-compatible** | OpenAI, Gemini, an AWS Bedrock gateway, Ollama, vLLM, LiteLLM, and any `/chat/completions`-style gateway | That service's own API root, for example `https://api.openai.com/v1`, `https://generativelanguage.googleapis.com/v1beta/openai`, or `http://localhost:11434/v1` for a local Ollama install. | `tools` + `tool_choice`, index-based streaming deltas, `parallel_tool_calls: false`.         |
| **Anthropic**         | Anthropic's own API (Claude models)                                                                      | `https://api.anthropic.com` or compatible API                                                                                                                                               | `tool_use` content blocks + `input_json_delta` streaming, `disable_parallel_tool_use: true`. |

A model with weak function-calling support is handled, not worked around. When a provider rejects
the model's own malformed tool call (the OpenAI-compatible `tool_use_failed` shape),
`server/providers/retry.ts` retries once and then ends the turn with a message naming the likely
cause — the model, not the query — and pointing at the Model field's guidance in Settings. The
plugin does not fall back to asking a tool-less model for JSON in the prompt: an unvalidated
free-text query against the Indexer is exactly what the guardrails exist to prevent.

## Verification status

This section indicates which providers and models are **verified
working**, which are **verified NOT working** (and why), and which are **expected to work but
have not been verified yet**.

### Verified supported

| Provider type     | Service                                    | Model(s)                                                                                                              | Notes                                                                                                                      |
| ----------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Anthropic         | Anthropic's own API                        | The current Claude model family (Opus, Sonnet, Haiku, Fable)                                                          | Recommended: **`claude-haiku-4-5`** for the fastest responses, **`claude-opus-4-8`** as the balanced default.              |
| OpenAI-compatible | AWS Bedrock chat gateway                   | `openai.gpt-oss-120b`, `mistral.mistral-large-3-675b-instruct`, `qwen.qwen3-32b`, `qwen3-coder-480b`, `deepseek.v3.2` | Model names use the gateway's own vendor-prefixed naming — see [model-name gotchas](#per-vendor-model-name-gotchas) below. |
| OpenAI-compatible | Google Gemini (OpenAI-compatible endpoint) | `gemini-flash-latest`, `gemini-3-flash-preview`                                                                       | Works, with two gotchas — see [model-name gotchas](#per-vendor-model-name-gotchas) below.                                  |

### Verified NOT supported

| Combination                                                                          | Why it fails                                                                                                                                                   | What the administrator sees                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Claude models through an OpenAI-compatible gateway                                   | An OpenAI-compatible provider cannot speak the protocol a Claude model expects. Impossible, not degraded.                                                      | The turn fails or the model behaves unpredictably. The only fix is a provider with type Anthropic (Claude), pointed at `https://api.anthropic.com`.                                                                                                           |
| Groq (any model, typical account tier)                                               | The assistant's tool definitions are rejected outright on typical Groq account tiers — a Groq-side limit, not something an administrator can configure around. | Chat turns fail outright; the Test button may still pass.                                                                                                                                                                                                     |
| Models without reliable tool calling (confirmed with `gemma-3-27b` and `qwen3-235b`) | The model cannot call the tools the assistant uses to fetch real Wazuh data.                                                                                   | **No error at all.** The model answers fluently but **fabricates security data** — invented alerts, agents, and numbers. This is the most important failure mode on this page: see [Tool calling is a hard requirement](#tool-calling-is-a-hard-requirement). |
| OpenRouter free tier                                                                 | Too slow for real use — 2-3 minutes per answer.                                                                                                                | Answers eventually arrive, but with an unusable delay.                                                                                                                                                                                                        |
| OpenRouter paid models                                                               | Need a funded account with credits.                                                                                                                            | Requests fail until the account holds credits.                                                                                                                                                                                                                |

### Expected to work, not yet verified

These share a service type already verified above, but were not tested during this pass (no key
or endpoint was available at test time). **"Expected to work" is not the same claim as
"verified."**

| Combination                                         | Status               | Notes                                                                                               |
| --------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------- |
| OpenAI's own API (`gpt-5.x`, `gpt-4o`, and similar) | Expected, unverified | **Top priority to verify next** — one of the providers administrators are most likely to try first. |
| Llama 3.3/4 through an OpenAI-compatible host       | Expected, unverified | Shares the same protocol as every other OpenAI-compatible service.                                  |
| Self-hosted Ollama                                  | Expected, unverified | Base URL pattern: `http://<host>:11434/v1`.                                                         |

## Provider type must match the service

The provider type decides which protocol is used and this should match with the service URL. Some AI services can expose OpenAI-compatible or Anthropic-compatible API URL, ensure matching the provider type with the service URL.

Anthropic's own API only works with the Anthropic provider type. Pointing an
OpenAI-compatible provider at a Claude model — for example through a gateway that merely forwards
the model name — does **not** work at all. There is no partial or degraded success here. If a
Claude model is wanted, create a provider with type **Anthropic (Claude)** and base URL
`https://api.anthropic.com`; there is no way to make a Claude model work through the
OpenAI-compatible type.

## A successful Test does not prove the assistant can answer a question

The **Test** button in Settings only proves the assistant can reach the endpoint and get a
response — it sends no Wazuh data and does not exercise tool calling. After configuring a provider,
confirm it works with one real question in the Chat view — not with the Test button alone.

## Tool calling is a hard requirement

The assistant has no direct access to Wazuh data — it reads everything by calling tools behind
the scenes (see [Tool catalog](./tool-catalog.md)). A model without reliable tool calling cannot
answer any question about the environment, and, critically, **it will not say so**. It answers
fluently and confidently using data it invented, because from the model's side a missing tool call
is not a visible failure. Confirmed with `gemma-3-27b` and `qwen3-235b`. Treat any answer from a
newly-configured provider with suspicion until it has been checked against a question whose real
answer is already known.

## The Anthropic output limit is fixed at 4,096 tokens

Every request to an Anthropic provider uses a fixed output limit of 4,096 tokens; this is not
configurable in the UI. For models that reason before answering, this limit is **shared between
the reasoning and the visible answer**, so a long reasoning pass can leave the answer itself cut
short. This is a property of the fixed limit, not a bug in a given model.

## Some Anthropic models reject the temperature setting — this is handled automatically

Some current Anthropic models reject the request's sampling temperature setting outright. The
assistant detects this the first time it happens for a given provider and model, and automatically
retries without it for the rest of that session. **The administrator does not need to do
anything** — this recovery is silent and automatic, and the same handling applies to
OpenAI-compatible gateways that reject the same setting (for example, some Bedrock gateway
models).

## Per-vendor model-name gotchas

- **Gemini**: new Google accounts must use the **alias** model name (`gemini-flash-latest`), not a
  dated model name, or the request fails. Gemini's free tier also caps at **20 requests per day**,
  which is too low for real use — use a paid key.
- **AWS Bedrock gateway**: model names carry the gateway's own vendor-namespace prefix, for
  example `openai.gpt-oss-120b` or `mistral.mistral-large-3-675b-instruct` — copy the prefix
  exactly as shown in the Settings form's model suggestions; it is not optional decoration.
- **OpenRouter**: a model name with a trailing **`:free`** suffix (for example
  `openai/gpt-oss-20b:free`) is a _different, rate-limited_ model from the paid model of the same
  name, not a pricing flag on the same model.

## Account-level settings that must be enabled first

Some providers reject every request until an account-level setting is turned on in that
provider's **own** console — for example an organization data-retention or usage setting — before
the API accepts anything at all, regardless of a correct base URL, model, and key. Check the
provider's own account or organization settings before assuming a failure is a Wazuh
configuration problem.

## Support policy for untested models

A model or provider not covered by the tables above is **use at your own risk**, not officially
unsupported — the assistant works with any service that correctly implements one of the two
supported service types and supports tool calling. To request verification of a specific provider
or model, contact Wazuh support or open an issue in the `wazuh-dashboard-plugins` repository.

## Connection lifecycle

- **Test**: `POST /api/wazuh_ai_assistant/providers/{id}/test` performs a connectivity check
  from the Settings UI without sending any Wazuh data. See
  [above](#a-successful-test-does-not-prove-the-assistant-can-answer-a-question) for why a passing
  Test is not the same as a working provider.
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

## Troubleshooting

| Symptom in the chat window                                                    | Most likely cause                                                                                                       | What to change                                                                                                   |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Confident, fluent answer with no real data (invented alerts, agents, numbers) | The model has no reliable tool calling — see [Tool calling is a hard requirement](#tool-calling-is-a-hard-requirement). | Switch to a model verified above, or one from a family known to support tool calling.                            |
| Turn ends with no answer at all, right after Test passed                      | Test does not exercise tool calling; the model rejected a tool call or a setting mid-turn.                              | Confirm with a real question next time instead of trusting Test alone. Check the model against the tables above. |
| Provider rejects the request outright (an oversized-request error)            | Groq's tool-definition size limit on typical account tiers.                                                             | Groq is not supported for this assistant; pick another OpenAI-compatible service.                                |
| Request fails with a Claude model configured under OpenAI-compatible          | Claude models only work under the Anthropic (Claude) provider type.                                                     | Recreate the provider with type Anthropic (Claude) and base URL `https://api.anthropic.com`.                     |
| Very slow answers (minutes, not seconds)                                      | OpenRouter's free tier, or another provider's own rate limiting.                                                        | Use a paid tier or key, or a different provider.                                                                 |
| Answer is cut off mid-sentence                                                | Anthropic's fixed 4,096-token output limit was consumed by reasoning before the answer.                                 | Not configurable; expect shorter answers from models that reason heavily.                                        |
| Everything looks correctly configured but every request still fails           | An account-level setting on the provider's own side (for example data retention) is not enabled.                        | Check the provider's own account or organization console.                                                        |
