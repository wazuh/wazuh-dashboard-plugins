import assert from 'node:assert/strict';
import {
  getAgentInventoryTool,
  INVENTORY_KIND_CONFIG,
} from './get-agent-inventory';
import { IndexerRequest } from '../types';
import { applySafetyValves, lintDsl } from '../guardrails';
import { BREAKDOWN_BUCKET_CAP } from '../digest';

type ResolveParamsContext = Parameters<
  NonNullable<typeof getAgentInventoryTool.resolveParams>
>[1];
type ResolveParamsRequest = Parameters<
  NonNullable<typeof getAgentInventoryTool.resolveParams>
>[2];

/** Minimal `context` stub for `resolveParams` (issue #8913's `resolveDeicticAgentParams`), same
 * pattern as api-host.test.ts's own `fakeContext`: only the two members that function actually
 * reads (`wazuh_core.manageHosts.get` -- via `resolveApiHostId` -- and
 * `wazuh_core.api.client.asCurrentUser.request`) are stubbed. `agents` becomes the Manager API's
 * `/agents` response shape (`{data: {affected_items, total_affected_items}}`); `undefined` means
 * "the lookup call itself throws", simulating a Manager API failure. */
function fakeContext(
  agents:
    | { items: Array<{ id: string; name?: string }>; total?: number }
    | undefined,
): ResolveParamsContext {
  return {
    wazuh_core: {
      manageHosts: {
        get: () => Promise.resolve([{ id: 'host-1' }]),
      },
      api: {
        client: {
          asCurrentUser: {
            request: () => {
              if (agents === undefined) {
                throw new Error('simulated Manager API failure');
              }
              return Promise.resolve({
                status: 200,
                data: {
                  data: {
                    affected_items: agents.items,
                    total_affected_items: agents.total ?? agents.items.length,
                  },
                },
              });
            },
          },
        },
      },
    },
  } as unknown as ResolveParamsContext;
}

/** Minimal `request` stub: only `request.headers.cookie` is ever read (via `resolveApiHostId`). */
function fakeRequest(): ResolveParamsRequest {
  return { headers: {} } as unknown as ResolveParamsRequest;
}

/**
 * Unit tests for get_agent_inventory (issue: "Consolidate agent inventory into one tool"), which
 * replaces get_agent_os/get_agent_packages/get_agent_ports/get_agent_processes. The regression
 * assertions below hardcode the exact request bodies those four (now-deleted) tool files built,
 * so a future edit that silently changes a folded-in kind's `_source`/index/size is caught here
 * instead of only at QA.
 */

function buildIndexer(params: Record<string, unknown>): IndexerRequest {
  const req = getAgentInventoryTool.buildRequest(params);
  assert.equal(req.target, 'indexer');
  return req as IndexerRequest;
}

test('get_agent_inventory: kind enum lists exactly the 5 implemented kinds', () => {
  const kindProperty = getAgentInventoryTool.spec.parameters.properties
    .kind as unknown as {
    enum?: string[];
  };
  assert.deepEqual(kindProperty.enum, [
    'os',
    'packages',
    'ports',
    'processes',
    'hotfixes',
  ]);
});

test('get_agent_inventory: an unrecognized kind is rejected', () => {
  assert.throws(
    () =>
      getAgentInventoryTool.buildRequest({ agent_id: '003', kind: 'networks' }),
    /kind/,
  );
  assert.throws(
    () =>
      getAgentInventoryTool.buildRequest({ agent_id: '003', kind: 'bogus' }),
    /kind/,
  );
  assert.throws(
    () => getAgentInventoryTool.buildRequest({ agent_id: '003' }),
    /kind/,
  );
});

// --- issue #8913 (diagnostic follow-up): a live diagnostic run (branch diag/8913-router-logging)
// proved stage-1 routing correctly offered this tool every time for a deictic inventory question,
// but the tool's OWN description (and the system prompt) told the model to "call get_agents
// first" -- a tool the router does not also offer for a lone 'inventory' route -- so the model
// could not comply and never called this tool either. These assertions pin the reworded
// description/params so a future edit cannot silently reintroduce that dead-end instruction. ---

test('get_agent_inventory: description tells the model to call this tool directly for a deictic reference, not get_agents first', () => {
  const { description } = getAgentInventoryTool.spec;
  assert.match(
    description,
    /call THIS TOOL DIRECTLY with BOTH\s+omitted -- do not call get_agents first/,
  );
  assert.doesNotMatch(description, /call get_agents first to look/);
});

test('get_agent_inventory: agent_id/agent_name param descriptions document the deictic auto-resolution, not a hard requirement', () => {
  const { agent_id: agentId, agent_name: agentName } = getAgentInventoryTool
    .spec.parameters.properties as unknown as {
    agent_id: { description?: string };
    agent_name: { description?: string };
  };
  assert.match(
    agentId.description ?? '',
    /resolves to the only active agent automatically/,
  );
  assert.match(
    agentName.description ?? '',
    /resolves to the only active agent automatically/,
  );
  assert.doesNotMatch(agentId.description ?? '', /is required\.?$/);
  assert.doesNotMatch(
    agentName.description ?? '',
    /^Either this or agent_id is required/,
  );
});

test('get_agent_inventory: an invalid agent_id is rejected (delegates to validateAgentId)', () => {
  assert.throws(
    () =>
      getAgentInventoryTool.buildRequest({
        agent_id: 'not-numeric',
        kind: 'os',
      }),
    /agent_id/,
  );
});

// --- issue #8873: agent_id is no longer the only way to identify the agent. A 40-question live
// run invoked this tool 0/40 times, including on 3 questions statically targeting it, because
// `agent_id` was strictly required and numeric while the target personas ask deictically ("this
// server") with no id the model can infer. ---

test('get_agent_inventory: agent_name alone builds a match filter on wazuh.agent.name', () => {
  const req = buildIndexer({ agent_name: 'web-prod-01', kind: 'packages' });
  assert.deepEqual(req.body.query, {
    bool: { filter: [{ match: { 'wazuh.agent.name': 'web-prod-01' } }] },
  });
});

test('get_agent_inventory: agent_id alone is unchanged (regression)', () => {
  const req = buildIndexer({ agent_id: '003', kind: 'packages' });
  assert.deepEqual(req.body.query, {
    bool: { filter: [{ term: { 'wazuh.agent.id': '003' } }] },
  });
});

test('get_agent_inventory: neither agent_id nor agent_name throws a descriptive error naming both options', () => {
  assert.throws(
    () => getAgentInventoryTool.buildRequest({ kind: 'packages' }),
    /agent_id.*agent_name|agent_name.*agent_id/,
  );
});

test('get_agent_inventory: both agent_id and agent_name supplied -- agent_id wins (exact, unambiguous Manager-API identifier vs. a fuzzier free-text match)', () => {
  const req = buildIndexer({
    agent_id: '003',
    agent_name: 'web-prod-01',
    kind: 'packages',
  });
  assert.deepEqual(req.body.query, {
    bool: { filter: [{ term: { 'wazuh.agent.id': '003' } }] },
  });
});

test('get_agent_inventory: kind="os" resolves to the wazuh-states-inventory-system* index (naming exception)', () => {
  const req = buildIndexer({ agent_id: '003', kind: 'os' });
  assert.equal(req.index, 'wazuh-states-inventory-system*');
});

// --- Regression: the 4 folded-in kinds must produce byte-identical bodies to the deleted
// individual tools (get-agent-os.ts / get-agent-packages.ts / get-agent-ports.ts /
// get-agent-processes.ts), for the same agent_id/limit inputs. ---

test('get_agent_inventory: kind="os" matches get_agent_os\'s original body exactly (limit ignored)', () => {
  const req = buildIndexer({ agent_id: '003', kind: 'os' });
  assert.deepEqual(req, {
    target: 'indexer',
    index: 'wazuh-states-inventory-system*',
    body: {
      query: { bool: { filter: [{ term: { 'wazuh.agent.id': '003' } }] } },
      _source: [
        'host.hostname',
        'host.os.name',
        'host.os.version',
        'host.os.platform',
        'host.os.full',
        'host.architecture',
      ],
      sort: ['_doc'],
      size: 5,
    },
  });
  // A supplied `limit` has no effect for kind="os", matching get-agent-os.ts, which never
  // exposed a `limit` parameter at all.
  const withLimit = buildIndexer({ agent_id: '003', kind: 'os', limit: 200 });
  assert.equal(withLimit.body.size, 5);
});

test('get_agent_inventory: kind="packages" matches get_agent_packages\'s original body exactly', () => {
  const req = buildIndexer({ agent_id: '003', kind: 'packages' });
  assert.deepEqual(req, {
    target: 'indexer',
    index: 'wazuh-states-inventory-packages*',
    body: {
      query: { bool: { filter: [{ term: { 'wazuh.agent.id': '003' } }] } },
      _source: [
        'package.name',
        'package.version',
        'package.architecture',
        'package.vendor',
      ],
      sort: ['_doc'],
      size: 50,
    },
  });
});

test('get_agent_inventory: kind="ports" matches get_agent_ports\'s original body, field CONTENTS unchanged, order intentionally reordered', () => {
  // The original assertion pinned get_agent_ports's order; issue #8921's column-budget item
  // deliberately re-ordered `_source` (its order drives digest.ts's deriveResultColumns, which
  // decides which 6 of these 8 fields the client's visible-column budget shows without a
  // row-expander click). NOTE: assert.deepEqual on an array is still ORDER-SENSITIVE — this
  // test pins the NEW exact order (contents unchanged from the original set), it has not been
  // relaxed to an order-insensitive check.
  const req = buildIndexer({ agent_id: '003', kind: 'ports' });
  assert.deepEqual(req, {
    target: 'indexer',
    index: 'wazuh-states-inventory-ports*',
    body: {
      query: { bool: { filter: [{ term: { 'wazuh.agent.id': '003' } }] } },
      _source: [
        'source.port',
        'interface.state',
        'process.name',
        'network.transport',
        'destination.ip',
        'source.ip',
        'destination.port',
        'process.pid',
      ],
      sort: ['_doc'],
      size: 50,
      aggs: {
        interface_state: {
          terms: { field: 'interface.state', size: BREAKDOWN_BUCKET_CAP },
        },
        network_transport: {
          terms: { field: 'network.transport', size: BREAKDOWN_BUCKET_CAP },
        },
      },
    },
  });
});

test('get_agent_inventory: kind="processes" matches get_agent_processes\'s original body exactly (breakdown is digest-level, not an agg)', () => {
  const req = buildIndexer({ agent_id: '003', kind: 'processes' });
  assert.deepEqual(req, {
    target: 'indexer',
    index: 'wazuh-states-inventory-processes*',
    body: {
      query: { bool: { filter: [{ term: { 'wazuh.agent.id': '003' } }] } },
      _source: [
        'process.pid',
        'process.name',
        'process.state',
        'process.parent.pid',
        'process.command_line',
      ],
      sort: ['_doc'],
      size: 50,
    },
  });
});

/**
 * Per-kind population-disclosure coverage, driven from INVENTORY_KIND_CONFIG itself rather than a
 * hardcoded kind list — a 6th kind added to the map is automatically required to either carry a
 * real breakdown aggregation, be covered by the tool-level digest.breakdownDimensions fallback
 * (at least one dimension present in the kind's own _source list), or have a written reason
 * below. Nothing is exempt by default.
 */
const KIND_BREAKDOWN_EXEMPT: Record<string, string> = {
  os:
    'fixedSize: 5 — one current OS record per agent, so the returned page is effectively the ' +
    'whole population; there is no truncation for a breakdown to disclose against.',
  hotfixes:
    'single free-text field (package.hotfix.name, the only live-confirmed field for this ' +
    'index) — there is no categorical dimension to break the population down by; counts.total ' +
    'is the only population statement this kind can make.',
};

test('get_agent_inventory: every kind has a real breakdown agg, a reachable synthetic dimension, or a written reason', () => {
  const dims = getAgentInventoryTool.digest.breakdownDimensions ?? [];
  const failures: string[] = [];
  for (const [kind, config] of Object.entries(INVENTORY_KIND_CONFIG)) {
    if (config.breakdownAggs && Object.keys(config.breakdownAggs).length > 0) {
      continue;
    }
    if (dims.some(dimension => config.source.includes(dimension))) {
      continue; // digest-level fallback reaches this kind through its own _source.
    }
    const reason = KIND_BREAKDOWN_EXEMPT[kind];
    if (typeof reason === 'string' && reason.length > 0) {
      continue;
    }
    failures.push(
      `kind="${kind}": no breakdownAggs, no digest.breakdownDimensions entry present in its ` +
        '_source, and no written reason in KIND_BREAKDOWN_EXEMPT',
    );
  }
  assert.deepEqual(failures, []);
});

test('get_agent_inventory: KIND_BREAKDOWN_EXEMPT names only real kinds (stale-exemption guard)', () => {
  for (const kind of Object.keys(KIND_BREAKDOWN_EXEMPT)) {
    assert.ok(
      kind in INVENTORY_KIND_CONFIG,
      `KIND_BREAKDOWN_EXEMPT names unknown kind "${kind}"`,
    );
    const config =
      INVENTORY_KIND_CONFIG[kind as keyof typeof INVENTORY_KIND_CONFIG];
    assert.equal(
      config.breakdownAggs,
      undefined,
      `kind "${kind}" now has a real breakdown agg — remove its stale exemption`,
    );
  }
});

test('get_agent_inventory: every breakdown-agg request passes applySafetyValves + lintDsl', () => {
  // Without this guard the loop passes vacuously if INVENTORY_KIND_CONFIG ever lost every
  // breakdownAggs entry (e.g. a refactor that renamed the field) -- same "nothing exempt by
  // default" standard as agg-representability-coverage.test.ts's indexerTools.length check.
  let checkedCount = 0;
  for (const [kind, config] of Object.entries(INVENTORY_KIND_CONFIG)) {
    if (!config.breakdownAggs) {
      continue;
    }
    checkedCount += 1;
    const req = buildIndexer({ agent_id: '003', kind });
    const valved = applySafetyValves(req.body);
    assert.equal(valved.ok, true, valved.ok ? '' : `${kind}: ${valved.reason}`);
    if (!valved.ok) {
      continue;
    }
    const lint = lintDsl(valved.body, req.index);
    assert.equal(lint.ok, true, lint.ok ? '' : `${kind}: ${lint.reason}`);
  }
  assert.ok(
    checkedCount > 0,
    'no INVENTORY_KIND_CONFIG kind declared a breakdownAggs -- this test would pass vacuously',
  );
});

test('get_agent_inventory: limit is clamped to [1, 500] for the 3 limit-taking folded-in kinds', () => {
  const over = buildIndexer({
    agent_id: '003',
    kind: 'packages',
    limit: 10_000,
  });
  assert.equal(over.body.size, 500);
  const under = buildIndexer({ agent_id: '003', kind: 'ports', limit: 0 });
  assert.equal(under.body.size, 1);
  const omitted = buildIndexer({ agent_id: '003', kind: 'processes' });
  assert.equal(omitted.body.size, 50);
});

// --- The one new kind added tonight. ---

test('get_agent_inventory: kind="hotfixes" targets wazuh-states-inventory-hotfixes* with the one confirmed field', () => {
  const req = buildIndexer({ agent_id: '003', kind: 'hotfixes' });
  assert.equal(req.index, 'wazuh-states-inventory-hotfixes*');
  assert.deepEqual(req.body._source, ['package.hotfix.name']);
  assert.deepEqual(req.body.query, {
    bool: { filter: [{ term: { 'wazuh.agent.id': '003' } }] },
  });
  assert.equal(req.body.size, 50);
});

test('get_agent_inventory: deriveColumns is set (no static tableSpec/digest for a per-kind tool)', () => {
  assert.equal(getAgentInventoryTool.deriveColumns, true);
  assert.deepEqual(getAgentInventoryTool.tableSpec.columns, []);
  assert.deepEqual(getAgentInventoryTool.digest.sampleColumns, []);
});

// --- issue #8913: a live-verified N=5 run of "What software does this box have installed?" found
// the system prompt's "call get_agents first" instruction was followed 0/5 times even though the
// deployed prompt text carried it (4/5 asked the user to name an agent; 1/5 called the wrong tool
// and found nothing). resolveDeicticAgentParams (this tool's `resolveParams` hook) makes
// correctness independent of that compliance by resolving the agent server-side whenever neither
// identifier was supplied. ---

function resolveParams(
  params: Record<string, unknown>,
  context: ResolveParamsContext,
) {
  return getAgentInventoryTool.resolveParams!(params, context, fakeRequest());
}

test('get_agent_inventory resolveParams: no identifier + exactly one active agent resolves and surfaces the assumption', async () => {
  const context = fakeContext({ items: [{ id: '003', name: 'web-prod-01' }] });
  const result = await resolveParams({ kind: 'packages' }, context);
  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }
  assert.equal(result.resolved.params.agent_id, '003');
  // The original params are otherwise untouched -- only agent_id is added.
  assert.equal(result.resolved.params.kind, 'packages');
  assert.ok(result.resolved.note, 'expected an assumption note to be attached');
  assert.match(result.resolved.note!, /web-prod-01/);
  assert.match(result.resolved.note!, /003/);
});

test('get_agent_inventory resolveParams: no identifier + zero active agents returns the "which agent?" error', async () => {
  const context = fakeContext({ items: [] });
  const result = await resolveParams({ kind: 'packages' }, context);
  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.match(result.reason, /agent_id.*agent_name|agent_name.*agent_id/);
  assert.match(result.reason, /no active agent/i);
  // Follow-up audit fix (same bug class as #8913's main fix): this LIVE tool_result error must
  // never tell the model to call get_agents -- stage-1 routing offered get_agent_inventory (its
  // own 'inventory' category) for this call to have happened at all, but nothing guarantees
  // 'agents' was ALSO routed this turn, so naming that tool here can be just as unreachable as it
  // was in the description/system-prompt text this whole fix started from.
  assert.doesNotMatch(result.reason, /get_agents/);
  assert.match(result.reason, /ask the user/i);
});

test('get_agent_inventory resolveParams: no identifier + multiple active agents errors and lists candidates', async () => {
  const context = fakeContext({
    items: [
      { id: '001', name: 'web-prod-01' },
      { id: '002', name: 'db-prod-01' },
    ],
  });
  const result = await resolveParams({ kind: 'packages' }, context);
  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.match(result.reason, /agent_id.*agent_name|agent_name.*agent_id/);
  assert.match(result.reason, /web-prod-01/);
  assert.match(result.reason, /db-prod-01/);
  assert.match(result.reason, /2 active agents/);
});

test('get_agent_inventory resolveParams: more active agents than the listing cap reports how many more', async () => {
  const items = Array.from({ length: 15 }, (_, i) => ({
    id: String(100 + i).padStart(3, '0'),
    name: `agent-${i}`,
  }));
  const context = fakeContext({ items });
  const result = await resolveParams({ kind: 'packages' }, context);
  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.match(result.reason, /15 active agents/);
  assert.match(result.reason, /and \d+ more/);
});

test('get_agent_inventory resolveParams: a lookup failure (Manager API unreachable) falls back to the plain "which agent?" error', async () => {
  const context = fakeContext(undefined);
  const result = await resolveParams({ kind: 'packages' }, context);
  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.match(result.reason, /agent_id.*agent_name|agent_name.*agent_id/);
  // Same follow-up audit fix as the zero-active-agents case above.
  assert.doesNotMatch(result.reason, /get_agents/);
});

test('get_agent_inventory resolveParams: agent_id supplied is returned unchanged, no lookup, no note (regression)', async () => {
  let lookupCalled = false;
  const context = {
    wazuh_core: {
      manageHosts: {
        get: () => Promise.reject(new Error('should not be called')),
      },
      api: {
        client: {
          asCurrentUser: {
            request: () => {
              lookupCalled = true;
              return Promise.reject(new Error('should not be called'));
            },
          },
        },
      },
    },
  } as unknown as ResolveParamsContext;
  const result = await resolveParams(
    { agent_id: '003', kind: 'packages' },
    context,
  );
  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }
  assert.deepEqual(result.resolved.params, {
    agent_id: '003',
    kind: 'packages',
  });
  assert.equal(result.resolved.note, undefined);
  assert.equal(lookupCalled, false);
});

test('get_agent_inventory resolveParams: agent_name supplied is returned unchanged, no lookup, no note (regression)', async () => {
  const context = {
    wazuh_core: {
      manageHosts: {
        get: () => Promise.reject(new Error('should not be called')),
      },
      api: {
        client: {
          asCurrentUser: {
            request: () => Promise.reject(new Error('should not be called')),
          },
        },
      },
    },
  } as unknown as ResolveParamsContext;
  const result = await resolveParams(
    { agent_name: 'web-prod-01', kind: 'packages' },
    context,
  );
  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }
  assert.deepEqual(result.resolved.params, {
    agent_name: 'web-prod-01',
    kind: 'packages',
  });
  assert.equal(result.resolved.note, undefined);
});

// Issue #8917: `failClosedFieldPolicy` must be set explicitly and independently of
// `deriveColumns` -- see that flag's doc comment in types.ts. This tool needs `deriveColumns` for
// column derivation across its 5 kinds, and separately opts into fail-closed field policy because
// every field any kind can surface still needs its own explicit FIELD_POLICY_DEFAULTS entry.
test('get_agent_inventory: failClosedFieldPolicy is explicitly true, independent of deriveColumns', () => {
  assert.equal(getAgentInventoryTool.failClosedFieldPolicy, true);
});

// --- issue #8910: an optional "filter" narrows results on the kind's primary name field, so
// presence questions ("is openssl installed?", "what's on port 9200?") no longer depend on the
// answer sorting into the first `limit` rows of a possibly much larger inventory. ---

test('get_agent_inventory: "filter" is an optional string param in the schema', () => {
  const filterProperty = getAgentInventoryTool.spec.parameters.properties
    .filter as unknown as { type?: string };
  assert.equal(filterProperty.type, 'string');
  assert.ok(
    !(getAgentInventoryTool.spec.parameters.required ?? []).includes('filter'),
    'filter must not be required',
  );
});

test('get_agent_inventory: omitting "filter" leaves the request body unchanged (regression)', () => {
  const req = buildIndexer({ agent_id: '003', kind: 'packages' });
  assert.deepEqual(req.body.query, {
    bool: { filter: [{ term: { 'wazuh.agent.id': '003' } }] },
  });
});

test('get_agent_inventory: kind="packages" filter narrows on package.name, case-insensitive prefix', () => {
  const req = buildIndexer({
    agent_id: '003',
    kind: 'packages',
    filter: 'openssl',
  });
  assert.deepEqual(req.body.query, {
    bool: {
      filter: [
        { term: { 'wazuh.agent.id': '003' } },
        {
          wildcard: {
            'package.name': { value: 'openssl*', case_insensitive: true },
          },
        },
      ],
    },
  });
});

test('get_agent_inventory: kind="hotfixes" filter narrows on package.hotfix.name', () => {
  const req = buildIndexer({
    agent_id: '003',
    kind: 'hotfixes',
    filter: 'KB5001',
  });
  assert.deepEqual(req.body.query, {
    bool: {
      filter: [
        { term: { 'wazuh.agent.id': '003' } },
        {
          wildcard: {
            'package.hotfix.name': {
              value: 'KB5001*',
              case_insensitive: true,
            },
          },
        },
      ],
    },
  });
});

test('get_agent_inventory: kind="processes" filter matches either process.name or process.command_line', () => {
  const req = buildIndexer({
    agent_id: '003',
    kind: 'processes',
    filter: 'nginx',
  });
  assert.deepEqual(req.body.query, {
    bool: {
      filter: [
        { term: { 'wazuh.agent.id': '003' } },
        {
          bool: {
            should: [
              {
                wildcard: {
                  'process.name': { value: 'nginx*', case_insensitive: true },
                },
              },
              {
                wildcard: {
                  'process.command_line': {
                    value: 'nginx*',
                    case_insensitive: true,
                  },
                },
              },
            ],
            minimum_should_match: 1,
          },
        },
      ],
    },
  });
});

test('get_agent_inventory: kind="os" filter matches either host.hostname or host.os.name', () => {
  const req = buildIndexer({
    agent_id: '003',
    kind: 'os',
    filter: 'web-prod-01',
  });
  assert.deepEqual(req.body.query, {
    bool: {
      filter: [
        { term: { 'wazuh.agent.id': '003' } },
        {
          bool: {
            should: [
              {
                wildcard: {
                  'host.hostname': {
                    value: 'web-prod-01*',
                    case_insensitive: true,
                  },
                },
              },
              {
                wildcard: {
                  'host.os.name': {
                    value: 'web-prod-01*',
                    case_insensitive: true,
                  },
                },
              },
            ],
            minimum_should_match: 1,
          },
        },
      ],
    },
  });
});

// #8914: a numeric ports filter matched EITHER side of the socket with no state narrowing, so
// "what's listening on port 9200" returned every connection touching 9200 instead of just the
// listener(s). The outer clause narrowed here: still a port match on EITHER side (`bool.filter`
// unchanged in spirit), AND (via a nested `bool.should`/`minimum_should_match: 1`) either
// `interface.state` case-insensitively matches "listening"/"listen" or the field is absent from
// that document -- the graceful fallback so a deployment/document without `interface.state` still
// gets the plain port match back instead of the query going silently empty.
//
// The exact clause shape (`term` with `{value, case_insensitive: true}`, not a bare string) is
// pinned here on purpose: a live query against a real wazuh-indexer deployment (issue #8914)
// found the actual `interface.state` vocabulary is lowercase full words ("listening",
// "established", "time_wait", "close_wait") -- NOT the "LISTEN"/"ESTABLISHED" short forms
// plugins/main's synthetic sample-data generator uses. An exact-cased `term: {'interface.state':
// 'LISTEN'}` (this file's previous revision) never matches real "listening" documents, so this
// test's assertion on the case-insensitive shape is what would catch a future regression back to
// an exact-cased term.
test('get_agent_inventory: kind="ports" numeric filter matches the port on either side AND prefers the listening state', () => {
  const req = buildIndexer({
    agent_id: '003',
    kind: 'ports',
    filter: '9200',
  });
  assert.deepEqual(req.body.query, {
    bool: {
      filter: [
        { term: { 'wazuh.agent.id': '003' } },
        {
          bool: {
            filter: [
              {
                bool: {
                  should: [
                    { term: { 'source.port': 9200 } },
                    { term: { 'destination.port': 9200 } },
                  ],
                  minimum_should_match: 1,
                },
              },
            ],
            should: [
              {
                term: {
                  'interface.state': {
                    value: 'listening',
                    case_insensitive: true,
                  },
                },
              },
              {
                term: {
                  'interface.state': {
                    value: 'listen',
                    case_insensitive: true,
                  },
                },
              },
              { bool: { must_not: { exists: { field: 'interface.state' } } } },
            ],
            minimum_should_match: 1,
          },
        },
      ],
    },
  });
});

// Pins the case-insensitivity specifically (issue #8914's live-verified defect): the live
// `wazuh-states-inventory-ports*` vocabulary is lowercase ("listening"), so a `term` clause
// without `case_insensitive: true` -- or one restored to an exact-cased literal like "LISTEN" or
// "Listening" -- must fail this assertion loudly rather than silently reintroducing the bug.
test('get_agent_inventory: kind="ports" listening-state match is case-insensitive, not an exact-cased literal', () => {
  const req = buildIndexer({
    agent_id: '003',
    kind: 'ports',
    filter: '9200',
  });
  const portFilterClause = (req.body.query as { bool: { filter: unknown[] } })
    .bool.filter[1] as {
    bool: {
      should: Array<Record<string, unknown>>;
      minimum_should_match: number;
    };
  };
  const stateClauses = portFilterClause.bool.should.filter(
    clause => 'term' in clause,
  ) as Array<{
    term: { 'interface.state': { value: string; case_insensitive: boolean } };
  }>;
  assert.ok(
    stateClauses.length > 0,
    'expected at least one "term" clause on interface.state',
  );
  for (const clause of stateClauses) {
    const termValue = clause.term['interface.state'];
    assert.equal(
      typeof termValue,
      'object',
      'interface.state term clause must use the {value, case_insensitive} object form, not a bare string',
    );
    assert.equal(termValue.case_insensitive, true);
  }
  const matchedValues = stateClauses.map(
    clause => clause.term['interface.state'].value,
  );
  assert.ok(
    matchedValues.includes('listening'),
    'must match the live-confirmed "listening" value',
  );
});

test('get_agent_inventory: kind="ports" numeric filter still returns a document lacking "interface.state" (fallback)', () => {
  // Same request as above -- this test documents the query SHAPE's fallback behavior (a document
  // with no "interface.state" field satisfies the "must_not: exists" should-clause, so it is not
  // excluded by the state narrowing), since this is a static request-building test with no live
  // Indexer to execute the query against.
  const req = buildIndexer({
    agent_id: '003',
    kind: 'ports',
    filter: '9200',
  });
  const portFilterClause = (req.body.query as { bool: { filter: unknown[] } })
    .bool.filter[1] as {
    bool: { should: unknown[]; minimum_should_match: number };
  };
  assert.deepEqual(
    portFilterClause.bool.should[portFilterClause.bool.should.length - 1],
    {
      bool: { must_not: { exists: { field: 'interface.state' } } },
    },
  );
  assert.equal(portFilterClause.bool.minimum_should_match, 1);
});

test('get_agent_inventory: kind="ports" a non-numeric filter falls back to a process.name match', () => {
  const req = buildIndexer({
    agent_id: '003',
    kind: 'ports',
    filter: 'nginx',
  });
  assert.deepEqual(req.body.query, {
    bool: {
      filter: [
        { term: { 'wazuh.agent.id': '003' } },
        {
          wildcard: {
            'process.name': { value: 'nginx*', case_insensitive: true },
          },
        },
      ],
    },
  });
});

test('get_agent_inventory: filter value is sanitized so a caller-supplied "*"/"?" cannot produce a leading wildcard', () => {
  const req = buildIndexer({
    agent_id: '003',
    kind: 'packages',
    filter: '*ssl?',
  });
  assert.deepEqual(req.body.query, {
    bool: {
      filter: [
        { term: { 'wazuh.agent.id': '003' } },
        {
          wildcard: {
            'package.name': { value: 'ssl*', case_insensitive: true },
          },
        },
      ],
    },
  });
});

test('get_agent_inventory: a blank/whitespace-only filter is treated as omitted', () => {
  const req = buildIndexer({
    agent_id: '003',
    kind: 'packages',
    filter: '   ',
  });
  assert.deepEqual(req.body.query, {
    bool: { filter: [{ term: { 'wazuh.agent.id': '003' } }] },
  });
});

test('get_agent_inventory: description advertises "filter" for presence questions (routing guidance)', () => {
  assert.match(
    getAgentInventoryTool.spec.description,
    /check whether one specific package\/port\/process is present.*pass "filter"/,
  );
});
