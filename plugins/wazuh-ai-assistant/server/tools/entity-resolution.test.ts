import assert from 'node:assert/strict';
import { listToolDefinitions } from './registry';
import {
  AGENT_NAME_PARAM_KEYS,
  buildNearMissIncludePattern,
  extractRequestedAgentNames,
  findNearMissSiblings,
  findUnmatchedAgentNames,
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
  assert.equal(
    normalizeAgentName('WEB-PROD-01'),
    normalizeAgentName('web-prod-01'),
  );
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

// --- findUnmatchedAgentNames -------------------------------------------------------------------

test('findUnmatchedAgentNames: a category word with zero matches (exact or near-miss) is unmatched', () => {
  const results = findUnmatchedAgentNames(
    ['cloud-services'],
    ['wazuh-aio-5', 'web-prod-01'],
  );
  assert.deepEqual(results, ['cloud-services']);
});

test('findUnmatchedAgentNames: an exact indexed match is not unmatched', () => {
  const results = findUnmatchedAgentNames(['wazuh-aio-5'], ['wazuh-aio-5']);
  assert.deepEqual(results, []);
});

test(
  'findUnmatchedAgentNames: a zero-padding/case/separator near-miss variant is not unmatched -- ' +
    'it is the SAME agent by normalization, just spelled differently',
  () => {
    const results = findUnmatchedAgentNames(['wazuh-aio-05'], ['wazuh-aio-5']);
    assert.deepEqual(results, []);
  },
);

test('findUnmatchedAgentNames: handles multiple requested names independently', () => {
  const results = findUnmatchedAgentNames(
    ['wazuh-aio-05', 'network-activity'],
    ['wazuh-aio-5'],
  );
  assert.deepEqual(results, ['network-activity']);
});

// --- extractRequestedAgentNames -----------------------------------------------------------------

test('extractRequestedAgentNames: reads a single agent_name string', () => {
  assert.deepEqual(extractRequestedAgentNames({ agent_name: 'web-prod-01' }), [
    'web-prod-01',
  ]);
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
 * Every DECLARED tool parameter whose name looks agent-name-shaped must be one
 * extractRequestedAgentNames actually reads. The candidates are derived from a LOOSE
 * name-shape regex over each tool's real declared params -- not a hand-built literal list --
 * so a param under any name, such as get_vulnerabilities_by_agent's `agent_identifier`, is
 * covered. A future `agent_hostname`/`agent_display_name` param fails here until
 * AGENT_NAME_PARAM_KEYS (and therefore the extractor) covers it.
 */
const AGENT_NAMEISH_PARAM_RE = /agent.*(name|identifier|host)/i;

test('every agent-name-shaped registry param is read by extractRequestedAgentNames', () => {
  const failures: string[] = [];
  const matchedTools: string[] = [];
  for (const def of listToolDefinitions()) {
    const agentParams = Object.keys(def.spec.parameters.properties).filter(
      name => AGENT_NAMEISH_PARAM_RE.test(name),
    );
    if (agentParams.length === 0) {
      continue;
    }
    matchedTools.push(def.spec.name);
    for (const paramName of agentParams) {
      if (!(AGENT_NAME_PARAM_KEYS as readonly string[]).includes(paramName)) {
        failures.push(
          `${def.spec.name}/${paramName}: agent-name-shaped param is not in ` +
            'AGENT_NAME_PARAM_KEYS, so the near-miss disclosure never reads it',
        );
        continue;
      }
      const prop = def.spec.parameters.properties[paramName] as {
        type?: string;
      };
      const value = prop.type === 'array' ? ['web-prod-01'] : 'web-prod-01';
      const extracted = extractRequestedAgentNames({ [paramName]: value });
      if (!extracted.includes('web-prod-01')) {
        failures.push(
          `${def.spec.name}/${paramName}: extractRequestedAgentNames did not read a value ` +
            'passed under this declared param',
        );
      }
    }
  }
  // The 5 known agent-name tools on this base: search_findings_by_agent,
  // search_findings_by_multiple_agents, get_events_by_agent, get_agent_inventory, and
  // get_vulnerabilities_by_agent (agent_identifier).
  assert.ok(
    matchedTools.length >= 5,
    `expected at least 5 agent-name tools, found ${matchedTools.length}: ` +
      matchedTools.join(', '),
  );
  assert.deepEqual(failures, []);
});

test('AGENT_NAMEISH_PARAM_RE mechanism: a differently-named agent param would be caught', () => {
  // Self-test in the field-policy-coverage.test.ts "mechanism" style: the loop above can only
  // fail for a param its regex actually matches, so pin the regex against the shapes that have
  // already slipped through once (agent_identifier) or plausibly could next.
  for (const name of [
    'agent_name',
    'agent_names',
    'agent_identifier',
    'agent_hostname',
    'agent_display_name',
  ]) {
    assert.ok(AGENT_NAMEISH_PARAM_RE.test(name), `${name} must match`);
  }
  // And params that are NOT agent names must not be dragged in.
  for (const name of ['agent_id', 'os_name', 'limit', 'technique_id']) {
    assert.ok(!AGENT_NAMEISH_PARAM_RE.test(name), `${name} must not match`);
  }
});

test('extractRequestedAgentNames: reads agent_identifier (get_vulnerabilities_by_agent)', () => {
  assert.deepEqual(
    extractRequestedAgentNames({ agent_identifier: 'wazuh-aio-5' }),
    ['wazuh-aio-5'],
  );
});

// --- buildNearMissIncludePattern -----------------------------------------------------------------

/** JS approximation of Lucene regexp matching: Lucene anchors the whole pattern by default, and
 * the subset this builder emits (character classes, `*`, `|`, escaped literals) is syntactically
 * identical in JS -- so `^(?:pattern)$` reproduces the terms-agg `include` semantics closely
 * enough to pin the builder's behaviour. */
function matchesInclude(pattern: string, candidate: string): boolean {
  return new RegExp(`^(?:${pattern})$`).test(candidate);
}

test('buildNearMissIncludePattern: matches every padding/separator/case variant of the requested name', () => {
  const pattern = buildNearMissIncludePattern(['wazuh-aio-5']);
  assert.ok(pattern);
  for (const candidate of [
    'wazuh-aio-5',
    'wazuh-aio-05',
    'WAZUH_AIO_005',
    'wazuh.aio.5',
    'wazuhaio5',
  ]) {
    assert.ok(
      matchesInclude(pattern!, candidate),
      `${candidate} must match the include pattern`,
    );
  }
});

test('buildNearMissIncludePattern: does not match genuinely different names', () => {
  const pattern = buildNearMissIncludePattern(['wazuh-aio-5']);
  assert.ok(pattern);
  for (const candidate of ['web-prod-01', 'wazuh-aio-50', 'wazuh-aio']) {
    assert.ok(
      !matchesInclude(pattern!, candidate),
      `${candidate} must NOT match the include pattern`,
    );
  }
});

test('buildNearMissIncludePattern: multiple requested names OR together; empty input yields none', () => {
  const pattern = buildNearMissIncludePattern(['web-01', 'db-02']);
  assert.ok(pattern);
  assert.ok(matchesInclude(pattern!, 'web-001'));
  assert.ok(matchesInclude(pattern!, 'DB-2'));
  assert.equal(buildNearMissIncludePattern([]), undefined);
});
