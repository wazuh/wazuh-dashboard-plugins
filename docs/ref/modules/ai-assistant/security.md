# Security

This page describes the plugin's security model and the boundaries it relies on.

## The load-bearing boundary: the user's own RBAC

**Every** Indexer and Manager API query runs as the requesting dashboard user
(`asCurrentUser`) — the plugin has no service-account or privilege-elevation path. A user can
never read data through the assistant that their own Wazuh RBAC forbids. Everything else
(guardrails, digests, privacy) is defense-in-depth on top of that boundary, not a substitute
for it.

## Read-only by construction

All 32 tools are read-only and there is no code-execution sink. Indirect prompt injection —
attacker-controlled text arriving through an ingested alert and being interpreted by the model —
is bounded by the same fact: the worst it can trigger is another read the user was already
allowed to perform. Answers are rendered through EUI's markdown component with raw HTML disabled
(verified against stored-XSS probes).

## Settings and providers: authorized by indexer RBAC

Provider management (`POST/PUT/DELETE /providers`, set-default, connection test) and settings
writes run as the calling user (`asCurrentUser`) against the Wazuh indexer's own
`/_plugins/_setup/ai_assistant/...` endpoints — the indexer's own
`plugin:wazuh/ai_assistant/settings/{read,write}` permissions on that identity's backend role are
what authorize each request (see [Required indexer permissions](#required-indexer-permissions)
below). `GET /providers` stays readable by any authenticated user regardless, because the Chat
view needs the provider list — it never returns a key, only `hasApiKey`.

## Required indexer permissions

The RBAC boundary above is enforced by the calling user's own indexer backend role, not by this
plugin — the tables below are a practical breakdown of which permissions a role needs for each use
case, cross-referenced against the current storage backend: the
`wazuh-ai-assistant-sessions` conversation data stream, the indexer's own settings/providers API
(`/_plugins/_setup/ai_assistant/...`), and the `ai-assistant-sessions-policy` ISM policy that backs
conversation retention. The `cluster:admin/opendistro/ism/...` and
`indices:admin/opensearch/ism/...` action names belong to the indexer's own ISM plugin — they
aren't defined in this repo but are required all the same.

### Minimal access to the dashboard

| Permission                 | Type    | Why                                                                                                                      |
| -------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| `cluster_composite_ops_ro` | Cluster | Baseline read access every user's backend role needs against the indexer before reaching any app, AI Assistant included. |

### AI chat

Chat reads run `asCurrentUser`, never a privileged internal identity, so every permission below is
checked against the chatting user's own backend role, not just an admin's.

| Permission                                                                                                                                                                                                                                        | Type    | Why                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Index `read` (dls: `{"term": {"user": "${user.name}"}}`) + `write` (dsl: `{"term": {"user": "${user.name}"}}`) on `wazuh-ai-assistant-sessions*`, `.ds-wazuh-ai-assistant-sessions-*` — or a bundled `wazuh_ai_assistant` role providing the same | Index   | Persist and retrieve the caller's own conversation turns. Enforced twice: indexer document-level security (a `{"term": {"user": "${user.name}"}}` filter on the role) **and** an application-level `user` filter on every query — defense in depth, not either/or. |
| `plugin:wazuh/ai_assistant/settings/read`                                                                                                                                                                                                         | Cluster | Resolve the default provider and privacy settings needed to start or continue a turn (`GET /_plugins/_setup/ai_assistant/settings`).                                                                                                                               |
| `cluster:admin/opendistro/ism/policy/get`                                                                                                                                                                                                         | Cluster | Read the `ai-assistant-sessions-policy` ISM policy — extract the value for `conversationsRetentionDays` setting                                                                                                                                                    |

### Manage settings (providers, privacy, conversation history)

Settings and providers live in two backends: the indexer's settings API, and the
`ai-assistant-sessions-policy` ISM policy (conversation retention only).

| Permission                                                                                                         | Type    | Why                                                                                     |
| ------------------------------------------------------------------------------------------------------------------ | ------- | --------------------------------------------------------------------------------------- |
| `plugin:wazuh/ai_assistant/settings/read`                                                                          | Cluster | Read providers and settings (`GET /_plugins/_setup/ai_assistant/{settings,providers}`). |
| `plugin:wazuh/ai_assistant/settings/write`                                                                         | Cluster | Create, update, or delete providers, and write settings, on the same endpoints.         |
| `cluster:admin/opendistro/ism/policy/get`                                                                          | Cluster | Read `ai-assistant-sessions-policy` to display the current retention window.            |
| `cluster:admin/opendistro/ism/policy/write`, `cluster:admin/opendistro/ism/managedindex/change`                    | Cluster | Edit `ai-assistant-sessions-policy` when an user changes the retention window.          |
| `indices:admin/opensearch/ism/managedindex` on `wazuh-ai-assistant-sessions*`, `.ds-wazuh-ai-assistant-sessions-*` | Index   | Re-apply the edited policy to the sessions data stream's backing indices.               |

The Settings UI's save controls are always interactive for any authenticated user; the indexer's
own permission check on the calling user's backend role is what makes each write actually succeed
or fail.

## SSRF guard on outbound provider traffic

Described in [Providers](./providers.md#outbound-url-guard-ssrf): scheme restrictions, blocked
metadata/link-local ranges (DNS-aware, IPv4-mapped-IPv6-aware), no redirects. Private ranges stay
reachable deliberately — that is where self-hosted gateways live.

## API-key encryption at rest

Provider API keys can be encrypted with **AES-256-GCM** using a key supplied through the
dashboard configuration (`wazuh_ai_assistant.encryptionKey`; prefer the OpenSearch Dashboards
keystore). The implementation is Node's builtin `crypto` only — no new dependency.

- The format, `enc:v1:`, binds each ciphertext to its own saved object via GCM
  **Additional Authenticated Data** (`wazuh-ai-assistant-provider:<saved object id>:apiKey`).
  Copying an encrypted blob into another provider's field — via saved-objects import, restore,
  or any write path that bypasses the plugin — fails decryption hard instead of silently handing
  the wrong provider a working key.
- Unset by default, but required to save API keys: without a key configured, provider writes
  carrying an API key are rejected (a startup warning is also logged). Plaintext keys are never
  supported or managed: a value stored by an earlier pre-release build fails decryption and must
  be re-entered — editing a provider that still holds one is refused until then.
- There is no key-rotation scheme: changing the key makes previously encrypted values
  undecryptable, surfaced as a clear error; recovery is re-entering the affected keys.

Full format and threat-model details: `plugins/wazuh-ai-assistant/docs/ENCRYPTION.md`.

## Resource protection

- **Concurrency caps**: 5 in-flight chat streams per user, 30 server-wide.
- **Stall timeouts** per provider call: 30 s to first byte, 120 s idle.
- **Query guardrails** on every Indexer query (see
  [Tool catalog](./tool-catalog.md#guardrails)): injected timeout, size clamps, bounded time
  windows, aggregation caps, script/regexp/leading-wildcard blocks, index-pattern allowlist.
- **Storage caps**: 500 conversations per user; title/message/count limits prevent unbounded
  saved-object growth.

## What leaves the cluster

Answering a question sends the user's prompt plus a capped tool-result digest to the configured
provider. That digest can include hostnames, source/destination IPs, usernames, process command
lines, and rule/alert text — and, through the escape hatch, any field the model selects within
the allowlisted indices. Mitigations, in order of strength:

1. **Self-hosted gateway** (Ollama/vLLM/LiteLLM on your own network) — nothing leaves your
   infrastructure. This is the primary deployment target.
2. **Privacy mode** — reversible pseudonymization of sensitive values before they reach the
   provider, admin-defaulted per provider, per-field policy editable in Settings. Off by
   default.
3. **Never-send fields** — stripped from digests unconditionally, even with privacy mode off.

The Settings page names the field categories involved, and the chat header always carries a
privacy on/off badge.

## Conversation isolation

Conversations are owner-scoped: list endpoints return only the caller's summaries, and requests
for another owner's conversation return `404` — existence is never leaked across owners. The
saved-object types are `hidden: true`, invisible to the generic saved-objects API and export UI.

A saved conversation stores what the user actually saw, so that resuming one restores the same
conversation rather than a summary of it: the prose turns, their timestamps, the result tables
(row-capped) and the model's own tool calls with their arguments and result digests. All of that is
real-valued — pseudonymization protects what goes to the PROVIDER, never what is stored locally —
which is why owner-scoping above and the retention policy in
[Configuration](./configuration.md) both exist. The client-held pseudonym map itself is never
persisted anywhere.
