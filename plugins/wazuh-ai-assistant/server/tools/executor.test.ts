import assert from 'node:assert/strict';
import {
  executeToolCall,
  PrivacyContext,
  resolveSecurityAnalyticsSpace,
} from './executor';
import { Pseudonymizer } from './privacy';
import { ToolCall } from '../../common/types';
import {
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from '../../../../src/core/server';

function hit(space: string | undefined): unknown {
  return space === undefined
    ? { _source: {} }
    : { _source: { space: { name: space } } };
}

test('resolveSecurityAnalyticsSpace: a single distinct space across all hits is used as-is', () => {
  assert.equal(
    resolveSecurityAnalyticsSpace([hit('standard'), hit('standard')]),
    'standard',
  );
  assert.equal(resolveSecurityAnalyticsSpace([hit('draft')]), 'draft');
});

test('resolveSecurityAnalyticsSpace: falls back to "standard" when hits span multiple spaces', () => {
  assert.equal(
    resolveSecurityAnalyticsSpace([hit('draft'), hit('custom')]),
    'standard',
  );
});

test('resolveSecurityAnalyticsSpace: falls back to "standard" with no hits or non-array input', () => {
  assert.equal(resolveSecurityAnalyticsSpace([]), 'standard');
  assert.equal(resolveSecurityAnalyticsSpace(undefined), 'standard');
  assert.equal(resolveSecurityAnalyticsSpace(null), 'standard');
});

test('resolveSecurityAnalyticsSpace: falls back to "standard" when no hit carries a space.name', () => {
  assert.equal(
    resolveSecurityAnalyticsSpace([hit(undefined), hit(undefined)]),
    'standard',
  );
});

// --- issue #8920 items 3 & 6: narrowed-window recount + entity near-miss disclosure ------------

interface SearchCall {
  index: string;
  body: Record<string, unknown>;
}

/** Minimal `context` stub: only `context.core.opensearch.client.asCurrentUser.search` is exercised
 * by the indexer path this suite drives. `responder` decides each call's OpenSearch response body
 * from the call's own shape/order, and every call is recorded in the returned `calls` array so a
 * test can assert exactly how many searches fired (e.g. "no second search when returned > 0"). */
function fakeContext(
  responder: (call: SearchCall, callIndex: number) => Record<string, unknown>,
): { context: RequestHandlerContext; calls: SearchCall[] } {
  const calls: SearchCall[] = [];
  const context = {
    core: {
      opensearch: {
        client: {
          asCurrentUser: {
            search: (params: SearchCall) => {
              const index = calls.length;
              calls.push(params);
              return Promise.resolve({ body: responder(params, index) });
            },
          },
        },
      },
    },
  } as unknown as RequestHandlerContext;
  return { context, calls };
}

const dummyRequest = {} as OpenSearchDashboardsRequest;

function toolCall(name: string, args: Record<string, unknown>): ToolCall {
  return { id: 'call-1', name, arguments: args };
}

async function parseDigest(
  outcome: Awaited<ReturnType<typeof executeToolCall>>,
): Promise<Record<string, unknown>> {
  return JSON.parse(outcome.toolResultContent);
}

test('narrowed-window recount: 0 rows in the queried window, but rows in the default window -> hint carries both counts', async () => {
  const { context, calls } = fakeContext((_call, index) =>
    index === 0
      ? { hits: { hits: [], total: { value: 0 } } }
      : { hits: { hits: [], total: { value: 5 } } },
  );
  const outcome = await executeToolCall(
    toolCall('get_mitre_findings', {
      technique_id: 'T1110',
      time_range_gte: 'now-1h',
      time_range_lte: 'now',
    }),
    context,
    dummyRequest,
  );
  const digest = await parseDigest(outcome);
  assert.equal(calls.length, 2, 'expected exactly one recount search');
  assert.equal(calls[1].body.size, 0);
  assert.match(
    digest.hint as string,
    /0 rows in the queried window \(now-1h to now\); 5 rows match in the default window \(now-90d to now\)/,
  );
});

test('narrowed-window recount: does not fire when the tool call itself returned rows', async () => {
  const { context, calls } = fakeContext(() => ({
    hits: {
      hits: [
        {
          _source: {
            '@timestamp': '2026-08-10T00:00:00Z',
            'wazuh.rule.mitre.technique.id': 'T1110',
          },
        },
      ],
      total: { value: 1 },
    },
  }));
  const outcome = await executeToolCall(
    toolCall('get_mitre_findings', { technique_id: 'T1110' }),
    context,
    dummyRequest,
  );
  const digest = await parseDigest(outcome);
  assert.equal(calls.length, 1, 'no recount search should fire on a non-zero result');
  assert.equal(digest.hint, undefined);
});

test('narrowed-window recount: also does not fire when the widened recount itself finds nothing', async () => {
  const { context, calls } = fakeContext(() => ({
    hits: { hits: [], total: { value: 0 } },
  }));
  const outcome = await executeToolCall(
    toolCall('get_mitre_findings', {
      technique_id: 'T1110',
      time_range_gte: 'now-1h',
      time_range_lte: 'now',
    }),
    context,
    dummyRequest,
  );
  const digest = await parseDigest(outcome);
  assert.equal(calls.length, 2, 'the recount search still fires...');
  // ...but since it ALSO found 0 rows, no widen hint is appended (the pre-existing zero-row hint
  // from digest.ts's buildZeroRowHint may still be present -- this only asserts the widen SENTENCE
  // is absent).
  assert.ok(
    !(digest.hint as string | undefined)?.includes('rows match in the default window'),
  );
});

test('entity near-miss: a zero-padding near-miss with data is disclosed, in the clear when privacy is off', async () => {
  const findingHit = {
    _source: {
      '@timestamp': '2026-08-10T00:00:00Z',
      'wazuh.agent.name': 'wazuh-aio-05',
      'wazuh.rule.title': 'test rule',
      'wazuh.rule.level': 'high',
    },
  };
  const { context, calls } = fakeContext((_call, index) =>
    index === 0
      ? { hits: { hits: [findingHit], total: { value: 1 } } }
      : {
          hits: { hits: [], total: { value: 0 } },
          aggregations: {
            agent_names: {
              buckets: [{ key: 'wazuh-aio-5', doc_count: 10 }],
            },
          },
        },
  );
  const outcome = await executeToolCall(
    toolCall('search_findings_by_agent', { agent_name: 'wazuh-aio-05' }),
    context,
    dummyRequest,
  );
  const digest = await parseDigest(outcome);
  assert.equal(calls.length, 2, 'exactly one entity near-miss probe, no recount (returned > 0)');
  assert.equal(calls[1].body.size, 0);
  const hint = digest.hint as string;
  assert.match(hint, /"wazuh-aio-05"/);
  assert.match(hint, /wazuh-aio-5/);
  assert.match(hint, /never silently substitute one host for another/);
});

test('entity near-miss: agent names in the hint are pseudonymized when privacy mode is active', async () => {
  const findingHit = {
    _source: {
      '@timestamp': '2026-08-10T00:00:00Z',
      'wazuh.agent.name': 'wazuh-aio-05',
    },
  };
  const { context } = fakeContext((_call, index) =>
    index === 0
      ? { hits: { hits: [findingHit], total: { value: 1 } } }
      : {
          hits: { hits: [], total: { value: 0 } },
          aggregations: {
            agent_names: { buckets: [{ key: 'wazuh-aio-5', doc_count: 10 }] },
          },
        },
  );
  const privacy: PrivacyContext = {
    pseudonymizer: new Pseudonymizer(),
    fieldPolicy: [],
  };
  const outcome = await executeToolCall(
    toolCall('search_findings_by_agent', { agent_name: 'wazuh-aio-05' }),
    context,
    dummyRequest,
    privacy,
  );
  const digest = await parseDigest(outcome);
  const hint = digest.hint as string;
  // Neither raw hostname reaches the digest's hint text under privacy mode.
  assert.ok(!hint.includes('wazuh-aio-05'));
  assert.ok(!hint.includes('wazuh-aio-5"'));
  assert.match(hint, /HOST_\d+/);
  // The same two real values are recoverable from the pseudonymizer's own map (round-trip sanity).
  const entries = privacy.pseudonymizer.newEntries();
  const realValues = entries.map(entry => entry.value);
  assert.ok(realValues.includes('wazuh-aio-05'));
  assert.ok(realValues.includes('wazuh-aio-5'));
});

test('entity near-miss: does not fire for a tool call naming no agent at all', async () => {
  const { context, calls } = fakeContext(() => ({
    hits: { hits: [], total: { value: 0 } },
  }));
  const outcome = await executeToolCall(
    toolCall('get_events_by_agent', {
      time_range_gte: 'now-1h',
      time_range_lte: 'now',
    }),
    context,
    dummyRequest,
  );
  await parseDigest(outcome);
  // A narrow window (differing from the plugin default) makes the window-recount fire once (2
  // total calls); no agent_name was supplied, so the entity probe must not fire a THIRD search.
  assert.equal(calls.length, 2);
});
