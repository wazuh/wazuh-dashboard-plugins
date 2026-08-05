import assert from 'node:assert/strict';
import {
  FINDING_SCOPE_NOTE,
  INVENTORY_CURRENT_STATE_NOTE,
  VULN_CURRENT_STATE_NOTE,
} from './common';
import { searchFindingsByAgentTool } from './search-findings-by-agent';
import { getCriticalFindingsTool } from './get-critical-findings';
import { getFindingsByTimeTool } from './get-findings-by-time';
import { getBruteForceTool } from './get-brute-force';
import { getSuspiciousPowershellTool } from './get-suspicious-powershell';
import { searchFindingsByMultipleAgentsTool } from './search-findings-by-multiple-agents';
import { searchFindingsByRuleTitleTool } from './search-findings-by-rule-title';
import { searchFindingsByRuleTagTool } from './search-findings-by-rule-tag';
import { getVulnerabilitiesTool } from './get-vulnerabilities';
import { getCriticalVulnerabilitiesTool } from './get-critical-vulnerabilities';
import { getVulnerabilitiesByAgentTool } from './get-vulnerabilities-by-agent';
import { getVulnerabilityByCveTool } from './get-vulnerability-by-cve';
import { getAgentInventoryTool } from './get-agent-inventory';

/**
 * Colocated regression test for the "State tool scope and analyst vocabulary" fix (issue 10): the
 * measured failure was two model families silently answering a narrower rule-matched-only
 * question ("everything that happened") with zero rows and no caveat. The fix adds a negative-
 * scope clause (and analyst-vocabulary synonyms) to `spec.description` for every finding-hits
 * tool, plus a current-state note for the vulnerability and syscollector-inventory tools -- this
 * test asserts the exact shared clause landed on every tool the issue names, so a future edit
 * that silently drops the clause from one tool's description fails loudly here instead of only
 * being caught by a live model re-run.
 */

const FINDING_HITS_TOOLS = [
  searchFindingsByAgentTool,
  getCriticalFindingsTool,
  getFindingsByTimeTool,
  getBruteForceTool,
  getSuspiciousPowershellTool,
  searchFindingsByMultipleAgentsTool,
  searchFindingsByRuleTitleTool,
  searchFindingsByRuleTagTool,
];

const VULN_TOOLS = [
  getVulnerabilitiesTool,
  getCriticalVulnerabilitiesTool,
  getVulnerabilitiesByAgentTool,
  getVulnerabilityByCveTool,
];

// The 4 pre-consolidation syscollector inventory tools (get_agent_os/get_agent_packages/
// get_agent_ports/get_agent_processes) were folded into get_agent_inventory by issue 12 --
// carrying INVENTORY_CURRENT_STATE_NOTE forward into the consolidated tool's description, so
// this assertion targets that one tool instead of the 4 now-deleted files.
const INVENTORY_TOOLS = [getAgentInventoryTool];

test('every finding-hits tool description states the rule-matched-only negative scope', () => {
  for (const tool of FINDING_HITS_TOOLS) {
    assert.ok(
      tool.spec.description.includes(FINDING_SCOPE_NOTE),
      `${tool.spec.name} is missing FINDING_SCOPE_NOTE`,
    );
  }
});

test('every finding-hits tool description carries the agent/finding synonym vocabulary', () => {
  for (const tool of FINDING_HITS_TOOLS) {
    // The shared FINDING_SCOPE_NOTE itself carries the findings synonyms (alerts/hits/signals);
    // every tool whose description names "agent" also spells out the host/machine/endpoint
    // synonym set next to it.
    assert.ok(
      /alerts\/hits\/signals/.test(tool.spec.description),
      `${tool.spec.name} is missing the findings synonym vocabulary`,
    );
  }
});

test('all 4 vulnerability tools state current-state-only scope', () => {
  for (const tool of VULN_TOOLS) {
    assert.ok(
      tool.spec.description.includes(VULN_CURRENT_STATE_NOTE),
      `${tool.spec.name} is missing VULN_CURRENT_STATE_NOTE`,
    );
  }
});

test('get_agent_inventory states current-state-only scope', () => {
  for (const tool of INVENTORY_TOOLS) {
    assert.ok(
      tool.spec.description.includes(INVENTORY_CURRENT_STATE_NOTE),
      `${tool.spec.name} is missing INVENTORY_CURRENT_STATE_NOTE`,
    );
  }
});
