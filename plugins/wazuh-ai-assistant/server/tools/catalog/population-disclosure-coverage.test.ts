import assert from 'node:assert/strict';
import { JsonSchemaProperty } from '../../../common/types';
import { listToolDefinitions } from '../registry';
import { ToolDefinition, IndexerRequest } from '../types';

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
 * Deliberately "at least one of (a)-(d)", not "exactly one": several tools legitimately satisfy
 * more than one branch at once, and that overlap is CORRECT, not a defect to flag --
 * `get_sca_results` is size:0 with a terms agg (both (a) and (b)); every finding-hits tool (and,
 * after this issue's fix, get_compliance_alerts/get_mitre_findings/search_findings_by_os) attaches
 * a real `terms` agg AND opts into `breakdownDimensions` (both (b) and (c), the digest-side
 * fallback for whenever a real aggregation is genuinely absent — see common.ts's
 * `FINDING_BREAKDOWN_AGGS`/`ToolDefinition.digest.breakdownDimensions` doc comments). An "exactly
 * one" assertion would therefore fail on tools that are demonstrably fine.
 */

/**
 * Tools that deliberately do NOT carry a breakdown mechanism, with the reason spelled out. Every
 * value must be a non-empty, SPECIFIC reason — "not applicable" or similar would defeat the point
 * of this map (a future tool could copy-paste its way past the check).
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
  // --- Known, named, NOT-YET-FIXED gaps (out of scope for issue #8920's cluster A3) -----------
  // Security Analytics catalog/config content on wazuh-threatintel-rules*: none of its
  // `document.*` fields are yet on guardrails.ts's AGG_FIELD_ALLOWLIST, and giving it one needs
  // the same live-mapping verification standard this repo already holds itself to elsewhere (see
  // get-agent-inventory.ts's own doc comment on its 8 still-unimplemented inventory kinds).
  // Deliberately left as an admitted gap, not a silent "fine" -- tracked as a follow-up cluster.
  get_rules:
    'NOT YET FIXED (known gap, out of scope for issue #8920 cluster A3): Security Analytics ' +
    'catalog content (document.* fields on wazuh-threatintel-rules*) -- none of its fields are ' +
    'yet on guardrails.ts AGG_FIELD_ALLOWLIST; needs its own live-mapping-verified aggregation ' +
    'design before a real or synthetic breakdown can be added. Tracked as a follow-up.',
  get_threat_intel_components:
    'NOT YET FIXED (known gap, out of scope for issue #8920 cluster A3): Security Analytics ' +
    'pipeline/config content (document.* fields across 5 wazuh-threatintel-* families) -- same ' +
    'gap as get_rules. Tracked as a follow-up.',
  get_detectors:
    'NOT YET FIXED (known gap, out of scope for issue #8920 cluster A3): detector.* fields live ' +
    'inside a `nested` document on .opensearch-sap-detectors-config, which needs a nested ' +
    'aggregation wrapper, not a plain top-level terms agg -- needs its own design. Tracked as a ' +
    'follow-up.',
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

/**
 * Builds every declared param for one tool. `get_agent_inventory` is special-cased to `kind:
 * 'ports'` rather than the generic enum-default ('os', the first listed kind): the exemption for
 * this tool is PER-KIND (see `get-agent-inventory.test.ts`'s own assertions that `os`/`packages`/
 * `hotfixes` deliberately carry no breakdown agg, with the reasons written on
 * `InventoryKindConfig.breakdownAggs`'s doc comment) -- this registry-wide check only needs ONE
 * kind that demonstrates the tool as a whole satisfies the invariant, and `ports` is the one that
 * actually carries a real breakdown aggregation.
 */
function sampleParams(def: ToolDefinition): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  for (const [name, prop] of Object.entries(def.spec.parameters.properties)) {
    params[name] = sampleValue(name, prop);
  }
  if (def.spec.name === 'get_agent_inventory') {
    params.kind = 'ports';
  }
  return params;
}

/** True when `body.size === 0` and at least one top-level bucket aggregation is declared --
 * "aggregation tool: population by construction" (branch (a), e.g. get_top_rules/get_sca_results).
 */
function hasSizeZeroWithAgg(body: Record<string, unknown>): boolean {
  const aggs = (body.aggs ?? body.aggregations) as
    | Record<string, unknown>
    | undefined;
  return (
    body.size === 0 && aggs !== undefined && Object.keys(aggs).length > 0
  );
}

/** True when `body.aggs`/`body.aggregations` contains a `terms` aggregation anywhere in its
 * (possibly nested, e.g. get_sca_results' per-policy sub-aggs) subtree -- "real breakdown
 * attached" (branch (b)), regardless of whether the top-level query is also a hits search (`size`
 * > 0, e.g. get_sca_checks/get_agent_inventory/the vulnerability tools/every finding-hits tool). */
function hasRealTermsAggregation(body: Record<string, unknown>): boolean {
  let found = false;
  const walk = (node: unknown, insideAggs: boolean): void => {
    if (found || !node || typeof node !== 'object') {
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(item => walk(item, insideAggs));
      return;
    }
    for (const [key, value] of Object.entries(
      node as Record<string, unknown>,
    )) {
      if (key === 'aggs' || key === 'aggregations') {
        walk(value, true);
        continue;
      }
      if (insideAggs && key === 'terms') {
        found = true;
        return;
      }
      walk(value, insideAggs);
    }
  };
  walk(body, false);
  return found;
}

test('every registry tool discloses a population-true breakdown, or is a reasoned exemption', () => {
  const defs = listToolDefinitions();
  assert.ok(defs.length > 0, 'registry produced no tools to check');

  const failures: string[] = [];
  for (const def of defs) {
    const exemptReason = POPULATION_DISCLOSURE_EXEMPT[def.spec.name];
    if (exemptReason !== undefined) {
      continue; // (d) -- reasoned exemption, checked for non-emptiness in a separate test below.
    }

    if (
      def.digest.breakdownDimensions &&
      def.digest.breakdownDimensions.length > 0
    ) {
      continue; // (c) -- synthetic fallback opted in.
    }

    if (def.target !== 'indexer') {
      failures.push(
        `${def.spec.name}: target="${def.target}" has no aggregation facility and no ` +
          'breakdownDimensions fallback, and is not in POPULATION_DISCLOSURE_EXEMPT',
      );
      continue;
    }

    const params = sampleParams(def);
    let request: IndexerRequest;
    try {
      request = def.buildRequest(params) as IndexerRequest;
    } catch (error) {
      failures.push(
        `${def.spec.name}: buildRequest threw for its own sample params -- ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      continue;
    }

    if (
      hasSizeZeroWithAgg(request.body) ||
      hasRealTermsAggregation(request.body)
    ) {
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

// --- Direct, focused regression checks for the specific mechanisms this test's generic loop
// above already exercises -- kept as a second, independent sanity check on the helper functions
// themselves (same "sanity-check the helper" precedent as field-policy-coverage.test.ts's
// "isFieldCovered mechanism" test). ---

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

  // A nested sub-aggregation's terms clause (get_sca_results-shaped) is still found.
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
});
