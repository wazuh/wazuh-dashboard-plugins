# Tool catalog

The assistant answers questions exclusively through a fixed catalog of **29 read-only tools**.
There are **no mutating tools**: every tool is read-tier, and there is no code-execution sink.
The worst an injected instruction (for example, text smuggled in through an ingested alert) can
achieve is another read the requesting user could already perform.

## How tools are defined

Each tool is a **declarative object** — `{ name, description, paramsSchema, target, template,
digestSpec, tableSpec }` — one file per tool under
`plugins/wazuh-ai-assistant/server/tools/catalog/`, loaded by an in-process registry
(`server/tools/registry.ts`) at plugin start. This is plain bundled data: no extra process, no
network hop, no MCP server. Because the catalog is declarative, exposing it outward (for
example, as an MCP server for external agents) remains a possible future option without
rearchitecting.

Key properties:

- **Typed parameters** with enums and clamps (`agent_identifier`, `severity` +
  `severity_comparison`, `time_range {gte, lte}` date-math, `limit` ≤ 500).
- **The tool definition shapes the result table, never the model** — each tool's `tableSpec`
  declares the columns; the executor maps hits through the declared field paths. Rendering is
  deterministic across providers.
- **Digest spec** — what the model is allowed to see: counts, per-intent aggregates, and at most
  5 whitelisted sample rows, serialized under a 6,000-character hard cap.

## The 29 tools

| Category                 | Tools                                                                                                                                                                                                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Agents                   | `get_active_agents`, `get_disconnected_agents`                                                                                                                                                                                                                                       |
| Alerts                   | `get_critical_alerts`, `get_alerts_by_time`, `get_top_rules`, `get_security_summary`, `get_brute_force`, `get_suspicious_powershell`, `search_alerts_by_agent`, `search_alerts_by_multiple_agents`, `search_alerts_by_os`, `search_alerts_by_rule_group`, `search_alerts_by_rule_id` |
| Vulnerabilities          | `get_vulnerabilities`, `get_critical_vulnerabilities`, `get_vulnerabilities_by_agent`, `get_vulnerability_by_cve`                                                                                                                                                                    |
| FIM                      | `get_fim_files`                                                                                                                                                                                                                                                                      |
| SCA                      | `get_sca_results`, `get_sca_checks`                                                                                                                                                                                                                                                  |
| MITRE ATT&CK             | `get_mitre_alerts`, `get_mitre_summary`                                                                                                                                                                                                                                              |
| Inventory (syscollector) | `get_agent_os`, `get_agent_packages`, `get_agent_ports`, `get_agent_processes`                                                                                                                                                                                                       |
| Compliance               | `get_pci_dss_alerts`, `get_pci_dss_summary`                                                                                                                                                                                                                                          |
| Free search              | `search_wazuh_data` (the escape hatch)                                                                                                                                                                                                                                               |

On Wazuh 5.0 the tools read from the 5.0 data layer: the `wazuh-events-v5-*` event indices,
`wazuh-findings-v5-*`, and the `wazuh-states-*` state indices (vulnerabilities, FIM, SCA,
inventory). Each tool's module in `server/tools/catalog/` documents which index or Server API endpoint
it queries on 5.0 and why.

## The escape hatch

`search_wazuh_data(index_pattern, dsl)` covers the long tail of questions no typed tool matches.
It is deliberately narrow:

- `index_pattern` must match the allowlist: `wazuh-events-v5-*`, `wazuh-findings-v5-*`,
  `wazuh-states-*`. Read-only `_search`/`_count` only.
- The model-proposed DSL goes through the **full guardrail lint** (below). A rejected query
  returns the reason to the model for one bounded self-correction.

## The two-stage router

Tool-selection accuracy degrades once a model faces roughly 15–20 tools, and small local models
prefer 3–5. The router (`server/tools/router.ts`) therefore never exposes the full catalog in a
single call:

1. **Stage 1 — route**: one cheap call with a single synthetic `route_question` tool picks 1–2
   categories from a ten-entry menu (`agents`, `alerts`, `vulnerabilities`, `fim`, `sca`,
   `mitre`, `inventory`, `compliance`, `free_search`, `general`).
2. **Stage 2 — act**: the model is re-invoked with only the routed categories' tools. The escape
   hatch stays reachable when routed to `free_search`; `general` answers without touching Wazuh
   data at all.

The router is a **token-cost optimization, not an access control**: every tool remains equally
authorized, and the real permission check is the user's own RBAC applied to every query. Every
registry tool must belong to exactly one category — the plugin fails fast at startup if a tool is
left unrouted.

## Guardrails

Every Indexer query — from typed tools and the escape hatch alike — passes through
`server/tools/guardrails.ts` before execution. OpenSearch cluster defaults are permissive
(no default timeout, expensive queries allowed), so the plugin enforces everything itself.

Values injected on every `_search`, overriding whatever the model proposed:

| Valve              | Value                                                |
| ------------------ | ---------------------------------------------------- |
| `timeout`          | `10s`                                                |
| `size`             | clamped ≤ 500                                        |
| `track_total_hits` | bounded at 10,000 (exact counts go through `_count`) |
| `from`             | rejected above 1,000 (no LLM-driven deep pagination) |

Static DSL lint (recursive tree walk; rejection reason returned to the model for one bounded
retry):

- `script` anywhere (query, sort, aggs, `script_fields`, `runtime_mappings`) — hard block.
- `regexp` blocked; `wildcard`/`query_string` values with leading `*`/`?` blocked.
- Date `range` on time fields must be bounded on both sides; span ≤ 90 days.
- A numeric `range` against a keyword-typed severity field (currently `wazuh.rule.level`,
  whose values are categorical severity words such as `critical`/`high`/`medium`/`low`) is
  rejected outright: OpenSearch does not error on a numeric range against a keyword field, it
  just silently matches nothing, which would look like a legitimate empty result to the model.
- Bucket aggregations only on a vetted low-cardinality field allowlist; bucket `size` ≤ 100;
  at most 5 top-level aggregations.
- Index pattern checked against the allowlist before anything else.

## Digest and privacy layers

After execution, the result goes through two more layers before reaching any model:

- **Digest** (`server/tools/digest.ts`): counts, aggregates, and ≤ 5 sample rows restricted to
  each tool's whitelisted columns — never `full_log` unless log inspection is the tool's purpose.
  The full result goes only to the browser.
- **Privacy** (`server/tools/privacy.ts`): when privacy mode is on, sensitive values are replaced
  with reversible, conversation-consistent pseudonyms (`HOST_1`, `IP_2`…) at the digest boundary —
  the single choke point through which data reaches a model — including aggregation bucket keys.
  The rendered answer is de-pseudonymized locally in the browser. The per-field policy
  (Allow / Anonymize / Never-send) is admin-editable in Settings; Never-send-class fields are
  stripped from the digest even with privacy mode off.
