# Home Overview — request-reduction analysis

Goal: minimize the total number of backend requests the Home Overview issues,
re-sourcing or replacing widgets where it helps, without losing value. All
numbers below were **verified live** against the running indexer (`:9200`) and
OSD server (`:5601`) on the sample dataset.

**Headline finding:** almost every saving comes from **re-sourcing widgets onto
a shared/consolidated query — the visualizations don't need to change and no
value is lost.** Only the IT-hygiene consolidation carries a real trade-off.

---

## Current request inventory (full scroll = 18)

| # | Hook | Index / endpoint | Section | Timing |
|---|---|---|---|---|
| 1 | `useFindingsOverview` (batch of 6 aggs) | findings, 24h | Overview + Threat Hunting (shared) | **mount** |
| 2 | `useAgentStatus` | Wazuh server API `/agents/summary/status` | Overview | **mount** |
| 3 | `useTopOperatingSystems` | inventory-system (terms) | Overview inv. row | lazy |
| 4 | `useTopNetworkServices` | inventory-ports (terms) | Overview inv. row | lazy |
| 5 | `useSCAOverview` | states-sca | Endpoint | lazy |
| 6 | `useFIMOverview` | fim-files | Endpoint | lazy |
| 7 | `useMalwareOverview` | findings + enrichments-exists, 24h | Endpoint | lazy |
| 8 | `useVulnerabilityOverview` | vulnerabilities (severity+byOS) | Threat Hunting | lazy |
| 9 | `useRulesCount` | SA `rules/_search` (HTTP) | Threat Intel Feed | lazy |
| 10 | `useDecodersCount` | SA `decoders/_search` (HTTP) | Threat Intel Feed | lazy |
| 11 | `useIntegrationsCount` | SA `integrations/_search` (HTTP) | Threat Intel Feed | lazy |
| 12 | `useDetectorsCount` | SA `detectors/_search` (HTTP) | Threat Intel Feed | lazy |
| 13 | `useCvesMatchedCount` | vulnerabilities (cardinality) | Threat Intel Feed | lazy |
| 14–17 | `useItHygiene*Count` ×4 | inventory-system/-packages/-users/-services | Security Ops | lazy |
| 18 | `useActiveResponseOverview` | active-responses, 24h | Security Ops | lazy |

On-mount cost today: **2** (findings + agent status). The rest fire lazily as
each section scrolls into view.

---

## Opportunities (tiered by value-vs-risk)

### Tier 1 — clean wins, no viz change, actually *more* robust

**1a. Fold Malware into the findings batch (#7 → #1).**
Add a `filter` sub-agg (`exists: wazuh.threat.enrichments`) holding the IOC aggs
to the on-mount findings search.
*Verified:* the filter sub-agg reproduces the standalone numbers exactly —
`ioc_matches = 8`, feed types `file = 6`, `folder = 2`. Same 24h window.
**−1 request**, and malware data is ready on mount instead of a separate lazy
call. Cost: the Endpoint Malware panel consumes the shared findings hook (same
coupling findings already has with Overview / Threat Hunting).

**1b. Collapse Rules + Decoders + Integrations (3 SA HTTP calls → 1 OpenSearch search).**
One `size:0` search over `wazuh-threatintel-rules-a,-decoders-a,-integrations-a`
with a `terms`/`filters` agg on `_index`.
*Verified: counts match the SA routes exactly* — decoders **464**, rules **158**,
integrations **115** — in a single **494-byte** response.
**−2 requests**, and it retires the fragile SA-proxy dependency for these three
(the 404 / "no handler found for uri" handling, and the integrations/detectors
full-document over-fetch we had to patch). Detectors stays separate — it lives
in the `.opensearch-sap-detectors-config` system index, not `wazuh-threatintel-*`.

Notes:
- "Rules" becomes *total* rules rather than *pre-packaged only*. On sample data
  they're equal (158); with custom rules the number would grow — arguably more
  useful, and we're flexible on the exact metric.
- Implement via a real data-source repository over a `wazuh-threatintel-*` index
  pattern, so RBAC and capability-hiding behave exactly like the state indices.
- **Pre-req to confirm:** the dashboard user role has read access to
  `wazuh-threatintel-*` (SA content indices may carry stricter RBAC than the
  `wazuh-states-*` indices the dashboard already reads).

**Tier 1 total: 18 → 15.** Zero visualization change; strictly fewer and more
robust requests.

### Tier 2 — good win, modest coupling

**2. Fold CVEs-matched into the vulnerabilities search (#13 → #8).**
Same index, same (no) window — just add a `cardinality(vulnerability.id)` agg.
*Verified:* severity + byOS + `cves_matched` in one **541-byte** search
(`cves_matched = 732`). **−1 request.**
Cost: the CVEs-matched tile (Threat Intel Feed) must read from the Threat
Hunting vulnerability hook — lift it to a shared hook (like findings) or have
Threat Hunting produce it and pass it down. Both sections are below the fold, so
keep it lazy behind a shared viewport trigger to avoid eager loading.

**Tier 1+2 total: 18 → 14.**

### Tier 3 — biggest saving, one real value trade-off

**3. Collapse the 4 IT-hygiene counts into one inventory search (#14–17 → 1).**
One `size:0` search over `wazuh-states-inventory-*` using a **`filters` agg**
(one named filter per index) — **not `terms` on `_index`**.
*Verified gotcha:* a `terms` agg **omits zero-count indices** (the empty
`services` index returned no bucket), which would make an empty tile
indistinguishable from a missing one. A `filters` agg returns an explicit `0`.
**−3 requests.** Visualization unchanged (still 4 tiles).

**Trade-off (the one real value cost):** loses today's *per-index*
capability-hiding. Currently a missing/failing inventory index hides only its
own tile (`indexPatterns.get()` fails → `data_source_not_found` → that tile
`unavailable`). Under one search, a missing category reports `0` (looks the same
as empty) and the whole card shares a single availability outcome. Acceptable if
we're flexible, but it is a behavior change.

**Tier 1+2+3 total: 18 → 11.**

### Aggressive (optional, not recommended)

Fold Overview's top-OS and top-network-services into the Tier-3 inventory search
as `filter`-scoped sub-terms (`_index: *-system` → terms `host.os.name`;
`_index: *-ports` → terms `process.name`). **−2 more → 9 total.** Skipped in the
recommendation: it couples the Overview inventory row to the Security-Ops card
(different sections, different scroll positions) for marginal gain.

---

## Recommendation

- **Do Tier 1 (1a + 1b): 18 → 15.** Pure win — no viz change, fewer requests,
  and it retires the fragile SA-proxy path for 3 of 4 threat-intel tiles. This is
  the "great improvement, low risk" case.
- **Consider Tier 2: → 14.** Clean, small coupling.
- **Tier 3 (→ 11) only if** the team accepts trading per-tile IT-hygiene
  capability-hiding for the request reduction.
- **Skip** the aggressive inventory mega-merge.
- Leave **SCA, FIM, Active Response, Agent Status, Detectors**, and the two
  Overview inventory tables (top-OS / top-services) as-is — each is a distinct
  index/endpoint with no free merge, or its own term breakdown that carries
  genuine value.

Net realistic target: **18 → 14–15 with zero value loss**, or **→ 11** if the
IT-hygiene trade-off is accepted. On-mount cost stays at **2**.

---

## Verification (when/if implemented)

- Re-run each consolidated query against `:9200`; confirm counts match the
  per-widget numbers above.
- Confirm dashboard-user RBAC on `wazuh-threatintel-*` (Tier 1b pre-req).
- Full jest suite (Node 22, scratchpad config); update the affected hook tests.
- Load the Overview welcome tab; confirm each re-sourced widget shows the same
  values and capability-hiding still behaves as expected (especially IT hygiene
  if Tier 3 is taken).
