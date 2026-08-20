import { ToolDefinition } from '../types';
import { objectSchema } from './common';
import {
  GENERIC_QUERY_FAMILIES,
  GENERIC_QUERY_INDEX_PATTERNS,
} from './generic-query-families';

/**
 * Escape hatch: the ONE generic, catalog-validated query tool for any data family a typed catalog
 * tool doesn't already cover. The model supplies a raw OpenSearch `_search` body as a
 * JSON-encoded string (this repo's `JsonSchemaObject` is a flat subset with no nested-object
 * properties, so a free-form query body cannot be expressed as typed params — see
 * common/types.ts) targeting one of the allowlisted Wazuh 5.0 data index families —
 * `generic-query-families.ts` is this tool's own single source of truth for which families that
 * is, kept in lockstep with `guardrails.ts`'s `checkIndexAllowlist`.
 *
 * Workstream A1a (AI/plan/coverage-validation-design.md): the product decision is ONE tool that
 * grows to cover every family with real data, not a new one-off typed tool per family — see that
 * file's mission statement. The families a typed tool already owns (findings-v5/events-v5's ~30
 * curated tools, the threatintel rules/decoders/integrations/policies/filters/kvdbs sub-families,
 * `.opensearch-sap-detectors-config`) are deliberately NOT re-listed in this tool's own enum: this
 * escape hatch only ever grows into a gap a typed tool leaves open, never competes with one for
 * routing (the typed tool always wins for its own domain — nothing here changes that).
 *
 * FIELD VALIDATION: this tool does not itself check the model's guessed field names against
 * `common/field-catalog.ts`'s static WCS/ECS catalog — that catalog only covers the original
 * events/findings/inventory/sca/vulnerabilities/fim families (see that file's `FIELD_CATALOG`
 * keys), so a static check would say nothing about the newly-opened metrics/CTI/SAP/threatintel
 * families below and would need its own maintenance as those evolve. Instead `validateFieldNames:
 * true` (below) opts this tool into `field-validation.ts`'s LIVE `_field_caps` check, which
 * already generalizes to every index pattern this tool can ever target with no per-family code —
 * a real mapping check (not a schema guess) with the same "closest known field" suggestion
 * mechanism workstream B built for `get_field_values` (`findNearMisses` there / `suggestCloseFields`
 * here — same shape, same intent: never make the model spend its bounded retry on a bare "zero
 * rows" with no hint of what it actually should have asked for).
 *
 * This tool does NOT lint or clamp anything itself beyond that. `executeIndexerRequest` in
 * executor.ts runs `checkIndexAllowlist` + `applySafetyValves` + `lintDsl` on every indexer
 * request unconditionally (see executor.ts) — the exact same defense-in-depth path every typed
 * catalog tool's output already goes through. This is deliberate: the escape hatch is the case
 * those guardrails exist for, so it must not duplicate or bypass them here.
 *
 * `tableSpec.columns`/`digest.sampleColumns` are left empty and `deriveColumns: true` opts this
 * tool into digest.ts's per-response column derivation (see digest.ts) — there is no fixed schema
 * to declare statically for an arbitrary query. `validateFieldNames: true` opts this tool (and
 * only this tool) into executor.ts's pre-execution field-existence check (field-validation.ts):
 * unlike every typed catalog tool, the field paths here come straight from the model's own guess,
 * so this is the one call site where a made-up field name (e.g. "agent.name.keyword") is actually
 * reachable.
 *
 * CHAINING (mission item 5): the model's own bounded-retry loop is this codebase's "declared
 * chain" mechanism (there is no separate registry-level chain graph — see e.g. guardrails.ts's
 * `VULN_FIELD_ON_FINDINGS_REASON`, which redirects a misrouted query to the right tool BY NAME in
 * its rejection text). This tool's own description below names `get_field_values` explicitly for
 * the zero-hit-recovery case, and `get_field_values`'s description already names this tool back
 * for the inverse case (discover-before-filter) — the two are always-on (`router.ts`'s
 * `free_search` category), so a model that hits a zero-row `search_wazuh_data` result and a model
 * that hits a rejected `get_field_values` field both land on a tool it already has this turn.
 */
/** `"pattern" (label)` clauses joined for the `index_pattern` parameter's description, so the
 * enum and its explanatory text can never list a different set of families from each other —
 * both are derived from `generic-query-families.ts` at module load time. */
const INDEX_PATTERN_DESCRIPTION =
  'The exact index pattern to search. One of: ' +
  GENERIC_QUERY_FAMILIES.map(
    family => `"${family.pattern}" (${family.label})`,
  ).join('; ') +
  '.';

export const searchWazuhDataTool: ToolDefinition = {
  spec: {
    name: 'search_wazuh_data',
    description:
      'The general-purpose query tool for Wazuh data that no other tool covers — use it for ANY ' +
      'index-resident question a typed tool does not already answer (see the "index_pattern" ' +
      'parameter below for every family this can reach: findings, events, current-state ' +
      '(vulnerabilities/FIM/SCA/inventory), operational metrics, CTI feed status, Security ' +
      'Analytics findings/rule catalog, and the raw threat-intel CVE/IOC feeds). Prefer a typed ' +
      'tool first when one matches the question — this tool never overrides one. Executes a ' +
      'read-only _search; nothing is written or modified. All constraints below are re-checked ' +
      'and clamped server-side, and a violation is returned to you as an error you can correct ' +
      'and retry once: use filter context (bool.filter; "must" is accepted but ' +
      'silently rewritten to "filter" — this is a lookup, not a relevance search); for ' +
      'wazuh-events-v5-*/wazuh-findings-v5-* the query MUST include a range on the "@timestamp" ' +
      'field with both "gte" and "lte" bounds, spanning no more than 90 days (a query without one ' +
      'is rejected); "size" must be <= 500; no "script"/"script_fields"/"runtime_mappings", no ' +
      '"regexp", and no leading-wildcard "wildcard"/"query_string"/"simple_query_string" values. ' +
      'For "how many distinct X" questions use a "cardinality" aggregation; metric aggregations ' +
      '("cardinality"/"avg"/"sum"/"min"/"max"/"value_count") are returned to you in the digest. ' +
      'If "aggs" has more than one top-level aggregation, every aggregation\'s buckets are ' +
      'summarized in the digest text you receive, but the rendered table only shows the first ' +
      'aggregation\'s buckets. For a "how many DISTINCT X" question, use a "cardinality" ' +
      'aggregation on an ALLOWLISTED keyword field such as wazuh.agent.name (for distinct hosts/' +
      'agents) instead of counting hits -- a hit count overcounts when one host has multiple ' +
      'documents. Only a fixed set of low-cardinality fields is allowed for this (the allowlist ' +
      'may grow over time); an arbitrary field like source.user.name or file.path is rejected -- ' +
      'if the field you need is not accepted, say so rather than retrying variations. If a field ' +
      'name you guessed is rejected as not existing, or a query returns zero rows and you suspect ' +
      'the filter value itself was wrong (not that the data is absent), call get_field_values ' +
      "first to see the field's real values before retrying this tool with a different guess.",
    parameters: objectSchema(
      {
        index_pattern: {
          type: 'string',
          description: INDEX_PATTERN_DESCRIPTION,
          enum: GENERIC_QUERY_INDEX_PATTERNS,
        },
        query_dsl: {
          type: 'string',
          // JSON-in-a-string (common/types.ts's JsonSchemaPrimitive.jsonString doc comment): lets
          // wire-schema.ts widen this property's WIRE type to accept an object too, and
          // schema-validator.ts's coerce() stringify it back — a model that emits nested JSON as
          // a live object rather than hand-serializing it isn't hard-rejected for that alone.
          jsonString: true,
          description:
            'A JSON-encoded (stringified) OpenSearch search request body, e.g. ' +
            '"{\\"query\\":{\\"bool\\":{\\"filter\\":[...]}},\\"sort\\":[...],\\"_source\\":[...],' +
            '\\"size\\":50}". May include "query", "aggs", "sort", "_source", "size". See this ' +
            "tool's description for the required constraints.",
        },
      },
      ['index_pattern', 'query_dsl'],
    ),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const indexPattern = params.index_pattern as string;
    const rawDsl = params.query_dsl as string;

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawDsl);
    } catch (error) {
      throw new Error(
        `Parameter "query_dsl" is not valid JSON (${
          error instanceof Error ? error.message : String(error)
        }). Re-send it as a single JSON-encoded string, e.g. "{\\"query\\":{...}}".`,
        { cause: error },
      );
    }
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      throw new Error(
        'Parameter "query_dsl" must decode to a JSON object (an OpenSearch search request body), ' +
          `got ${Array.isArray(parsed) ? 'an array' : typeof parsed}.`,
      );
    }

    return {
      target: 'indexer',
      index: indexPattern,
      body: parsed as Record<string, unknown>,
    };
  },
  tableSpec: { columns: [] },
  digest: { sampleColumns: [] },
  deriveColumns: true,
  // The genuine escape hatch: the model's own DSL can put ANY finding/event/state field into the
  // digest, so an unlisted field must fail closed (issue #8917 -- see
  // `ToolDefinition.failClosedFieldPolicy`'s doc comment, types.ts; this used to be inherited from
  // `deriveColumns` above, now explicit). Do not set this to `false` -- that would remove the
  // fail-closed protection this tool has always had.
  failClosedFieldPolicy: true,
  validateFieldNames: true,
};
