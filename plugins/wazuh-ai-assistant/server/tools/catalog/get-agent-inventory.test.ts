import assert from 'node:assert/strict';
import {
  getAgentInventoryTool,
  INVENTORY_KIND_CONFIG,
} from './get-agent-inventory';
import { IndexerRequest } from '../types';
import { applySafetyValves, lintDsl } from '../guardrails';
import { BREAKDOWN_BUCKET_CAP } from '../digest';

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

// --- Issue #8920 item 1 (population-disclosure): "ports" now also carries a real breakdown
// aggregation, so its body is get_agent_ports's original query/_source/sort/size PLUS the new
// `aggs` clause -- everything else stays byte-identical. "processes"/"packages" take the
// digest-level breakdownDimensions fallback instead (no aggregation-mapping evidence for their
// fields -- see InventoryKindConfig.breakdownAggs' doc comment), so their bodies stay exactly
// the folded-in originals. ---

test('get_agent_inventory: kind="ports" matches get_agent_ports\'s original body, plus the new interface.state/network.transport breakdown aggs', () => {
  const req = buildIndexer({ agent_id: '003', kind: 'ports' });
  assert.deepEqual(req, {
    target: 'indexer',
    index: 'wazuh-states-inventory-ports*',
    body: {
      query: { bool: { filter: [{ term: { 'wazuh.agent.id': '003' } }] } },
      _source: [
        'source.ip',
        'source.port',
        'destination.ip',
        'destination.port',
        'network.transport',
        'interface.state',
        'process.name',
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
