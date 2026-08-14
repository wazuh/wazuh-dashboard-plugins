import assert from 'node:assert/strict';
import {
  buildDiscoverDsl,
  executeToolCall,
  PrivacyContext,
  resolveSecurityAnalyticsSpace,
  scrubAssumptionNote,
} from './executor';
import { FIELD_POLICY_DEFAULTS, Pseudonymizer } from './privacy';
import { ToolCall } from '../../common/types';

// Derived from executeToolCall's own signature rather than imported from the OSD platform path,
// so this file stays runnable standalone — the same convention api-host.test.ts documents for
// the same reason.
type RequestHandlerContext = Parameters<typeof executeToolCall>[1];
type OpenSearchDashboardsRequest = Parameters<typeof executeToolCall>[2];

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

test('executeToolCall: get_agent_inventory keeps package.name/package.version readable under privacy mode, still anonymizing package.vendor', async () => {
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
  // package.vendor has an explicit 'allow-scan' FIELD_POLICY_DEFAULTS entry (the #8912
  // follow-through its previous 'anonymize' entry's comment promised): the distributor name
  // stays readable on that explicit basis -- not via get_agent_inventory's
  // `failClosedFieldPolicy: true` unlisted-field default (see the dedicated decoupling-proof
  // test below, which uses a genuinely unlisted field) -- while the embedded maintainer
  // address is still caught by the value-shape scan.
  const vendor = digest.samples[0]['package.vendor'] as string;
  assert.match(vendor, /^Ubuntu Developers/);
  assert.doesNotMatch(vendor, /lists\.ubuntu\.com/);
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
  // pre-#8917 bug this test guards against), this would have no effect and the unlisted field
  // would still come back fail-closed.
  //
  // Uses `kind: 'os'` / `host.os.full` rather than `kind: 'packages'` / `package.vendor` (this
  // test's original target): `package.vendor` gained its own explicit FIELD_POLICY_DEFAULTS
  // 'anonymize' entry (see privacy.ts's comment on that entry), so it is no longer unlisted and
  // would stay anonymized regardless of this flag -- that entry, not the flag, was masking this
  // test's own regression signal. `host.os.full` has no FIELD_POLICY_DEFAULTS entry of its own
  // (unlike its siblings host.os.name/version/platform above it in INVENTORY_KIND_CONFIG's `os`
  // source list), so it stays a genuine unlisted field for this proof.
  const { getAgentInventoryTool } = await import(
    './catalog/get-agent-inventory'
  );
  const original = getAgentInventoryTool.failClosedFieldPolicy;
  assert.equal(getAgentInventoryTool.deriveColumns, true);
  try {
    getAgentInventoryTool.failClosedFieldPolicy = false;
    const context = fakeSearchContext([
      {
        host: {
          os: { full: 'Ubuntu 22.04.1 LTS' },
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
        arguments: { agent_id: '001', kind: 'os' },
      },
      context,
      fakeRequest,
      privacy,
    );
    const digest = JSON.parse(outcome.toolResultContent) as {
      samples: Array<Record<string, unknown>>;
    };
    // With failClosedFieldPolicy: false, host.os.full (no FIELD_POLICY_DEFAULTS entry) now falls
    // under plain allow-by-omission instead of failing closed -- proving the executor reads this
    // flag, and only this flag, to decide.
    assert.equal(digest.samples[0]['host.os.full'], 'Ubuntu 22.04.1 LTS');
  } finally {
    getAgentInventoryTool.failClosedFieldPolicy = original;
  }
});

// --- Issue #8913: end-to-end (executeToolCall, not just resolveDeicticAgentParams in isolation)
// proof that a resolveParams-minted assumption note reaches the digest the model sees. A merge
// regression once dropped `assumptionNote` from `executeIndexerRequest`'s call to `buildDigest`
// (`executeManagerRequest`'s sibling call already threaded it through) -- silently discarding the
// note for every Indexer-backed tool while keeping it for Manager-API-backed ones. -------------

test('executeToolCall: a resolveParams-minted assumption note reaches the digest for an Indexer-backed tool', async () => {
  const context = {
    ...fakeSearchContext([{ package: { name: 'adduser', version: '1' } }]),
    wazuh_core: {
      manageHosts: { get: () => Promise.resolve([{ id: 'host-1' }]) },
      api: {
        client: {
          asCurrentUser: {
            request: () =>
              Promise.resolve({
                status: 200,
                data: {
                  data: {
                    affected_items: [{ id: '001', name: 'agent-one' }],
                    total_affected_items: 1,
                  },
                },
              }),
          },
        },
      },
    },
  } as unknown as ExecContext;
  const outcome = await executeToolCall(
    {
      id: 'call-1',
      name: 'get_agent_inventory',
      arguments: { kind: 'packages' },
    },
    context,
    fakeRequest,
    undefined,
  );
  const digest = JSON.parse(outcome.toolResultContent) as {
    assumptionNote?: string;
  };
  assert.match(digest.assumptionNote ?? '', /agent-one/);
});

// --- Privacy capture probe P3 (2026-08-14): the assumption note carried the resolved agent's
// raw hostname to the provider under privacy mode -- a bare single-word token neither the shape
// scan nor the known-entity scan can catch (nothing ever minted it; resolution exists precisely
// because the caller never supplied the value). The fix: resolvers declare the identifiers their
// note interpolates (`noteEntities`), and executeToolCall pseudonymizes them at its single choke
// point via scrubAssumptionNote. These tests pin the pure helper AND the end-to-end wiring. ----

test('scrubAssumptionNote: pseudonymizes each declared entity, every occurrence, under privacy mode', () => {
  const privacy: PrivacyContext = {
    pseudonymizer: new Pseudonymizer([]),
    fieldPolicy: FIELD_POLICY_DEFAULTS,
  };
  const scrubbed = scrubAssumptionNote(
    'resolved to "wazuh-aio-5" (id 001); wazuh-aio-5 was the only active agent.',
    [{ value: 'wazuh-aio-5', kind: 'HOST' }],
    privacy,
  );
  assert.ok(scrubbed);
  assert.doesNotMatch(scrubbed as string, /wazuh-aio-5/);
  const matches = (scrubbed as string).match(/HOST_1/g) ?? [];
  assert.equal(matches.length, 2, 'both occurrences must be replaced');
});

test('scrubAssumptionNote: longest entity first, so a substring entity cannot corrupt a longer one', () => {
  const privacy: PrivacyContext = {
    pseudonymizer: new Pseudonymizer([]),
    fieldPolicy: FIELD_POLICY_DEFAULTS,
  };
  const scrubbed = scrubAssumptionNote(
    'candidates: DB03, DB03-PRIMARY.',
    [
      { value: 'DB03', kind: 'HOST' },
      { value: 'DB03-PRIMARY', kind: 'HOST' },
    ],
    privacy,
  );
  assert.doesNotMatch(scrubbed as string, /DB03/);
  // Two DISTINCT pseudonyms -- the longer name must not have been split by the shorter's
  // substitution into "HOST_n-PRIMARY".
  assert.doesNotMatch(scrubbed as string, /-PRIMARY/);
});

test('scrubAssumptionNote: no-op without privacy, without a note, or without entities', () => {
  const privacy: PrivacyContext = {
    pseudonymizer: new Pseudonymizer([]),
    fieldPolicy: FIELD_POLICY_DEFAULTS,
  };
  const note = 'resolved to "wazuh-aio-5" (id 001).';
  assert.equal(
    scrubAssumptionNote(
      note,
      [{ value: 'wazuh-aio-5', kind: 'HOST' }],
      undefined,
    ),
    note,
  );
  assert.equal(scrubAssumptionNote(undefined, [], privacy), undefined);
  assert.equal(scrubAssumptionNote(note, [], privacy), note);
  assert.equal(scrubAssumptionNote(note, undefined, privacy), note);
});

test('executeToolCall: under privacy mode the assumption note reaches the digest pseudonymized, never with the raw hostname', async () => {
  const context = {
    ...fakeSearchContext([{ package: { name: 'adduser', version: '1' } }]),
    wazuh_core: {
      manageHosts: { get: () => Promise.resolve([{ id: 'host-1' }]) },
      api: {
        client: {
          asCurrentUser: {
            request: () =>
              Promise.resolve({
                status: 200,
                data: {
                  data: {
                    affected_items: [{ id: '001', name: 'agent-one' }],
                    total_affected_items: 1,
                  },
                },
              }),
          },
        },
      },
    },
  } as unknown as ExecContext;
  const outcome = await executeToolCall(
    {
      id: 'call-1',
      name: 'get_agent_inventory',
      arguments: { kind: 'packages' },
    },
    context,
    fakeRequest,
    {
      pseudonymizer: new Pseudonymizer([]),
      fieldPolicy: FIELD_POLICY_DEFAULTS,
    },
  );
  const digest = JSON.parse(outcome.toolResultContent) as {
    assumptionNote?: string;
  };
  assert.ok(digest.assumptionNote, 'the note itself must survive the scrub');
  assert.doesNotMatch(
    digest.assumptionNote as string,
    /agent-one/,
    'probe P3: the resolved hostname must never reach the provider raw',
  );
  assert.match(digest.assumptionNote as string, /HOST_\d+/);
  // The agent ID is a reviewed 'allow' (wazuh.agent.id) and must stay readable.
  assert.match(digest.assumptionNote as string, /001/);
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

function parseDigest(
  outcome: Awaited<ReturnType<typeof executeToolCall>>,
): Record<string, unknown> {
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
  const digest = parseDigest(outcome);
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
  const digest = parseDigest(outcome);
  assert.equal(
    calls.length,
    1,
    'no recount search should fire on a non-zero result',
  );
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
  const digest = parseDigest(outcome);
  assert.equal(calls.length, 2, 'the recount search still fires...');
  // ...but since it ALSO found 0 rows, no widen hint is appended (the pre-existing zero-row hint
  // from digest.ts's buildZeroRowHint may still be present -- this only asserts the widen SENTENCE
  // is absent).
  assert.ok(
    !(digest.hint as string | undefined)?.includes(
      'rows match in the default window',
    ),
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
  const digest = parseDigest(outcome);
  assert.equal(
    calls.length,
    2,
    'exactly one entity near-miss probe, no recount (returned > 0)',
  );
  assert.equal(calls[1].body.size, 0);
  // The probe must be candidate-scoped (population-independent): a terms `include` pattern
  // derived from the requested name, not a bare top-N aggregation that only ever sees the
  // busiest agents.
  const probeTerms = (
    calls[1].body.aggs as {
      agent_names: { terms: Record<string, unknown> };
    }
  ).agent_names.terms;
  assert.equal(typeof probeTerms.include, 'string');
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
  const digest = parseDigest(outcome);
  const hint = digest.hint as string;
  // Neither raw hostname reaches the digest's hint text under privacy mode. Word-boundary regexes,
  // not substring checks: the hint quotes the REQUESTED name (`"wazuh-aio-05"`) but renders each
  // SIBLING bare, with no trailing quote (see appendEntityNearMissHint's sentence template in
  // executor.ts) — a plain `hint.includes('wazuh-aio-5"')` check (the sibling name plus a literal
  // closing quote) can never match that bare form, so it stayed true whether or not the sibling
  // actually leaked in cleartext, silently certifying nothing. `\b` anchors on both sides so
  // "wazuh-aio-05" (the requested name) can never satisfy the "wazuh-aio-5" (its sibling) pattern
  // or vice versa — the two differ by the zero-padded digit these near-miss tests are about.
  assert.ok(!/\bwazuh-aio-05\b/.test(hint));
  assert.ok(!/\bwazuh-aio-5\b/.test(hint));
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
  parseDigest(outcome);
  // A narrow window (differing from the plugin default) makes the window-recount fire once (2
  // total calls); no agent_name was supplied, so the entity probe must not fire a THIRD search.
  assert.equal(calls.length, 2);
});

test('entity near-miss: fires on a states index with NO @timestamp range injected', async () => {
  // get_agent_inventory reads wazuh-states-inventory-*: no event-time axis, lintDsl requires no
  // bound there, and a range injected on an unmapped @timestamp field would match NOTHING --
  // silently disabling the disclosure for exactly the tools issue #8920 item 6 names. The probe
  // must therefore go out rangeless for a rangeless executed body.
  const portsHit = {
    _source: { 'source.port': 22, 'interface.state': 'listen' },
  };
  const { context, calls } = fakeContext((_call, index) =>
    index === 0
      ? { hits: { hits: [portsHit], total: { value: 1 } } }
      : {
          hits: { hits: [], total: { value: 0 } },
          aggregations: {
            agent_names: { buckets: [{ key: 'wazuh-aio-5', doc_count: 3 }] },
          },
        },
  );
  const outcome = await executeToolCall(
    toolCall('get_agent_inventory', {
      kind: 'ports',
      agent_name: 'wazuh-aio-05',
    }),
    context,
    dummyRequest,
  );
  const digest = parseDigest(outcome);
  assert.equal(calls.length, 2, 'the probe must fire for a states-index tool');
  const probeFilter = (calls[1].body.query as { bool: { filter: unknown[] } })
    .bool.filter;
  assert.deepEqual(
    probeFilter,
    [{ match_all: {} }],
    'no @timestamp range may be injected into a states-index probe',
  );
  assert.match(digest.hint as string, /wazuh-aio-5/);
});

test("entity near-miss: fires even when the inherited window excludes the sibling's only document", async () => {
  // Reproduces the reported case verbatim: a prior turn narrowed the conversation to "the last 24
  // hours" (see window-recount.ts), the typo'd host "wazuh-aio-05" is a real, separate agent whose
  // ONE document was ingested well outside that window, while "wazuh-aio-5" (the silently
  // substituted host) has ~1800 documents INSIDE it. The executed body therefore returns rows, so
  // no recount fires -- the near-miss probe is the only mechanism left that can catch the
  // substitution. This fake OpenSearch mimics real range filtering: if the probe inherits the
  // executed body's NARROW range (the bug), the sibling's out-of-window document is filtered out
  // and the aggregation returns no bucket.
  //
  // The probe cannot simply drop the range on a findings index: `lintDsl` REQUIRES a both-sides
  // bounded @timestamp range on the events/findings families, and the probe helper early-returns on
  // a lint failure, so a rangeless body made the disclosure vanish silently instead of erroring.
  // The fix therefore uses the WIDEST window the guardrails allow, and this fake keys on the
  // range's own lower bound: the inherited `now-24h` excludes the sibling, the default window
  // includes it.
  const wrongHostHit = {
    _source: {
      '@timestamp': '2026-08-10T00:00:00Z',
      'wazuh.agent.name': 'wazuh-aio-5',
      'wazuh.rule.title': 'test rule',
      'wazuh.rule.level': 'high',
    },
  };
  const { context, calls } = fakeContext((call, index) => {
    if (index === 0) {
      // The ~1800 wrong-host findings, all inside the narrowed now-24h window (the tool call
      // itself returns rows, so `appendWindowRecountHint` never fires).
      return { hits: { hits: [wrongHostHit], total: { value: 1800 } } };
    }
    const filter = (
      call.body.query as { bool: { filter: Array<Record<string, unknown>> } }
    ).bool.filter;
    // A real range filter would exclude the sibling's single out-of-window document, so simulate
    // exactly that: the bucket comes back only when the probe's lower bound is wide enough to
    // contain it. `now-24h` (the executed body's inherited window, i.e. the bug) does not;
    // `DEFAULT_TIME_RANGE_GTE` (the guardrail-legal widest window, i.e. the fix) does.
    const rangeClause = filter.find(clause => 'range' in clause) as
      | { range: { '@timestamp': { gte?: unknown } } }
      | undefined;
    const inheritedNarrowWindow =
      rangeClause?.range['@timestamp'].gte === 'now-24h';
    return {
      hits: { hits: [], total: { value: 0 } },
      aggregations: {
        agent_names: {
          buckets: inheritedNarrowWindow
            ? []
            : [{ key: 'wazuh-aio-5', doc_count: 1 }],
        },
      },
    };
  });
  const outcome = await executeToolCall(
    toolCall('search_findings_by_agent', {
      agent_name: 'wazuh-aio-05',
      time_range_gte: 'now-24h',
      time_range_lte: 'now',
    }),
    context,
    dummyRequest,
  );
  const digest = parseDigest(outcome);
  assert.equal(
    calls.length,
    2,
    'the executed body returned rows, so no recount -- only the probe',
  );
  const probeFilter = (calls[1].body.query as { bool: { filter: unknown[] } })
    .bool.filter;
  // The invariant is "never the INHERITED window", not "never a range": a findings-index probe must
  // carry a bounded range or lintDsl rejects it (and the helper's early return would swallow that
  // silently). So it must be the guardrail-legal widest window, never the executed body's now-1h.
  assert.deepEqual(
    probeFilter,
    [{ range: { '@timestamp': { gte: 'now-90d', lte: 'now' } } }],
    "the probe must carry the default window, never the executed body's own narrower one",
  );
  assert.match(
    digest.hint as string,
    /wazuh-aio-5/,
    'the near-miss disclosure must survive a narrowed inherited window',
  );
});

test('recount + near-miss combine: a 0-row narrow-window agent query gets both disclosures', async () => {
  const { context, calls } = fakeContext((call, index) => {
    if (index === 0) {
      return { hits: { hits: [], total: { value: 0 } } };
    }
    // The widened recount is the size:0 body with NO aggs; the probe carries the terms agg.
    const isProbe = call.body.aggs !== undefined;
    return isProbe
      ? {
          hits: { hits: [], total: { value: 0 } },
          aggregations: {
            agent_names: { buckets: [{ key: 'wazuh-aio-05', doc_count: 1 }] },
          },
        }
      : { hits: { hits: [], total: { value: 66 } } };
  });
  const outcome = await executeToolCall(
    toolCall('search_findings_by_agent', {
      agent_name: 'wazuh-aio-5',
      time_range_gte: 'now-24h',
      time_range_lte: 'now',
    }),
    context,
    dummyRequest,
  );
  const digest = parseDigest(outcome);
  assert.equal(calls.length, 3, 'tool search + recount + near-miss probe');
  const hint = digest.hint as string;
  assert.match(hint, /66 rows match in the default window/);
  assert.match(hint, /wazuh-aio-05/);
});

test('recount wording: a clamped total (relation "gte") is stated as "at least", never exact', async () => {
  // applySafetyValves clamps track_total_hits to 10000, so any window with more matches reports
  // value=10000/relation:'gte' -- an exact "10000 rows match" would be a fabricated count in the
  // one feature that exists to stop counts being misstated.
  const { context } = fakeContext((_call, index) =>
    index === 0
      ? { hits: { hits: [], total: { value: 0 } } }
      : { hits: { hits: [], total: { value: 10000, relation: 'gte' } } },
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
  const digest = parseDigest(outcome);
  assert.match(
    digest.hint as string,
    /at least 10000 rows match in the default window/,
  );
});

test('sub-technique split: a breakdown carrying a dotted technique id gains the per-exact-id hint', async () => {
  // get_mitre_findings' technique_ids terms agg buckets per EXACT id; the hint is what tells the
  // model a parent bucket does not include its children (issue #8920 item 2's disclosure half,
  // applied at the digest chokepoint so get_mitre_summary and escape-hatch aggs inherit it too).
  const findingHit = {
    _source: {
      '@timestamp': '2026-08-10T00:00:00Z',
      'wazuh.rule.mitre.technique.id': ['T1059'],
    },
  };
  const { context } = fakeContext((_call, index) =>
    index === 0
      ? {
          hits: { hits: [findingHit], total: { value: 12 } },
          aggregations: {
            technique_ids: {
              buckets: [
                { key: 'T1059', doc_count: 3 },
                { key: 'T1059.001', doc_count: 9 },
              ],
            },
          },
        }
      : { hits: { hits: [], total: { value: 0 } } },
  );
  const outcome = await executeToolCall(
    toolCall('get_mitre_findings', { technique_id: 'T1059' }),
    context,
    dummyRequest,
  );
  const digest = parseDigest(outcome);
  assert.match(
    digest.hint as string,
    /parent technique bucket .* does NOT include its sub-techniques/,
  );
});

// --- #8935 item I2: the "Open in Discover" DSL matches the post-filtered table -----------------

test('buildDiscoverDsl: a post_filter is folded into the DSL so Discover opens the same rows as the table', () => {
  // FAILS ON BASE: base ships body.query alone, so a get_sca_checks call with an exact-name
  // `search` rendered a 1-row table whose Discover link opened the whole policy (the post_filter
  // narrows hits.hits, and the table is built from hits.hits).
  const query = {
    bool: { filter: [{ term: { 'wazuh.agent.id': '000' } }] },
  };
  const postFilter = {
    bool: {
      minimum_should_match: 1,
      should: [{ prefix: { 'check.name': 'Ensure SSH' } }],
    },
  };
  assert.deepEqual(buildDiscoverDsl({ query, post_filter: postFilter }), {
    bool: { filter: [query, postFilter] },
  });
});

test('buildDiscoverDsl: without a post_filter the DSL is body.query unchanged (match_all fallback)', () => {
  const query = { bool: { filter: [{ term: { a: 1 } }] } };
  assert.deepEqual(buildDiscoverDsl({ query }), query);
  assert.deepEqual(buildDiscoverDsl({}), { match_all: {} });
});

// --- issue #8935 item I4: bound disclosure (lookback clamp) -------------------------------------

test('bound disclosure: search_wazuh_data with a 180-day range is clamped-and-disclosed on a SUCCESSFUL call, not rejected', async () => {
  // ON BASE (before this item): this exact call's toolResultContent is
  // `{"error":"Range on time field \"@timestamp\" spans more than the 90-day maximum lookback."}`
  // -- checkDateRanges' rejection in guardrails.ts. That error DOES reach the model (chat.ts's
  // augmentToolError), but the model's bounded retry is an ordinary in-cap query indistinguishable
  // from a default-window one, so nothing ever marks the eventual ANSWER as capped -- the defect
  // this item fixes. This test is the strongest fails-on-base witness: it asserts the digest is a
  // SUCCESS carrying the disclosure as data, not an error the model has to remember to relay.
  const findingHit = {
    _source: {
      '@timestamp': '2026-08-10T00:00:00Z',
      'wazuh.rule.title': 'test rule',
    },
  };
  const { context, calls } = fakeContext(() => ({
    hits: { hits: [findingHit], total: { value: 1 } },
  }));
  const queryDsl = JSON.stringify({
    query: {
      bool: {
        filter: [{ range: { '@timestamp': { gte: 'now-180d', lte: 'now' } } }],
      },
    },
    size: 20,
  });
  const outcome = await executeToolCall(
    toolCall('search_wazuh_data', {
      index_pattern: 'wazuh-findings-v5-*',
      query_dsl: queryDsl,
    }),
    context,
    dummyRequest,
  );
  const digest = parseDigest(outcome);
  assert.equal(
    digest.error,
    undefined,
    `expected a success digest, got an error instead: ${digest.error}`,
  );
  assert.match(digest.hint as string, /Time window capped/);
  assert.match(digest.hint as string, /90-day maximum/);
  // The MOCKED OpenSearch client itself must have received the CAPPED range -- the digest's hint
  // text alone would not prove the query that actually ran was narrowed (executor.ts's own
  // "linted body byte-identical to executed body" invariant is what this checks in practice).
  assert.equal(
    calls.length,
    1,
    'no recount/near-miss probe: the call itself returned rows',
  );
  const executedFilter = (
    calls[0].body.query as { bool: { filter: Array<Record<string, unknown>> } }
  ).bool.filter;
  const rangeClause = executedFilter[0] as {
    range: { '@timestamp': { gte: string; lte: string } };
  };
  const { gte, lte } = rangeClause.range['@timestamp'];
  assert.notEqual(gte, 'now-180d');
  assert.notEqual(lte, 'now');
  const spanMs = Date.parse(lte) - Date.parse(gte);
  assert.equal(spanMs, 90 * 24 * 60 * 60 * 1000);
});

test('bound disclosure: a request already within the 90-day cap gets no disclosure', async () => {
  // OVER-CLAMPING GUARD, not a fails-on-base witness (it asserts the absence of a string base
  // never emits) -- labeled per the integration review so it is never counted as fix evidence.
  const findingHit = {
    _source: {
      '@timestamp': '2026-08-10T00:00:00Z',
      'wazuh.rule.mitre.technique.id': ['T1110'],
    },
  };
  const { context } = fakeContext(() => ({
    hits: { hits: [findingHit], total: { value: 1 } },
  }));
  const outcome = await executeToolCall(
    toolCall('get_mitre_findings', {
      technique_id: 'T1110',
      time_range_gte: 'now-30d',
      time_range_lte: 'now',
    }),
    context,
    dummyRequest,
  );
  const digest = parseDigest(outcome);
  assert.equal(digest.error, undefined);
  assert.ok(
    !(digest.hint as string | undefined)?.includes('Time window capped'),
  );
});
