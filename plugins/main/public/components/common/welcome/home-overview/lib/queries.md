# Home Overview — queries & aggregations reference

This documents every backend request the Home Overview issues: what it
represents, the index it reads, the exact aggregation body built by
[`queries.ts`](./queries.ts), and — where it applies — the equivalent DQL for
the filter portion. Field/agg names come from [`fields.ts`](./fields.ts) and
[`constants.ts`](./constants.ts); the responses are decoded by
[`mappers.ts`](./mappers.ts) and orchestrated in
[`../hooks/use-overview-data.ts`](../hooks/use-overview-data.ts).

## How these queries run

- **Aggregations only.** Every OpenSearch search sets `size: 0`
  (`pagination.pageSize = 0`, the `NO_HITS` constant) — no document hits are
  fetched, only aggregation results or `hits.total`.
- **Fixed filters only.** Searches run through the data-source layer with the
  data source's _fixed_ filters (cluster scoping, and per-index constraints like
  the network-services listener filter). Global/pinned search-bar filters are
  **not** applied to the Home Overview.
- **Time window.** Only the **findings** and **active-responses** searches use a
  `now-24h → now` range (on the index's time field, `timestamp`). All the
  `wazuh-states-*` / `wazuh-threatintel-*` indices are **current-state** and are
  queried with no time filter.
- **DQL caveat.** DQL/KQL expresses only the _filter_ part of a request, never
  aggregations. Where a query is purely aggregations over `match_all`, the DQL is
  simply `*` (plus the implicit time filter). Aggregations are shown as raw
  request JSON.

## Indices / data sources

| Data source (hook)                                     | Index pattern                                              | Window   |
| ------------------------------------------------------ | ---------------------------------------------------------- | -------- |
| Findings (`useFindingsOverview`)                       | `wazuh-findings-v5*`                                       | last 24h |
| Top OS (`useTopOperatingSystems`)                      | `wazuh-states-inventory-system*`                           | current  |
| Top network services (`useTopNetworkServices`)         | `wazuh-states-inventory-ports*`                            | current  |
| SCA (`useSCAOverview`)                                 | `wazuh-states-sca*`                                        | current  |
| FIM (`useFIMOverview`)                                 | `wazuh-states-fim*`                                        | current  |
| Vulnerabilities (`useVulnerabilityOverview`)           | `wazuh-states-vulnerabilities*`                            | current  |
| Threat-intel enrichments (`useThreatIntelEnrichments`) | `wazuh-threatintel-enrichments*`                           | current  |
| IT Hygiene counts ×4 (`useItHygiene*Count`)            | `wazuh-states-inventory-{system,packages,users,services}*` | current  |
| Active Response (`useActiveResponseOverview`)          | `wazuh-active-responses*`                                  | last 24h |
| Rules/Decoders/Integrations/Detectors                  | Security Analytics `_search` (HTTP)                        | current  |
| Agents by status (`useAgentStatus`)                    | Wazuh Server API (not OpenSearch)                          | current  |

---

## 1. Findings batch — `wazuh-findings-v5*`, last 24h

Fired **on mount**; one search feeds three sections (Overview, Threat Hunting,
Endpoint Security → Malware). Built by `buildFindingsOverviewAggs()` +
`buildMalwareFilterAgg()`.

**Represents:** finding severity distribution, top MITRE tactics, total findings,
top rules, distinct techniques observed, top techniques, and the Malware
IOC-match hero.

```jsonc
{
  "size": 0,
  // time filter: timestamp >= now-24h
  "aggs": {
    // Finding severity tiles — one bucket per band (wazuh.rule.level is a keyword band, lowercase)
    "severity": {
      "filters": {
        "filters": {
          "critical": { "match_phrase": { "wazuh.rule.level": "critical" } },
          "high": { "match_phrase": { "wazuh.rule.level": "high" } },
          "medium": { "match_phrase": { "wazuh.rule.level": "medium" } },
          "low": { "match_phrase": { "wazuh.rule.level": "low" } },
          "informational": {
            "match_phrase": { "wazuh.rule.level": "informational" }
          }
        }
      }
    },
    // Overview "top tactics" bar list; external_id sub-agg carries the MITRE id (TA####) for the Intelligence deep-link
    "tactics": {
      "terms": { "field": "wazuh.rule.mitre.tactic.name", "size": 5 },
      "aggs": {
        "external_id": {
          "terms": { "field": "wazuh.rule.mitre.tactic.id", "size": 1 }
        }
      }
    },
    // Threat Hunting "top rules"
    "top_rules": { "terms": { "field": "wazuh.rule.title", "size": 5 } },
    // Threat Hunting "techniques observed" hero (distinct technique ids)
    "techniques_count": {
      "cardinality": { "field": "wazuh.rule.mitre.technique.id" }
    },
    // Threat Hunting "top techniques" (links to MITRE Framework filtered by name)
    "top_techniques": {
      "terms": { "field": "wazuh.rule.mitre.technique.name", "size": 5 }
    },
    // Malware Detection "IOC matches" hero — findings carrying a threat enrichment,
    // counted as distinct events (one event can carry several enrichment matches)
    "malware": {
      "filter": { "exists": { "field": "wazuh.threat.enrichments" } },
      "aggs": { "ioc_matches": { "cardinality": { "field": "event.doc_id" } } }
    }
  }
}
```

**DQL (filter part):** whole search is `*` over the last 24h; the Malware subset
is `wazuh.threat.enrichments: *` (field exists).

## 2. Top operating systems — `wazuh-states-inventory-system*`, current

`buildTopTermsAgg('top_os', 'host.os.name')`. Top 5 OS by asset count.

```jsonc
{
  "size": 0,
  "aggs": { "top_os": { "terms": { "field": "host.os.name", "size": 5 } } }
}
```

DQL: `*` (current state).

## 3. Top network services — `wazuh-states-inventory-ports*`, current

`buildTopTermsAgg('top_services', 'process.name')`, over the **listeners** subset
(the data source pins `destination.port` to 0, mirroring IT Hygiene › Network ›
Listeners). Top 5 listening processes.

```jsonc
{
  "size": 0,
  // fixed filter from the data source: destination.port IS 0
  "aggs": {
    "top_services": { "terms": { "field": "process.name", "size": 5 } }
  }
}
```

**DQL (filter part):** `destination.port: 0`.

## 4. Configuration Assessment (SCA) — `wazuh-states-sca*`, current

`buildSCATilesAgg()` + `buildSCATopBenchmarksAgg()`.

**Represents:** Passed / Failed / Not-applicable check counts (+ a derived score)
and the top 5 benchmarks with a per-benchmark pass/fail breakdown.

```jsonc
{
  "size": 0,
  "aggs": {
    "sca_result": {
      "filters": {
        "filters": {
          "passed": { "match_phrase": { "check.result": "Passed" } },
          "failed": { "match_phrase": { "check.result": "Failed" } },
          "not_applicable": {
            "match_phrase": { "check.result": "Not applicable" }
          }
        }
      }
    },
    "sca_benchmarks": {
      "terms": { "field": "policy.name", "size": 5 },
      "aggs": { "result": { "terms": { "field": "check.result", "size": 3 } } }
    }
  }
}
```

Score is a fraction `passed / (passed + failed)` (computed in `mapScaTiles` /
`mapScaBenchmarks`, not in the query) and rendered with the shared
`decimalFormat()` percent formatter — the same mechanism as the agents-summary
SCA scan (`welcome/components/sca_scan/sca_scan.tsx`).

## 5. File Integrity Monitoring — `wazuh-states-fim*`, current

`buildFIMTopPlatformsAgg()`. The `wazuh-states-fim*` pattern spans files +
registry keys + registry values.

**Represents:** total baselined objects (`hits.total`) and the top 5 platforms.

```jsonc
{
  "size": 0, // total comes from hits.total (mapDocCount)
  "aggs": {
    "fim_platforms": {
      "terms": { "field": "wazuh.agent.host.os.platform", "size": 5 }
    }
  }
}
```

DQL: `*`.

## 6. Vulnerabilities — `wazuh-states-vulnerabilities*`, current

`buildVulnerabilitySeverityFiltersAgg()` + `buildVulnerabilityTopOsAgg()` +
`buildCvesMatchedAgg()`.

**Represents:** vulnerability severity tiles, top affected OS, and the distinct
"CVEs matched" count. Note `vulnerability.severity` values are **Capitalized**
(unlike the lowercase finding bands) and there is **no** informational band.

```jsonc
{
  "size": 0,
  "aggs": {
    "vulnerability_severity": {
      "filters": {
        "filters": {
          "critical": {
            "match_phrase": { "vulnerability.severity": "Critical" }
          },
          "high": { "match_phrase": { "vulnerability.severity": "High" } },
          "medium": { "match_phrase": { "vulnerability.severity": "Medium" } },
          "low": { "match_phrase": { "vulnerability.severity": "Low" } }
        }
      }
    },
    "vulnerabilities_by_os": {
      "terms": { "field": "host.os.name", "size": 5 }
    },
    // distinct CVEs, not the match-document count (one CVE matches many assets)
    "cves_matched": { "cardinality": { "field": "vulnerability.id" } }
  }
}
```

DQL: `*`.

## 7. Threat-intel enrichments catalog — `wazuh-threatintel-enrichments*`, current

`buildThreatIntelFeedByTypeAgg()`. This is the feed **catalog** (what indicators
the platform ships with) — distinct from the Malware IOC-match hero in §1 (what
actually matched in findings).

**Represents:** total IOCs in the feed (`hits.total`, the "IOCs" tile) and the
feed composition by indicator type (domain/url/ip/hash).

```jsonc
{
  "size": 0, // total IOCs from hits.total
  "aggs": {
    "ioc_feed_by_type": { "terms": { "field": "document.type", "size": 5 } }
  }
}
```

DQL: `*`.

## 8. IT Hygiene counts ×4 — `wazuh-states-inventory-{system,packages,users,services}*`, current

No aggregation — a plain `size: 0` search per index; the tile value is
`hits.total`. One search per index so a missing index hides only its own tile.

```jsonc
{ "size": 0 } // value = hits.total, per index pattern
```

DQL: `*`.

## 9. Active Response — `wazuh-active-responses*`, last 24h

Plain count (`hits.total`) of active-response actions in the last 24h.

```jsonc
{ "size": 0 } // time filter: timestamp >= now-24h; value = hits.total
```

DQL (filter part): `*` over the last 24h.

---

## 10–13. Threat Intelligence Feed counts — Security Analytics (HTTP)

Not OpenSearch data-source searches: these hit the Security Analytics dashboards
plugin over `core.http` at `../_plugins/_security_analytics/<type>/_search`
(`services/security-analytics.service.ts`). Each is `size: 0`; the count is read
from `hits.total` (decoders also accept `response.total`). If the plugin is
absent the route 404s → the tile is hidden (`unavailable`).

**Rules** (`rules/_search`) — enabled rules; summed over pre-packaged + custom
(two calls, `?prePackaged=true|false`):

```jsonc
{ "size": 0, "query": { "term": { "document.enabled": true } } }
```

**Decoders** (`decoders/_search`) — enabled, both content spaces:

```jsonc
{
  "size": 0,
  "query": {
    "bool": {
      "filter": [
        { "terms": { "space.name": ["standard", "custom"] } },
        { "term": { "document.enabled": true } }
      ]
    }
  }
}
```

**Integrations** (`integrations/_search`) — same filter, but this route treats the
whole body as the query, so the `bool` sits at the top level (not under `query`):

```jsonc
{
  "size": 0,
  "bool": {
    "filter": [
      { "terms": { "space.name": ["standard", "custom"] } },
      { "term": { "document.enabled": true } }
    ]
  }
}
```

**Detectors** (`detectors/_search`) — total detectors:

```jsonc
{ "size": 0, "query": { "match_all": {} } }
```

## 14. Agents by status — Wazuh Server API

Not an index query. `WzRequest.apiReq('GET', '/agents/summary/status')` returns
the connection summary (`active` / `disconnected` / `pending` / `never_connected`
/ `total`), mapped by `mapAgentStatus`. Clicking a count opens Agents management ›
Summary pre-filtered via the `wz-agents-overview-table-filter` sessionStorage key
(`q: "status=<api-token>"`).

---

## Notes

- **Severity casing:** findings use lowercase bands on `wazuh.rule.level`
  (incl. `informational`); vulnerabilities use Capitalized values on
  `vulnerability.severity` (no informational). See `VULNERABILITY_SEVERITY_VALUES`.
- **`external_id` sub-agg** (§1 tactics): a `size: 1` terms sub-agg pairs each
  tactic name with its MITRE external id (names map 1:1 to ids) so the label can
  deep-link into the MITRE Intelligence resource. Techniques link to the
  Framework tab filtered by _name_, so they need no id sub-agg.
- **`cardinality` vs `hits.total`:** IOC matches, techniques observed, and CVEs
  matched are distinct-value counts (`cardinality`), deliberately not raw doc
  counts, because one document can contribute several matches / one value can
  span many documents.
- **Agg/field names are single-sourced:** aggregation keys in `constants.ts`
  (`AGG`) and field names in `fields.ts`; the same constants are used by the
  builders here and the readers in `mappers.ts`, so producer and consumer can't
  drift.
