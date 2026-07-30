import { ToolSpec } from '../../common/types';
import { ToolDefinition } from './types';
import { getActiveAgentsTool } from './catalog/get-active-agents';
import { getDisconnectedAgentsTool } from './catalog/get-disconnected-agents';
import { getCriticalAlertsTool } from './catalog/get-critical-alerts';
import { searchAlertsByAgentTool } from './catalog/search-alerts-by-agent';
import { getTopRulesTool } from './catalog/get-top-rules';
import { getCriticalVulnerabilitiesTool } from './catalog/get-critical-vulnerabilities';
import { getAlertsByTimeTool } from './catalog/get-alerts-by-time';
import { getBruteForceTool } from './catalog/get-brute-force';
import { getSecuritySummaryTool } from './catalog/get-security-summary';
import { getSuspiciousPowershellTool } from './catalog/get-suspicious-powershell';
import { searchAlertsByRuleTitleTool } from './catalog/search-alerts-by-rule-title';
import { searchAlertsByRuleGroupTool } from './catalog/search-alerts-by-rule-group';
import { getPciDssAlertsTool } from './catalog/get-pci-dss-alerts';
import { getPciDssSummaryTool } from './catalog/get-pci-dss-summary';
import { searchAlertsByMultipleAgentsTool } from './catalog/search-alerts-by-multiple-agents';
import { searchAlertsByOsTool } from './catalog/search-alerts-by-os';
import { getVulnerabilitiesTool } from './catalog/get-vulnerabilities';
import { getVulnerabilitiesByAgentTool } from './catalog/get-vulnerabilities-by-agent';
import { getVulnerabilityByCveTool } from './catalog/get-vulnerability-by-cve';
import { getFimFilesTool } from './catalog/get-fim-files';
import { getScaResultsTool } from './catalog/get-sca-results';
import { getScaChecksTool } from './catalog/get-sca-checks';
import { getMitreAlertsTool } from './catalog/get-mitre-alerts';
import { getMitreSummaryTool } from './catalog/get-mitre-summary';
import { getAgentOsTool } from './catalog/get-agent-os';
import { getAgentPackagesTool } from './catalog/get-agent-packages';
import { getAgentPortsTool } from './catalog/get-agent-ports';
import { getAgentProcessesTool } from './catalog/get-agent-processes';
import { searchWazuhDataTool } from './catalog/search-wazuh-data';

/**
 * In-process tool catalog: declarative objects loaded at import
 * time, no MCP, no extra process. The six T1 read tools come first in this list; the rest of
 * the 4.14 ports plus the FIM/SCA/MITRE/inventory/CVE modules follow, grouped by category
 * below. The two-stage router (server/tools/router.ts) plugs into this registry as its seam.
 * `get_manager_integrations` was evaluated and skipped: its endpoint,
 * `GET /manager/configuration/wmodules/wmodules`, returns a response shape that doesn't fit this
 * registry's generic Manager-list digest/table extraction cleanly, so it was left out of the
 * catalog rather than special-cased.
 */
const CATALOG: ToolDefinition[] = [
  // Original 6 (production, unchanged)
  getActiveAgentsTool,
  getDisconnectedAgentsTool,
  getCriticalAlertsTool,
  searchAlertsByAgentTool,
  getTopRulesTool,
  getCriticalVulnerabilitiesTool,

  // General alert search / summary
  getAlertsByTimeTool,
  getBruteForceTool,
  getSecuritySummaryTool,
  getSuspiciousPowershellTool,
  searchAlertsByRuleTitleTool,
  searchAlertsByRuleGroupTool,
  getPciDssAlertsTool,
  getPciDssSummaryTool,
  searchAlertsByMultipleAgentsTool,
  searchAlertsByOsTool,

  // Vulnerabilities. (get_solved_vulnerabilities was retired in the 5.0 port: its 4.14 data
  // source (data.vulnerability.status on
  // wazuh-alerts-*) has no 5.0 equivalent; the states index tracks current state only.)
  getVulnerabilitiesTool,
  getVulnerabilitiesByAgentTool,
  getVulnerabilityByCveTool,

  // FIM / SCA / MITRE. (get_fim_events was REPLACED by get_fim_files in the 5.0 port — product
  // 5.0's confirmed FIM surface is current file STATE, not an event stream;
  // the honest tool says so. See get-fim-files.ts.)
  getFimFilesTool,
  getScaResultsTool,
  getScaChecksTool,
  getMitreAlertsTool,
  getMitreSummaryTool,

  // Syscollector inventory
  getAgentOsTool,
  getAgentPackagesTool,
  getAgentPortsTool,
  getAgentProcessesTool,

  // Escape hatch — last resort, kept last so the 28 typed tools are listed first.
  searchWazuhDataTool,
];

const registry = new Map<string, ToolDefinition>(
  CATALOG.map(tool => [tool.spec.name, tool]),
);

export function getToolDefinition(name: string): ToolDefinition | undefined {
  return registry.get(name);
}

export function listToolDefinitions(): ToolDefinition[] {
  return CATALOG;
}

/**
 * The `ToolSpec[]` shape the adapters' `ChatStreamOptions.tools` expects — the full-catalog
 * fallback path (used when the router is disabled, and by server/routes/chat.ts's stage-1 router
 * whenever it falls back). The catalog is read-only by construction (every tool is tier 'T1');
 * mutating/destructive tools were removed by product decision — which operations are exposed is
 * decided at catalog-distribution level, not by a runtime flag.
 */
export function listToolSpecs(): ToolSpec[] {
  return CATALOG.map(tool => tool.spec);
}
