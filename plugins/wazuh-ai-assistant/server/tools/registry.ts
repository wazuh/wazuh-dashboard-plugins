import { ToolSpec } from '../../common/types';
import { ToolDefinition } from './types';
import { getAgentsTool } from './catalog/get-agents';
import { getCriticalFindingsTool } from './catalog/get-critical-findings';
import { searchFindingsByAgentTool } from './catalog/search-findings-by-agent';
import { getTopRulesTool } from './catalog/get-top-rules';
import { getTopAgentsTool } from './catalog/get-top-agents';
import { getCriticalVulnerabilitiesTool } from './catalog/get-critical-vulnerabilities';
import { getFindingsByTimeTool } from './catalog/get-findings-by-time';
import { getEventsByAgentTool } from './catalog/get-events-by-agent';
import { getBruteForceTool } from './catalog/get-brute-force';
import { getSecuritySummaryTool } from './catalog/get-security-summary';
import { getSuspiciousPowershellTool } from './catalog/get-suspicious-powershell';
import { searchFindingsByRuleTitleTool } from './catalog/search-findings-by-rule-title';
import { searchFindingsByRuleTagTool } from './catalog/search-findings-by-rule-tag';
import { getComplianceAlertsTool } from './catalog/get-compliance-alerts';
import { getComplianceSummaryTool } from './catalog/get-compliance-summary';
import { searchFindingsByMultipleAgentsTool } from './catalog/search-findings-by-multiple-agents';
import { searchFindingsByOsTool } from './catalog/search-findings-by-os';
import { getVulnerabilitiesTool } from './catalog/get-vulnerabilities';
import { getVulnerabilitiesByAgentTool } from './catalog/get-vulnerabilities-by-agent';
import { getVulnerabilityByCveTool } from './catalog/get-vulnerability-by-cve';
import { getFimFilesTool } from './catalog/get-fim-files';
import { getScaResultsTool } from './catalog/get-sca-results';
import { getScaChecksTool } from './catalog/get-sca-checks';
import { getMitreFindingsTool } from './catalog/get-mitre-findings';
import { getMitreSummaryTool } from './catalog/get-mitre-summary';
import { getAgentInventoryTool } from './catalog/get-agent-inventory';
import { getRulesTool } from './catalog/get-rules';
import { getThreatIntelComponentsTool } from './catalog/get-threat-intel-components';
import { getDetectorsTool } from './catalog/get-detectors';
import { findDocumentByFieldTool } from './catalog/find-document-by-field';
import { searchWazuhDataTool } from './catalog/search-wazuh-data';
import { getFieldValuesTool } from './catalog/get-field-values';
import { lookupIndicatorTool } from './catalog/lookup-indicator';
import { getCveIntelTool } from './catalog/get-cve-intel';
import { getCtiStatusTool } from './catalog/get-cti-status';

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
  // Original 6 (production, unchanged) — get_active_agents/get_disconnected_agents were replaced
  // by the single get_agents tool (see get-agents.ts).
  getAgentsTool,
  getCriticalFindingsTool,
  searchFindingsByAgentTool,
  getTopRulesTool,
  getCriticalVulnerabilitiesTool,
  // Entity-pivot counterpart to get_top_rules above -- "which agents are noisiest" (GA benchmark
  // gap). Kept adjacent to get_top_rules since both are the same "aggregate and rank" shape.
  getTopAgentsTool,

  // General finding search / summary
  getFindingsByTimeTool,
  // Raw event stream (issue: "Add a typed events tool over wazuh-events-v5") -- the mirror image
  // of the finding-hits tools above: ALL normalized events, matched or not, not just rule-matched
  // detections. Kept adjacent to them in this list since the two are the same category
  // (server/tools/router.ts's TOOL_CATEGORY) and are the tools users most often conflate.
  getEventsByAgentTool,
  getBruteForceTool,
  getSecuritySummaryTool,
  getSuspiciousPowershellTool,
  searchFindingsByRuleTitleTool,
  searchFindingsByRuleTagTool,
  getComplianceAlertsTool,
  getComplianceSummaryTool,
  searchFindingsByMultipleAgentsTool,
  searchFindingsByOsTool,

  // Vulnerabilities. (get_solved_vulnerabilities was retired in the 5.0 port: its 4.14 data
  // source (data.vulnerability.status on
  // wazuh-alerts-*) has no 5.0 equivalent; the states index tracks current state only.)
  getVulnerabilitiesTool,
  getVulnerabilitiesByAgentTool,
  getVulnerabilityByCveTool,
  // The two-source CVE answer (workstream A1b): feed knowledge + local detection, in the same
  // call. Kept adjacent to get_vulnerability_by_cve since both key off a CVE id.
  getCveIntelTool,

  // FIM / SCA / MITRE. (get_fim_events was REPLACED by get_fim_files in the 5.0 port — product
  // 5.0's confirmed FIM surface is current file STATE, not an event stream;
  // the honest tool says so. See get-fim-files.ts.)
  getFimFilesTool,
  getScaResultsTool,
  getScaChecksTool,
  getMitreFindingsTool,
  getMitreSummaryTool,

  // Syscollector inventory (get_agent_os/get_agent_packages/get_agent_ports/get_agent_processes
  // were consolidated into this one tool -- see get-agent-inventory.ts's doc comment)
  getAgentInventoryTool,

  // Security Analytics content: ruleset + pipeline components + detector definitions
  getRulesTool,
  getThreatIntelComponentsTool,
  getDetectorsTool,

  // IOC/indicator lookup against the CTI enrichment feed (workstream A1b, coverage doc CV-049) --
  // filed adjacent to the Security Analytics content tools above since it is the same "Security
  // Analytics / threat-intel pipeline knowledge" domain, not the customer's own observed data.
  lookupIndicatorTool,
  // CTI content freshness (workstream A1b, coverage doc CV-078/MS-6/MS-7) -- same domain as above.
  getCtiStatusTool,

  // Generic exact-ID lookup (document _id or a business-level UUID field, tried automatically)
  findDocumentByFieldTool,

  // Cheap discovery tool (workstream B): "what values does this field actually hold" -- meant to
  // be called BEFORE a filtered call whose value is a guess, not after. Available broadly (see
  // router.ts's TOOL_CATEGORY): it is not scoped to one data family, since the "verify before
  // filter" need cuts across all of them.
  getFieldValuesTool,

  // Escape hatch — last resort, kept last so the typed tools are listed first.
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

/**
 * Resolves a tool's cost-budget class for chat.ts's tool-round COST budget (see
 * `ToolDefinition.costClass`'s doc comment in types.ts for the 1/2/3 scale). Defaults to 2 (the
 * ordinary filtered-search weight) for a tool with no `costClass` opinion AND for a name this
 * registry does not recognize at all (a router/pseudo-tool like `route_question` or
 * `suggest_discover_query`, which are never executed via `executeToolCall` and so never reach this
 * lookup in practice, or a stale name from a scripted test) -- never throws, never returns
 * `undefined`, so every call site can charge a cost unconditionally.
 */
export function getToolCostClass(name: string): 1 | 2 | 3 {
  return getToolDefinition(name)?.costClass ?? 2;
}
