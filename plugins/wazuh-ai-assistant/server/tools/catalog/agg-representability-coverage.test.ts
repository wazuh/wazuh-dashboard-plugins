import assert from 'node:assert/strict';
import { JsonSchemaProperty } from '../../../common/types';
import { listToolDefinitions } from '../registry';
import { SUPPORTED_METRIC_AGG_TYPES } from '../digest';
import { IndexerRequest } from '../types';

/**
 * Class-level guard for issue #8920 item 5: NO catalog tool may build a request whose aggregation
 * response digest.ts cannot represent.
 *
 * The defect this exists to prevent: `bucketsToRows` used to read only the FIRST top-level
 * aggregation and only its `buckets` ARRAY, so any other aggregation shape — a metric agg sorted
 * first, a multi-value `stats`/`percentiles`, `filters` with named (object-keyed) buckets — was
 * silently discarded and the digest reported `returned: 0` for a query OpenSearch fully answered.
 * digest.ts now represents `{buckets: [...]}` bucket aggs, `{value}` metrics
 * (`SUPPORTED_METRIC_AGG_TYPES`) and `{doc_count}` single-bucket counts, and hints on anything
 * else — but a TYPED tool must never rely on that last-resort hint: its builder is ours, so it
 * must only emit aggregation types whose response the digest fully represents.
 *
 * Method (same as agg-size-coverage.test.ts, which guards sizes the same way): drive each indexer
 * tool's own `buildRequest` with sample params, then WALK the produced `aggs` tree and assert
 * every aggregation node's type is in the representable set. **Nothing is exempt by default** — a
 * new tool, or a new aggregation added to an existing tool, is checked automatically; a new
 * aggregation TYPE must be added to the explicit list below only together with digest support
 * (extend `bucketsToRows`/`extractMetricAggs` and their tests first).
 *
 * The `search_wazuh_data` escape hatch's aggs come from the CALLER, not its builder, so the only
 * possible guard for it is the runtime one: digest.ts's unrepresentable-aggregation hint (see
 * `findUnrepresentableAggs`), which is tested in digest.test.ts. This file guards the half we
 * control at build time.
 */

/** Aggregation types whose TOP-LEVEL response shape digest.ts fully represents. */
const REPRESENTABLE_BUCKET_AGG_TYPES = new Set([
  // `{buckets: [...]}` — array-of-buckets shapes handled by bucketsToRows/buildBreakdown.
  // range/date_range are representable ONLY in their default (non-keyed) form — the keyed:true
  // variant is caught separately below.
  'terms',
  'significant_terms',
  'date_histogram',
  'histogram',
  'range',
  'date_range',
  // `{doc_count: n}` — single-bucket count (isSingleBucketDocCount).
  'filter',
]);
const REPRESENTABLE_SUB_AGG_TYPES = new Set([
  // Merged into the parent bucket's row by bucketsToRows' sub-agg loop.
  'top_hits',
  'filter',
  ...SUPPORTED_METRIC_AGG_TYPES,
]);

/** Reserved keys inside an aggregation definition that are not the aggregation's type. */
const NON_TYPE_AGG_KEYS = new Set(['aggs', 'aggregations', 'meta']);

interface AggViolation {
  tool: string;
  agg: string;
  problem: string;
}

/** Walks one `aggs` map, collecting every aggregation whose type is not representable. */
function checkAggsTree(
  tool: string,
  aggs: Record<string, unknown>,
  violations: AggViolation[],
  topLevel: boolean,
): void {
  for (const [aggName, aggDef] of Object.entries(aggs)) {
    if (!aggDef || typeof aggDef !== 'object' || Array.isArray(aggDef)) {
      violations.push({ tool, agg: aggName, problem: 'malformed agg node' });
      continue;
    }
    const record = aggDef as Record<string, unknown>;
    const typeKeys = Object.keys(record).filter(
      key => !NON_TYPE_AGG_KEYS.has(key),
    );
    const allowed = topLevel
      ? REPRESENTABLE_BUCKET_AGG_TYPES
      : REPRESENTABLE_SUB_AGG_TYPES;
    for (const typeKey of typeKeys) {
      // A metric type at TOP level is also representable (synthesized row + Digest.metrics).
      const representable =
        allowed.has(typeKey) ||
        (topLevel &&
          (SUPPORTED_METRIC_AGG_TYPES as readonly string[]).includes(typeKey));
      if (!representable) {
        violations.push({
          tool,
          agg: aggName,
          problem: `aggregation type "${typeKey}" is not digest-representable at this level`,
        });
      }
      // `keyed: true` turns an array-of-buckets response into an OBJECT keyed by bucket name,
      // which none of digest.ts's extractors read — representable type or not, it must not ship.
      const typeSpec = record[typeKey];
      if (
        typeSpec &&
        typeof typeSpec === 'object' &&
        (typeSpec as { keyed?: unknown }).keyed === true
      ) {
        violations.push({
          tool,
          agg: aggName,
          problem: `"${typeKey}" with keyed:true returns object-keyed buckets the digest drops`,
        });
      }
    }
    const subAggs = (record.aggs ?? record.aggregations) as
      | Record<string, unknown>
      | undefined;
    if (subAggs && typeof subAggs === 'object') {
      checkAggsTree(tool, subAggs, violations, false);
    }
  }
}

/**
 * Minimal valid value for one declared param — same conventions as agg-size-coverage.test.ts's
 * sampleValue (see its doc comment for why each branch exists); duplicated deliberately so this
 * file stays runnable standalone, like the other catalog coverage tests.
 */
function sampleValue(name: string, prop: JsonSchemaProperty): unknown {
  if (name === 'limit') {
    return 20;
  }
  // get_field_values' `field` param is restricted to guardrails.ts's AGG_FIELD_ALLOWLIST -- an
  // arbitrary generic string throws (correctly) rather than reaching an aggregation, which would
  // otherwise mask this sweep's real question. "wazuh.agent.id" is chosen (not just any
  // allowlisted field) because its FIELD_LOCATIONS include "events" -- the family every OTHER
  // enum property in this sweep also samples first (alphabetical `enumValues[0]`), including this
  // tool's own `index_family`; a field whose locations did NOT include "events" would make the
  // generically-sampled `index_family` invalid for it and throw for an unrelated reason.
  if (name === 'field') {
    return 'wazuh.agent.id';
  }
  if ((prop as { jsonString?: true }).jsonString) {
    return JSON.stringify({
      query: {
        bool: {
          filter: [{ range: { '@timestamp': { gte: 'now-7d', lte: 'now' } } }],
        },
      },
    });
  }
  const enumValues = (prop as { enum?: unknown[] }).enum;
  if (Array.isArray(enumValues) && enumValues.length > 0) {
    return enumValues[0];
  }
  if (prop.type === 'number') {
    return 20;
  }
  if (prop.type === 'boolean') {
    return true;
  }
  if (prop.type === 'array') {
    const items = (prop as { items?: JsonSchemaProperty }).items;
    const itemEnum = (items as { enum?: unknown[] } | undefined)?.enum;
    if (Array.isArray(itemEnum) && itemEnum.length > 0) {
      return [itemEnum[0]];
    }
    return ['001'];
  }
  if (/(^|_)agent_id$/.test(name) || name === 'agent') {
    return '001';
  }
  if (/(^|_)(gte|lte|from|to)$/.test(name) || name.includes('time_range')) {
    return 'now-7d';
  }
  return 'test';
}

function sampleParams(
  properties: Record<string, JsonSchemaProperty>,
): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  for (const [name, prop] of Object.entries(properties)) {
    params[name] = sampleValue(name, prop);
  }
  return params;
}

test('every indexer tool only builds aggregations the digest can represent', () => {
  const indexerTools = listToolDefinitions().filter(
    def => def.target === 'indexer',
  );
  assert.ok(indexerTools.length > 0, 'registry produced no indexer tools');

  const violations: AggViolation[] = [];
  for (const def of indexerTools) {
    const params = sampleParams(def.spec.parameters.properties);
    let request: IndexerRequest;
    try {
      request = def.buildRequest(params) as IndexerRequest;
    } catch (error) {
      violations.push({
        tool: def.spec.name,
        agg: '(buildRequest)',
        problem: `threw for its own declared params -- ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
      continue;
    }
    const aggs = (request.body.aggs ?? request.body.aggregations) as
      | Record<string, unknown>
      | undefined;
    if (!aggs) {
      continue;
    }
    checkAggsTree(def.spec.name, aggs, violations, true);
  }

  assert.deepEqual(
    violations.map(v => `${v.tool}/${v.agg}: ${v.problem}`),
    [],
    'A tool builds an aggregation whose response shape digest.ts silently drops or cannot fully ' +
      'represent. Extend digest.ts (bucketsToRows/extractMetricAggs + tests) BEFORE adding the ' +
      'type to the representable sets here.',
  );
});

test('checkAggsTree mechanism: a synthetic offender is actually flagged', () => {
  // Self-test in the style of field-policy-coverage.test.ts's mechanism check: if the walker
  // silently stopped recognizing offenders, every registry assertion above would pass vacuously.
  const violations: AggViolation[] = [];
  checkAggsTree(
    'synthetic_tool',
    {
      p95: { percentiles: { field: 'wazuh.rule.level' } },
      sev: { filters: { filters: { high: { term: { a: 'b' } } } } },
      keyed: {
        date_histogram: {
          field: '@timestamp',
          calendar_interval: '1d',
          keyed: true,
        },
      },
      ok_terms: {
        terms: { field: 'wazuh.rule.id', size: 5 },
        aggs: { worst: { stats: { field: 'wazuh.rule.level' } } },
      },
    },
    violations,
    true,
  );
  const flagged = violations.map(v => v.agg).sort();
  assert.deepEqual(flagged, ['keyed', 'p95', 'sev', 'worst']);
});
