# Architecture

The AI Assistant is a standard OpenSearch Dashboards plugin with a browser side and a server
side. All intelligence-related work — provider calls, tool execution, guardrails, privacy
filtering — happens **server-side**; the browser only renders streams and tables.

```
plugins/wazuh-ai-assistant/
  common/            Shared contract: chat/stream event types, constants, pure helpers
  public/            React 18 app (EUI/OUI): chat UI, settings UI, SSE client
  server/            Routes, orchestration loop, tool registry, providers, crypto
  eval/              Test and measurement harness (unit tests run under Jest)
  docs/              In-depth design and review records (see below)
```

The plugin has **zero npm runtime dependencies**: everything comes from the host
`wazuh-dashboard` bundle, and only devDependencies (TypeScript, ESLint, Prettier) are declared.

## Request lifecycle of a chat turn

1. The browser POSTs the conversation to `/api/wazuh_ai_assistant/chat` and reads the response as
   an SSE stream (`window.fetch` + a manual `ReadableStream` reader — not `EventSource`, which
   cannot send a POST body, and not `core.http.post`, which buffers the whole response).
2. The chat route runs the **orchestration loop** (`server/routes/chat.ts`):
   1. **Stage 1 — route**: one cheap model call with a single synthetic `route_question` tool
      picks 1–2 categories (agents, findings, vulnerabilities, fim, sca, mitre, inventory,
      compliance, security_analytics, free_search, general) from a compact menu.
   2. **Stage 2 — act**: the model is re-invoked with the routed categories' typed tools, plus any
      chained detail tools (`router.ts`'s `CHAIN_PAIRS`, expanded to a fixed point) and the two
      always-on tools `search_wazuh_data` and `get_field_values` — a handful of schemas instead of
      all 35, keeping every provider in its reliable tool-count range and cutting token overhead.
   3. When the model emits a `tool_call`, the server **lints and clamps** the query
      (guardrails), executes it locally — Indexer via
      `context.core.opensearch.client.asCurrentUser`, Manager API via
      `context.wazuh_core.api.client.asCurrentUser` — and builds a **digest** for the model plus
      a `table` stream event with the full local result for the browser.
   4. The loop is bounded: at most **6 tool rounds per turn** (`MAX_TOOL_ROUNDS`,
      `server/routes/chat.ts:182`), then the final answer streams as text deltas.
3. The browser renders the streamed text, the result table (severity badges, pagination, an
   **Open in Discover** deep link when results are truncated), and de-pseudonymizes the answer
   locally if privacy mode was active.

## Streaming contract

`common/types.ts` defines a discriminated-union `StreamEvent` contract shared by both sides:
text deltas, assembled `tool_call` events (the browser never sees partial tool JSON), `table`
events carrying the tool's `tableSpec`-shaped result, and terminal status/error events. Provider
adapters translate their wire formats into this one contract, so the UI is provider-agnostic.

## Storage

The plugin registers **no saved-object types**. Everything is stored through the Wazuh indexer's
own APIs instead:

| Contents                                                                                                      | Backend                                                                           | Scope                  |
| ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------- |
| Provider records: name, type, base URL, model, `apiKey` (optionally encrypted, see [Security](./security.md)) | `/_plugins/_setup/ai_assistant/providers`                                         | Global (admin-managed) |
| Privacy defaults per provider, user-override flag, field policy                                               | `/_plugins/_setup/ai_assistant/settings`                                          | Global (admin-managed) |
| Conversations: title, owner, and messages with their timestamps, result tables and tool calls                 | `wazuh-ai-assistant-sessions` index, via `/_plugins/_setup/ai_assistant/sessions` | Owner-scoped           |

Conversation retention is a separate ISM policy, `ai-assistant-sessions-policy` (7-day default),
that manages the `wazuh-ai-assistant-sessions` backing indices rather than the settings API above.

Conversation routes never leak cross-owner existence (`404` instead of `403`), list responses
return summaries only (never `messages`), and writes use optimistic concurrency.

Which conversation the browser has open is held outside React state — in the URL hash
(`#/conversation/<id>`, shareable) and in a per-tab `sessionStorage` pointer — so a reload, a deep
link or a trip through another dashboard app returns to it. A turn is saved twice: once when the
question is sent, so an interrupted answer never loses the question, and once when the answer ends.
A turn that ends without completing is stored as interrupted and can be retried.

Anything that would interrupt a running answer asks first, through one dialog: the platform's
`overlays.openConfirm`. Leaving the app entirely (another dashboard app, a reload, closing the tab)
reaches it through the `onAppLeave` hook registered in `public/application.tsx`; opening another
conversation or starting a new one calls it directly. Both use the same copy and no styling
overrides (`public/services/interrupt-confirm.ts`), since `onAppLeave` cannot carry button labels or
a color and a plugin-side modal could not be made to match it.
Switching to the Settings tab deliberately prompts nothing — the Chat tab stays mounted and the
answer keeps streaming into it.

## Integration with wazuh-core

The plugin declares `wazuhCore` in `requiredPlugins` and uses the two sanctioned mechanisms the
official `main` and `wazuh-check-updates` plugins use:

- **Route context**: `context.wazuh_core.api.client.asCurrentUser.request(method, path, data,
{ apiHostID })` for Manager API calls — this rides the JWT from the `wz-token` cookie set by
  the main plugin's login flow, so there is no parallel auth path.
- **Plugin contract**: `plugins.wazuhCore` at setup/start for non-request code (host registry,
  `dashboardSecurity.isAdministratorUser` for the Manager-session liveness probe behind
  `GET /settings/access`, see [Security](./security.md)).

Every Indexer and Manager call runs **`asCurrentUser`** — the user's own RBAC is the real
enforcement boundary; the plugin adds no privileged path (see [Security](./security.md)).

## Server-side limits

| Limit                            | Value                                                        |
| -------------------------------- | ------------------------------------------------------------ |
| Time window per query            | bounded on both sides, ≤ 90 days                             |
| Result rows per query            | 500 (`size` clamped)                                         |
| Aggregation buckets / `top_hits` | 100; ≤ 5 top-level aggregations                              |
| Digest sent to the model         | 6,000 chars, ≤ 5 sample rows                                 |
| Table rendered to the user       | 500 rows                                                     |
| Tool rounds per turn             | 6                                                            |
| Concurrent chat streams          | 5 per user, 30 server-wide                                   |
| Provider stall timeouts          | 30 s to first byte, 120 s idle                               |
| Conversations per user           | 500 (title 200 chars, message 100,000 chars, 1,000 messages) |
| Saved conversation payload       | 700 KB serialized, 100 rows per persisted table              |

## Developer documentation

The plugin folder ships two maintainer documents:

- `plugins/wazuh-ai-assistant/docs/ENCRYPTION.md` — the API-key encryption-at-rest format.
- `plugins/wazuh-ai-assistant/docs/CI.md` — the test gates and how to run the eval harness.
