import assert from 'node:assert/strict';
import { getAgentInventoryTool } from './get-agent-inventory';
import { IndexerRequest } from '../types';

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

test('get_agent_inventory: kind="ports" matches get_agent_ports\'s original body exactly', () => {
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
    },
  });
});

test('get_agent_inventory: kind="processes" matches get_agent_processes\'s original body exactly', () => {
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

test('get_agent_inventory: kind="ports" filter is numeric equality on source.port OR destination.port', () => {
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
            should: [
              { term: { 'source.port': 9200 } },
              { term: { 'destination.port': 9200 } },
            ],
            minimum_should_match: 1,
          },
        },
      ],
    },
  });
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
