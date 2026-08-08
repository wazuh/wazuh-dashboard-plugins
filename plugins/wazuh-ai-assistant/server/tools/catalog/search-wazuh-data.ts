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
 * to declare statically for an arbitrary query. `validateFieldNames: true` opts this tool (and
 * only this tool) into executor.ts's pre-execution field-existence check (field-validation.ts):
 * unlike every typed catalog tool, the field paths here come straight from the model's own guess,
 * so this is the one call site where a made-up field name (e.g. "agent.name.keyword") is actually
 * reachable.
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
      "aggregation's buckets. For a \"how many DISTINCT X\" question, use a \"cardinality\" " +
      'aggregation on an ALLOWLISTED keyword field such as wazuh.agent.name (for distinct hosts/' +
      'agents) instead of counting hits -- a hit count overcounts when one host has multiple ' +
      'documents. Only a fixed set of low-cardinality fields is allowed for this (the allowlist ' +
      'may grow over time); an arbitrary field like source.user.name or file.path is rejected -- ' +
      'if the field you need is not accepted, say so rather than retrying variations.',
    parameters: objectSchema(
      {
        index_pattern: {
          type: 'string',
          description:
            'The exact index pattern to search. One of: "wazuh-findings-v5-*" (rule-match ' +
            'findings — the security detections, with wazuh.rule.level/wazuh.rule.mitre/severity), ' +
            '"wazuh-events-v5-*" (all normalized events, matched or not), "wazuh-states-*" ' +
            '(current-state data: vulnerabilities, FIM, SCA, inventory).',
          enum: ['wazuh-findings-v5-*', 'wazuh-events-v5-*', 'wazuh-states-*'],
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
  validateFieldNames: true,
};
