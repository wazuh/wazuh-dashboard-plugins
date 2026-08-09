import assert from 'node:assert/strict';
import { executeToolCall, resolveSecurityAnalyticsSpace } from './executor';
import { FIELD_POLICY_DEFAULTS, Pseudonymizer } from './privacy';

function hit(space: string | undefined): unknown {
  return space === undefined
    ? { _source: {} }
    : { _source: { space: { name: space } } };
}

type ExecContext = Parameters<typeof executeToolCall>[1];
type ExecRequest = Parameters<typeof executeToolCall>[2];

/** Minimal `context`/`request` stubs for `executeToolCall`'s Indexer path: only
 * `context.core.opensearch.client.asCurrentUser.search` is read (get_agent_inventory's
 * `buildRequest` needs only `agent_id`/`kind` from `params`, no async lookup). `request` is
 * unused on this path and can be an empty object. */
function fakeSearchContext(hits: Array<Record<string, unknown>>): ExecContext {
  return {
    core: {
      opensearch: {
        client: {
          asCurrentUser: {
            search: () =>
              Promise.resolve({
                body: {
                  hits: {
                    total: { value: hits.length },
                    hits: hits.map(_source => ({ _source })),
                  },
                },
              }),
          },
        },
      },
    },
  } as unknown as ExecContext;
}
const fakeRequest = {} as ExecRequest;

// --- Issue #8917: end-to-end (executeToolCall, not just applyFieldPolicy in isolation) proof that
// the executor threads a deriveColumns tool's OWN `failClosedFieldPolicy` flag into field policy,
// not `deriveColumns` itself -- and that an explicit FIELD_POLICY_DEFAULTS entry wins over the
// fail-closed default for a real get_agent_inventory call. ---------------------------------------

test('executeToolCall: get_agent_inventory keeps package.name/package.version readable under privacy mode, still anonymizing package.vendor (no entry)', async () => {
  const context = fakeSearchContext([
    {
      package: {
        name: 'adduser',
        version: '3.118ubuntu5',
        vendor: 'Ubuntu Developers',
        architecture: 'all',
      },
    },
  ]);
  const privacy = {
    pseudonymizer: new Pseudonymizer([]),
    fieldPolicy: FIELD_POLICY_DEFAULTS,
  };
  const outcome = await executeToolCall(
    {
      id: 'call-1',
      name: 'get_agent_inventory',
      arguments: { agent_id: '001', kind: 'packages' },
    },
    context,
    fakeRequest,
    privacy,
  );
  const digest = JSON.parse(outcome.toolResultContent) as {
    samples: Array<Record<string, unknown>>;
  };
  assert.equal(digest.samples[0]['package.name'], 'adduser');
  assert.equal(digest.samples[0]['package.version'], '3.118ubuntu5');
  assert.equal(digest.samples[0]['package.architecture'], 'all');
  // package.vendor has no FIELD_POLICY_DEFAULTS entry -- get_agent_inventory's
  // `failClosedFieldPolicy: true` must still fail it closed.
  assert.match(
    digest.samples[0]['package.vendor'] as string,
    /^(HOST|IP|USER|URL|VAL)_\d+$/,
  );
});

test('executeToolCall: privacy off leaves get_agent_inventory digest completely unscrubbed', async () => {
  const context = fakeSearchContext([
    { package: { name: 'adduser', version: '3.118ubuntu5' } },
  ]);
  const outcome = await executeToolCall(
    {
      id: 'call-1',
      name: 'get_agent_inventory',
      arguments: { agent_id: '001', kind: 'packages' },
    },
    context,
    fakeRequest,
    undefined,
  );
  const digest = JSON.parse(outcome.toolResultContent) as {
    samples: Array<Record<string, unknown>>;
  };
  assert.equal(digest.samples[0]['package.name'], 'adduser');
  assert.equal(digest.samples[0]['package.version'], '3.118ubuntu5');
});

test('executeToolCall: unlisted-field fail-closed tracks failClosedFieldPolicy, not deriveColumns (decoupling proof)', async () => {
  // Flips ONLY `failClosedFieldPolicy` on the real, registered get_agent_inventory tool --
  // `deriveColumns` stays `true` throughout. If the executor still keyed off `deriveColumns` (the
  // pre-#8917 bug this test guards against), this would have no effect and package.vendor would
  // still come back fail-closed.
  const { getAgentInventoryTool } = await import('./catalog/get-agent-inventory');
  const original = getAgentInventoryTool.failClosedFieldPolicy;
  assert.equal(getAgentInventoryTool.deriveColumns, true);
  try {
    getAgentInventoryTool.failClosedFieldPolicy = false;
    const context = fakeSearchContext([
      {
        package: {
          name: 'adduser',
          version: '3.118ubuntu5',
          vendor: 'Ubuntu Developers',
        },
      },
    ]);
    const privacy = {
      pseudonymizer: new Pseudonymizer([]),
      fieldPolicy: FIELD_POLICY_DEFAULTS,
    };
    const outcome = await executeToolCall(
      {
        id: 'call-1',
        name: 'get_agent_inventory',
        arguments: { agent_id: '001', kind: 'packages' },
      },
      context,
      fakeRequest,
      privacy,
    );
    const digest = JSON.parse(outcome.toolResultContent) as {
      samples: Array<Record<string, unknown>>;
    };
    // With failClosedFieldPolicy: false, package.vendor (no FIELD_POLICY_DEFAULTS entry) now
    // falls under plain allow-by-omission instead of failing closed -- proving the executor reads
    // this flag, and only this flag, to decide.
    assert.equal(digest.samples[0]['package.vendor'], 'Ubuntu Developers');
  } finally {
    getAgentInventoryTool.failClosedFieldPolicy = original;
  }
});

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
