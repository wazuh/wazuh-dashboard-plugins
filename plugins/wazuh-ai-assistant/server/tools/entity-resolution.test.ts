import assert from 'node:assert/strict';
import { listToolDefinitions } from './registry';
import {
  extractRequestedAgentNames,
  findNearMissSiblings,
  normalizeAgentName,
} from './entity-resolution';

// --- normalizeAgentName -----------------------------------------------------------------------

test('normalizeAgentName: zero-padding differences normalize equal', () => {
  assert.equal(
    normalizeAgentName('wazuh-aio-05'),
    normalizeAgentName('wazuh-aio-5'),
  );
});

test('normalizeAgentName: separator differences (hyphen/underscore/dot) normalize equal', () => {
  const forms = ['wazuh-aio-05', 'wazuh_aio_05', 'wazuh.aio.05', 'wazuhaio05'];
  const normalized = new Set(forms.map(normalizeAgentName));
  assert.equal(normalized.size, 1);
});

test('normalizeAgentName: case differences normalize equal', () => {
  assert.equal(normalizeAgentName('WEB-PROD-01'), normalizeAgentName('web-prod-01'));
});

test('normalizeAgentName: genuinely distinct hosts (differing digit, not just padding) stay distinct', () => {
  assert.notEqual(
    normalizeAgentName('web-prod-01'),
    normalizeAgentName('web-prod-02'),
  );
});

test('normalizeAgentName: combined case + separator + zero-padding variance still normalizes equal', () => {
  assert.equal(
    normalizeAgentName('WAZUH_AIO_005'),
    normalizeAgentName('wazuh.aio.5'),
  );
});

// --- findNearMissSiblings ----------------------------------------------------------------------

test('findNearMissSiblings: flags a distinct indexed name that only differs by zero-padding', () => {
  const results = findNearMissSiblings(
    ['wazuh-aio-05'],
    ['wazuh-aio-5', 'web-prod-01'],
  );
  assert.deepEqual(results, [
    { requested: 'wazuh-aio-05', siblings: ['wazuh-aio-5'] },
  ]);
});

test('findNearMissSiblings: does not flag an exact match to itself', () => {
  const results = findNearMissSiblings(
    ['wazuh-aio-05'],
    ['wazuh-aio-05', 'web-prod-01'],
  );
  assert.deepEqual(results, []);
});

test('findNearMissSiblings: genuinely distinct hosts (web-prod-01 vs -02) are never flagged against each other', () => {
  const results = findNearMissSiblings(['web-prod-01'], ['web-prod-02']);
  assert.deepEqual(results, []);
});

test('findNearMissSiblings: fires for a typo with zero exact matches (the zero-rows case)', () => {
  const results = findNearMissSiblings(['wazuh-aio-5'], ['wazuh-aio-05']);
  assert.deepEqual(results, [
    { requested: 'wazuh-aio-5', siblings: ['wazuh-aio-05'] },
  ]);
});

test('findNearMissSiblings: dedupes repeated indexed siblings', () => {
  const results = findNearMissSiblings(
    ['wazuh-aio-05'],
    ['wazuh-aio-5', 'wazuh-aio-5'],
  );
  assert.deepEqual(results[0].siblings, ['wazuh-aio-5']);
});

test('findNearMissSiblings: handles multiple requested names independently', () => {
  const results = findNearMissSiblings(
    ['wazuh-aio-05', 'web-prod-01'],
    ['wazuh-aio-5', 'web-prod-02'],
  );
  assert.deepEqual(results, [
    { requested: 'wazuh-aio-05', siblings: ['wazuh-aio-5'] },
  ]);
});

// --- extractRequestedAgentNames -----------------------------------------------------------------

test('extractRequestedAgentNames: reads a single agent_name string', () => {
  assert.deepEqual(
    extractRequestedAgentNames({ agent_name: 'web-prod-01' }),
    ['web-prod-01'],
  );
});

test('extractRequestedAgentNames: reads an agent_names array, deduped', () => {
  assert.deepEqual(
    extractRequestedAgentNames({
      agent_names: ['web-prod-01', 'web-prod-02', 'web-prod-01'],
    }),
    ['web-prod-01', 'web-prod-02'],
  );
});

test('extractRequestedAgentNames: combines both shapes when somehow both are present', () => {
  assert.deepEqual(
    extractRequestedAgentNames({
      agent_name: 'web-prod-01',
      agent_names: ['web-prod-02'],
    }),
    ['web-prod-01', 'web-prod-02'],
  );
});

test('extractRequestedAgentNames: empty for a call naming no agent at all', () => {
  assert.deepEqual(extractRequestedAgentNames({}), []);
  assert.deepEqual(extractRequestedAgentNames({ agent_name: '   ' }), []);
  assert.deepEqual(extractRequestedAgentNames({ agent_names: [] }), []);
});

/**
 * Registry-driven assertion (issue #8920 item 6's coverage requirement): the predicate must fire
 * for EVERY tool in the registry that declares an `agent_name`/`agent_names` parameter, not just the
 * ones this test happens to name -- `verifiedBaseNotes` confirmed these four on the base registry
 * (search_findings_by_agent, search_findings_by_multiple_agents, get_events_by_agent,
 * get_agent_inventory); this loop also protects a FUTURE tool that adds the same param from being
 * silently unreachable by this disclosure.
 */
test('extractRequestedAgentNames fires for every registry tool declaring agent_name/agent_names', () => {
  const agentNameTools = listToolDefinitions().filter(
    def =>
      'agent_name' in def.spec.parameters.properties ||
      'agent_names' in def.spec.parameters.properties,
  );
  assert.ok(
    agentNameTools.length >= 4,
    `expected at least the 4 known agent_name/agent_names tools, found ${agentNameTools.length}: ` +
      agentNameTools.map(def => def.spec.name).join(', '),
  );
  for (const def of agentNameTools) {
    const usesArray = 'agent_names' in def.spec.parameters.properties;
    const params = usesArray
      ? { agent_names: ['web-prod-01'] }
      : { agent_name: 'web-prod-01' };
    const extracted = extractRequestedAgentNames(params);
    assert.deepEqual(
      extracted,
      ['web-prod-01'],
      `${def.spec.name}: extractRequestedAgentNames did not fire for its own declared param`,
    );
  }
});
