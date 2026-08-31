import assert from 'node:assert/strict';
import { JsonSchemaProperty } from '../../../common/types';
import { listToolDefinitions } from '../registry';
import { applySafetyValves, lintDsl, MAX_AGG_SIZE } from '../guardrails';
import { IndexerRequest } from '../types';

/**
 * Class-level guard: NO catalog tool may be able to build an indexer request that
 * the guardrails then reject.
 *
 * The defect this exists to prevent: `get_sca_results` clamped its `limit` parameter to a maximum of
 * 500 and wrote that value into a `terms` aggregation `size`, but `guardrails.ts`'s `checkAggs`
 * rejects any aggregation size above `MAX_AGG_SIZE` (100) — and `executor.ts` runs `lintDsl` on
 * every indexer request with no per-tool exemption. So the entire 101-500 range hard-failed, while
 * the tool's own parameter description advertised 500, steering a compliant model straight into it.
 *
 * Fixing that one tool's arithmetic would not stop the next tool from repeating it, which is why the
 * check is catalog-wide and driven from `listToolDefinitions()`: every tool now in the registry, and
 * every tool added later, is asserted here automatically. **Nothing is exempt by default.** A new
 * tool that derives an aggregation size from a caller-supplied limit and clamps it to the wrong
 * ceiling fails this test instead of silently shipping a broken parameter range.
 *
 * Method: drive each tool's own `buildRequest` with a deliberately absurd `limit`, then run the
 * result through the SAME two guardrail stages `executor.ts` applies, in the same order
 * (`applySafetyValves` then `lintDsl`). Asserting through the real functions rather than
 * re-implementing the cap check is the point — it is what makes the test track the guardrails if
 * their internals change.
 *
 * Manager-target tools are skipped: they never reach `lintDsl` (`clampManagerParams` is their
 * separate bounding path), so there is no aggregation body for this invariant to apply to.
 */

/** Far above every cap in the codebase, so any tool that fails to clamp is caught rather than
 * accidentally landing inside a legal range. */
const ABSURD_LIMIT = 100_000;

/**
 * Minimal valid value for one declared param, so `buildRequest` gets far enough to produce a body.
 * Several tools validate their inputs and throw a descriptive Error for a malformed value (an agent
 * id that is not numeric, a bad date-math string), which would mask the aggregation-size question
 * this test is asking — so the values here are chosen to satisfy those validators, not to be
 * realistic data.
 */
function sampleValue(name: string, prop: JsonSchemaProperty): unknown {
  if (name === 'limit') {
    return ABSURD_LIMIT;
  }
  // get_field_values' `field` param is restricted to guardrails.ts's AGG_FIELD_ALLOWLIST -- a
  // generic sample string throws (correctly) rather than reaching an aggregation size question.
  // "wazuh.agent.id" is chosen because its FIELD_LOCATIONS include "events", the family every
  // other enum property (including this tool's own `index_family`) samples first here.
  if (name === 'field') {
    return 'wazuh.agent.id';
  }
  // A `jsonString: true` param (common/types.ts) carries JSON inside a string — search_wazuh_data's
  // `query_dsl` is the only one today. Detected from the schema MARKER rather than the param name so
  // a future jsonString param is handled without editing this file.
  //
  // The sample carries a bounded `@timestamp` range deliberately. `search_wazuh_data` is the escape
  // hatch: its body comes from the CALLER, and `lintDsl` requires a both-sides-bounded range within
  // the 90-day cap for the findings indices. A bare `match_all` is therefore rejected — correctly,
  // and that rejection is a feature, not the aggregation-size defect this file is guarding. Supplying
  // a well-formed caller query keeps the escape hatch inside the invariant (its own `limit` still
  // reaches the request) instead of exempting it and losing the coverage.
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
  // `agent_id` goes through validateAgentId, which requires a numeric string.
  if (/(^|_)agent_id$/.test(name) || name === 'agent') {
    return '001';
  }
  if (/(^|_)(gte|lte|from|to)$/.test(name) || name.includes('time_range')) {
    return 'now-7d';
  }
  return 'test';
}

/** Builds every declared param (not just the required ones): an OPTIONAL `limit` is exactly the
 * parameter #8894 lived in, so restricting this to required params would have missed the bug. */
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

test('every indexer tool builds a guardrail-legal request even at an absurd limit', () => {
  assert.ok(
    indexerTools.length > 0,
    'registry produced no indexer tools to check',
  );

  const failures: string[] = [];
  for (const def of indexerTools) {
    const params = sampleParams(def.spec.parameters.properties);
    let request: IndexerRequest;
    try {
      request = def.buildRequest(params) as IndexerRequest;
    } catch (error) {
      // A parameter-level throw is a legitimate tool behaviour (executor.ts turns it into a
      // self-correctable tool error), not an aggregation-size violation. Record it so a tool that
      // starts throwing on its own sample params is visible rather than silently unchecked.
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
        `${def.spec.name}: applySafetyValves rejected its own request -- ${valved.reason}`,
      );
      continue;
    }
    const lint = lintDsl(valved.body, request.index);
    if (!lint.ok) {
      failures.push(
        `${def.spec.name}: lintDsl rejected its own request -- ${lint.reason}`,
      );
    }
  }

  assert.deepEqual(
    failures,
    [],
    'A tool built a request its own guardrails refuse. If the reason is an aggregation size, that ' +
      'tool is clamping its limit to a ceiling above MAX_AGG_SIZE -- use clampAggLimit/' +
      'aggLimitProperty from catalog/common.ts instead of clampLimit with a literal maximum.',
  );
});

/** Every aggregation `size` anywhere in a request body, at any nesting depth. */
function aggSizes(body: Record<string, unknown>): number[] {
  const sizes: number[] = [];
  const walk = (node: unknown, insideAggs: boolean): void => {
    if (!node || typeof node !== 'object') {
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
      if (insideAggs && key === 'size' && typeof value === 'number') {
        sizes.push(value);
        continue;
      }
      walk(value, insideAggs);
    }
  };
  walk(body, false);
  return sizes;
}

test('a limit that reaches an aggregation is advertised as MAX_AGG_SIZE, not a larger number', () => {
  // The half of #8894 that actually misled the model was the schema description promising "max 500"
  // on a tool that failed above 100. Any description naming a maximum above the enforced cap is the
  // same defect, whether or not the clamp itself now happens to be correct.
  //
  // Whether a tool's `limit` reaches an aggregation is detected BEHAVIOURALLY -- build the request
  // twice with different limits and see whether any aggregation size moves -- rather than by
  // checking for the presence of an `aggs` key. That distinction matters: the finding-hits tools
  // attach breakdown aggregations whose size comes from a fixed internal cap while their `limit`
  // drives only the hits `size`, and they legitimately advertise up to MAX_SIZE (500). Keying off
  // `aggs` alone would fail those tools the moment breakdown aggregations land on this branch.
  const offenders: string[] = [];
  for (const def of indexerTools) {
    const limitProp = def.spec.parameters.properties.limit;
    if (!limitProp) {
      continue;
    }
    const advertised = /max\s+(\d+)/i.exec(limitProp.description ?? '');
    if (!advertised || Number(advertised[1]) <= MAX_AGG_SIZE) {
      continue;
    }
    const build = (limit: number): number[] | undefined => {
      try {
        const params = {
          ...sampleParams(def.spec.parameters.properties),
          limit,
        };
        return aggSizes((def.buildRequest(params) as IndexerRequest).body);
      } catch {
        return undefined;
      }
    };
    const low = build(7);
    const high = build(MAX_AGG_SIZE + 11);
    if (!low || !high) {
      continue;
    }
    const limitFeedsAnAgg =
      low.length !== high.length || low.some((size, i) => size !== high[i]);
    if (limitFeedsAnAgg) {
      offenders.push(
        `${def.spec.name}: advertises max ${advertised[1]}, but its limit changes an aggregation size, which guardrails cap at ${MAX_AGG_SIZE}`,
      );
    }
  }
  assert.deepEqual(
    offenders,
    [],
    'Use aggLimitProperty() from catalog/common.ts, which generates the advertised maximum from MAX_AGG_SIZE.',
  );
});
