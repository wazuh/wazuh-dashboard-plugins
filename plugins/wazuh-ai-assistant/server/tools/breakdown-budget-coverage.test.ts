import assert from 'node:assert/strict';
import { JsonSchemaProperty } from '../../common/types';
import { listToolDefinitions } from './registry';
import {
  ANSWER_BUCKET_CAP,
  BREAKDOWN_BUCKET_CAP,
  buildDigest,
  Digest,
} from './digest';
import { IndexerRequest, ToolDefinition } from './types';

/**
 * Class-level guard for issue #8935 item 1: NO catalog tool may build a top-level `terms`
 * aggregation sized ABOVE the side-disclosure budget (`BREAKDOWN_BUCKET_CAP`, 5 — i.e. an
 * aggregation that IS the answer, not a side note attached to a hits-shaped result) whose response
 * the digest cannot carry up to `ANSWER_BUCKET_CAP` (50) with every trim disclosed.
 *
 * The defect this exists to prevent: on the base, `buildBreakdown` (digest.ts) is UNBOUNDED — it
 * carries every bucket OpenSearch returns with no per-tool cap and no disclosure of anything it
 * drops. `get_sca_results` clamps its `limit` up to `MAX_AGG_SIZE` (100) and writes it straight into
 * a `terms` `size` — a policy-heavy agent's SCA results ride through as up to 100 undisclosed
 * buckets, degraded only by `capDigest`'s LAST-RESORT char-cap pop (itself silent) if the response
 * happens to be large enough in bytes. A future tool that requests any enumeration-sized aggregation
 * inherits the same silent-overrun risk unless this sweep catches it first.
 *
 * Method (same shape as `agg-representability-coverage.test.ts` and `agg-size-coverage.test.ts`,
 * which guard adjacent invariants the same way): drive each indexer tool's own `buildRequest` with
 * sample params (an ABSURD `limit`, so a `clampAggLimit`-driven size reaches its true maximum, the
 * same technique `agg-size-coverage.test.ts` uses), find every TOP-LEVEL `terms` aggregation node
 * sized above `BREAKDOWN_BUCKET_CAP` (the same "size >= BREAKDOWN_BUCKET_CAP means a distribution,
 * not a side note" signal `population-disclosure-coverage.test.ts`'s `hasRealTermsAggregation`
 * treats as semantic — checked at TOP level only, since that is all `buildBreakdown`/digest.ts's
 * carry-cap logic ever reads), synthesize a response with EXACTLY that many buckets at a realistic
 * enumeration key length, run the REAL `buildDigest`, and assert the class-level invariant.
 * **Nothing is exempt by default** — a new tool, or a new large aggregation added to an existing
 * tool, is checked automatically.
 */

/** ~45 chars — matches `ANSWER_BUCKET_CAP`'s own sizing arithmetic in digest.ts (a realistic
 * SCA/CIS-benchmark check name, "Ensure sshd PermitRootLogin is disabled" = 40 chars). Using a
 * realistic length here (not a short synthetic key) is the point: it is what makes the
 * `DIGEST_CHAR_CAP` assertion below meaningful rather than trivially true. */
const REALISTIC_KEY_LENGTH = 45;
function realisticKey(i: number): string {
  const base = `Ensure representative CIS benchmark check ${i} is disabled`;
  return base.length >= REALISTIC_KEY_LENGTH
    ? base.slice(0, REALISTIC_KEY_LENGTH)
    : base.padEnd(REALISTIC_KEY_LENGTH, '.');
}

interface LargeTermsAgg {
  tool: string;
  aggKey: string;
  field: string;
  size: number;
}

/**
 * TOP-LEVEL `terms` aggregation nodes sized above `BREAKDOWN_BUCKET_CAP` — deliberately top-level
 * only (not a recursive walk like `population-disclosure-coverage.test.ts`'s
 * `collectAggTypeEntries`): `buildBreakdown`/`capBreakdownCarry` (digest.ts) only ever read
 * `result.aggregations`' own top-level keys, so a sub-aggregation's `terms` size is not this
 * class's concern (its parent bucket's row already caps at the PARENT's top-level size).
 */
function findLargeTopLevelTermsAggs(
  tool: string,
  body: Record<string, unknown>,
): LargeTermsAgg[] {
  const aggs = (body.aggs ?? body.aggregations) as
    | Record<string, unknown>
    | undefined;
  if (!aggs) {
    return [];
  }
  const found: LargeTermsAgg[] = [];
  for (const [aggKey, aggDef] of Object.entries(aggs)) {
    if (!aggDef || typeof aggDef !== 'object' || Array.isArray(aggDef)) {
      continue;
    }
    const termsSpec = (aggDef as Record<string, unknown>).terms as
      | { field?: unknown; size?: unknown }
      | undefined;
    if (
      termsSpec &&
      typeof termsSpec.field === 'string' &&
      typeof termsSpec.size === 'number' &&
      termsSpec.size > BREAKDOWN_BUCKET_CAP
    ) {
      found.push({
        tool,
        aggKey,
        field: termsSpec.field,
        size: termsSpec.size,
      });
    }
  }
  return found;
}

/** A response carrying exactly `agg.size` buckets, sorted descending by `doc_count` (matching how
 * OpenSearch's own `terms` aggregation always orders its buckets by default), at a realistic
 * enumeration key length. */
function syntheticTermsResponse(agg: LargeTermsAgg): unknown {
  return {
    aggregations: {
      [agg.aggKey]: {
        buckets: Array.from({ length: agg.size }, (_, i) => ({
          key: realisticKey(i),
          doc_count: agg.size - i,
        })),
      },
    },
  };
}

const DIGEST_CHAR_CAP_MIRROR = 6000; // digest.ts's DIGEST_CHAR_CAP is not exported; kept in sync
// manually the same way digest.test.ts's own capDigest tests hardcode this value.

/**
 * The class-level invariant this whole sweep exists to check, factored out so the mechanism
 * self-test below can feed it a fabricated violation directly (see that test) — proving this check
 * is capable of failing, not merely capable of passing every real tool in the registry today.
 */
function assertBucketBudgetRespected(
  agg: LargeTermsAgg,
  digest: Digest,
): string[] {
  const problems: string[] = [];
  const breakdownLength = digest.breakdown?.length ?? 0;
  if (breakdownLength > ANSWER_BUCKET_CAP) {
    problems.push(
      `${agg.tool}/${agg.aggKey}: breakdown carries ${breakdownLength} buckets, above ` +
        `ANSWER_BUCKET_CAP (${ANSWER_BUCKET_CAP})`,
    );
  }
  if (agg.size > ANSWER_BUCKET_CAP && !digest.breakdownNote) {
    problems.push(
      `${agg.tool}/${agg.aggKey}: ${agg.size} requested buckets carried only ${breakdownLength}, ` +
        'with NO breakdownNote -- the hidden buckets are undisclosed',
    );
  }
  const serializedLength = JSON.stringify(digest).length;
  if (serializedLength > DIGEST_CHAR_CAP_MIRROR) {
    problems.push(
      `${agg.tool}/${agg.aggKey}: serialized digest is ${serializedLength} chars, above ` +
        `DIGEST_CHAR_CAP (${DIGEST_CHAR_CAP_MIRROR})`,
    );
  }
  return problems;
}

/**
 * Minimal valid value for one declared param — same conventions as `agg-size-coverage.test.ts`'s
 * `sampleValue` (see its doc comment for why each branch exists, and why `limit` is set to an
 * ABSURD value: several tools derive an aggregation `size` from `limit` via `clampAggLimit`, so an
 * absurd input is what makes the built request reach that tool's TRUE maximum size instead of
 * whatever modest default `buildRequest` would otherwise pick).
 */
const ABSURD_LIMIT = 100_000;
function sampleValue(name: string, prop: JsonSchemaProperty): unknown {
  if (name === 'limit') {
    return ABSURD_LIMIT;
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
    return ABSURD_LIMIT;
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

test('every large top-level terms aggregation in the registry stays within ANSWER_BUCKET_CAP with every trim disclosed', () => {
  const indexerTools = listToolDefinitions().filter(
    def => def.target === 'indexer',
  );
  assert.ok(indexerTools.length > 0, 'registry produced no indexer tools');

  const problems: string[] = [];
  let candidateCount = 0;
  for (const def of indexerTools) {
    const params = sampleParams(def.spec.parameters.properties);
    let request: IndexerRequest;
    try {
      request = def.buildRequest(params) as IndexerRequest;
    } catch {
      // A parameter-level throw is covered by agg-size-coverage.test.ts /
      // agg-representability-coverage.test.ts; not this sweep's concern.
      continue;
    }
    const largeAggs = findLargeTopLevelTermsAggs(def.spec.name, request.body);
    for (const agg of largeAggs) {
      candidateCount++;
      const response = syntheticTermsResponse(agg);
      const digest = buildDigest(def.spec.name, response, def);
      problems.push(...assertBucketBudgetRespected(agg, digest));
    }
  }

  // Guards the sweep itself against silently checking nothing (e.g. every large-agg tool started
  // throwing on its own sample params) — get_sca_results' limit-driven `policies` agg (clamped to
  // MAX_AGG_SIZE=100 by the ABSURD `limit` above) is expected to trip this every run.
  assert.ok(
    candidateCount > 0,
    'expected at least one answer-sized (> BREAKDOWN_BUCKET_CAP) terms aggregation in the ' +
      'registry (e.g. get_sca_results) -- if none exist, this sweep is vacuously passing',
  );

  assert.deepEqual(
    problems,
    [],
    'A tool builds a large enumeration aggregation whose response digest.ts does not fully carry ' +
      '(up to ANSWER_BUCKET_CAP) or fully disclose (breakdownNote) within DIGEST_CHAR_CAP. Extend ' +
      "digest.ts's capBreakdownCarry/mergeTruncation/buildBucketTruncationNote before loosening " +
      'this test.',
  );
});

function buildMinimalToolDef(
  overrides: Partial<ToolDefinition> = {},
): ToolDefinition {
  return {
    spec: {
      name: 'synthetic_tool',
      description: 'test',
      parameters: { type: 'object', properties: {} },
    },
    target: 'indexer',
    tier: 'T1',
    buildRequest: () => ({
      target: 'indexer',
      index: 'test-*',
      body: {},
    }),
    tableSpec: { columns: [] },
    digest: { sampleColumns: [] },
    ...overrides,
  };
}

test('the REAL buildDigest respects the budget on a fabricated over-budget response (not tied to any registry tool)', () => {
  // Independent of the registry sweep above: proves the fix generalizes to an aggregation larger
  // than any current tool builds (200 buckets, above even MAX_AGG_SIZE), not just to the specific
  // shapes get_sca_results happens to produce today.
  const agg: LargeTermsAgg = {
    tool: 'synthetic_tool',
    aggKey: 'enumeration',
    field: 'some.field',
    size: 200,
  };
  const def = buildMinimalToolDef();
  const digest = buildDigest(def.spec.name, syntheticTermsResponse(agg), def);
  const problems = assertBucketBudgetRespected(agg, digest);
  assert.deepEqual(
    problems,
    [],
    'buildDigest failed to carry/disclose a fabricated 200-bucket aggregation within budget',
  );
});

test('mechanism self-test: assertBucketBudgetRespected actually flags an undisclosed carry violation', () => {
  // Fabricates the shape the BASE (pre-fix) buildBreakdown produced: every bucket present, no cap,
  // no note -- proving this sweep's own check is capable of failing, not merely capable of passing
  // every real tool in the registry today. Mirrors agg-representability-coverage.test.ts's
  // "checkAggsTree mechanism" self-test, which validates its walker the same way.
  const agg: LargeTermsAgg = {
    tool: 'synthetic_tool',
    aggKey: 'policies',
    field: 'policy.id',
    size: 100,
  };
  const brokenDigest: Digest = {
    tool: 'synthetic_tool',
    counts: { returned: 100, truncated: false },
    breakdown: Array.from({ length: 100 }, (_, i) => ({
      key: `k${i}`,
      count: 1,
    })),
    samples: [],
    columns: [],
  };
  const problems = assertBucketBudgetRespected(agg, brokenDigest);
  assert.ok(
    problems.length > 0,
    'expected the mechanism to flag an uncapped, undisclosed 100-bucket breakdown',
  );
});
