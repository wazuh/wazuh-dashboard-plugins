import { ToolDefinition } from '../types';
import { objectSchema } from './common';

/**
 * Escape hatch: the last-resort tool for questions no
 * typed catalog tool covers. The model supplies a raw OpenSearch `_search` body as a JSON-encoded
 * string (this repo's `JsonSchemaObject` is a flat subset with no nested-object properties, so a
 * free-form query body cannot be expressed as typed params — see common/types.ts) targeting one
 * of the three allowlisted Wazuh 5.0 data index families (findings-v5 / events-v5 / states).
 *
 * This tool does NOT lint or clamp anything itself. `executeIndexerRequest` in executor.ts runs
 * `checkIndexAllowlist` + `applySafetyValves` + `lintDsl` on every indexer request unconditionally
 * (see executor.ts) — the exact same defense-in-depth path every typed
 * catalog tool's output already goes through. This is deliberate: the escape hatch is the case
 * those guardrails exist for, so it must not duplicate or bypass them here.
 *
 * `tableSpec.columns`/`digest.sampleColumns` are left empty and `deriveColumns: true` opts this
 * tool into digest.ts's per-response column derivation (see digest.ts) — there is no fixed schema
 * to declare statically for an arbitrary query.
 */
export const searchWazuhDataTool: ToolDefinition = {
  spec: {
    name: 'search_wazuh_data',
    description:
      'LAST RESORT: raw OpenSearch search against Wazuh data indices, for questions that no other ' +
      'tool covers. Use ONLY when no other tool matches the question — always prefer a typed tool ' +
      'first. Executes a read-only _search; nothing is written or modified. All constraints below ' +
      'are re-checked and clamped server-side, and a violation is returned to you as an error ' +
      'you can correct and retry once: use filter context (bool.filter; "must" is accepted but ' +
      'silently rewritten to "filter" — this is a lookup, not a relevance search); for ' +
      'wazuh-events-v5-*/wazuh-findings-v5-* the query MUST include a range on the "@timestamp" ' +
      'field with both "gte" and "lte" bounds, spanning no more than 90 days (a query without one ' +
      'is rejected); "size" must be <= 500; no "script"/"script_fields"/"runtime_mappings", no ' +
      '"regexp", and no leading-wildcard "wildcard"/"query_string"/"simple_query_string" values. ' +
      'If "aggs" has more than one top-level aggregation, every aggregation\'s buckets are ' +
      'summarized in the digest text you receive, but the rendered table only shows the first ' +
      "aggregation's buckets.",
    parameters: objectSchema(
      {
        index_pattern: {
          type: 'string',
          description:
            'The exact index pattern to search. One of: "wazuh-findings-v5-*" (rule-match ' +
            'findings — the security alerts, with rule.level/rule.mitre/severity), ' +
            '"wazuh-events-v5-*" (all normalized events, matched or not), "wazuh-states-*" ' +
            '(current-state data: vulnerabilities, FIM, SCA, inventory).',
          enum: ['wazuh-findings-v5-*', 'wazuh-events-v5-*', 'wazuh-states-*'],
        },
        query_dsl: {
          type: 'string',
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
};
