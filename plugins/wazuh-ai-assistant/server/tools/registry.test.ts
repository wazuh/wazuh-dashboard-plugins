import assert from 'node:assert/strict';
import { getToolDefinition, listToolDefinitions } from './registry';
import { getAgentInventoryTool } from './catalog/get-agent-inventory';
import { getScaResultsTool } from './catalog/get-sca-results';
import { getScaChecksTool } from './catalog/get-sca-checks';
import { getVulnerabilitiesByAgentTool } from './catalog/get-vulnerabilities-by-agent';
import { searchFindingsByAgentTool } from './catalog/search-findings-by-agent';
import { getTopAgentsTool } from './catalog/get-top-agents';

/**
 * Generic sole-candidate parameter resolution -- registry-wiring tests (types.ts's
 * `soleCandidateParams`, param-resolution.ts's `buildGenericResolveParams`). The four catalog
 * tools that declare `soleCandidateParams` without a hand-written `resolveParams` of their own
 * get the generic resolver attached automatically at load time; `get_agent_inventory` (issue
 * #8913's hand-written hook) is left completely alone; a tool with neither is unaffected either
 * way.
 */

for (const [name, directTool] of [
  ['get_sca_results', getScaResultsTool],
  ['get_sca_checks', getScaChecksTool],
  ['get_vulnerabilities_by_agent', getVulnerabilitiesByAgentTool],
  ['search_findings_by_agent', searchFindingsByAgentTool],
] as const) {
  test(`registry: ${name} gets the generic resolver attached automatically (its own module export declares soleCandidateParams but no resolveParams)`, () => {
    assert.equal(
      directTool.resolveParams,
      undefined,
      `${name}'s own module export should declare no hand-written resolveParams`,
    );
    const registered = getToolDefinition(name);
    assert.ok(registered, `${name} should be registered`);
    assert.equal(typeof registered?.resolveParams, 'function');
  });
}

test('registry: get_agent_inventory keeps its own hand-written resolveParams untouched (same function reference)', () => {
  const registered = getToolDefinition('get_agent_inventory');
  assert.ok(registered);
  assert.equal(registered?.resolveParams, getAgentInventoryTool.resolveParams);
});

test('registry: a tool with neither soleCandidateParams nor resolveParams is unaffected', () => {
  assert.equal(getTopAgentsTool.soleCandidateParams, undefined);
  assert.equal(getTopAgentsTool.resolveParams, undefined);
  const registered = getToolDefinition('get_top_agents');
  assert.ok(registered);
  assert.equal(registered?.resolveParams, undefined);
});

test('registry: listToolDefinitions returns exactly one entry per registered tool, resolveParams-resolved', () => {
  const all = listToolDefinitions();
  const names = all.map(t => t.spec.name);
  assert.equal(new Set(names).size, names.length, 'no duplicate tool names');
  assert.ok(names.includes('get_sca_results'));
  assert.equal(
    typeof all.find(t => t.spec.name === 'get_sca_results')?.resolveParams,
    'function',
  );
});
