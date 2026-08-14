import assert from 'node:assert/strict';
import { JsonSchemaProperty } from '../../common/types';
import { listToolDefinitions } from './registry';
import {
  BREAKDOWN_BUCKET_CAP,
  BREAKDOWN_CHAR_BUDGET,
  buildDigest,
  Digest,
  DIGEST_CHAR_CAP,
} from './digest';
import { IndexerRequest, ToolDefinition } from './types';

/**
 * Class-level guard for issue #8935 item 1: NO tool may build a top-level BUCKET aggregation
 * larger than the side-disclosure budget (`BREAKDOWN_BUCKET_CAP`, 5 — i.e. an aggregation that IS
 * the answer, not a side note attached to a hits-shaped result) whose response the digest cannot
 * carry up to its char budget (`BREAKDOWN_CHAR_BUDGET`) with every trim disclosed, inside
 * `DIGEST_CHAR_CAP`.
 *
 * The defect this exists to prevent: on the base, `buildBreakdown` (digest.ts) is UNBOUNDED — it
 * carries every bucket OpenSearch returns with no cap and no disclosure of anything it drops.
 * `get_sca_results` clamps its `limit` up to `MAX_AGG_SIZE` (100) and writes it straight into a
 * `terms` `size` — a policy-heavy agent's SCA results ride through as up to 100 undisclosed
 * buckets, degraded only by `capDigest`'s LAST-RESORT char-cap pop (itself silent) if the response
 * happens to be large enough in bytes. A future tool that requests any enumeration-sized
 * aggregation inherits the same silent-overrun risk unless this sweep catches it first.
 *
 * SHAPE COVERAGE (issue #8935 integration review — the first cut of this sweep matched only a
 * literal `terms` object with a string `field`, which structurally exempted every shape
 * `capBreakdownCarry` actually handles): `buildBreakdown` carries buckets from ANY top-level agg
 * with a `buckets` array, so this sweep must recognize every bucket-producing aggregation type the
 * guardrails allow through — sized (`terms`, `multi_terms`, `composite`) AND unsized
 * (`date_histogram`, `histogram`, `range`, which guardrails caps by interval/shape but never by
 * bucket COUNT; a 1-minute `date_histogram` over 7 days returns 10,080 buckets). Unsized shapes
 * are exercised at `UNSIZED_SYNTHETIC_BUCKETS` buckets. The escape hatch's `query_dsl` sample
 * (see `sampleValue`) deliberately CONTAINS aggregations — including a non-count-ordered terms agg
 * — because search_wazuh_data is the only surface that can produce most of these shapes, and a
 * stub body with no aggs would silently exempt it from the whole sweep.
 *
 * Method (same shape as `agg-representability-coverage.test.ts` and `agg-size-coverage.test.ts`,
 * which guard adjacent invariants the same way): drive each indexer tool's own `buildRequest` with
 * sample params (an ABSURD `limit`, so a `clampAggLimit`-driven size reaches its true maximum),
 * find every top-level bucket-aggregation node above `BREAKDOWN_BUCKET_CAP`, synthesize a response
 * with exactly that many buckets at a realistic enumeration key length, run the REAL `buildDigest`,
 * and assert the class-level invariant — including that the carry is MAXIMAL (a regression that
 * trimmed everything back to 5 buckets with a note would fail, not pass) and that the note's
 * remainder figures are numerically exact. **Nothing is exempt by default** — a new tool, or a new
 * large aggregation added to an existing tool, is checked automatically.
 */

/** ~45 chars — matches digest.ts's own sizing arithmetic (a realistic SCA/CIS-benchmark check
 * name, "Ensure sshd PermitRootLogin is disabled" = 40 chars). Using a realistic length here (not
 * a short synthetic key) is the point: it is what makes the char-budget assertions below
 * meaningful rather than trivially true. */
const REALISTIC_KEY_LENGTH = 45;
function realisticKey(i: number): string {
  const base = `Ensure representative CIS benchmark check ${i} is disabled`;
  return base.length >= REALISTIC_KEY_LENGTH
    ? base.slice(0, REALISTIC_KEY_LENGTH)
    : base.padEnd(REALISTIC_KEY_LENGTH, '.');
}

/** Every aggregation type whose response carries a top-level `buckets` ARRAY `buildBreakdown`
 * will pick up. `filters` (keyed object buckets) and `top_hits` are the unrepresentable shapes
 * `findUnrepresentableAggs` discloses separately — not this sweep's class. */
const SIZED_BUCKET_AGG_TYPES = ['terms', 'multi_terms', 'composite'] as const;
const UNSIZED_BUCKET_AGG_TYPES = [
  'date_histogram',
  'histogram',
  'range',
] as const;

/** Bucket count used to exercise an UNSIZED bucket aggregation (no `size` to read a maximum
 * from): well above anything the char budget can carry, and realistic for a fine-grained
 * `date_histogram` (a 1-minute interval over 9 hours). */
const UNSIZED_SYNTHETIC_BUCKETS = 500;

interface LargeBucketAgg {
  tool: string;
  aggKey: string;
  kind: string;
  /** Bucket count the synthesized response will carry (the requested `size` for sized shapes). */
  size: number;
}

/** TOP-LEVEL bucket-aggregation nodes above `BREAKDOWN_BUCKET_CAP` — deliberately top-level only
 * (not a recursive walk like `population-disclosure-coverage.test.ts`'s `collectAggTypeEntries`):
 * `buildBreakdown`/`capBreakdownCarry` (digest.ts) only ever read `result.aggregations`' own
 * top-level keys, so a sub-aggregation's size is not this class's concern (its parent bucket's
 * rows already cap at the PARENT's top-level count). */
function findLargeTopLevelBucketAggs(
  tool: string,
  body: Record<string, unknown>,
): LargeBucketAgg[] {
  const aggs = (body.aggs ?? body.aggregations) as
    | Record<string, unknown>
    | undefined;
  if (!aggs) {
    return [];
  }
  const found: LargeBucketAgg[] = [];
  for (const [aggKey, aggDef] of Object.entries(aggs)) {
    if (!aggDef || typeof aggDef !== 'object' || Array.isArray(aggDef)) {
      continue;
    }
    const aggRecord = aggDef as Record<string, unknown>;
    for (const kind of SIZED_BUCKET_AGG_TYPES) {
      const spec = aggRecord[kind] as { size?: unknown } | undefined;
      if (!spec || typeof spec !== 'object') {
        continue;
      }
      const size = typeof spec.size === 'number' ? spec.size : 10; // terms default size
      if (size > BREAKDOWN_BUCKET_CAP) {
        found.push({ tool, aggKey, kind, size });
      }
    }
    for (const kind of UNSIZED_BUCKET_AGG_TYPES) {
      if (aggRecord[kind] && typeof aggRecord[kind] === 'object') {
        found.push({ tool, aggKey, kind, size: UNSIZED_SYNTHETIC_BUCKETS });
      }
    }
  }
  return found;
}

/** A response carrying exactly `agg.size` buckets at a realistic enumeration key length,
 * doc_count strictly DESCENDING (size - i) so the remainder figures asserted below are computable
 * in closed form. Descending matches a default terms ordering, but nothing below depends on it:
 * the invariant asserts the FIRST-buckets carry and the disclosure, never a ranking claim. */
function syntheticBucketsResponse(agg: LargeBucketAgg): unknown {
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

/** The exact per-entry cost model capBreakdownCarry uses (serialized entry + 1 array comma). */
function carryCost(entries: Array<Record<string, unknown>>): number {
  return entries.reduce(
    (sum, entry) => sum + JSON.stringify(entry).length + 1,
    0,
  );
}

/**
 * The class-level invariant this whole sweep exists to check, factored out so the mechanism
 * self-test below can feed it a fabricated violation directly (see that test) — proving this check
 * is capable of failing, not merely capable of passing every real tool in the registry today.
 *
 * Beyond "capped and disclosed", this asserts (issue #8935 integration review):
 *  - CARRY MAXIMALITY: when anything was hidden, one more bucket would not have fit the budget —
 *    so a regression that trimmed an enumeration back to 5 buckets behind a note cannot pass;
 *  - NOTE EXACTNESS: the disclosed remainder equals the summed hidden doc_counts and the hidden
 *    key count, so a wrong number cannot pass;
 *  - the carried buckets are a PREFIX of the response's own order (a size cut, never a re-rank).
 */
function assertBucketBudgetRespected(
  agg: LargeBucketAgg,
  digest: Digest,
): string[] {
  const problems: string[] = [];
  const carried = digest.breakdown ?? [];
  const label = `${agg.tool}/${agg.aggKey} (${agg.kind})`;
  if (carried.length > agg.size) {
    problems.push(`${label}: carried more buckets than the response held`);
  }
  for (let i = 0; i < carried.length; i++) {
    if (carried[i].key !== realisticKey(i)) {
      problems.push(
        `${label}: carried buckets are not a prefix of the response order (index ${i})`,
      );
      break;
    }
  }
  const used = carryCost(carried);
  if (used > BREAKDOWN_CHAR_BUDGET) {
    problems.push(
      `${label}: carry costs ${used} chars, above BREAKDOWN_CHAR_BUDGET ` +
        `(${BREAKDOWN_CHAR_BUDGET})`,
    );
  }
  const hiddenCount = agg.size - carried.length;
  if (hiddenCount > 0) {
    if (!digest.breakdownNote) {
      problems.push(
        `${label}: ${agg.size} buckets carried only ${carried.length}, with NO breakdownNote ` +
          '-- the hidden buckets are undisclosed',
      );
    } else {
      // doc_counts descend size..1, so the hidden tail sums to hiddenCount*(hiddenCount+1)/2.
      const hiddenSum = (hiddenCount * (hiddenCount + 1)) / 2;
      const expected = `${hiddenSum} matches across ${hiddenCount} keys`;
      if (!digest.breakdownNote.includes(expected)) {
        problems.push(
          `${label}: breakdownNote lacks the exact remainder "${expected}": ` +
            digest.breakdownNote,
        );
      }
      if (/top \d+ buckets by count/.test(digest.breakdownNote)) {
        problems.push(
          `${label}: breakdownNote claims a count ordering the digest cannot know ` +
            '(see CARRY_TRIM_SENTENCE in digest.ts)',
        );
      }
    }
    // Maximality: for a single-aggregation response the group's share IS the whole budget.
    const nextEntry = {
      key: realisticKey(carried.length),
      count: agg.size - carried.length,
    };
    if (used + JSON.stringify(nextEntry).length + 1 <= BREAKDOWN_CHAR_BUDGET) {
      problems.push(
        `${label}: carry stopped at ${carried.length} buckets with budget left over -- ` +
          'an enumeration answer was trimmed harder than the budget requires',
      );
    }
  }
  const serializedLength = JSON.stringify(digest).length;
  if (serializedLength > DIGEST_CHAR_CAP) {
    problems.push(
      `${label}: serialized digest is ${serializedLength} chars, above ` +
        `DIGEST_CHAR_CAP (${DIGEST_CHAR_CAP})`,
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
    // The escape hatch's sample body CARRIES aggregations on purpose (see the module doc comment's
    // SHAPE COVERAGE paragraph): a size-100 terms agg with an EXPLICIT non-count order (the
    // adversarial ordering for any "top by count" claim) plus an unsized date_histogram —
    // search_wazuh_data is the only tool that can reach either shape, so a stub body with no aggs
    // would contribute zero candidates and silently exempt the whole surface.
    return JSON.stringify({
      query: {
        bool: {
          filter: [{ range: { '@timestamp': { gte: 'now-7d', lte: 'now' } } }],
        },
      },
      size: 0,
      aggs: {
        rare_rules: {
          terms: {
            field: 'wazuh.rule.id',
            size: 100,
            order: { _count: 'asc' },
          },
        },
        over_time: {
          date_histogram: { field: '@timestamp', fixed_interval: '1h' },
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

test('every large top-level bucket aggregation in the registry is carried to budget with every trim disclosed', () => {
  const indexerTools = listToolDefinitions().filter(
    def => def.target === 'indexer',
  );
  assert.ok(indexerTools.length > 0, 'registry produced no indexer tools');

  const problems: string[] = [];
  const candidateTools = new Set<string>();
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
    const largeAggs = findLargeTopLevelBucketAggs(def.spec.name, request.body);
    for (const agg of largeAggs) {
      candidateCount++;
      candidateTools.add(def.spec.name);
      const response = syntheticBucketsResponse(agg);
      const digest = buildDigest(def.spec.name, response, def);
      problems.push(...assertBucketBudgetRespected(agg, digest));
    }
  }

  // Guards the sweep itself against silently checking nothing — get_sca_results' limit-driven
  // `policies` agg (clamped to MAX_AGG_SIZE=100 by the ABSURD `limit` above) must trip it, and so
  // must the escape hatch (whose exemption was exactly how the first cut of this sweep went blind
  // to every non-terms shape — see the module doc comment).
  assert.ok(
    candidateCount > 0,
    'expected at least one answer-sized (> BREAKDOWN_BUCKET_CAP) bucket aggregation in the ' +
      'registry (e.g. get_sca_results) -- if none exist, this sweep is vacuously passing',
  );
  assert.ok(
    candidateTools.has('search_wazuh_data'),
    'the escape hatch contributed no candidates -- its query_dsl sample must carry aggregations ' +
      'so the one surface that can produce every bucket shape is never exempt',
  );

  assert.deepEqual(
    problems,
    [],
    'A tool builds a large bucket aggregation whose response digest.ts does not carry to budget ' +
      "or fully disclose within DIGEST_CHAR_CAP. Extend digest.ts's " +
      'capBreakdownCarry/mergeTruncation/buildBucketTruncationNote before loosening this test.',
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
  const agg: LargeBucketAgg = {
    tool: 'synthetic_tool',
    aggKey: 'enumeration',
    kind: 'terms',
    size: 200,
  };
  const def = buildMinimalToolDef();
  const digest = buildDigest(def.spec.name, syntheticBucketsResponse(agg), def);
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
  const agg: LargeBucketAgg = {
    tool: 'synthetic_tool',
    aggKey: 'policies',
    kind: 'terms',
    size: 100,
  };
  const brokenDigest: Digest = {
    tool: 'synthetic_tool',
    counts: { returned: 100, truncated: false },
    breakdown: Array.from({ length: 100 }, (_, i) => ({
      key: realisticKey(i),
      count: 100 - i,
    })),
    samples: [],
    columns: [],
  };
  const problems = assertBucketBudgetRespected(agg, brokenDigest);
  assert.ok(
    problems.length > 0,
    'expected the mechanism to flag an uncapped, undisclosed 100-bucket breakdown',
  );
  // And the OPPOSITE regression too: a 5-bucket over-trim behind a note must be flagged as
  // non-maximal, not accepted as "capped and disclosed".
  const overTrimmed: Digest = {
    tool: 'synthetic_tool',
    counts: { returned: 100, truncated: false },
    breakdown: Array.from({ length: 5 }, (_, i) => ({
      key: realisticKey(i),
      count: 100 - i,
    })),
    breakdownNote:
      'Per-bucket counts are exact, but the bucket list is incomplete.',
    samples: [],
    columns: [],
  };
  assert.ok(
    assertBucketBudgetRespected(agg, overTrimmed).length > 0,
    'expected the mechanism to flag a non-maximal (over-trimmed) carry',
  );
});
