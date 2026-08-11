import assert from 'node:assert/strict';
import {
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from '../../../../src/core/server';
import { buildGenericResolveParams } from './param-resolution';
import { ToolDefinition } from './types';

type ResolveParams = NonNullable<ToolDefinition['resolveParams']>;

/** Minimal `context` stub covering BOTH live sources the generic resolver can hit: the Manager
 * API's `/agents` (via `wazuh_core.api.client.asCurrentUser.request`, same shape
 * get-agent-inventory.test.ts's own `fakeContext` uses) and the Indexer's `_search` (via
 * `core.opensearch.client.asCurrentUser.search`, same shape executor.test.ts's own `fakeContext`
 * uses). Either side can be omitted (`undefined`) to simulate that source failing outright; either
 * side records every call it received so a test can assert on scoping. */
function fakeContext(options: {
  agents?: { items: Array<{ id: string; name?: string }>; total?: number };
  agentsThrows?: boolean;
  termBuckets?: string[];
  termsThrows?: boolean;
}): {
  context: RequestHandlerContext;
  managerCalls: Array<Record<string, unknown>>;
  searchCalls: Array<{ index: string; body: Record<string, unknown> }>;
} {
  const managerCalls: Array<Record<string, unknown>> = [];
  const searchCalls: Array<{ index: string; body: Record<string, unknown> }> =
    [];
  const context = {
    wazuh_core: {
      manageHosts: {
        get: () => Promise.resolve([{ id: 'host-1' }]),
      },
      api: {
        client: {
          asCurrentUser: {
            request: (
              _method: string,
              _path: string,
              requestParams: Record<string, unknown>,
            ) => {
              managerCalls.push(requestParams);
              if (options.agentsThrows || options.agents === undefined) {
                throw new Error('simulated Manager API failure');
              }
              return Promise.resolve({
                status: 200,
                data: {
                  data: {
                    affected_items: options.agents.items,
                    total_affected_items:
                      options.agents.total ?? options.agents.items.length,
                  },
                },
              });
            },
          },
        },
      },
    },
    core: {
      opensearch: {
        client: {
          asCurrentUser: {
            search: (call: {
              index: string;
              body: Record<string, unknown>;
            }) => {
              searchCalls.push(call);
              if (options.termsThrows || options.termBuckets === undefined) {
                throw new Error('simulated Indexer failure');
              }
              return Promise.resolve({
                body: {
                  aggregations: {
                    candidates: {
                      buckets: options.termBuckets.map(key => ({ key })),
                    },
                  },
                },
              });
            },
          },
        },
      },
    },
  } as unknown as RequestHandlerContext;
  return { context, managerCalls, searchCalls };
}

const fakeRequest = { headers: {} } as unknown as OpenSearchDashboardsRequest;

/** Minimal `ToolDefinition` stub -- only `soleCandidateParams` is read by
 * `buildGenericResolveParams`; the rest are never invoked by this suite. */
function stubTool(
  soleCandidateParams: NonNullable<ToolDefinition['soleCandidateParams']>,
): ToolDefinition {
  return {
    spec: {
      name: 'stub_tool',
      description: '',
      parameters: { type: 'object', properties: {} },
    },
    target: 'indexer',
    tier: 'T1',
    buildRequest: () => ({ target: 'indexer', index: 'x', body: {} }),
    tableSpec: { columns: [] },
    digest: { sampleColumns: [] },
    soleCandidateParams,
  };
}

// --- contract outcome 1: param already supplied -> passthrough --------------------------------

test('buildGenericResolveParams: a supplied param passes through unchanged, no lookup, no note', async () => {
  const tool = stubTool([
    { param: 'agent_id', source: { kind: 'manager-agents' } },
  ]);
  const resolve: ResolveParams = buildGenericResolveParams(tool);
  const { context, managerCalls } = fakeContext({
    agents: { items: [{ id: '003', name: 'web-prod-01' }] },
  });
  const result = await resolve({ agent_id: '007' }, context, fakeRequest);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.resolved.params.agent_id, '007');
  assert.equal(result.resolved.note, undefined);
  assert.equal(
    managerCalls.length,
    0,
    'no lookup should fire for a supplied param',
  );
});

// --- contract outcome 2: exactly one candidate -> inject + assumptionNote ----------------------

test('buildGenericResolveParams (manager-agents): exactly one active agent resolves and attaches a note', async () => {
  const tool = stubTool([
    { param: 'agent_id', source: { kind: 'manager-agents' } },
  ]);
  const resolve: ResolveParams = buildGenericResolveParams(tool);
  const { context } = fakeContext({
    agents: { items: [{ id: '001', name: 'wazuh-aio-5' }] },
  });
  const result = await resolve({}, context, fakeRequest);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.resolved.params.agent_id, '001');
  assert.match(result.resolved.note ?? '', /wazuh-aio-5/);
  assert.match(result.resolved.note ?? '', /001/);
});

test('buildGenericResolveParams (manager-agents, valueFrom "name"): injects the agent NAME, not the id', async () => {
  const tool = stubTool([
    {
      param: 'agent_name',
      source: { kind: 'manager-agents' },
      valueFrom: 'name',
    },
  ]);
  const resolve: ResolveParams = buildGenericResolveParams(tool);
  const { context } = fakeContext({
    agents: { items: [{ id: '001', name: 'wazuh-aio-5' }] },
  });
  const result = await resolve({}, context, fakeRequest);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.resolved.params.agent_name, 'wazuh-aio-5');
});

test('buildGenericResolveParams (manager-agents, valueFrom "id-or-name"): injects the id (exact, unambiguous)', async () => {
  const tool = stubTool([
    {
      param: 'agent_identifier',
      source: { kind: 'manager-agents' },
      valueFrom: 'id-or-name',
    },
  ]);
  const resolve: ResolveParams = buildGenericResolveParams(tool);
  const { context } = fakeContext({
    agents: { items: [{ id: '001', name: 'wazuh-aio-5' }] },
  });
  const result = await resolve({}, context, fakeRequest);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.resolved.params.agent_identifier, '001');
});

test('buildGenericResolveParams (indexer-terms): exactly one candidate resolves and attaches a note', async () => {
  const tool = stubTool([
    {
      param: 'policy_id',
      source: {
        kind: 'indexer-terms',
        index: 'wazuh-states-sca*',
        field: 'policy.id',
      },
    },
  ]);
  const resolve: ResolveParams = buildGenericResolveParams(tool);
  const { context } = fakeContext({ termBuckets: ['cis_ubuntu22-04'] });
  const result = await resolve({}, context, fakeRequest);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.resolved.params.policy_id, 'cis_ubuntu22-04');
  assert.match(result.resolved.note ?? '', /cis_ubuntu22-04/);
});

// --- contract outcome 3: zero/many candidates -> ok:false with named candidates ----------------

test('buildGenericResolveParams (manager-agents): zero active agents errors without naming get_agents', async () => {
  const tool = stubTool([
    { param: 'agent_id', source: { kind: 'manager-agents' } },
  ]);
  const resolve: ResolveParams = buildGenericResolveParams(tool);
  const { context } = fakeContext({ agents: { items: [] } });
  const result = await resolve({}, context, fakeRequest);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.reason, /no active agent/i);
  assert.doesNotMatch(result.reason, /get_agents/);
});

test('buildGenericResolveParams (manager-agents): multiple active agents errors and lists up to 10 named candidates', async () => {
  const tool = stubTool([
    { param: 'agent_id', source: { kind: 'manager-agents' } },
  ]);
  const resolve: ResolveParams = buildGenericResolveParams(tool);
  const items = Array.from({ length: 15 }, (_, i) => ({
    id: String(i + 1).padStart(3, '0'),
    name: `agent-${i + 1}`,
  }));
  const { context } = fakeContext({ agents: { items, total: 15 } });
  const result = await resolve({}, context, fakeRequest);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.reason, /15 active agents/);
  assert.match(result.reason, /agent-1"/);
  assert.match(result.reason, /and \d+ more/);
});

test('buildGenericResolveParams (indexer-terms): zero matching values errors', async () => {
  const tool = stubTool([
    {
      param: 'policy_id',
      source: {
        kind: 'indexer-terms',
        index: 'wazuh-states-sca*',
        field: 'policy.id',
      },
    },
  ]);
  const resolve: ResolveParams = buildGenericResolveParams(tool);
  const { context } = fakeContext({ termBuckets: [] });
  const result = await resolve({}, context, fakeRequest);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.reason, /No matching value/);
});

test('buildGenericResolveParams (indexer-terms): multiple matching values errors and lists candidates', async () => {
  const tool = stubTool([
    {
      param: 'policy_id',
      source: {
        kind: 'indexer-terms',
        index: 'wazuh-states-sca*',
        field: 'policy.id',
      },
    },
  ]);
  const resolve: ResolveParams = buildGenericResolveParams(tool);
  const { context } = fakeContext({
    termBuckets: ['cis_ubuntu22-04', 'cis_rhel8'],
  });
  const result = await resolve({}, context, fakeRequest);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.reason, /cis_ubuntu22-04/);
  assert.match(result.reason, /cis_rhel8/);
});

// --- contract outcome 4: lookup failure -> plain bounded error ---------------------------------

test('buildGenericResolveParams (manager-agents): a Manager API failure degrades to a plain bounded error', async () => {
  const tool = stubTool([
    { param: 'agent_id', source: { kind: 'manager-agents' } },
  ]);
  const resolve: ResolveParams = buildGenericResolveParams(tool);
  const { context } = fakeContext({ agentsThrows: true });
  const result = await resolve({}, context, fakeRequest);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.reason, /agent_id/);
  assert.doesNotMatch(result.reason, /get_agents/);
});

test('buildGenericResolveParams (indexer-terms): an Indexer failure degrades to a plain bounded error', async () => {
  const tool = stubTool([
    {
      param: 'policy_id',
      source: {
        kind: 'indexer-terms',
        index: 'wazuh-states-sca*',
        field: 'policy.id',
      },
    },
  ]);
  const resolve: ResolveParams = buildGenericResolveParams(tool);
  const { context } = fakeContext({ termsThrows: true });
  const result = await resolve({}, context, fakeRequest);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.reason, /policy_id/);
});

// --- scopedBy cascade: a later param scopes its lookup on an earlier one's resolved value ------

test("buildGenericResolveParams: scopedBy narrows the second param's lookup to the FIRST param's resolved value", async () => {
  const tool = stubTool([
    { param: 'agent_id', source: { kind: 'manager-agents' } },
    {
      param: 'policy_id',
      source: {
        kind: 'indexer-terms',
        index: 'wazuh-states-sca*',
        field: 'policy.id',
        scopedBy: { param: 'agent_id', field: 'wazuh.agent.id' },
      },
    },
  ]);
  const resolve: ResolveParams = buildGenericResolveParams(tool);
  const { context, searchCalls } = fakeContext({
    agents: { items: [{ id: '001', name: 'wazuh-aio-5' }] },
    termBuckets: ['cis_ubuntu22-04'],
  });
  const result = await resolve({}, context, fakeRequest);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.resolved.params.agent_id, '001');
  assert.equal(result.resolved.params.policy_id, 'cis_ubuntu22-04');
  assert.equal(searchCalls.length, 1);
  const filter = (searchCalls[0].body.query as { bool: { filter: unknown[] } })
    .bool.filter;
  assert.deepEqual(filter, [{ term: { 'wazuh.agent.id': '001' } }]);
});

test('buildGenericResolveParams: scopedBy uses a CALLER-supplied earlier param unchanged', async () => {
  const tool = stubTool([
    { param: 'agent_id', source: { kind: 'manager-agents' } },
    {
      param: 'policy_id',
      source: {
        kind: 'indexer-terms',
        index: 'wazuh-states-sca*',
        field: 'policy.id',
        scopedBy: { param: 'agent_id', field: 'wazuh.agent.id' },
      },
    },
  ]);
  const resolve: ResolveParams = buildGenericResolveParams(tool);
  const { context, managerCalls, searchCalls } = fakeContext({
    termBuckets: ['cis_ubuntu22-04'],
  });
  const result = await resolve({ agent_id: '042' }, context, fakeRequest);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.resolved.params.agent_id, '042');
  assert.equal(
    managerCalls.length,
    0,
    'agent_id was supplied, no manager-agents lookup',
  );
  const filter = (searchCalls[0].body.query as { bool: { filter: unknown[] } })
    .bool.filter;
  assert.deepEqual(filter, [{ term: { 'wazuh.agent.id': '042' } }]);
});

test('buildGenericResolveParams: a failed FIRST param short-circuits before the SECOND is attempted', async () => {
  const tool = stubTool([
    { param: 'agent_id', source: { kind: 'manager-agents' } },
    {
      param: 'policy_id',
      source: {
        kind: 'indexer-terms',
        index: 'wazuh-states-sca*',
        field: 'policy.id',
        scopedBy: { param: 'agent_id', field: 'wazuh.agent.id' },
      },
    },
  ]);
  const resolve: ResolveParams = buildGenericResolveParams(tool);
  const { context, searchCalls } = fakeContext({
    agents: { items: [] },
    termBuckets: ['cis_ubuntu22-04'],
  });
  const result = await resolve({}, context, fakeRequest);
  assert.equal(result.ok, false);
  assert.equal(
    searchCalls.length,
    0,
    'policy_id lookup must never fire once agent_id fails',
  );
});
