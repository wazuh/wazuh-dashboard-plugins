import assert from 'node:assert/strict';
import { JsonSchemaProperty } from '../../../common/types';
import { listToolDefinitions } from '../registry';
import { IndexerRequest } from '../types';
import { rollUpTechniqueIdFilters } from '../technique-rollup';

/**
 * Class-level guard for issue #8920 item 2 (sub-technique rollup): ANY catalog tool that accepts a
 * technique-id parameter must roll a bare parent id ("T1059") up to include its sub-techniques
 * (an exact `term` PLUS a sibling `prefix` on "T1059."), never match only the parent's own exact
 * bucket -- MITRE ATT&CK itself treats a parent technique as covering its children, so a
 * `term`-only filter on "T1059" silently excludes every "T1059.001"/"T1059.002"/... finding and
 * undercounts "how many T1059 findings" questions. A dotted id ("T1059.001") already names one
 * specific sub-technique and must stay an exact match, never broadened further.
 *
 * Driven from `listToolDefinitions()`, not a hardcoded tool-name list -- following this repo's
 * `agg-size-coverage.test.ts`/`field-policy-coverage.test.ts` convention, **nothing is exempt by
 * default**: a future tool that adds a technique-id parameter (get_mitre_findings and get_rules
 * today) is checked automatically the moment it lands in the registry, and fails this test until
 * its EXECUTED body rolls up the same way. "Executed" is load-bearing: executor.ts applies
 * technique-rollup.ts's chokepoint transform to every indexer body (typed tool and the
 * search_wazuh_data escape hatch alike), so the per-tool assertions below run each built body
 * through the same transform, and a separate block pins the transform itself against
 * hand-written escape-hatch shapes.
 */

/** Matches a technique-id-shaped param name regardless of exact spelling ("technique_id",
 * "techniqueId", "mitre_technique_id", ...) -- deliberately loose so a differently-named future
 * param is still caught, at the cost of also matching a hypothetical unrelated "id" param that
 * happens to mention "technique"; that tradeoff favors a false-positive coverage check (a param
 * this test wrongly probes with "T1059", which then simply fails its own tool's validation and is
 * reported as a `buildRequest` failure below) over a false-negative one (a real technique-id param
 * silently unchecked). */
const TECHNIQUE_ID_PARAM_RE = /technique.?_?id/i;

/** Field paths a technique-id filter could legitimately target -- a suffix match (not a single
 * hardcoded literal) so a future MITRE-technique field is still covered without editing this
 * test. */
const TECHNIQUE_ID_FIELD_RE = /technique\.id$/i;

/** Minimal valid value for one declared param. Kept independent of `agg-size-coverage.test.ts`'s
 * own `sampleValue` (not imported) so this file's only special case is the technique-id override
 * below, and does not inherit that file's unrelated special-casing. */
function sampleValue(name: string, prop: JsonSchemaProperty): unknown {
  if (TECHNIQUE_ID_PARAM_RE.test(name)) {
    return 'T1059';
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
  overrides: Record<string, unknown>,
): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  for (const [name, prop] of Object.entries(properties)) {
    params[name] = sampleValue(name, prop);
  }
  return { ...params, ...overrides };
}

/** Every `term`/`prefix` clause anywhere in the tree whose field matches `TECHNIQUE_ID_FIELD_RE`,
 * bucketed by clause type -- a hand-rolled walk (mirroring guardrails.ts's own `walk` shape) rather
 * than importing it, so this test tracks a regression in the TOOL's own output, not in the
 * guardrail's internals (already covered separately by agg-size-coverage.test.ts). */
function collectTechniqueIdClauses(node: unknown): {
  terms: string[];
  prefixes: string[];
} {
  const found = { terms: [] as string[], prefixes: [] as string[] };
  const walk = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!value || typeof value !== 'object') {
      return;
    }
    for (const [key, clauseValue] of Object.entries(
      value as Record<string, unknown>,
    )) {
      if (
        (key === 'term' || key === 'prefix') &&
        clauseValue &&
        typeof clauseValue === 'object' &&
        !Array.isArray(clauseValue)
      ) {
        for (const [field, fieldValue] of Object.entries(
          clauseValue as Record<string, unknown>,
        )) {
          if (
            TECHNIQUE_ID_FIELD_RE.test(field) &&
            typeof fieldValue === 'string'
          ) {
            (key === 'term' ? found.terms : found.prefixes).push(fieldValue);
          }
        }
      }
      walk(clauseValue);
    }
  };
  walk(node);
  return found;
}

const techniqueIdTools = listToolDefinitions().filter(def =>
  Object.keys(def.spec.parameters.properties).some(name =>
    TECHNIQUE_ID_PARAM_RE.test(name),
  ),
);

test('registry produced at least one technique-id tool to check', () => {
  assert.ok(
    techniqueIdTools.length > 0,
    'no tool in the registry declares a technique-id-shaped parameter -- either the registry ' +
      'lost get_mitre_findings, or TECHNIQUE_ID_PARAM_RE needs updating to match a renamed param',
  );
});

test('a bare parent id rolls up to term + sibling prefix, never a bare exact-only term', () => {
  const failures: string[] = [];
  for (const def of techniqueIdTools) {
    const paramName = Object.keys(def.spec.parameters.properties).find(name =>
      TECHNIQUE_ID_PARAM_RE.test(name),
    ) as string;
    const params = sampleParams(def.spec.parameters.properties, {
      [paramName]: 'T1059',
    });
    let request: IndexerRequest;
    try {
      request = def.buildRequest(params) as IndexerRequest;
    } catch (error) {
      failures.push(
        `${def.spec.name}: buildRequest threw for "T1059" -- ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      continue;
    }
    // The EXECUTED body is what matters: executor.ts applies rollUpTechniqueIdFilters to every
    // indexer body (typed tool or escape hatch), so a tool may either roll up in its own
    // buildRequest (get_mitre_findings does, for the sake of its description/tests) or inherit
    // the chokepoint transform (get_rules does) -- both are asserted here exactly as they run.
    const executedBody = rollUpTechniqueIdFilters(request.body);
    const { terms, prefixes } = collectTechniqueIdClauses(executedBody);
    if (!terms.includes('T1059') || !prefixes.includes('T1059.')) {
      failures.push(
        `${def.spec.name}: "T1059" must roll up to a term("T1059") AND a sibling ` +
          `prefix("T1059.") clause on a *technique.id field -- got terms=${JSON.stringify(
            terms,
          )} prefixes=${JSON.stringify(prefixes)}`,
      );
    }
  }
  assert.deepEqual(
    failures,
    [],
    'A tool accepting a technique-id parameter does not roll a bare parent id up to include its ' +
      'sub-techniques. Build the filter as {bool:{minimum_should_match:1, should:[{term:{field: ' +
      'id}}, {prefix:{field: `${id}.`}}]}} -- see get-mitre-findings.ts.',
  );
});

test('a dotted sub-technique id stays an exact match, never broadened with a prefix', () => {
  const failures: string[] = [];
  for (const def of techniqueIdTools) {
    const paramName = Object.keys(def.spec.parameters.properties).find(name =>
      TECHNIQUE_ID_PARAM_RE.test(name),
    ) as string;
    const params = sampleParams(def.spec.parameters.properties, {
      [paramName]: 'T1059.001',
    });
    let request: IndexerRequest;
    try {
      request = def.buildRequest(params) as IndexerRequest;
    } catch (error) {
      failures.push(
        `${def.spec.name}: buildRequest threw for "T1059.001" -- ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      continue;
    }
    const { terms, prefixes } = collectTechniqueIdClauses(
      rollUpTechniqueIdFilters(request.body),
    );
    if (!terms.includes('T1059.001')) {
      failures.push(
        `${def.spec.name}: "T1059.001" must still produce an exact term("T1059.001") clause -- ` +
          `got terms=${JSON.stringify(terms)}`,
      );
    }
    if (prefixes.length > 0) {
      failures.push(
        `${def.spec.name}: "T1059.001" (already a specific sub-technique) must NOT be broadened ` +
          `with a prefix clause -- got prefixes=${JSON.stringify(prefixes)}`,
      );
    }
  }
  assert.deepEqual(
    failures,
    [],
    'A dotted sub-technique id must stay an exact-only match -- rolling it up further would over-' +
      'broaden past what the caller explicitly asked for.',
  );
});

// --- the CHOKEPOINT half: executor.ts applies rollUpTechniqueIdFilters to every EXECUTED indexer
// body, so the class cannot be reproduced through the search_wazuh_data escape hatch's
// hand-written DSL (which no per-tool test above can see). These pin the transform itself. ---

test('chokepoint rollup: a hand-written bare-parent term on a technique-id field is rolled up', () => {
  const body = {
    query: {
      bool: {
        filter: [
          { range: { '@timestamp': { gte: 'now-7d', lte: 'now' } } },
          { term: { 'wazuh.rule.mitre.technique.id': 'T1059' } },
        ],
      },
    },
    size: 20,
  };
  const rolled = rollUpTechniqueIdFilters(body);
  const { terms, prefixes } = collectTechniqueIdClauses(rolled);
  assert.deepEqual(terms, ['T1059']);
  assert.deepEqual(prefixes, ['T1059.']);
  // The original body is never mutated.
  const original = collectTechniqueIdClauses(body);
  assert.deepEqual(original.prefixes, []);
});

test('chokepoint rollup: a lowercase id is uppercased (keyword term/prefix are case-sensitive)', () => {
  const rolled = rollUpTechniqueIdFilters({
    query: {
      bool: {
        filter: [{ term: { 'wazuh.rule.mitre.technique.id': 't1110' } }],
      },
    },
  });
  const { terms, prefixes } = collectTechniqueIdClauses(rolled);
  assert.deepEqual(terms, ['T1110']);
  assert.deepEqual(prefixes, ['T1110.']);
});

test('chokepoint rollup: a dotted sub-technique id stays exact (case-normalized only)', () => {
  const rolled = rollUpTechniqueIdFilters({
    query: {
      bool: {
        filter: [{ term: { 'wazuh.rule.mitre.technique.id': 't1059.001' } }],
      },
    },
  });
  const { terms, prefixes } = collectTechniqueIdClauses(rolled);
  assert.deepEqual(terms, ['T1059.001']);
  assert.deepEqual(prefixes, []);
});

test('chokepoint rollup: non-technique terms and aggregations pass through untouched', () => {
  const body = {
    query: {
      bool: { filter: [{ term: { 'wazuh.agent.name': 'T1059' } }] },
    },
    aggs: {
      technique_ids: {
        terms: { field: 'wazuh.rule.mitre.technique.id', size: 5 },
      },
    },
  };
  const rolled = rollUpTechniqueIdFilters(body);
  assert.deepEqual(rolled.aggs, body.aggs);
  const filter = (rolled.query as { bool: { filter: unknown[] } }).bool.filter;
  assert.deepEqual(filter, [{ term: { 'wazuh.agent.name': 'T1059' } }]);
});

test('chokepoint rollup: idempotent over an already-rolled body', () => {
  const once = rollUpTechniqueIdFilters({
    query: {
      bool: {
        filter: [{ term: { 'wazuh.rule.mitre.technique.id': 'T1059' } }],
      },
    },
  });
  const twice = rollUpTechniqueIdFilters(once);
  assert.deepEqual(twice, once);
});

// --- the DISCLOSURE half: broadening a match without disclosing the per-exact-id split would let
// a rolled-up call return rows the model cannot attribute. Every technique-id tool must attach a
// terms AGGREGATION on a technique-id field alongside the rolled filter, so the digest breakdown
// carries the exact-vs-sub-technique counts as data. ---

/** Terms AGGREGATION nodes (not query clauses) on a technique-id field: walks only aggs MAPS. */
function hasTechniqueIdTermsAgg(body: Record<string, unknown>): boolean {
  let found = false;
  const walkAggsMap = (aggs: unknown): void => {
    if (found || !aggs || typeof aggs !== 'object' || Array.isArray(aggs)) {
      return;
    }
    for (const aggDef of Object.values(aggs as Record<string, unknown>)) {
      if (!aggDef || typeof aggDef !== 'object' || Array.isArray(aggDef)) {
        continue;
      }
      const record = aggDef as Record<string, unknown>;
      const termsSpec = record.terms as { field?: unknown } | undefined;
      if (
        termsSpec &&
        typeof termsSpec.field === 'string' &&
        TECHNIQUE_ID_FIELD_RE.test(termsSpec.field)
      ) {
        found = true;
        return;
      }
      walkAggsMap(record.aggs ?? record.aggregations);
    }
  };
  walkAggsMap(body.aggs ?? body.aggregations);
  return found;
}

test('every technique-id tool attaches a terms agg on the technique-id field (the disclosure)', () => {
  const failures: string[] = [];
  for (const def of techniqueIdTools) {
    const paramName = Object.keys(def.spec.parameters.properties).find(name =>
      TECHNIQUE_ID_PARAM_RE.test(name),
    ) as string;
    const params = sampleParams(def.spec.parameters.properties, {
      [paramName]: 'T1059',
    });
    let request: IndexerRequest;
    try {
      request = def.buildRequest(params) as IndexerRequest;
    } catch {
      continue; // already reported by the rollup test above
    }
    const perRowAttribution = def.digest.sampleColumns.some(column =>
      TECHNIQUE_ID_FIELD_RE.test(column),
    );
    if (!hasTechniqueIdTermsAgg(request.body) && !perRowAttribution) {
      failures.push(
        `${def.spec.name}: rolls a technique-id filter up but discloses no per-exact-id split ` +
          '-- the model gets extra rows it cannot attribute to a sub-technique. Attach a terms ' +
          'agg on the technique-id field (see get-mitre-findings.ts technique_ids; requires an ' +
          'AGG_FIELD_ALLOWLIST entry) or carry the technique-id field in digest.sampleColumns ' +
          'so each row self-identifies.',
      );
    }
  }
  assert.deepEqual(failures, []);
});
