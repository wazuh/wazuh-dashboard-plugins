import assert from 'node:assert/strict';
import { JsonSchemaProperty } from '../../../common/types';
import { listToolDefinitions } from '../registry';
import { ToolDefinition } from '../types';

/**
 * Registry-wide forward-regression fence for the "declared free-text subject parameter silently
 * ignored" class (#8935 item I2). The reported instance this item fixes is `get_sca_checks`'s
 * `search` parameter, which -- on the unfixed base -- DID reach the request (see this file's
 * "WHAT THIS SWEEP FAILS ON" note below for why that means this file is NOT that fix's witness).
 * The actual defect class is broader than that one instance: any tool that declares a
 * "narrow results by this free text" parameter and then forgets to wire it into `buildRequest`
 * ships a parameter that LOOKS load-bearing to a model (and to a human reading the schema) but
 * silently does nothing -- indistinguishable, from the outside, from a parameter that narrows
 * correctly but the narrower field/subject already happens to be empty. This sweep makes that
 * mechanical and catalog-wide instead of relying on a human noticing during review.
 *
 * WHAT COUNTS AS A "SUBJECT" PARAM: name matches `/^(search|.*_contains)$/` (today: only
 * `get_sca_checks`'s `search`; the `_contains` half exists for a future tool that names its
 * parameter e.g. `title_contains`), `type: 'string'`, no `enum` (a closed-vocabulary picker is not
 * free text), not `jsonString` (the escape hatch's raw-DSL parameter is a different contract
 * entirely, already covered by `agg-size-coverage.test.ts`'s escape-hatch handling).
 *
 * METHOD: build each qualifying tool's request with every OTHER parameter filled by a minimal
 * schema-legal value and the subject parameter itself set to a distinctive SENTINEL string. The
 * sentinel must leave a LOAD-BEARING trace somewhere in the built request body -- either verbatim
 * (a `multi_match`/`prefix`/`term` clause that embeds the raw value) or as the per-character
 * case-class pattern `get-sca-checks.ts`'s own `buildContainsIncludePattern` produces (an
 * `include`-scoped aggregation). Detected by stringifying the whole request body and searching for
 * either form, so it does not matter whether the value ends up in `query`, `post_filter`, or an
 * aggregation `include` -- the exact set of places #8935 item I2's own fix touches.
 *
 * WHAT THIS SWEEP FAILS ON: right NOW, on both the unfixed `fix/8920-*` base and this branch's fix,
 * `get_sca_checks` is the only tool with a qualifying parameter, and in BOTH cases its `search`
 * value reaches the request (base: a `query.bool.filter` multi_match/prefix should-clause; this
 * branch: the same should-clause relocated to `post_filter`, plus the new `matching_checks` agg
 * `include` when a fragment is supplied). So this sweep PASSES on the unfixed base -- it is
 * deliberately NOT the fix witness for get_sca_checks's own defect (the colocated tests in
 * `get-sca-checks.test.ts` are; several of them fail on base). This file is the FORWARD fence: the
 * next tool that declares `search`/`*_contains` and forgets to wire it in fails HERE, on the day it
 * is added, rather than shipping silently. The "mechanism self-test" below proves the fence
 * actually trips, using a fabricated tool that reproduces exactly that omission.
 */

const SUBJECT_PARAM_NAME_RE = /^(search|.*_contains)$/;

/** Letters-only (so the per-character case-class expansion below is defined for every character)
 * and distinctive enough that it will not coincidentally already appear in a tool's fixed query
 * scaffolding (field names, index names, etc.). */
const SENTINEL = 'zqsentinelzq';

/** Mirrors `get-sca-checks.ts`'s `buildContainsIncludePattern` letter-class expansion (each letter
 * -> a `[xX]` character class) so this sweep also recognizes an `include`-scoped match, not only a
 * verbatim one. SENTINEL is letters-only, so the digit/escape branches of the real function are not
 * exercised here -- they are covered directly by `get-sca-checks.test.ts`. */
function sentinelIncludeFragment(sentinel: string): string {
  return sentinel
    .split('')
    .map(char => `[${char.toLowerCase()}${char.toUpperCase()}]`)
    .join('');
}

function isFreeTextSubjectParam(
  name: string,
  prop: JsonSchemaProperty,
): boolean {
  if (!SUBJECT_PARAM_NAME_RE.test(name)) {
    return false;
  }
  if (prop.type !== 'string') {
    return false;
  }
  if ((prop as { enum?: unknown[] }).enum) {
    return false;
  }
  if ((prop as { jsonString?: true }).jsonString) {
    return false;
  }
  return true;
}

/**
 * Minimal, permissive filler value for every OTHER declared parameter -- just enough to get
 * `buildRequest` to run without throwing on an unrelated validator (agent-id shape, a required
 * non-empty string, ...). Deliberately simpler than `agg-size-coverage.test.ts`'s `sampleValue`
 * (that sweep probes size behaviour; this one only needs `buildRequest` to succeed), but the same
 * spirit: real, schema-legal values, not an attempt at realistic data.
 */
function fillerValue(name: string, prop: JsonSchemaProperty): unknown {
  const enumValues = (prop as { enum?: unknown[] }).enum;
  if (Array.isArray(enumValues) && enumValues.length > 0) {
    return enumValues[0];
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
  if (prop.type === 'number') {
    return 1;
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
  return 'test-value';
}

function requestBodyRecord(
  request: ReturnType<ToolDefinition['buildRequest']>,
): Record<string, unknown> {
  return request.target === 'indexer'
    ? request.body
    : (request.params as Record<string, unknown>);
}

/**
 * Runs the sweep's check for ONE tool/subject-parameter pair. Factored out of the registry-driving
 * test below so the mechanism self-test can call it directly against a fabricated tool without
 * registering that tool anywhere in the real catalog. Returns a failure message, or `undefined`
 * when the sentinel left a load-bearing trace.
 */
function checkSubjectParam(
  def: ToolDefinition,
  paramName: string,
): string | undefined {
  const params: Record<string, unknown> = {};
  for (const [name, prop] of Object.entries(def.spec.parameters.properties)) {
    params[name] = name === paramName ? SENTINEL : fillerValue(name, prop);
  }
  let request: ReturnType<ToolDefinition['buildRequest']>;
  try {
    request = def.buildRequest(params);
  } catch (error) {
    return (
      `${def.spec.name}.${paramName}: buildRequest threw with a sentinel value in it -- ` +
      `${error instanceof Error ? error.message : String(error)}`
    );
  }
  const serialized = JSON.stringify(requestBodyRecord(request));
  const includeFragment = sentinelIncludeFragment(SENTINEL);
  if (!serialized.includes(SENTINEL) && !serialized.includes(includeFragment)) {
    return (
      `${def.spec.name}.${paramName}: declared as a free-text subject parameter, but a sentinel ` +
      'value placed in it left no trace (verbatim or include-pattern) anywhere in the built ' +
      'request body -- the parameter looks load-bearing to a caller but is silently ignored.'
    );
  }
  return undefined;
}

test('every declared free-text subject parameter is load-bearing', () => {
  const tools = listToolDefinitions();
  let qualifyingParamCount = 0;
  const failures: string[] = [];
  for (const def of tools) {
    for (const [name, prop] of Object.entries(def.spec.parameters.properties)) {
      if (!isFreeTextSubjectParam(name, prop)) {
        continue;
      }
      qualifyingParamCount += 1;
      const failure = checkSubjectParam(def, name);
      if (failure) {
        failures.push(failure);
      }
    }
  }
  // If the naming/shape heuristic above ever stops matching ANY parameter in the registry (e.g.
  // `get_sca_checks`'s `search` is renamed or re-typed without a replacement), this sweep would
  // silently check zero tools and always pass -- worse than not existing, because it would read as
  // coverage. Guard the guard: today's catalog has exactly one qualifying parameter
  // (`get_sca_checks.search`).
  assert.ok(
    qualifyingParamCount > 0,
    'no registry tool declared a parameter this sweep recognizes as free-text subject -- the ' +
      'detection heuristic (SUBJECT_PARAM_NAME_RE / isFreeTextSubjectParam) no longer matches ' +
      'anything real, so this test is not actually checking the class it exists for',
  );
  assert.deepEqual(
    failures,
    [],
    'A tool declares a search/*_contains parameter that a caller would reasonably expect to ' +
      'narrow results, but building a request with a sentinel value in it leaves no trace of ' +
      'that value anywhere in the request. Wire the parameter into buildRequest (query, ' +
      'post_filter, or an agg include) or drop it from the schema.',
  );
});

test('mechanism self-test: a tool that declares "search" but ignores it fails the sweep', () => {
  // Reproduces the exact defect shape this sweep exists to catch: a schema that PROMISES
  // narrowing via `search`, and a `buildRequest` that never reads `params.search` at all. Checked
  // directly against `checkSubjectParam` (not via the registry -- this tool is intentionally never
  // registered) to prove the detector itself can fail, not just that it currently reports zero
  // failures for the real catalog.
  const ignoresSearch: ToolDefinition = {
    spec: {
      name: 'fabricated_ignores_search',
      description: 'Test fixture only -- never registered in the real catalog.',
      parameters: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description: 'Looks load-bearing. Is not.',
          },
        },
      },
    },
    target: 'indexer',
    tier: 'T1',
    buildRequest() {
      // Deliberately never reads `params.search` -- the defect under test.
      return {
        target: 'indexer',
        index: 'wazuh-does-not-matter*',
        body: { query: { bool: { filter: [] } } },
      };
    },
    tableSpec: { columns: [] },
    digest: { sampleColumns: [] },
  };
  const failure = checkSubjectParam(ignoresSearch, 'search');
  assert.ok(
    failure,
    'the sweep failed to catch a fabricated tool that declares "search" and ignores it entirely ' +
      '-- the check itself is broken and would not catch a real regression either',
  );
});
