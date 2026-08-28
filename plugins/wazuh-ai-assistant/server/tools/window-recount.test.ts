import assert from 'node:assert/strict';
import { listToolDefinitions } from './registry';
import {
  DEFAULT_TIME_RANGE_GTE,
  DEFAULT_TIME_RANGE_LTE,
} from './catalog/common';
import { findTimestampRange, widenToDefaultWindow } from './window-recount';
import { IndexerRequest, ToolDefinition } from './types';
import { JsonSchemaProperty } from '../../common/types';

// --- findTimestampRange ----------------------------------------------------------------------

test('findTimestampRange: locates the @timestamp range inside query.bool.filter', () => {
  const body = {
    query: {
      bool: {
        filter: [
          { term: { 'wazuh.agent.name': 'web-01' } },
          { range: { '@timestamp': { gte: 'now-24h', lte: 'now' } } },
        ],
      },
    },
  };
  assert.deepEqual(findTimestampRange(body), { gte: 'now-24h', lte: 'now' });
});

test('findTimestampRange: returns undefined for a states-index body with no @timestamp range', () => {
  const body = {
    query: { bool: { filter: [{ term: { 'wazuh.agent.id': '001' } }] } },
  };
  assert.equal(findTimestampRange(body), undefined);
});

test('findTimestampRange: returns a gt/lt-bounded clause verbatim (lintDsl accepts those too)', () => {
  const body = {
    query: {
      bool: {
        filter: [{ range: { '@timestamp': { gt: 'now-24h', lt: 'now' } } }],
      },
    },
  };
  assert.deepEqual(findTimestampRange(body), { gt: 'now-24h', lt: 'now' });
  // And widening replaces the WHOLE bounds object, so the widened copy uses gte/lte defaults.
  const widened = widenToDefaultWindow(body);
  assert.ok(widened);
  assert.deepEqual(findTimestampRange(widened as Record<string, unknown>), {
    gte: DEFAULT_TIME_RANGE_GTE,
    lte: DEFAULT_TIME_RANGE_LTE,
  });
});

test('findTimestampRange: returns undefined for a body with no query at all', () => {
  assert.equal(findTimestampRange({}), undefined);
});

test('findTimestampRange: returns undefined when filter is not an array', () => {
  assert.equal(
    findTimestampRange({ query: { bool: { filter: {} } } }),
    undefined,
  );
});

// --- widenToDefaultWindow ---------------------------------------------------------------------

function narrowBody(gte: string, lte: string): Record<string, unknown> {
  return {
    query: {
      bool: {
        filter: [
          { term: { 'wazuh.agent.name': 'web-01' } },
          { range: { '@timestamp': { gte, lte } } },
        ],
      },
    },
    sort: [{ '@timestamp': { order: 'desc' } }],
    size: 20,
  };
}

test('widenToDefaultWindow: a narrow ISO window widens to the plugin default window, size:0, no aggs', () => {
  const body = narrowBody('2026-08-09T00:00:00Z', '2026-08-10T00:00:00Z');
  const widened = widenToDefaultWindow(body);
  assert.ok(widened);
  assert.deepEqual(findTimestampRange(widened as Record<string, unknown>), {
    gte: DEFAULT_TIME_RANGE_GTE,
    lte: DEFAULT_TIME_RANGE_LTE,
  });
  assert.equal(widened?.size, 0);
  // Intent only: applySafetyValves clamps track_total_hits to MAX_TRACK_TOTAL_HITS (10000)
  // before execution, so the EXECUTED recount reports value<=10000 with relation:'gte' beyond.
  // The executed behaviour (the "at least N" hint wording) is pinned in executor.test.ts.
  assert.equal(widened?.track_total_hits, true);
  assert.equal('aggs' in (widened as object), false);
  assert.equal('aggregations' in (widened as object), false);
  // The non-time filter clause survives untouched.
  const filter = (
    (widened as Record<string, unknown>).query as {
      bool: { filter: unknown[] };
    }
  ).bool.filter;
  assert.deepEqual(filter[0], { term: { 'wazuh.agent.name': 'web-01' } });
});

test('widenToDefaultWindow: a window already at the defaults returns undefined (nothing to widen)', () => {
  const body = narrowBody(DEFAULT_TIME_RANGE_GTE, DEFAULT_TIME_RANGE_LTE);
  assert.equal(widenToDefaultWindow(body), undefined);
});

test('widenToDefaultWindow: a body with no @timestamp range returns undefined', () => {
  const body = {
    query: { bool: { filter: [{ term: { 'wazuh.agent.id': '001' } }] } },
  };
  assert.equal(widenToDefaultWindow(body), undefined);
});

test('widenToDefaultWindow: an escape-hatch-shaped body (arbitrary aggs, narrow window) still widens', () => {
  const body = {
    query: {
      bool: {
        filter: [
          { range: { '@timestamp': { gte: 'now-7d', lte: 'now' } } },
          { term: { 'wazuh.rule.level': 'high' } },
        ],
      },
    },
    size: 0,
    aggs: { by_agent: { terms: { field: 'wazuh.agent.name', size: 10 } } },
  };
  const widened = widenToDefaultWindow(body);
  assert.ok(widened);
  assert.equal('aggs' in (widened as object), false);
  assert.deepEqual(findTimestampRange(widened as Record<string, unknown>), {
    gte: DEFAULT_TIME_RANGE_GTE,
    lte: DEFAULT_TIME_RANGE_LTE,
  });
});

test('widenToDefaultWindow: does not mutate the input body', () => {
  const body = narrowBody('now-7d', 'now-1d');
  const beforeJson = JSON.stringify(body);
  widenToDefaultWindow(body);
  assert.equal(JSON.stringify(body), beforeJson);
});

// --- registry sweep ----------------------------------------------------------------------------

/** Minimal valid value for one declared param -- same shape as agg-size-coverage.test.ts's own
 * `sampleValue`, kept independent (not imported) since this file's needs are narrower (it only
 * cares about producing A valid body, not stressing limits). */
function sampleValue(name: string, prop: JsonSchemaProperty): unknown {
  if (name === 'time_range_gte') {
    return 'now-7d';
  }
  if (name === 'time_range_lte') {
    return 'now-1d';
  }
  // get_field_values' `field` param is restricted to guardrails.ts's AGG_FIELD_ALLOWLIST.
  // "wazuh.agent.id" is chosen because its FIELD_LOCATIONS include "events", the family this
  // file's own generic enum heuristic samples first for `index_family` (alphabetical
  // `enumValues[0]`) -- and because it IS a time-ranged surface, exercising this sweep for real.
  if (name === 'field') {
    return 'wazuh.agent.id';
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
  return 'test';
}

function sampleParams(def: ToolDefinition): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  for (const [name, prop] of Object.entries(def.spec.parameters.properties)) {
    params[name] = sampleValue(name, prop);
  }
  return params;
}

/**
 * Registry sweep (coverage, not just the unit matrix above): every indexer tool that declares
 * `time_range_gte`/`time_range_lte` params builds a request `widenToDefaultWindow` can actually
 * widen to EXACTLY the plugin defaults, given a narrow window -- proving executor.ts's recount
 * chokepoint is reachable for every one of them with no per-tool opt-in, the same "nothing
 * exempt by default" standard as agg-size-coverage.test.ts.
 */
test('every time-ranged indexer tool builds a request widenable to exactly the default window', () => {
  const timeRangedTools = listToolDefinitions().filter(
    def =>
      def.target === 'indexer' &&
      'time_range_gte' in def.spec.parameters.properties &&
      'time_range_lte' in def.spec.parameters.properties,
  );
  assert.ok(
    timeRangedTools.length > 0,
    'registry produced no time-ranged indexer tools to check',
  );

  const failures: string[] = [];
  for (const def of timeRangedTools) {
    let request: IndexerRequest;
    try {
      request = def.buildRequest(sampleParams(def)) as IndexerRequest;
    } catch (error) {
      failures.push(
        `${def.spec.name}: buildRequest threw for its own declared params -- ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      continue;
    }
    const widened = widenToDefaultWindow(request.body);
    if (!widened) {
      failures.push(
        `${def.spec.name}: declares time_range params but its request body has no widenable ` +
          '@timestamp range -- widenToDefaultWindow returned undefined',
      );
      continue;
    }
    const range = findTimestampRange(widened);
    if (
      !range ||
      range.gte !== DEFAULT_TIME_RANGE_GTE ||
      range.lte !== DEFAULT_TIME_RANGE_LTE
    ) {
      failures.push(
        `${
          def.spec.name
        }: widened range is not exactly the default window -- got ${JSON.stringify(
          range,
        )}`,
      );
    }
  }
  assert.deepEqual(failures, []);
});

/** States-index tools (no event-time axis) must be correctly UNTOUCHED: they build no `@timestamp`
 * range at all, so the recount chokepoint has nothing to widen and never fires for them. Checked
 * against a real one (get_agent_inventory) rather than only asserted in the abstract. */
test('a states-index tool (no @timestamp range) is correctly untouched', () => {
  const getAgentInventory = listToolDefinitions().find(
    def => def.spec.name === 'get_agent_inventory',
  );
  assert.ok(getAgentInventory, 'get_agent_inventory missing from the registry');
  const request = getAgentInventory!.buildRequest({
    agent_id: '001',
    kind: 'packages',
  }) as IndexerRequest;
  assert.equal(findTimestampRange(request.body), undefined);
  assert.equal(widenToDefaultWindow(request.body), undefined);
});
