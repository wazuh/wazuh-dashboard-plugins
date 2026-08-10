import assert from 'node:assert/strict';
import { JsonSchemaProperty } from '../../../common/types';
import { listToolDefinitions } from '../registry';
import { ToolDefinition, IndexerRequest } from '../types';
import { BREAKDOWN_BUCKET_CAP } from '../digest';

/**
 * Class-level guard for issue #8920 item 1 ("sample narrated as population"): a tool whose digest
 * samples are a strict subset of its rows gives the model no population-true view of any
 * categorical dimension, so completeness/absence claims ("named 2 of 10 failed checks", "no
 * high-severity vulnerabilities") get made from a handful of sample rows instead of the actual
 * matched set. The mechanism to prevent this already exists twice on base:
 *
 *   (a)/(b) a REAL OpenSearch aggregation (`terms`, possibly under `size: 0`) — population-true by
 *       construction, since OpenSearch computes `aggregations` over the FULL matched set
 *       regardless of `size`/`limit` (digest.ts's `buildBreakdown`); or
 *   (c) the SYNTHETIC `digest.breakdownDimensions` fallback — groups every RETURNED row (not just
 *       the sample), exact when the result isn't itself `limit`-truncated and clearly labeled
 *       page-only (`Digest.breakdownNote`) otherwise (digest.ts's `buildSyntheticBreakdown`).
 *
 * This test extends that invariant to EVERY tool in the registry: for each one, assert it uses (a),
 * (b), or (c), OR (d) is named in `POPULATION_DISCLOSURE_EXEMPT` below with a written reason.
 * **Nothing is exempt by default** — a future row-returning tool with no breakdown and no reasoned
 * exemption fails this suite, the same "nothing exempt by default" standard as
 * `agg-size-coverage.test.ts` and `field-policy-coverage.test.ts`.
 *
 * The helper predicates are deliberately STRICT, each in response to a way this test could
 * otherwise be satisfied without the property it claims to prove:
 *   - (b) requires `terms` to be an aggregation NODE's own type key (a `terms` QUERY clause
 *     nested inside a `filter` sub-aggregation returns a doc_count, not buckets — it must not
 *     count), with a real `field` and `size >= BREAKDOWN_BUCKET_CAP` (a size:1 "breakdown" is not
 *     a distribution).
 *   - (a) requires a BUCKET aggregation type under size:0 — a metric-only cardinality/avg body
 *     returns no buckets at all and must not count as "population by construction".
 *   - (c) requires every declared dimension to be REACHABLE in the tool's own rows: present in
 *     the built body's `_source` (union across `kind` enum values for multi-kind tools), or the
 *     tool sends no `_source` at all (full documents). A dimension `getByPath` can never resolve
 *     produces no buckets at runtime — a declared-but-dead fallback must fail here, not pass.
 *
 * Deliberately "at least one of (a)-(d)", not "exactly one": several tools legitimately satisfy
 * more than one branch at once, and that overlap is CORRECT, not a defect to flag --
 * `get_sca_results` is size:0 with a terms agg (both (a) and (b)); every finding-hits tool
 * attaches a real `terms` agg AND opts into `breakdownDimensions` (both (b) and (c), the
 * digest-side fallback for whenever a real aggregation is genuinely absent). An "exactly one"
 * assertion would therefore fail on tools that are demonstrably fine.
 */

/**
 * Tools that deliberately do NOT carry a breakdown mechanism, with the reason spelled out. Every
 * value must be a non-empty, SPECIFIC reason — "not applicable" or similar would defeat the point
 * of this map (a future tool could copy-paste its way past the check). A separate test below also
 * asserts each exempt tool really has NO breakdown mechanism, so an exemption cannot silently
 * outlive its own fix.
 */
const POPULATION_DISCLOSURE_EXEMPT: Record<string, string> = {
  // Manager-API target: the Manager returns `total_affected_items` (a population-true COUNT) but
  // has no aggregation facility at all to break that count down by a categorical field the way an
  // Indexer `terms` agg does -- there is no analogous mechanism this tool could attach.
  get_agents:
    'Manager API target (GET /agents) -- total_affected_items gives a population-true count, ' +
    'but the Manager API has no aggregation facility to break it down by a categorical field.',
  // Exact-ID lookup: returns at most a handful of documents matching a caller-supplied ID value,
  // never an open-ended result whose categorical distribution a breakdown would meaningfully
  // summarize (see find-document-by-field.ts's own doc comment).
  find_document_by_field:
    'Exact-ID lookup (an "ids"/"term" bool.should over ID_FIELD_ALLOWLIST fields) -- returns at ' +
    'most a handful of documents matching a caller-supplied ID, not a population a categorical ' +
    'breakdown could meaningfully summarize.',
  // Escape hatch: the query body (including any "aggs") is authored by the MODEL, not built by
  // this catalog -- the population-disclosure guarantee for a hand-written aggregation is the
  // model's own responsibility, the same boundary every other guardrail applied to this tool's
  // output already draws (see search-wazuh-data.ts's own doc comment).
  search_wazuh_data:
    'Escape hatch: the query body (including any "aggs") is model-authored, not built by this ' +
    'catalog -- the population-disclosure guarantee for a hand-authored aggregation is the ' +
    "model's own responsibility, same boundary as every other guardrail on this tool's output.",
};

/**
 * Minimal valid value for one declared param, so `buildRequest` gets far enough to produce a body
 * -- mirrors `agg-size-coverage.test.ts`'s `sampleValue`, simplified: this test does not need an
 * absurd limit, only a value shape every validator in the catalog accepts.
 */
function sampleValue(name: string, prop: JsonSchemaProperty): unknown {
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
  def: ToolDefinition,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  for (const [name, prop] of Object.entries(def.spec.parameters.properties)) {
    params[name] = sampleValue(name, prop);
  }
  return { ...params, ...overrides };
}

/** Every enum value of a tool's `kind` param, or `[undefined]` for tools without one — used to
 * drive multi-kind tools (get_agent_inventory) once per kind instead of only the enum default. */
function kindVariants(def: ToolDefinition): Array<string | undefined> {
  const kindProp = def.spec.parameters.properties.kind as
    | { enum?: unknown[] }
    | undefined;
  if (kindProp && Array.isArray(kindProp.enum) && kindProp.enum.length > 0) {
    return kindProp.enum.filter(
      (value): value is string => typeof value === 'string',
    );
  }
  return [undefined];
}

/** Aggregation types whose response is an ARRAY of buckets — what "population by construction"
 * actually requires under size:0 (a metric-only agg returns no buckets at all). */
const BUCKET_AGG_TYPE_KEYS = new Set([
  'terms',
  'significant_terms',
  'date_histogram',
  'histogram',
  'range',
  'date_range',
]);
/** Reserved keys inside an aggregation definition that are not the aggregation's type. */
const NON_TYPE_AGG_KEYS = new Set(['aggs', 'aggregations', 'meta']);

/**
 * Structurally walks the body's aggregation MAPS (agg name → definition), collecting each
 * aggregation node's (type, spec) pairs at every nesting level. Because only aggregation maps are
 * walked — never query clauses — a `terms` QUERY clause inside a `filter` sub-aggregation
 * (`aggs: {failed: {filter: {terms: {...}}}}`) can never be mistaken for a terms AGGREGATION.
 */
function collectAggTypeEntries(
  body: Record<string, unknown>,
): Array<{ type: string; spec: unknown }> {
  const entries: Array<{ type: string; spec: unknown }> = [];
  const walkAggsMap = (aggs: unknown): void => {
    if (!aggs || typeof aggs !== 'object' || Array.isArray(aggs)) {
      return;
    }
    for (const aggDef of Object.values(aggs as Record<string, unknown>)) {
      if (!aggDef || typeof aggDef !== 'object' || Array.isArray(aggDef)) {
        continue;
      }
      const record = aggDef as Record<string, unknown>;
      for (const [key, value] of Object.entries(record)) {
        if (!NON_TYPE_AGG_KEYS.has(key)) {
          entries.push({ type: key, spec: value });
        }
      }
      walkAggsMap(record.aggs ?? record.aggregations);
    }
  };
  walkAggsMap(body.aggs ?? body.aggregations);
  return entries;
}

/** Branch (a): `size: 0` with at least one BUCKET aggregation — "population by construction".
 * A metric-only agg body (cardinality/avg under size:0) deliberately does NOT qualify: it
 * returns a number, not a categorical distribution. */
function hasSizeZeroWithAgg(body: Record<string, unknown>): boolean {
  if (body.size !== 0) {
    return false;
  }
  return collectAggTypeEntries(body).some(entry =>
    BUCKET_AGG_TYPE_KEYS.has(entry.type),
  );
}

/** Branch (b): a real `terms` AGGREGATION node (see `collectAggTypeEntries`) with an actual
 * `field` and `size >= BREAKDOWN_BUCKET_CAP` — a fieldless or size:1 terms agg is not a
 * population disclosure. */
function hasRealTermsAggregation(body: Record<string, unknown>): boolean {
  return collectAggTypeEntries(body).some(entry => {
    if (entry.type !== 'terms') {
      return false;
    }
    const spec = entry.spec as { field?: unknown; size?: unknown } | undefined;
    return (
      typeof spec?.field === 'string' &&
      typeof spec?.size === 'number' &&
      spec.size >= BREAKDOWN_BUCKET_CAP
    );
  });
}

/**
 * Branch (c) validity: every declared `breakdownDimensions` entry must be REACHABLE in the tool's
 * rows — either the tool never restricts `_source` (full documents), or the dimension appears in
 * the union of `_source` lists across the tool's `kind` variants. Returns the unreachable
 * dimensions (empty array = all reachable). Manager-target tools return full items, so their
 * dimensions are always considered reachable.
 */
function unreachableDimensions(def: ToolDefinition): string[] {
  const dims = def.digest.breakdownDimensions ?? [];
  if (dims.length === 0 || def.target !== 'indexer') {
    return [];
  }
  const sourceUnion = new Set<string>();
  let anyUnrestricted = false;
  for (const kind of kindVariants(def)) {
    let request: IndexerRequest;
    try {
      request = def.buildRequest(
        sampleParams(def, kind !== undefined ? { kind } : {}),
      ) as IndexerRequest;
    } catch {
      continue; // a kind whose sample params don't validate is checked by other suites
    }
    const source = request.body._source;
    if (!Array.isArray(source)) {
      anyUnrestricted = true;
      break;
    }
    for (const field of source) {
      if (typeof field === 'string') {
        sourceUnion.add(field);
      }
    }
  }
  if (anyUnrestricted) {
    return [];
  }
  return dims.filter(dimension => !sourceUnion.has(dimension));
}

test('every registry tool discloses a population-true breakdown, or is a reasoned exemption', () => {
  const defs = listToolDefinitions();
  assert.ok(defs.length > 0, 'registry produced no tools to check');

  const failures: string[] = [];
  for (const def of defs) {
    const exemptReason = POPULATION_DISCLOSURE_EXEMPT[def.spec.name];
    if (exemptReason !== undefined) {
      continue; // (d) -- reasoned exemption, itself audited by the tests below.
    }

    // A declared-but-unreachable dimension is a latent lie regardless of which branch the tool
    // ends up qualifying under — flag it even when a real aggregation also exists.
    const deadDims = unreachableDimensions(def);
    if (deadDims.length > 0) {
      failures.push(
        `${def.spec.name}: breakdownDimensions [${deadDims.join(
          ', ',
        )}] are not reachable in ` +
          "the tool's own _source — getByPath can never resolve them, so the declared fallback " +
          'is dead code',
      );
      continue;
    }

    if (
      def.digest.breakdownDimensions &&
      def.digest.breakdownDimensions.length > 0
    ) {
      continue; // (c) -- synthetic fallback opted in (and validated reachable above).
    }

    if (def.target !== 'indexer') {
      failures.push(
        `${def.spec.name}: target="${def.target}" has no aggregation facility and no ` +
          'breakdownDimensions fallback, and is not in POPULATION_DISCLOSURE_EXEMPT',
      );
      continue;
    }

    // Multi-kind tools must satisfy the invariant per-kind through their own colocated test
    // (get-agent-inventory.test.ts drives every INVENTORY_KIND_CONFIG entry); here it is enough
    // that at least one kind demonstrates a mechanism, since the per-kind split is asserted
    // there, driven from the kind map itself.
    const qualifies = kindVariants(def).some(kind => {
      let request: IndexerRequest;
      try {
        request = def.buildRequest(
          sampleParams(def, kind !== undefined ? { kind } : {}),
        ) as IndexerRequest;
      } catch {
        return false;
      }
      return (
        hasSizeZeroWithAgg(request.body) ||
        hasRealTermsAggregation(request.body)
      );
    });
    if (qualifies) {
      continue; // (a) or (b).
    }

    failures.push(
      `${def.spec.name}: no size:0 bucket aggregation, no real terms aggregation, no ` +
        'breakdownDimensions fallback, and not in POPULATION_DISCLOSURE_EXEMPT',
    );
  }

  assert.deepEqual(
    failures,
    [],
    'A tool has no population-true breakdown mechanism and no reasoned exemption. Attach a real ' +
      "terms aggregation (see common.ts's FINDING_BREAKDOWN_AGGS/VULN_BREAKDOWN_AGGS), opt into " +
      'digest.breakdownDimensions, or add a named, specific reason to POPULATION_DISCLOSURE_EXEMPT.',
  );
});

test('every POPULATION_DISCLOSURE_EXEMPT entry names a real, currently-registered tool', () => {
  const registeredNames = new Set(
    listToolDefinitions().map(def => def.spec.name),
  );
  for (const name of Object.keys(POPULATION_DISCLOSURE_EXEMPT)) {
    assert.ok(
      registeredNames.has(name),
      `POPULATION_DISCLOSURE_EXEMPT names "${name}", which is not in the registry -- stale entry?`,
    );
  }
});

test('every POPULATION_DISCLOSURE_EXEMPT reason is non-empty (a real, written justification)', () => {
  for (const [name, reason] of Object.entries(POPULATION_DISCLOSURE_EXEMPT)) {
    assert.ok(
      typeof reason === 'string' && reason.trim().length > 0,
      `POPULATION_DISCLOSURE_EXEMPT["${name}"] must be a non-empty reason, not a silent exemption`,
    );
  }
});

test('no POPULATION_DISCLOSURE_EXEMPT tool secretly has a breakdown (stale-exemption guard)', () => {
  // The reverse direction: a tool that later GAINS a breakdown mechanism must drop its
  // exemption, otherwise the map accumulates entries that misdescribe the catalog.
  const byName = new Map(
    listToolDefinitions().map(def => [def.spec.name, def]),
  );
  for (const name of Object.keys(POPULATION_DISCLOSURE_EXEMPT)) {
    const def = byName.get(name);
    if (!def) {
      continue; // covered by the registered-names test above
    }
    assert.ok(
      !def.digest.breakdownDimensions ||
        def.digest.breakdownDimensions.length === 0,
      `${name}: has breakdownDimensions now — remove its stale exemption`,
    );
    if (def.target !== 'indexer') {
      continue;
    }
    const jsonStringDriven = Object.values(def.spec.parameters.properties).some(
      prop => (prop as { jsonString?: true }).jsonString,
    );
    if (jsonStringDriven) {
      continue; // escape hatch: its aggs are caller-authored, nothing static to inspect
    }
    let request: IndexerRequest;
    try {
      request = def.buildRequest(sampleParams(def)) as IndexerRequest;
    } catch {
      continue;
    }
    assert.ok(
      !hasSizeZeroWithAgg(request.body) &&
        !hasRealTermsAggregation(request.body),
      `${name}: builds a real breakdown aggregation now — remove its stale exemption`,
    );
  }
});

// --- Direct, focused regression checks for the helper predicates themselves -- the same
// "sanity-check the helper" precedent as field-policy-coverage.test.ts's "isFieldCovered
// mechanism" test: if a helper silently becomes a no-op or over-matches, the registry loop above
// would pass vacuously. ---

test('hasSizeZeroWithAgg / hasRealTermsAggregation mechanism sanity check', () => {
  // A plain hits search (no aggs at all) satisfies neither.
  const hitsOnly = { query: { match_all: {} }, size: 20 };
  assert.equal(hasSizeZeroWithAgg(hitsOnly), false);
  assert.equal(hasRealTermsAggregation(hitsOnly), false);

  // size:0 + a bucket agg (get_top_rules-shaped) satisfies (a) and (b).
  const aggOnly = {
    query: { match_all: {} },
    aggs: { top: { terms: { field: 'wazuh.rule.id', size: 5 } } },
    size: 0,
  };
  assert.equal(hasSizeZeroWithAgg(aggOnly), true);
  assert.equal(hasRealTermsAggregation(aggOnly), true);

  // A hits search WITH a real breakdown agg riding along (get_sca_checks-shaped) satisfies only
  // (b) -- size is not 0.
  const hitsWithAgg = {
    query: { match_all: {} },
    aggs: { results: { terms: { field: 'check.result', size: 5 } } },
    size: 20,
  };
  assert.equal(hasSizeZeroWithAgg(hitsWithAgg), false);
  assert.equal(hasRealTermsAggregation(hitsWithAgg), true);

  // A nested sub-aggregation's terms AGG (get_sca_results-shaped: top-level terms with filter
  // sub-aggs) is still found.
  const nested = {
    query: { match_all: {} },
    aggs: {
      policies: {
        terms: { field: 'policy.id', size: 20 },
        aggs: { passed: { filter: { term: { 'check.result': 'Passed' } } } },
      },
    },
    size: 0,
  };
  assert.equal(hasRealTermsAggregation(nested), true);

  // OVER-MATCH guards — each of these satisfied the pre-hardening helpers and must NOT count:
  // 1. A `terms` QUERY clause inside a `filter` SUB-AGGREGATION is a filtered doc count, not a
  //    bucket distribution.
  const termsQueryInFilterAgg = {
    query: { match_all: {} },
    aggs: {
      failed: { filter: { terms: { 'check.result': ['Failed'] } } },
    },
    size: 20,
  };
  assert.equal(hasRealTermsAggregation(termsQueryInFilterAgg), false);
  // 2. size:0 with a METRIC-only agg returns a number, not a population distribution.
  const metricOnly = {
    query: { match_all: {} },
    aggs: { distinct: { cardinality: { field: 'wazuh.agent.name' } } },
    size: 0,
  };
  assert.equal(hasSizeZeroWithAgg(metricOnly), false);
  assert.equal(hasRealTermsAggregation(metricOnly), false);
  // 3. A terms agg sized below BREAKDOWN_BUCKET_CAP (e.g. size:1) is not a distribution.
  const tinyTerms = {
    query: { match_all: {} },
    aggs: { top1: { terms: { field: 'wazuh.rule.id', size: 1 } } },
    size: 0,
  };
  assert.equal(hasRealTermsAggregation(tinyTerms), false);
});

test('unreachableDimensions mechanism: a dimension missing from _source is flagged', () => {
  const syntheticDef: ToolDefinition = {
    spec: {
      name: 'synthetic_offender',
      description: 'test',
      parameters: { type: 'object', properties: {} },
    },
    target: 'indexer',
    tier: 'T1',
    buildRequest: () => ({
      target: 'indexer',
      index: 'wazuh-states-inventory-packages*',
      body: {
        query: { match_all: {} },
        _source: ['package.name'],
        size: 20,
      },
    }),
    tableSpec: { columns: [] },
    digest: {
      sampleColumns: ['package.name'],
      breakdownDimensions: ['package.vendor'],
    },
  };
  assert.deepEqual(unreachableDimensions(syntheticDef), ['package.vendor']);
  // And the reachable variant passes.
  const reachable: ToolDefinition = {
    ...syntheticDef,
    digest: {
      sampleColumns: ['package.name'],
      breakdownDimensions: ['package.name'],
    },
  };
  assert.deepEqual(unreachableDimensions(reachable), []);
});
