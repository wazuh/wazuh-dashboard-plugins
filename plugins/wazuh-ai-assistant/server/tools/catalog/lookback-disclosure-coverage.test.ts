import assert from 'node:assert/strict';
import { JsonSchemaProperty } from '../../../common/types';
import { listToolDefinitions } from '../registry';
import { applySafetyValves, clampLookbackWindow, lintDsl } from '../guardrails';
import { IndexerRequest } from '../types';

/**
 * Class-level guard for issue #8935 item I4 (bound disclosure): every tool that lets a caller
 * request a time-based lookback wider than the 90-day cap must have that request CLAMPED AND
 * DISCLOSED (a successful, capped answer with a "Time window capped" hint in its digest), never
 * silently rejected as if the model had asked for something unfixable.
 *
 * Follows `agg-size-coverage.test.ts`'s method exactly: drive every registered indexer tool's own
 * `buildRequest` with a deliberately over-wide range, then run the result through the SAME
 * guardrail stages `executor.ts` applies, in the same order (`applySafetyValves` ->
 * `clampLookbackWindow` -> `lintDsl`). Asserting through the real functions — not a
 * reimplementation of the clamp/lint logic — is what makes this test track the guardrails if
 * their internals change, and what makes it a genuine regression guard rather than a tautology.
 *
 * COVERAGE, "nothing exempt by default": every tool in `listToolDefinitions()` whose OWN schema
 * declares a `time_range_gte`/`time_range_lte` parameter pair (detected structurally, never by
 * tool name or an exemption list) is swept here automatically — a future tool with the same two
 * parameters inherits the guarantee with no edit to this file. Tools with NO such parameters (the
 * `wazuh-states-*` snapshot tools with no event-time axis, the exact-ID lookup tool, and the
 * `search_wazuh_data` escape hatch, whose time range lives inside its free-form `query_dsl` string
 * rather than a flat schema property) are outside this class BY SHAPE, and the second test below
 * checks that exemption is real rather than assumed: none of them silently build a clampable
 * `@timestamp` range some other way.
 */

/** Far above the 90-day cap, so a tool that already clamps its own inputs some other way (it
 * shouldn't — the guardrail chokepoint is meant to be the only enforcement point) is still
 * exercised the same as one that does not. */
const OVER_WIDE_RANGE_GTE = 'now-180d';
const OVER_WIDE_RANGE_LTE = 'now';

/**
 * Minimal valid value for one declared param, so `buildRequest` gets far enough to produce a body
 * — same purpose as `agg-size-coverage.test.ts`'s `sampleValue`, with `time_range_gte`/
 * `time_range_lte` forced to an over-wide, well-formed pair regardless of what the generic
 * gte/lte/time_range heuristic below would otherwise produce (that heuristic alone would hand back
 * an ordinary in-cap `now-7d`, which would never exercise the clamp at all).
 */
function sampleValue(name: string, prop: JsonSchemaProperty): unknown {
  if (name === 'time_range_gte') {
    return OVER_WIDE_RANGE_GTE;
  }
  if (name === 'time_range_lte') {
    return OVER_WIDE_RANGE_LTE;
  }
  if ((prop as { jsonString?: true }).jsonString) {
    // search_wazuh_data's query_dsl -- not a member of the time-ranged sweep below (its schema has
    // no flat time_range_gte/lte property), but still needs a well-formed sample so it can be
    // included in the "outside this class by shape" check without throwing.
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
    return 10;
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

const indexerTools = listToolDefinitions().filter(
  def => def.target === 'indexer',
);

/** Structural detection, never a name/allowlist check -- exactly the two flat properties
 * `catalog/common.ts`'s `timeRangeProperties()` adds to a tool's schema. */
function hasTimeRangeParams(
  properties: Record<string, JsonSchemaProperty>,
): boolean {
  return 'time_range_gte' in properties && 'time_range_lte' in properties;
}

const timeRangedTools = indexerTools.filter(def =>
  hasTimeRangeParams(def.spec.parameters.properties),
);
const nonTimeRangedTools = indexerTools.filter(
  def => !hasTimeRangeParams(def.spec.parameters.properties),
);

test('registry sanity: at least one indexer tool declares time_range_gte/lte (sampling logic is exercised)', () => {
  assert.ok(
    timeRangedTools.length > 0,
    'no time-ranged tool found in the registry -- this sweep would silently cover nothing',
  );
});

test('every time-ranged tool: a 180-day request is clamped, disclosed, and passes the REAL lintDsl -- FAILS ON BASE', () => {
  // On this base (before clampLookbackWindow exists), every one of these calls to lintDsl rejects
  // with "spans more than the 90-day maximum lookback." -- there is no clamp stage between
  // applySafetyValves and lintDsl to narrow the range first, so this loop's `failures` array is
  // non-empty for every single time-ranged tool in the registry. That is the intended failure
  // mode: the class is "no time-ranged tool discloses a lookback clamp", and the fix is a single
  // chokepoint change (executor.ts), not a per-tool one -- this test can't be satisfied by fixing
  // one tool at a time.
  const failures: string[] = [];
  for (const def of timeRangedTools) {
    const params = sampleParams(def.spec.parameters.properties);
    let request: IndexerRequest;
    try {
      request = def.buildRequest(params) as IndexerRequest;
    } catch (error) {
      failures.push(
        `${def.spec.name}: buildRequest threw for its own declared params -- ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      continue;
    }

    const valved = applySafetyValves(request.body);
    if (!valved.ok) {
      failures.push(
        `${def.spec.name}: applySafetyValves rejected its own 180-day request -- ${valved.reason}`,
      );
      continue;
    }

    const { body: clamped, disclosure } = clampLookbackWindow(valved.body);
    if (!disclosure) {
      failures.push(
        `${def.spec.name}: clampLookbackWindow produced NO disclosure for a 180-day request`,
      );
      continue;
    }
    if (!disclosure.includes('Time window capped')) {
      failures.push(
        `${def.spec.name}: disclosure text is missing the expected "Time window capped" marker -- ` +
          `got: ${disclosure}`,
      );
      continue;
    }

    const lint = lintDsl(clamped, request.index);
    if (!lint.ok) {
      failures.push(
        `${def.spec.name}: lintDsl still rejects the CLAMPED body -- ${lint.reason}`,
      );
    }
  }

  assert.deepEqual(
    failures,
    [],
    'A time-ranged tool did not get a disclosed, guardrail-legal clamp for a 180-day request. ' +
      "Every tool with time_range_gte/lte parameters must flow through executor.ts's " +
      'clampLookbackWindow chokepoint between applySafetyValves and lintDsl.',
  );
});

test('mechanism self-test: WITHOUT the clamp stage, the same 180-day request is rejected by the real lintDsl', () => {
  // Proves the test above actually distinguishes "the clamp ran" from "this body would have
  // passed lintDsl regardless" -- if this self-test ever finds a tool whose UNCLAMPED 180-day
  // request already passes lintDsl, the class-level test above is not exercising anything
  // meaningful for that tool and must be treated as broken, not as a passing guarantee.
  const offenders: string[] = [];
  for (const def of timeRangedTools) {
    const params = sampleParams(def.spec.parameters.properties);
    let request: IndexerRequest;
    try {
      request = def.buildRequest(params) as IndexerRequest;
    } catch {
      continue; // Already reported by the test above; not this self-test's concern.
    }
    const valved = applySafetyValves(request.body);
    if (!valved.ok) {
      continue;
    }
    const lint = lintDsl(valved.body, request.index);
    if (lint.ok) {
      offenders.push(
        `${def.spec.name}: an UNCLAMPED 180-day request passed lintDsl -- the disclosure sweep's ` +
          'premise (that clamping is what makes this body legal) is false for this tool',
      );
    }
  }
  assert.deepEqual(
    offenders,
    [],
    "At least one time-ranged tool's 180-day sample never actually needed clamping -- fix the " +
      'sample (it may not be hitting a real @timestamp range) before trusting the sweep above.',
  );
});

test('tools with NO time_range_gte/lte parameter build no clampable @timestamp range -- exempt by shape, not by an exemption list', () => {
  assert.ok(
    nonTimeRangedTools.length > 0,
    'expected at least one indexer tool with no time_range parameter (states/ID-lookup/escape-hatch tools)',
  );
  const offenders: string[] = [];
  for (const def of nonTimeRangedTools) {
    const params = sampleParams(def.spec.parameters.properties);
    let request: IndexerRequest;
    try {
      request = def.buildRequest(params) as IndexerRequest;
    } catch {
      continue; // A parameter-level throw has nothing to do with this class; not this test's concern.
    }
    const valved = applySafetyValves(request.body);
    if (!valved.ok) {
      continue;
    }
    const { disclosure } = clampLookbackWindow(valved.body);
    if (disclosure) {
      offenders.push(
        `${def.spec.name}: has no time_range_gte/lte parameter but still built a clampable ` +
          '@timestamp range -- it belongs in the time-ranged sweep above, not this exemption ' +
          "(add time_range_gte/lte via catalog/common.ts's timeRangeProperties, or this tool's " +
          'own wide-range callers get no disclosure).',
      );
    }
  }
  assert.deepEqual(
    offenders,
    [],
    'A tool is missing time_range_gte/lte in its schema but still builds a wide time-range clause ' +
      '-- it is silently outside the disclosure sweep above.',
  );
});
